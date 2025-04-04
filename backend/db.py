import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, ForeignKey, DateTime, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy.future import select
import json
from datetime import datetime, timezone

# Load environment variables
load_dotenv()

# Get PostgreSQL connection string from environment variables
DATABASE_URL = os.getenv("DATABASE_URL").replace("postgresql://", "postgresql+asyncpg://")

# Create async engine with SSL parameters
engine = create_async_engine(
    DATABASE_URL, 
    connect_args={
        "ssl": True,  # Enable SSL
    }
)

# Create a base class for declarative models
Base = declarative_base()

# Define models
class Operator(Base):
    __tablename__ = "operators"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)
    image = Column(String(255))
    department = Column(String(255), default="Recruit41")
    active = Column(Boolean, default=False)
    
    tickets = relationship("Ticket", back_populates="operator")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    
    tickets = relationship("Ticket", back_populates="user")

class Ticket(Base):
    __tablename__ = "tickets"
    
    session_id = Column(String(255), primary_key=True)
    op_id = Column(Integer, ForeignKey("operators.id"), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved = Column(Boolean, default=False)
    
    operator = relationship("Operator", back_populates="tickets")
    user = relationship("User", back_populates="tickets")
    conversations = relationship("Conversation", back_populates="ticket", cascade="all, delete-orphan")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True)
    session_id = Column(String(255), ForeignKey("tickets.session_id"), nullable=False)
    turn_id = Column(Integer, nullable=False)
    role = Column(String(50), nullable=False)
    agent = Column(String(100), nullable=True)
    content = Column(Text, nullable=True)
    ai_active = Column(Boolean, default=True)
    flagged = Column(Boolean, default=False)
    tool_call_name = Column(String(100), nullable=True)
    handoff_from = Column(String(100), nullable=True)
    handoff_to = Column(String(100), nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    
    ticket = relationship("Ticket", back_populates="conversations")

# Create async session factory
async_session = sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)

# Function to get a database session
async def get_db():
    async with async_session() as session:
        yield session

# Test connection function
async def test_connection():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(lambda _: print("✅ Connected to PostgreSQL successfully!"))
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")

# Helper functions to replace MongoDB operations
async def insert_conversation_event(session_id, event):
    """Insert a conversation event into the database"""
    async with async_session() as session:
        # Check if ticket exists
        result = await session.execute(select(Ticket).where(Ticket.session_id == session_id))
        ticket = result.scalars().first()
        
        # If ticket doesn't exist, create it
        if not ticket:
            ticket = Ticket(
                session_id=session_id,
                started_at=datetime.now(timezone.utc),
                resolved=False
            )
            session.add(ticket)
        
        # Create conversation entry
        conversation = Conversation(
            session_id=session_id,
            turn_id=event.get("turn_id"),
            role=event.get("role"),
            agent=event.get("agent"),
            content=event.get("content"),
            ai_active=event.get("flags", {}).get("ai_active", True) if "flags" in event else True,
            flagged=event.get("flagged", False),
            tool_call_name=event.get("tool_call", {}).get("name") if "tool_call" in event else None,
            handoff_from=event.get("handoff", {}).get("from") if "handoff" in event else None,
            handoff_to=event.get("handoff", {}).get("to") if "handoff" in event else None,
            timestamp=datetime.fromisoformat(event.get("timestamp").rstrip("Z")) if "timestamp" in event else datetime.now(timezone.utc)
        )
        session.add(conversation)
        await session.commit()

async def update_ticket_end_time(session_id):
    """Update the ended_at time for a ticket"""
    async with async_session() as session:
        result = await session.execute(select(Ticket).where(Ticket.session_id == session_id))
        ticket = result.scalars().first()
        if ticket:
            ticket.ended_at = datetime.now(timezone.utc)
            await session.commit()

async def get_all_tickets():
    """Get all tickets from the database"""
    async with async_session() as session:
        result = await session.execute(select(Ticket))
        tickets = result.scalars().all()
        
        # Convert to dictionary format similar to MongoDB
        ticket_list = []
        for ticket in tickets:
            ticket_dict = {
                "session_id": ticket.session_id,
                "started_at": ticket.started_at.isoformat() if ticket.started_at else None,
                "ended_at": ticket.ended_at.isoformat() if ticket.ended_at else None,
                "resolved": ticket.resolved,
                "user_id": ticket.user_id
            }
            ticket_list.append(ticket_dict)
        
        return ticket_list

async def get_ticket_with_conversations(session_id):
    """Get a ticket with all its conversations"""
    async with async_session() as session:
        # Get ticket
        ticket_result = await session.execute(select(Ticket).where(Ticket.session_id == session_id))
        ticket = ticket_result.scalars().first()
        
        if not ticket:
            return None
        
        # Get conversations
        conv_result = await session.execute(
            select(Conversation)
            .where(Conversation.session_id == session_id)
            .order_by(Conversation.turn_id)
        )
        conversations = conv_result.scalars().all()
        
        # Format response similar to MongoDB
        ticket_dict = {
            "session_id": ticket.session_id,
            "started_at": ticket.started_at.isoformat() if ticket.started_at else None,
            "ended_at": ticket.ended_at.isoformat() if ticket.ended_at else None,
            "resolved": ticket.resolved,
            "user_id": ticket.user_id,
            "conversation": []
        }
        
        for conv in conversations:
            conv_dict = {
                "turn_id": conv.turn_id,
                "role": conv.role,
                "agent": conv.agent,
                "content": conv.content,
                "flagged": conv.flagged,
                "timestamp": conv.timestamp.isoformat() if conv.timestamp else None,
                "flags": {
                    "ai_active": conv.ai_active,
                    "human_override": not conv.ai_active
                }
            }
            
            # Add tool call if exists
            if conv.tool_call_name:
                conv_dict["tool_call"] = {
                    "name": conv.tool_call_name,
                    "args": {}
                }
            
            # Add handoff if exists
            if conv.handoff_from or conv.handoff_to:
                conv_dict["handoff"] = {
                    "from": conv.handoff_from,
                    "to": conv.handoff_to
                }
                
            ticket_dict["conversation"].append(conv_dict)
        
        return ticket_dict

async def toggle_conversation_flag(session_id, turn_id):
    """Toggle the flagged status for a conversation"""
    async with async_session() as session:
        result = await session.execute(
            select(Conversation)
            .where(Conversation.session_id == session_id)
            .where(Conversation.turn_id == turn_id)
        )
        conversation = result.scalars().first()
        
        if conversation:
            conversation.flagged = not conversation.flagged
            await session.commit()
            return conversation.flagged
        
        return None

async def toggle_ticket_resolved(session_id):
    """Toggle the resolved status for a ticket"""
    async with async_session() as session:
        result = await session.execute(select(Ticket).where(Ticket.session_id == session_id))
        ticket = result.scalars().first()
        
        if ticket:
            ticket.resolved = not ticket.resolved
            await session.commit()
            return ticket.resolved
        
        return None
