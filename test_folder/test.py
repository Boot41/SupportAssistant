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
    trace,
    WebSearchTool
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
    issue_resolved: Optional[bool] = None  # New flag to track if issue is resolved


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
    context.context.interview_id = interview_id

    # MOCK LOGIC – in reality, you'd query your backend
    if interview_id.endswith("5"):  # pretend IDs ending in 5 failed
        context.context.transcript_found = False
        return "Transcript not found. Kiran likely did not hear the user."
    else:
        context.context.transcript_found = True
        return "Transcript exists. Audio likely reached Kiran."

# Handing off to the Human Support Agent if unresolved:
@function_tool(
    name_override="human_support",
    description_override="Notify Human Support Agent that the issue requires human intervention"
)
async def human_support() -> str:
    return "Human Support will be notified shortly. Please hold on."


# ----------------------
# AGENTS
# ----------------------

# Define the Technical Support Agent (the agent handling the issue)
technical_agent = Agent[SupportContext](
    name="TechnicalSupportAgent",
    handoff_description="Handles mic/audio issues, silent AI responses, and checks if user audio is working.",
    instructions="""
You're the Technical Support Agent for Recruit41.

Your goal is to help candidates smoothly fix:
- Microphone/audio input issues
- Video not showing or not turning on
- AI (Kiran) not responding due to missing voice input or server-side issues
- Interview environment setup problems

Keep your tone friendly, clear, and supportive. Think of it like you're walking the user through this in real-time. Guide users one step at a time — always wait for their response before continuing.

---

**Step 0: When a user says "AI is not responding"**

That can mean:
1. Their audio didn’t reach Kiran  
2. Kiran is facing a server-side delay or problem

So you need to first check **if their audio is being picked up**.

---

**Step 1: Audio Detection Check**

Start by pointing out the **circular audio indicator next to the user's name** at the **bottom-left of the video**.

Gently ask if it was moving when they were talking.

- If **yes**, audio is working. Move to **Step 2A**
- If **no**, audio is not being picked up. Move to **Step 2B**

---

**Step 2A: Audio is working (detector is moving)**

Say something like:
"Perfect, looks like your audio is being detected properly."

Next:
- Ask for the **Interview ID** from the **bottom-right** corner (e.g., #DEMO-1-625)
- Use `check_transcript_exists` with that ID

Then:
- If transcript **exists** → say:  
  "Your audio reached Kiran successfully! If it's still quiet, it might be a temporary issue on our side. Please try refreshing the tab or reconnecting in a few minutes."

- If transcript **doesn't exist** → say:  
  "Strange — your audio was picked up, but Kiran didn’t receive it. Try leaving and rejoining the session."

---

**Step 2B: Audio is NOT being detected (detector is NOT moving)**

Follow a progressive diagnostic flow — one step at a time:

1. Ask the user to check the **mic icon at the bottom center** of the screen.
   - If there's a **red slash**, say:
     "That means you're muted. Go ahead and click it to unmute, then speak and see if the audio circle starts moving."

2. If already unmuted, guide them to:
   - Click the **dropdown arrow next to the mic icon**
   - Try selecting a different mic from the list
   - Speak again and check the audio circle for movement

3. If the audio circle now moves → return to **Step 2A**

4. If it still doesn't move:
   - Ask for the **Interview ID**
   - Use `check_transcript_exists`
   - If transcript exists for one mic setting but not others, advise:
     "Looks like one of the mic options was working earlier — you can switch back to that one."

---

**Step 3: Video Not Working**

If the user mentions video issues (camera not showing up or video feed is black):

1. Ask them to check if the **browser has permission to access the camera**:
   - In Chrome: Click the lock 🔒 icon in the address bar and ensure "Camera" is set to "Allow".

2. If permissions are correct:
   - Ask them to click the **video toggle button** in the Recruit41 interface.
   - Instruct: "Try turning the video off and back on again."

3. If the issue still persists:
   - Ask them to **leave and rejoin** the interview session.
   - Let them know this refreshes the video permissions and setup.

---

🎯 Always keep the conversation flowing naturally. Never dump all instructions at once. Wait for the user to respond before moving to the next step.

Be patient, clear, and encouraging — like a helpful teammate solving it with them.
""",
    tools=[check_transcript_exists]
)

