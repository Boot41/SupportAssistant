# Support Assistant Backend

This is the backend API for the Support Assistant chatbot application. It uses FastAPI to provide a WebSocket-based API for real-time chat communication.

## Features

- Real-time chat using WebSockets
- Agent-based architecture with specialized agents for different types of queries
- Triage system to route user queries to the appropriate specialized agent
- Terminal output showing agent transitions and tool calls

## Setup

1. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Create a `.env` file in the backend directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. Run the server:
   ```
   python main.py
   ```

The server will start on http://localhost:8001.

## API Endpoints

- `GET /`: Health check endpoint
- `GET /generate-session-id`: Generates a new session ID for WebSocket connections
- `WebSocket /ws/{session_id}`: WebSocket endpoint for chat communication

## Architecture

The backend implements a multi-agent system with the following agents:

1. **Triage Agent**: Routes user queries to specialized agents
2. **Technical Support Agent**: Handles technical issues like audio/mic problems
3. **Marketing Agent**: Handles inquiries about pricing, demos, and product features

Each agent has specific tools and can hand off to other agents when appropriate.
