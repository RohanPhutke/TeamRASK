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
ASTRA_DB_COLLECTION = os.getenv("ASTRA_DB_COLLECTION")
GOOGLE_PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")
GOOGLE_LOCATION = os.getenv("GOOGLE_LOCATION")

# Initialize FastAPI
app = FastAPI()

# Initialize Vertex AI
aiplatform.init(project=GOOGLE_PROJECT_ID, location=GOOGLE_LOCATION)

# Connect to AstraDB
database = connect_to_database()
collection = database.get_collection(ASTRA_DB_COLLECTION)

# Request model
class QueryRequest(BaseModel):
    query: str
    template: str

@app.post("/generate-response/")
async def generate_response(request: QueryRequest):
    try:
        user_query = request.query
        template_text = request.template

        print(f"Received query: {user_query}")
        print(f"Using template: {template_text}")

        # Step 1: Query AstraDB directly using vector search
        doc_context = query_astra_db(user_query)
        print("Doc context :",doc_context)

        # Step 2: Generate response using Gemini
        response = generate_chat_response(user_query, template_text, doc_context)

        return {"response": response}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def query_astra_db(query_text: str):
    """
    Queries a collection in AstraDB using vector similarity search.
    """
    try:
        # Properly format the query with Astra's built-in vectorizer
        query_vector = {"$vectorize": f"text: {query_text}"}
        cursor = collection.find({}, sort=query_vector, limit=5)

        results = list(cursor)  # Convert to list
        if not results:
            print("⚠️ No matching results found.")
            return
        
        print(f"✅ Query Results ({len(results)} documents):")
        for i, doc in enumerate(results, 1):
            print(f"{i}. {doc.get('text', 'No text found')}")

    except Exception as e:
        print(f"❌ Error querying collection: {e}")


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
