from __future__ import annotations as _annotations

import asyncio
import random
import uuid
import os

from pydantic import BaseModel
from dotenv import load_dotenv

from agents import (
    Agent,
    HandoffOutputItem,
    ItemHelpers,
    MessageOutputItem,
    RunContextWrapper,
    Runner,
    ToolCallItem,
    ToolCallOutputItem,
    TResponseInputItem,
    function_tool,
    handoff,
    trace,
)
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX

# Load environment variables
load_dotenv()
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

### CONTEXT
class AirlineAgentContext(BaseModel):
    passenger_name: str | None = None
    confirmation_number: str | None = None
    seat_number: str | None = None
    flight_number: str | None = None

### TOOLS
@function_tool(
    name_override="faq_lookup_tool", 
    description_override="Lookup frequently asked questions."
)
async def faq_lookup_tool(question: str) -> str:
    """
    Lookup FAQ information based on the question.
    
    Args:
        question (str): The user's question about airline services.
    
    Returns:
        str: An appropriate FAQ response.
    """
    question = question.lower()
    
    if any(keyword in question for keyword in ["bag", "baggage"]):
        return (
            "You are allowed to bring one bag on the plane. "
            "It must be under 50 pounds and 22 inches x 14 inches x 9 inches."
        )
    elif any(keyword in question for keyword in ["seats", "plane", "seating"]):
        return (
            "There are 120 seats on the plane. "
            "There are 22 business class seats and 98 economy seats. "
            "Exit rows are rows 4 and 16. "
            "Rows 5-8 are Economy Plus, with extra legroom. "
        )
    elif "wifi" in question:
        return "We have free wifi on the plane, join Airline-Wifi"
    
    return "I'm sorry, I don't know the answer to that specific question."

@function_tool
async def update_seat(
    context: RunContextWrapper[AirlineAgentContext], 
    confirmation_number: str, 
    new_seat: str
) -> str:
    """
    Update the seat for a given confirmation number.

    Args:
        context (RunContextWrapper): The current context wrapper.
        confirmation_number (str): The confirmation number for the flight.
        new_seat (str): The new seat to update to.

    Returns:
        str: Confirmation of seat update.
    """
    # Update the context based on the customer's input
    context.context.confirmation_number = confirmation_number
    context.context.seat_number = new_seat
    
    # Ensure that the flight number has been set by the incoming handoff
    assert context.context.flight_number is not None, "Flight number is required"
    
    return f"Updated seat to {new_seat} for confirmation number {confirmation_number}"

### HOOKS
async def on_seat_booking_handoff(context: RunContextWrapper[AirlineAgentContext]) -> None:
    """
    Generate a random flight number when seat booking is initiated.

    Args:
        context (RunContextWrapper): The current context wrapper.
    """
    flight_number = f"FLT-{random.randint(100, 999)}"
    context.context.flight_number = flight_number

### AGENTS
faq_agent = Agent[AirlineAgentContext](
    name="FAQ Agent",
    handoff_description="A helpful agent that can answer questions about the airline.",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You are an FAQ agent. If you are speaking to a customer, you probably were transferred to from the triage agent.
    Use the following routine to support the customer:
    1. Identify the last question asked by the customer.
    2. Use the faq lookup tool to answer the question. Do not rely on your own knowledge.
    3. If you cannot answer the question, transfer back to the triage agent.""",
    tools=[faq_lookup_tool],
)

seat_booking_agent = Agent[AirlineAgentContext](
    name="Seat Booking Agent",
    handoff_description="A helpful agent that can update a seat on a flight.",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You are a seat booking agent. If you are speaking to a customer, you probably were transferred to from the triage agent.
    Use the following routine to support the customer:
    1. Ask for their confirmation number.
    2. Ask the customer what their desired seat number is.
    3. Use the update seat tool to update the seat on the flight.
    If the customer asks a question that is not related to the routine, transfer back to the triage agent.""",
    tools=[update_seat],
)

triage_agent = Agent[AirlineAgentContext](
    name="Triage Agent",
    handoff_description="A triage agent that can delegate a customer's request to the appropriate agent.",
    instructions=(
        f"{RECOMMENDED_PROMPT_PREFIX} "
        "You are a helpful triaging agent. You can use your tools to delegate questions to other appropriate agents."
    ),
    handoffs=[
        faq_agent,
        handoff(agent=seat_booking_agent, on_handoff=on_seat_booking_handoff),
    ],
)

# Add handoff back to triage agent for both FAQ and Seat Booking agents
faq_agent.handoffs.append(triage_agent)
seat_booking_agent.handoffs.append(triage_agent)

### RUN
async def main():
    """
    Main function to run the airline customer service agent system.
    """
    current_agent: Agent[AirlineAgentContext] = triage_agent
    input_items: list[TResponseInputItem] = []
    context = AirlineAgentContext()

    # Generate a unique conversation ID
    conversation_id = uuid.uuid4().hex[:16]

    try:
        while True:
            user_input = input("Enter your message (or 'exit' to quit): ")
            
            # Allow user to exit the conversation
            if user_input.lower() == 'exit':
                print("Ending conversation. Goodbye!")
                break

            with trace("Customer service", group_id=conversation_id):
                input_items.append({"content": user_input, "role": "user"})
                result = await Runner.run(current_agent, input_items, context=context)

                for new_item in result.new_items:
                    agent_name = new_item.agent.name
                    if isinstance(new_item, MessageOutputItem):
                        print(f"{agent_name}: {ItemHelpers.text_message_output(new_item)}")
                    elif isinstance(new_item, HandoffOutputItem):
                        print(
                            f"Handed off from {new_item.source_agent.name} to {new_item.target_agent.name}"
                        )
                    elif isinstance(new_item, ToolCallItem):
                        print(f"{agent_name}: Calling a tool")
                    elif isinstance(new_item, ToolCallOutputItem):
                        print(f"{agent_name}: Tool call output: {new_item.output}")
                    else:
                        print(f"{agent_name}: Skipping item: {new_item.__class__.__name__}")
                
                input_items = result.to_input_list()
                current_agent = result.last_agent

    except KeyboardInterrupt:
        print("\nConversation terminated by user.")

if __name__ == "__main__":
    asyncio.run(main())