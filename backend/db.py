import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
load_dotenv()

# Fetch MongoDB URI from .env
MONGODB_URI = os.getenv("MONGODB_URI")

# Create an async MongoDB client using Motor
client = AsyncIOMotorClient(MONGODB_URI)

# Define database and collection
db = client["SupportAssistant"]
threads_collection = db["Threads"]

# Optionally run a connection test (as a coroutine elsewhere)
async def test_connection():
    try:
        await client.admin.command('ping')
        print("✅ Connected to MongoDB asynchronously! Ping successful.")
    except Exception as e:
        print("❌ MongoDB connection failed:", e)
