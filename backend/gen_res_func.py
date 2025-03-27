from connect_to_database import database
from vertexai.generative_models import GenerativeModel
import json

def query_astra_db(query_text: str, collection_name: str):
    """
    Queries a dynamically selected collection in AstraDB using vector similarity search.
    """
    print("Querying AstraDB.......")
    try:
        # Get the specified collection
        collection = database.get_collection(collection_name)

        query_vector = {"$vectorize": f"text: {query_text}"}
        cursor = collection.find({}, sort=query_vector, limit=5)

        results = list(cursor)
        if not results:
            print("âš ï¸ No matching results found.")
            return ""

        doc_context = ""
        for i, doc in enumerate(results, 1):
            text_data = doc.get("text", "No text found")
            doc_context += f"\n{i}. {text_data}"  # Collect text for Gemini input
            # print(f"{i}. {text_data}")

        return doc_context

    except Exception as e:
        print(f"âŒ Error querying collection: {e}")
        return ""

def generate_chat_response(query, template, context):
    """Generates response using Gemini-Pro."""
    model = GenerativeModel("gemini-2.0-flash")
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