marketing_agent = Agent[SupportContext](
    name="MarketingAgent",
    handoff_description="Handles inquiries related to Recruit41's services, including automated interview processes, supported interview formats, candidate evaluation features, and pricing details.",
    instructions="""
You are the Marketing Support Agent for Recruit41, a platform that automates interviews at scale.

Your job is to help potential clients understand how Recruit41 works, what it offers, and how it fits into their hiring needs. You should sound **friendly, approachable, and helpful** — like a smart, responsive assistant from a modern SaaS brand.

You will receive questions about pricing, demo access, interview formats, product features, or sales-related details.

You must always:
1. Use WebSearch first, targeting Recruit41’s domain. This ensures answers use the latest public product information.
2. Only use fallback knowledge if no search results are relevant.

Your rules:
1. You MUST always answer the user's question directly. Do NOT redirect them to the website or sales team unless explicitly asked for contact.
2. DO NOT use vague phrases like "visit our website", "our team will assist", or "I'm transferring you".
3. If the question is about **pricing**, always say:
   - "Recruit41 follows a usage-based pricing model starting at ₹249 per interview."
   - Optionally add: "Pricing may vary depending on the type and volume of interviews."
4. Keep your tone conversational and responses concise — 1–2 lines, chatbot style.

Fallback Knowledge:

Recruit41 is an AI-powered recruitment platform that automates resume screening, case studies, and coding assessments. It offers scalable, asynchronous interviews and real-time candidate evaluation. Recruiters can customize interview formats, review video answers, and receive ranked shortlists.

🌟 Client Onboarding Journey:
If a client is interested in trying Recruit41:
- First, the Recruit41 team connects with them to understand their hiring goals, role types, and scale.
- Based on this, a **customized interview format** is created (e.g., mix of video Q&A, technical tests, roleplays).
- A **simulation** of the experience is shared with the client for review.
- If the client is happy with it, they can go live instantly or request additional tweaks.
- Recruit41 helps with rollout, scaling, and candidate funnel optimization as needed.

🎯 Use Case Scenarios:

- **Campus Hiring**: Recruit41 supports student outreach, automated scheduling, and interview workflows across colleges. Ideal for placement drives and internship funnels.

- **Enterprise Hiring**: Designed for corporate hiring at scale — supports advanced workflows, ATS integration, evaluation rubrics, and panel feedback.

- **Industry Hiring**: For domain-specific hiring like finance, healthcare, or manufacturing. Enables specialized assessments and structured scenario responses.

- **Non-Tech Hiring**: Tailored for roles like sales, support, operations, HR, and more. Interviews include:
  - Video/voice responses to real-world situations
  - Soft-skill and tone evaluation (clarity, empathy, communication)
  - Behavioral and situational scoring

Recruit41 is trusted by startups, enterprise firms, and recruitment agencies. A demo is available at https://demo.recruit41.com.
""",
    tools=[WebSearchTool()]
)
# Define the Triage Agent (decides whether to escalate or resolve the issue)
triage_agent = Agent[SupportContext](
    name="TriageAgent",
    instructions="""
You are a triage agent. Based on the user message, hand off the query to one of the specialized agents below.

Respond only with the required handoff. Don't answer questions yourself.

Agents available:
- TechnicalSupportAgent: Handles audio, mic, and AI not responding issues.
- MarketingAgent: Handles questions about pricing, demos, and campaigns.

When the issue is resolved, thank the user and check if they are satisfied. If not, inform them that we will escalate the issue to a human support agent.
""",
    handoffs=[
        handoff(technical_agent),
        handoff(marketing_agent),
    ],
    tools=[human_support]
)

# Add re-routing support
technical_agent.handoffs.append(triage_agent)
marketing_agent.handoffs.append(triage_agent)


# Handle the case where issue is resolved
async def handle_resolved_issue(session_id: str, resolved: bool):
    if resolved:
        # Return to Triage agent for confirmation
        await triage_agent.handoffs[0].run(context=session_id)
    else:
        await triage_agent.handoffs[1].run(context=session_id)  # Human support if unresolved


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
