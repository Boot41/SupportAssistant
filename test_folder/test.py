import asyncio
import os
import re
from dotenv import load_dotenv
from agents import Agent, handoff, Runner

load_dotenv()
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# 🧠 Define specialized agents
ALL_AGENTS = {
    "TechnicalIssuesAgent": Agent(
        name="TechnicalIssuesAgent",
        instructions="""
        You are responsible for diagnosing and resolving technical problems related to:
        - Audio (mic issues, no sound)
        - Video (camera problems)
        - System crashes or errors
        - Network and connectivity problems
        Respond thoroughly with step-by-step troubleshooting.
        """,
        handoff_description="Handles technical issues including audio, video, system errors, and network connectivity."
    ),
    "AIInteractionAgent": Agent(
        name="AIInteractionAgent",
        instructions="""
        You handle issues related to the behavior of the AI system, including:
        - AI not responding or stuck
        - Repetitive or misunderstood responses
        - Special behavior related to AI personas like 'Kiran'
        Provide detailed resolution or explanation.
        """,
        handoff_description="Handles issues where the AI behaves incorrectly, including not responding, repeating, or misunderstanding the user."
    ),
    "InterviewFlowAgent": Agent(
        name="InterviewFlowAgent",
        instructions="""
        You address issues in the interview process, including:
        - Interview not starting or ending properly
        - Mistaken actions during the session
        - Questions about feedback, results, or scoring
        Clarify the situation and guide the user through what to expect.
        """,
        handoff_description="Handles issues related to the interview process such as start/stop errors, action mistakes, and feedback/results confusion."
    ),
    "UXExperienceAgent": Agent(
        name="UXExperienceAgent",
        instructions="""
        You handle UX and interface-related concerns, including:
        - Confusing or unclear instructions
        - UI glitches, freezing, or lag
        - General user confusion or panic
        Guide the user to regain clarity and confidence.
        """,
        handoff_description="Handles user experience issues including interface confusion, unclear instructions, glitches, or panic."
    ),
    "MarketingSupportAgent": Agent(
        name="MarketingSupportAgent",
        instructions="""
        You respond to questions about:
        - Demos, pricing, or product details
        - Sales campaigns or feature comparisons
        Provide accurate and helpful promotional support.
        """,
        handoff_description="Handles marketing-related queries including pricing, demos, campaigns, and product comparisons."
    )
}

# 🧾 Summarizer agent
summarizer_agent = Agent(
    name="Summarizer Agent",
    instructions="""
    You are an expert summarizer. Your task is to:
    1. Carefully review the responses from each specialized agent
    2. Create a concise, coherent, and actionable summary
    3. Integrate insights from all agent responses
    4. Provide a clear, step-by-step resolution plan
    5. Ensure the summary is user-friendly and addresses the original query comprehensively
    6. Format the summary in a clear, easy-to-follow manner
    """
)

# 🧭 Support Router
support_router = Agent(
    name="Support Router",
    instructions="""
    You are a triage agent. Analyze the user's query and determine which specialized agents can best address the issue.

    You have access to these agents (via handoffs). Read their descriptions and decide which ones are relevant.

    After identifying relevant agents, hand off the query to them one-by-one. The last step should always pass their responses to the summarizer agent for a unified final answer.

    Return your decision in this format:
    Agents: [functions.transfer_to_<agentname>, ...]
    Explanation:
    - functions.transfer_to_<agentname>: Why it was selected
    """,
    handoffs=[
        *[handoff(agent) for agent in ALL_AGENTS.values()],
        handoff(summarizer_agent)
    ]
)

# 🚀 Main workflow
async def main():
    user_query = input("Enter your query: ")
    print("\n[Routing through Support Router agent...]")

    # Ask router to classify and delegate
    router_result = await Runner.run(support_router, user_query)
    print("\n[Router Response]:\n", router_result.final_output)

    # Extract handoff function names
    agent_names = []
    match = re.search(r"Agents:\s*\[(.*?)\]", router_result.final_output, re.DOTALL)
    if match:
        function_calls = match.group(1).split(',')
        for func in function_calls:
            func = func.strip()
            # Extract agent name from: functions.transfer_to_<agentname>
            match_agent = re.match(r"functions\.transfer_to_([a-z_]+)", func.lower())
            if match_agent:
                agent_key_snake = match_agent.group(1)
                # Convert back to PascalCase key (e.g., technicalissuesagent → TechnicalIssuesAgent)
                for key in ALL_AGENTS:
                    if key.lower() == agent_key_snake:
                        agent_names.append(key)
                        break

    # Run selected agents
    agent_responses = []
    for agent_key in agent_names:
        agent = ALL_AGENTS[agent_key]
        print(f"\n[Running {agent.name}...]")
        result = await Runner.run(agent, user_query)
        print(f"\n[{agent.name} Response]:\n{result.final_output}")
        agent_responses.append(result.final_output)

    # Run summarizer
    if agent_responses:
        combined = "\n\n".join(agent_responses)
        summary_result = await Runner.run(summarizer_agent, combined)
        print("\n[Final Summarized Response]:\n", summary_result.final_output)
    else:
        print("\n[No specialized agents were matched for this query.]")

if __name__ == "__main__":
    asyncio.run(main())
