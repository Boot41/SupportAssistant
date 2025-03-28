import asyncio
import os
import uuid
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel

from agents import (
    Agent,
    Runner,
    function_tool,
    handoff,
    HandoffOutputItem,
    ItemHelpers,
    MessageOutputItem,
    RunContextWrapper,
    ToolCallItem,
    ToolCallOutputItem,
    TResponseInputItem,
    trace
)

# Load API key
load_dotenv()
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# ----------------------
# CONTEXT
# ----------------------
class SupportContext(BaseModel):
    user_id: Optional[str] = None
    interview_id: Optional[str] = None
    transcript_found: Optional[bool] = None


# ----------------------
# TOOLS
# ----------------------
@function_tool(
    name_override="check_transcript_exists",
    description_override="Check whether user audio transcript was generated during the interview"
)
async def check_transcript_exists(
    context: RunContextWrapper[SupportContext],
    interview_id: str
) -> str:
    """
    Mocks a tool call to check if a transcript exists.
    """
    context.context.interview_id = interview_id

    # MOCK LOGIC – in reality, you'd query your backend
    if interview_id.endswith("5"):  # pretend IDs ending in 5 failed
        context.context.transcript_found = False
        return "Transcript not found. Kiran likely did not hear the user."
    else:
        context.context.transcript_found = True
        return "Transcript exists. Audio likely reached Kiran."

# ----------------------
# AGENTS
# ----------------------

technical_agent = Agent[SupportContext](
    name="TechnicalSupportAgent",
    handoff_description="Handles mic/audio issues, silent AI responses, and checks if user audio is working.",
    instructions="""
You are a Technical Support Agent.

Your responsibility is to help users with:
- Audio/mic issues
- AI (Kiran) not responding due to no input
- Interview environment setup issues

Follow this logic:
1. Ask if the mic icon was moving when the user spoke.
2. If YES, ask for their interview ID and use the `check_transcript_exists` tool.
3. Based on tool output:
   - If transcript exists → Tell user audio was received.
   - If not → Instruct user to rejoin, check permissions, restart.
4. If user says "AI is not responding", treat it as a possible mic/input issue unless stated otherwise.
""",
    tools=[check_transcript_exists]
)

marketing_agent = Agent[SupportContext](
    name="MarketingAgent",
    handoff_description="Handles inquiries related to Recruit41's services, including automated interview processes, supported interview formats, candidate evaluation features, and pricing details.",
    instructions="""
You are the Marketing Support Agent for Recruit41, a platform dedicated to streamlining the recruitment process through automation.

**Recruit41's Core Services:**
- **Automated Interview Rounds:** Recruit41 automates various stages of the interview process, from initial screening to coding assessments and case studies, ensuring that employers engage only with the most qualified candidates.

- **Diverse Interview Formats:** The platform supports multiple interview formats, including:
  - **Resume-Based Interviews:** Assess candidates based on their resumes.
  - **Case Studies:** Evaluate problem-solving abilities through real-world scenarios.
  - **Coding Rounds:** Test technical skills with coding challenges.

**Pricing Structure:**
Recruit41 offers a cost-effective solution with the lowest cost per interview on the market and unlimited capacity. The cost per interview depends on the type of assessment:
- **Screening Interviews:** [Specific pricing details can be provided here based on the latest information from Recruit41's website.]

**Unique Value Propositions:**
- **Unlimited Capacity:** Recruit41 can handle an unlimited number of interviews simultaneously, making it scalable for organizations of any size.
- **Cost-Effective:** With the lowest cost per interview in the market, Recruit41 provides a budget-friendly solution without compromising on quality.
- **Efficiency:** By automating the interview process, Recruit41 reduces the time and effort required to identify top candidates, accelerating the hiring process.

When interacting with users:
1. Provide detailed and accurate information about Recruit41's services, features, and pricing.
2. If uncertain about a specific detail, acknowledge the limitation and suggest visiting Recruit41's official website for the most current information.
3. Maintain a professional and supportive tone, ensuring users feel valued and informed.

If a query falls outside the scope of marketing or product-related information, consider handing off the conversation to the appropriate agent.
"""
)


# ----------------------
# TRIAGE AGENT
# ----------------------
triage_agent = Agent[SupportContext](
    name="TriageAgent",
    instructions="""
You are a triage agent. Based on the user message, hand off the query to one of the specialized agents below.

Respond only with the required handoff. Don't answer questions yourself.

Agents available:
- TechnicalSupportAgent: Handles audio, mic, and AI not responding issues.
- MarketingAgent: Handles questions about pricing, demos, and campaigns.
""",
    handoffs=[
        handoff(technical_agent),
        handoff(marketing_agent),
    ]
)

# Add re-routing support
technical_agent.handoffs.append(triage_agent)
marketing_agent.handoffs.append(triage_agent)

# ----------------------
# MAIN INTERACTION LOOP
# ----------------------
async def main():
    current_agent = triage_agent
    input_items: list[TResponseInputItem] = []
    context = SupportContext()

    session_id = uuid.uuid4().hex[:12]

    try:
        while True:
            user_input = input("You: ")
            if user_input.lower() in {"exit", "quit"}:
                print("Session ended.")
                break

            with trace("Support Session", group_id=session_id):
                input_items.append({"role": "user", "content": user_input})
                result = await Runner.run(current_agent, input_items, context=context)

                for item in result.new_items:
                    name = item.agent.name
                    if isinstance(item, MessageOutputItem):
                        print(f"{name}: {ItemHelpers.text_message_output(item)}")
                    elif isinstance(item, ToolCallItem):
                        print(f"{name}: [Tool called]")
                    elif isinstance(item, ToolCallOutputItem):
                        print(f"{name}: [Tool Output] {item.output}")
                    elif isinstance(item, HandoffOutputItem):
                        print(f"[Handoff] {item.source_agent.name} → {item.target_agent.name}")
                    else:
                        print(f"{name}: (Unhandled item: {item.__class__.__name__})")

                # Update history and current agent
                input_items = result.to_input_list()
                current_agent = result.last_agent

    except KeyboardInterrupt:
        print("\nSession terminated.")

if __name__ == "__main__":
    asyncio.run(main())
