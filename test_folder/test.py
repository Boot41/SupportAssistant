from agents import Agent, Runner
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load OpenAI API key from .env
load_dotenv()
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# Define specialized agents with fixed, hardcoded responses
tech_agent = Agent(name="TechSupport", instructions="Always reply with exactly this: I am a Tech Agent. Do not say anything else.")
nontech_agent = Agent(name="NonTechSupport", instructions="Always reply with exactly this: I am a Non-Tech Agent. Do not say anything else.")
marketing_agent = Agent(name="MarketingSupport", instructions="Always reply with exactly this: I am a Marketing Agent. Do not say anything else.")

# Define classifier agent
classifier = Agent(
    name="Support Agent",
    instructions=(
        "You are a classifier. Classify the user's query into one of the following categories: 'tech', 'non-tech', or 'marketing'.\n"
        "Just respond with one word: tech, non-tech, or marketing."
    )
)

def route_query(query: str):
    result = Runner.run_sync(classifier, query)
    classification = result.final_output.strip().lower()
    print(f"\n[Classifier picked]: {classification}")

    if classification == "tech":
        return "I am a Tech Agent"
    elif classification == "non-tech":
        return "I am a Non-Tech Agent"
    elif classification == "marketing":
        return "I am a Marketing Agent"
    else:
        return "Could not classify the query."

# Example usage
if __name__ == "__main__":
    user_query = input("Enter your query: ")
    result = route_query(user_query)
    print("\nResponse:", result)