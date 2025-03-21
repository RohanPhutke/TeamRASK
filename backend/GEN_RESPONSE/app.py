import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from google.cloud import aiplatform
from vertexai.generative_models import GenerativeModel

from establish_connection import connect_to_database

# Load environment variables
load_dotenv()
GOOGLE_PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")
GOOGLE_LOCATION = os.getenv("GOOGLE_LOCATION")

# Initialize FastAPI
app = FastAPI()

# Initialize Vertex AI
aiplatform.init(project=GOOGLE_PROJECT_ID, location=GOOGLE_LOCATION)

# Connect to AstraDB
database = connect_to_database()

# Request model
class QueryRequest(BaseModel):
    query: str
    template: str
    collection_name: str

@app.post("/generate-response/")
async def generate_response(request: QueryRequest):
    try:
        user_query = request.query
        template_text = request.template
        collection_name = request.collection_name  # <-- Get collection from request

        print(f"Received query: {user_query}")
        print(f"Using template: {template_text}")
        print(f"Using collection: {collection_name}")

        # Step 1: Query AstraDB dynamically using the provided collection
        doc_context = query_astra_db(user_query, collection_name)

        # Step 2: Generate response using Gemini
        response = generate_chat_response(user_query, template_text, doc_context)

        return {"response": response}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def query_astra_db(query_text: str, collection_name: str):
    """
    Queries a dynamically selected collection in AstraDB using vector similarity search.
    """
    try:
        # Get the specified collection
        collection = database.get_collection(collection_name)

        query_vector = {"$vectorize": f"text: {query_text}"}
        cursor = collection.find({}, sort=query_vector, limit=5)

        results = list(cursor)
        if not results:
            print("⚠️ No matching results found.")
            return ""

        doc_context = ""
        for i, doc in enumerate(results, 1):
            text_data = doc.get("text", "No text found")
            doc_context += f"\n{i}. {text_data}"  # Collect text for Gemini input
            # print(f"{i}. {text_data}")

        return doc_context

    except Exception as e:
        print(f"❌ Error querying collection: {e}")
        return ""

def generate_chat_response(query, template, context):
    """Generates response using Gemini-Pro."""
    model = GenerativeModel("gemini-pro")
    prompt = f"""
    {template}
    -------------
    START CONTEXT:
    {json.dumps(context, indent=2)}
    END CONTEXT
    -------------
    QUESTION: {query}
    """
    response = model.generate_content(prompt)
    return response.text.strip() if response else "No response received."

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
