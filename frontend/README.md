# Support Assistant Frontend

This is the frontend React application for the Support Assistant chatbot. It provides a clean, modern UI for interacting with the chatbot.

## Features

- Real-time chat interface using WebSockets
- Clean, responsive design
- Visual indicators for different agent responses
- Typing indicators while waiting for responses

## Setup

1. Install the required dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

The application will be available at http://localhost:3000.

## Usage

The frontend connects to the backend WebSocket API to provide a real-time chat experience. The UI only shows the chat messages, while all the agent transitions and tool calls are logged in the terminal on the backend side.

## Structure

- `src/App.js`: Main application component
- `src/components/ChatMessage.js`: Component for rendering chat messages
- `src/components/ChatInput.js`: Component for the message input form
