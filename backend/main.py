import asyncio
import os
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, date, timedelta
import httpx  # Using httpx for async HTTP requests
from fastapi import HTTPException
from fastapi.logger import logger
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# Replace MongoDB imports with PostgreSQL/SQLAlchemy imports
from db import (
    insert_conversation_event, 
    update_ticket_end_time, 
    get_all_tickets, 
    get_ticket_with_conversations, 
    toggle_conversation_flag, 
    toggle_ticket_resolved,
    get_db,
    SessionLocal,
    Ticket
)
from db import OperatorSG
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

load_dotenv()
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo"

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with specific origins in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CONTEXT
class SupportContext(BaseModel):
    user_id: Optional[str] = None
    interview_id: Optional[str] = None
    transcript_found: Optional[bool] = None
    ticket_id: Optional[str] = None
    issue_resolved: Optional[bool] = None

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
import json
from datetime import date
import httpx  # Using httpx for async HTTP requests

WEBHOOK_URL = "https://chat.googleapis.com/v1/spaces/AAQAys6OFTM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=CCLGglbxyz8fMv0jdHhevoAp4VswRaakxnc9w-qRzFU"

@function_tool(
    name_override="human_support",
    description_override="Notify the current on-call human support agent via Google Chat"
)
async def human_support(context: RunContextWrapper[SupportContext]) -> str:
    print("🔔 Human support function called")
    print(f"Ticket ID from context: {context.context.ticket_id}")
    
    operator_info = None
    
    # Try to fetch operators from database first
    try:
        # Use a simpler approach with direct SQL queries to avoid greenlet issues
        db = SessionLocal()
        try:
            # Get today's date
            today = date.today()
            print(f"Today's date: {today}")
            
            # Get all operators first (for debugging)
            stmt = select(OperatorSG)
            result = await db.execute(stmt)
            all_operators = result.scalars().all()
            print(f"Found {len(all_operators)} total operators in database")
            
            # Find operator for today
            stmt = select(OperatorSG).where(OperatorSG.active_date == today)
            result = await db.execute(stmt)
            operator = result.scalar_one_or_none()
            
            if operator:
                print(f"Found operator: {operator.full_name} ({operator.email})")
                # Save operator info to use later
                operator_info = {
                    "id": operator.id,
                    "full_name": operator.full_name,
                    "email": operator.email,
                    "email_username": operator.email.split('@')[0]
                }
                
                # Update ticket if it exists
                if context.context.ticket_id:
                    stmt = select(Ticket).where(Ticket.ticket_id == context.context.ticket_id)
                    result = await db.execute(stmt)
                    ticket = result.scalar_one_or_none()
                    
                    if ticket:
                        ticket.op_id = operator.id
                        await db.commit()
                        print(f"🔄 Ticket {ticket.ticket_id} updated with operator {operator.full_name}")
                    else:
                        print(f"⚠️ No ticket found for ticket ID: {context.context.ticket_id}")
            else:
                # If no operator for today, try to find most recent
                print("No operator for today, trying to find most recent")
                stmt = select(OperatorSG).where(OperatorSG.active_date <= today).order_by(OperatorSG.active_date.desc())
                result = await db.execute(stmt)
                operator = result.scalar_one_or_none()
                
                if operator:
                    print(f"Found recent operator: {operator.full_name} ({operator.email})")
                    # Save operator info to use later
                    operator_info = {
                        "id": operator.id,
                        "full_name": operator.full_name,
                        "email": operator.email,
                        "email_username": operator.email.split('@')[0]
                    }
                    
                    # Update ticket if it exists
                    if context.context.ticket_id:
                        stmt = select(Ticket).where(Ticket.ticket_id == context.context.ticket_id)
                        result = await db.execute(stmt)
                        ticket = result.scalar_one_or_none()
                        
                        if ticket:
                            ticket.op_id = operator.id
                            await db.commit()
                            print(f"🔄 Ticket {ticket.ticket_id} updated with operator {operator.full_name}")
                        else:
                            print(f"⚠️ No ticket found for ticket ID: {context.context.ticket_id}")
        except Exception as db_error:
            print(f"Database error: {db_error}")
        finally:
            await db.close()
    except Exception as e:
        print(f"🔥 Exception in database operations: {e}")
    
    # Send notification - completely separate from database operations
    try:
        # Create payload based on operator availability
        if operator_info:
            # Create a formatted card with operator details
            payload = {
                "cards": [
                    {
                        "header": {
                            "title": "Support Request Alert",
                            "subtitle": f"On-call: {operator_info['full_name']}",
                            "imageUrl": "https://www.gstatic.com/images/icons/material/system/2x/support_agent_black_48dp.png",
                            "imageStyle": "AVATAR"
                        },
                        "sections": [
                            {
                                "widgets": [
                                    {
                                        "textParagraph": {
                                            "text": f"<users/{operator_info['email_username']}> A user is requesting assistance and you are the on-call operator today."
                                        }
                                    },
                                    {
                                        "keyValue": {
                                            "topLabel": "Operator",
                                            "content": operator_info['full_name']
                                        }
                                    },
                                    {
                                        "keyValue": {
                                            "topLabel": "Email",
                                            "content": operator_info['email']
                                        }
                                    },
                                    {
                                        "buttons": [
                                            {
                                                "textButton": {
                                                    "text": "View Dashboard",
                                                    "onClick": {
                                                        "openLink": {
                                                            "url": "https://localhost:3000/signin"
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        else:
            print("No operators found in database")
            # Fallback card when no operator is found
            payload = {
                "cards": [
                    {
                        "header": {
                            "title": "Support Request",
                            "subtitle": "No assigned operator found",
                            "imageUrl": "https://www.gstatic.com/images/icons/material/system/2x/warning_black_48dp.png",
                            "imageStyle": "AVATAR"
                        },
                        "sections": [
                            {
                                "widgets": [
                                    {
                                        "textParagraph": {
                                            "text": "A user needs immediate assistance but no on-call operator was found in the system."
                                        }
                                    },
                                    {
                                        "buttons": [
                                            {
                                                "textButton": {
                                                    "text": "View Dashboard",
                                                    "onClick": {
                                                        "openLink": {
                                                            "url": "https://localhost:3000/signin"
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        
        # Send notification using synchronous requests in a separate context
        headers = {"Content-Type": "application/json"}
        
        # Use httpx for async HTTP requests
        async with httpx.AsyncClient() as client:
            webhook_url = os.getenv('GOOGLE_CHAT_WEBHOOK_URL', WEBHOOK_URL)
            response = await client.post(webhook_url, headers=headers, json=payload)
            print(f"Webhook response: {response.status_code} - {response.text}")
        
            if response.status_code == 200:
                print("✅ Notification sent successfully")
                if operator_info:
                    return f"Operator {operator_info['full_name']} has been notified and will assist you shortly."
                else:
                    return "Support team has been notified. Someone will assist you shortly."
            else:
                print(f"❌ Failed webhook response: {response.status_code}")
                return "We're having trouble notifying the support team. Please try again later."
                
    except Exception as e:
        print(f"🔥 Exception in notification process: {e}")
        
        # Fallback to direct notification without database
        try:
            print("Falling back to direct notification without database query")
            payload = {
                "text": "🚨 **URGENT Support Request**: <users/all> A user needs immediate assistance. (Database error occurred)"
            }
            headers = {"Content-Type": "application/json"}
            
            # Use httpx for async HTTP requests
            async with httpx.AsyncClient() as client:
                webhook_url = os.getenv('GOOGLE_CHAT_WEBHOOK_URL', WEBHOOK_URL)
                response = await client.post(webhook_url, headers=headers, json=payload)
                print(f"Fallback webhook response: {response.status_code} - {response.text}")
                
                if response.status_code == 200:
                    print("✅ Fallback notification sent successfully")
                    return "Support team has been notified despite database issues. Someone will assist you shortly."
                else:
                    return "We're having trouble notifying the support team. Please try again later."
        except Exception as fallback_error:
            print(f"🔥 Exception in fallback notification: {fallback_error}")
            return "An error occurred while trying to contact support. Please try again later."

@function_tool(
    name_override="mark_issue_resolved",
    description_override="Mark the user's issue as resolved and close the support ticket"
)
async def mark_issue_resolved(context: RunContextWrapper[SupportContext]) -> str:
    try:
        # Mark the issue as resolved in the context
        context.context.issue_resolved = True
        
        # Get the ticket ID from the context
        ticket_id = context.context.ticket_id
        print(f"Ticket ID: {ticket_id}")
        # Check if ticket_id is None or empty
        if not ticket_id:
            logger.warning("No ticket_id found in context, cannot update ticket in database")
            return "✅ Your issue has been marked as resolved. Thank you for contacting support!"
        
        # Update the ticket in the database
        async with SessionLocal() as db:
            try:
                # Find the ticket by ticket_id
                result = await db.execute(
                    select(Ticket).where(Ticket.ticket_id == ticket_id)
                )
                ticket = result.scalar_one_or_none()
                
                if ticket:
                    # Mark as resolved and set ended_at to current time
                    ticket.resolved = True
                    ticket.ended_at = datetime.now(timezone.utc)
                    await db.commit()
                    logger.info(f"Ticket {ticket_id} marked as resolved in database")
                else:
                    logger.warning(f"Could not find ticket with ticket_id {ticket_id} to mark as resolved")
            except Exception as db_error:
                logger.error(f"Database error marking ticket as resolved: {str(db_error)}")
        
        return "✅ Your issue has been marked as resolved. Thank you for contacting support!"
    except Exception as e:
        logger.error(f"Error marking ticket as resolved: {str(e)}")
        # Still mark resolved in context even if DB update fails
        context.context.issue_resolved = True
        return "✅ Your issue has been marked as resolved. Thank you for contacting support!"

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
    tools=[check_transcript_exists, mark_issue_resolved]
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
    tools=[WebSearchTool(), mark_issue_resolved]
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
    tools=[human_support, mark_issue_resolved]
)

# Add re-routing support
technical_agent.handoffs.append(triage_agent)
marketing_agent.handoffs.append(triage_agent)



# # Handle the case where issue is resolved
# async def handle_resolved_issue(ticket_id: str, resolved: bool):
#     if resolved:
#         # Return to Triage agent for confirmation
#         await triage_agent.handoffs[0].run(context=ticket_id)
#     else:
#         await triage_agent.handoffs[1].run(context=ticket_id)  # Human support if unresolved





# WEBSOCKET CONNECTION MANAGER
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.operator_connections: Dict[str, WebSocket] = {}
        self.session_data: Dict[str, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, ticket_id: str):
        await websocket.accept()
        self.active_connections[ticket_id] = websocket
        context = SupportContext()
        context.ticket_id = ticket_id  # Set the ticket_id in the context
        
        self.session_data[ticket_id] = {
            "current_agent": triage_agent,
            "input_items": [],
            "context": context,
            "turn_id": 1,
            "human_override": False,
            "started_at": datetime.utcnow().isoformat() + "Z",
            "user_id": None,
            "resolved": False
        }

    async def connect_operator(self, websocket: WebSocket, ticket_id: str):
        await websocket.accept()
        self.operator_connections[ticket_id] = websocket

    def disconnect(self, ticket_id: str):
        self.active_connections.pop(ticket_id, None)
        self.operator_connections.pop(ticket_id, None)
        self.session_data.pop(ticket_id, None)

    async def send_message(self, ticket_id: str, message: Dict[str, Any]):
        if ticket_id in self.active_connections:
            await self.active_connections[ticket_id].send_json(message)

    async def send_to_operator(self, ticket_id: str, trace_event: Dict[str, Any]):
        if ticket_id in self.operator_connections:
            await self.operator_connections[ticket_id].send_json({
                "type": "trace_event",
                "trace": trace_event
            })

manager = ConnectionManager()

async def log_trace_event(ticket_id: str, event: Dict[str, Any]):
    # Add default flags to event if not present
    if "flags" not in event:
        event["flags"] = {
            "ai_active": not manager.session_data[ticket_id].get("human_override", False),
            "human_override": manager.session_data[ticket_id].get("human_override", False)
        }
    if "flagged" not in event:
        event["flagged"] = False
    
    # Use PostgreSQL insert function instead of MongoDB
    await insert_conversation_event(ticket_id, event)

@app.websocket("/ws/{ticket_id}")
async def websocket_endpoint(websocket: WebSocket, ticket_id: str):
    # Check if session already exists before creating a new one
    if ticket_id not in manager.session_data:
        await manager.connect(websocket, ticket_id)
    else:
        # If session exists, just update the websocket connection
        await websocket.accept()
        manager.active_connections[ticket_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_json()
            user_message = data.get("message", "")
            session_data = manager.session_data[ticket_id]

            if session_data.get("human_override"):
                await manager.send_to_operator(ticket_id, {
                    "turn_id": session_data["turn_id"],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "role": "user",
                    "content": user_message
                })
                
                # Log user message to PostgreSQL
                await log_trace_event(ticket_id, {
                    "turn_id": session_data["turn_id"],
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "role": "user",
                    "content": user_message
                })
                
                session_data["turn_id"] += 1
                continue

            current_agent = session_data["current_agent"]
            input_items = session_data["input_items"]
            context = session_data["context"]

            input_items.append({"role": "user", "content": user_message})

            await log_trace_event(ticket_id, {
                "turn_id": session_data["turn_id"],
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "role": "user",
                "content": user_message
            })

            await manager.send_to_operator(ticket_id, {
                "turn_id": session_data["turn_id"],
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "role": "user",
                "content": user_message
            })

            session_data["turn_id"] += 1

            # Only process AI response if human_override is not enabled
            if not session_data.get("human_override"):
                with trace("Support Session", group_id=ticket_id):
                    result = await Runner.run(current_agent, input_items, context=context)

                    for item in result.new_items:
                        agent_name = item.agent.name

                        if isinstance(item, MessageOutputItem):
                            message_text = ItemHelpers.text_message_output(item)
                            event = {
                                "turn_id": session_data["turn_id"],
                                "timestamp": datetime.utcnow().isoformat() + "Z",
                                "role": "agent",
                                "agent": agent_name,
                                "content": message_text
                            }
                            await log_trace_event(ticket_id, event)
                            await manager.send_to_operator(ticket_id, event)
                            await manager.send_message(ticket_id, {
                                "type": "message",
                                "agent": agent_name,
                                "content": message_text
                            })

                        elif isinstance(item, ToolCallItem):
                        # Dynamically log the tool's name and its arguments/output
                            tool_name = item.raw_item.name
                            print(tool_name)
                            # Now, we need to get the arguments used in the tool call. 
                            # If it's a dictionary or has attributes, you can extract those like this:
                            tool_args = getattr(item.raw_item, "args", str(item.raw_item))  # Extract args or handle complex objects
    
                            # Log the event with tool name, args, and output
                            await log_trace_event(ticket_id, {
                                "turn_id": session_data["turn_id"],
                                "timestamp": datetime.utcnow().isoformat() + "Z",
                                "role": "agent",
                                "agent": agent_name,
                                "tool_call": {
                                    "name": tool_name,
                                    "args": tool_args,
                                    # "output": item.output
                                }
                            })
    
                        elif isinstance(item, HandoffOutputItem):
                            handoff_event = {
                                "turn_id": session_data["turn_id"],
                                "timestamp": datetime.utcnow().isoformat() + "Z",
                                "role": "agent",
                                "agent": agent_name,
                                "handoff": {
                                    "from": item.source_agent.name,
                                    "to": item.target_agent.name
                                },
                                "content": f"[Handoff] {item.source_agent.name} → {item.target_agent.name}"
                            }
                            await log_trace_event(ticket_id, handoff_event)
                            await manager.send_to_operator(ticket_id, handoff_event)
                            await manager.send_message(ticket_id, {
                                "type": "handoff",
                                "source": item.source_agent.name,
                                "target": item.target_agent.name
                            })

                    session_data["input_items"] = result.to_input_list()
                    session_data["current_agent"] = result.last_agent
                    session_data["turn_id"] += 1

    except WebSocketDisconnect:
        session_data = manager.session_data.get(ticket_id, {})
        # Update ticket end time in PostgreSQL
        await update_ticket_end_time(ticket_id)
        # Only remove the websocket connection, not the entire session data
        if ticket_id in manager.active_connections:
            manager.active_connections.pop(ticket_id, None)

@app.websocket("/operator/{ticket_id}")
async def operator_ws(websocket: WebSocket, ticket_id: str):
    await manager.connect_operator(websocket, ticket_id)
    try:
        while True:
            data = await websocket.receive_json()
            content = data.get("message")
            if content:
                await manager.send_message(ticket_id, {
                    "type": "message",
                    "agent": "HumanSupport",
                    "content": content
                })
                await log_trace_event(ticket_id, {
                    "turn_id": manager.session_data[ticket_id]["turn_id"],
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "role": "agent",
                    "agent": "HumanSupport",
                    "content": content
                })
                manager.session_data[ticket_id]["turn_id"] += 1
    except WebSocketDisconnect:
        manager.operator_connections.pop(ticket_id, None)

@app.get("/")
async def root():
    return {"message": "Support Assistant API is running"}

@app.get("/generate-ticket-id")
async def generate_ticket_id():
    return {"ticket_id": uuid.uuid4().hex[:12]}

@app.post("/override/{ticket_id}")
async def override_ticket(ticket_id: str):
    if ticket_id in manager.session_data:
        manager.session_data[ticket_id]["human_override"] = True
        
        # Log the human override event
        await log_trace_event(ticket_id, {
            "turn_id": manager.session_data[ticket_id]["turn_id"],
            "type": "system",
            "content": "Human support has taken over this conversation."
        })
        
        # Notify the client that human support has taken over
        await manager.send_message(ticket_id, {
            "type": "system",
            "content": "A human support agent has joined the conversation."
        })
        
        return {"message": "Human override enabled for this ticket."}
    return {"error": "Ticket not found."}

@app.post("/resolve/{ticket_id}")
async def resolve_ticket(ticket_id: str):
    if ticket_id in manager.session_data:
        # Update the resolved status in PostgreSQL
        await toggle_ticket_resolved(ticket_id)
        return {"message": "Ticket marked as resolved."}
    return {"error": "Ticket not found."}

@app.get("/tickets")
async def get_tickets():
    """Get all tickets from the database."""
    tickets = await get_all_tickets()
    # print(tickets)
    return tickets

@app.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str):
    """Get a specific ticket with its conversation history."""
    ticket = await get_ticket_with_conversations(ticket_id)
    
    if not ticket:
        return {"error": "Ticket not found"}
    
    return ticket

@app.post("/tickets/{ticket_id}/flag/{turn_id}")
async def toggle_flag(ticket_id: str, turn_id: int):
    """Toggle the flagged status for a specific message in a conversation."""
    new_flagged_status = await toggle_conversation_flag(ticket_id, turn_id)
    
    if new_flagged_status is not None:
        return {"message": f"Message flagged status toggled to {new_flagged_status}"}
    
    return {"error": "Message not found"}

@app.post("/tickets/{ticket_id}/toggle-resolve")
async def toggle_resolve(ticket_id: str):
    """Toggle the resolved status for a session."""
    new_resolved_status = await toggle_ticket_resolved(ticket_id)
    
    if new_resolved_status is not None:
        return {"message": f"Session resolved status toggled to {new_resolved_status}"}
    
    return {"error": "Session not found"}

@app.get("/agent-schedule")
async def get_weekly_agent_schedule(db: AsyncSession = Depends(get_db)):
    """Get the weekly agent schedule showing one agent per day for the current week."""
    try:
        # Get current date
        today = date.today()
        
        # Calculate the start of the week (Monday)
        start_date = today - timedelta(days=today.weekday())
        
        # Create a list of dates for the week (Monday to Friday)
        weekdays = []
        for i in range(5):  # 0 = Monday, 4 = Friday
            day_date = start_date + timedelta(days=i)
            weekdays.append(day_date)
        
        # Initialize the schedule structure
        schedule = {
            "days": []
        }
        
        # For each weekday, find the assigned operator
        for day_date in weekdays:
            # Query the database for operators assigned to this date
            result = await db.execute(
                select(OperatorSG)
                .where(OperatorSG.active_date == day_date)
                .order_by(OperatorSG.active_date.asc())
            )
            
            # Get the first operator if multiple exist
            operator_row = result.first()
            operator = operator_row[0] if operator_row else None
            
            # Format the day information
            day_info = {
                "day": day_date.strftime("%A"),
                "date": day_date.strftime("%B %d, %Y"),
                "is_today": day_date == today,
                "operator": {
                    "name": operator.full_name if operator else None,
                    "email": operator.email if operator else None
                } if operator else None
            }
            
            schedule["days"].append(day_info)
        
        return schedule
    except Exception as e:
        logger.error(f"Error retrieving weekly agent schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve agent schedule: {str(e)}")

@app.post("/auth")
async def auth_callback(payload: dict, db: AsyncSession = Depends(get_db)):
    code = payload.get("code")
    redirect_uri = payload.get("redirect_uri")
    logger.info(f"Received /auth request with code: {code}, redirect_uri: {redirect_uri}")
    if not code or not redirect_uri:
        raise HTTPException(status_code=400, detail="Missing authorization code or redirect URI")

    async with httpx.AsyncClient() as client:
        # Step 1: Exchange authorization code for tokens
        logger.info(f"Exchanging code for token with redirect_uri: {redirect_uri}")
        
        token_data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
        logger.info(f"Token request data: {token_data}")
        
        token_response = await client.post(
            GOOGLE_TOKEN_URL, 
            data=token_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        logger.info(f"Token response status: {token_response.status_code}")
        if token_response.status_code != 200:
            error_detail = token_response.text
            logger.error(f"Token exchange failed: {error_detail}")
            raise HTTPException(status_code=401, detail=f"Failed to exchange code for token: {error_detail}")
        
        tokens = token_response.json()
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")

        if not access_token:
            raise HTTPException(status_code=401, detail="No access token returned")

        # Step 2: Fetch user info
        user_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if user_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to fetch user info")

        user_info = user_response.json()
        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")
        google_id = user_info.get("id")

        if not all([email, name, google_id]):
            raise HTTPException(status_code=400, detail="Incomplete user info from Google")

        # Step 3: Create or update user in DB
        result = await db.execute(select(OperatorSG).filter_by(email=email))
        operator = result.scalar_one_or_none()

        if not operator:
            operator = OperatorSG(
                email=email,
                full_name=name,
                image=picture,
                active_date=datetime.utcnow(),
                google_id=google_id,
                refresh_token=refresh_token
            )
            db.add(operator)
        else:
            # Update refresh_token if user already exists
            operator.refresh_token = refresh_token

        await db.commit()

        return {
            "message": "Login successful",
            "email": email,
            "name": name,
            "image": picture,
            "google_id": google_id,
            "success": True,
            "operator_id": operator.id
        }

@app.post("/ticket-transfer")
async def ticket_transfer_notification(
    transfer_data: Dict[str, str], 
    db: AsyncSession = Depends(get_db)
):
    """
    Send a Google Chat notification for a ticket transfer between two users.
    
    Expected request body:
    {
        "from": "sender@email.com",
        "to": "recipient@email.com",
        "ticketId": "unique_ticket_id"
    }
    """
    try:
        # Validate input
        if not all(key in transfer_data for key in ['from', 'to', 'ticketId']):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Query OperatorSG to get full names
        from_result = await db.execute(
            select(OperatorSG).where(OperatorSG.email == transfer_data['from'])
        )
        to_result = await db.execute(
            select(OperatorSG).where(OperatorSG.email == transfer_data['to'])
        )
        
        from_operator = from_result.scalar_one_or_none()
        to_operator = to_result.scalar_one_or_none()
        
        if not from_operator or not to_operator:
            raise HTTPException(status_code=404, detail="One or both operators not found")
        
        # Extract usernames for Google Chat mentions
        from_username = from_operator.email.split('@')[0]
        to_username = to_operator.email.split('@')[0]
        
        # Prepare Google Chat notification payload
        payload = {
            "cards": [
                {
                    "header": {
                        "title": "🔄 Ticket Transfer",
                        "subtitle": f"Ticket Transfer Request"
                    },
                    "sections": [
                        {
                            "widgets": [
                                {
                                    "textParagraph": {
                                        "text": f"<users/{from_username}> {from_operator.full_name} is requesting assistance from <users/{to_username}> {to_operator.full_name} for the ticket: {transfer_data['ticketId']}"
                                    }
                                }
                            ]
                        },
                        {
                            "widgets": [
                                {
                                    "buttons": [
                                        {
                                            "textButton": {
                                                "text": "View Dashboard",
                                                "onClick": {
                                                    "openLink": {
                                                        "url": f"{os.getenv('FRONTEND_URL', 'https://support.example.com')}/signin"
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        
        # Send notification to Google Chat
        async with httpx.AsyncClient() as client:
            webhook_url = os.getenv('GOOGLE_CHAT_WEBHOOK_URL', 
                "https://chat.googleapis.com/v1/spaces/AAQAys6OFTM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=CCLGglbxyz8fMv0jdHhevoAp4VswRaakxnc9w-qRzFU")
            response = await client.post(webhook_url, json=payload)
            response.raise_for_status()
        
        return {"status": "Notification for ticket transfer sent successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in ticket transfer notification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send ticket transfer notification: {str(e)}")

@app.post("/reassign-operator")
async def reassign_operator(
    reassign_data: Dict[str, str], 
    db: AsyncSession = Depends(get_db)
):
    """
    Reassign the on-call operator.

    Request body:
    {
        "switch_from": "current_operator@email.com",
        "switch_to": "new_operator@email.com"
    }

    Behavior:
    - If 'switch_from' has an active_date -> transfer it to 'switch_to'
    - If 'switch_from' has no active_date -> just assign today's date to 'switch_to'
    """
    try:
        # Validate input
        if not all(key in reassign_data for key in ['switch_from', 'switch_to']):
            raise HTTPException(status_code=400, detail="Missing required fields")

        # Query for both operators
        from_result = await db.execute(
            select(OperatorSG).where(OperatorSG.email == reassign_data['switch_from'])
        )
        from_operator = from_result.scalar_one_or_none()

        to_result = await db.execute(
            select(OperatorSG).where(OperatorSG.email == reassign_data['switch_to'])
        )
        to_operator = to_result.scalar_one_or_none()

        if not from_operator:
            raise HTTPException(status_code=404, detail="Current operator not found")
        if not to_operator:
            raise HTTPException(status_code=404, detail="New operator not found")

        # Determine which date to transfer
        print(f"To {to_operator.active_date}")
        original_date = from_operator.active_date or date.today()

        # Perform reassignment
        from_operator.active_date = to_operator.active_date
        to_operator.active_date = original_date

        await db.commit()

        # Extract usernames for Google Chat mentions
        from_username = from_operator.email.split('@')[0]
        to_username = to_operator.email.split('@')[0]

        # Prepare Google Chat message
        payload = {
            "cards": [
                {
                    "header": {
                        "title": "🔄 On-Call Operator Reassigned",
                        "subtitle": "Operator Shift Change"
                    },
                    "sections": [
                        {
                            "widgets": [
                                {
                                    "textParagraph": {
                                        "text": f"On-call operator has been switched:\n"
                                                f"From: <users/{from_username}> {from_operator.full_name}\n"
                                                f"To: <users/{to_username}> {to_operator.full_name}\n"
                                                f"Date Assigned: {original_date}"
                                    }
                                }
                            ]
                        },
                        {
                            "widgets": [
                                {
                                    "buttons": [
                                        {
                                            "textButton": {
                                                "text": "View Dashboard",
                                                "onClick": {
                                                    "openLink": {
                                                        "url": f"{os.getenv('FRONTEND_URL', 'https://support.example.com')}/signin"
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }

        # Send to Google Chat
        async with httpx.AsyncClient() as client:
            webhook_url = os.getenv('GOOGLE_CHAT_WEBHOOK_URL', "https://chat.googleapis.com/v1/spaces/AAQAys6OFTM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=CCLGglbxyz8fMv0jdHhevoAp4VswRaakxnc9w-qRzFU")
            response = await client.post(webhook_url, json=payload)
            response.raise_for_status()

        return {
            "status": "Operator reassigned successfully",
            "from": from_operator.full_name,
            "to": to_operator.full_name,
            "date_transferred": str(original_date)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in operator reassignment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to reassign operator: {str(e)}")

@app.get("/operators")
async def get_all_operators(db: AsyncSession = Depends(get_db)):
    """
    Retrieve all operators with their full names and email addresses.
    
    Returns:
    - A list of dictionaries containing full_name and email for each operator
    """
    try:
        # Query all operators and select only full_name and email
        result = await db.execute(
            select(OperatorSG.full_name, OperatorSG.email)
        )
        
        # Convert the result to a list of dictionaries
        operators = [
            {
                "full_name": row.full_name,
                "email": row.email
            } for row in result.all()
        ]
        
        return {
            "operators": operators,
            "total_count": len(operators)
        }
    
    except Exception as e:
        logger.error(f"Error retrieving operators: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve operators: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)