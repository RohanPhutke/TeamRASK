from connect_to_database import database
from vertexai.generative_models import GenerativeModel
import json

def query_astra_db(query_text: str, collection_name: str, book_id: str = None):
    """
    Queries AstraDB with optional filtering by `book_id` before vector search.
    
    Args:
        query_text: Text to vectorize and search.
        collection_name: Name of the collection (e.g., "books").
        book_id: Optional filter to scope results to a specific book.
    Returns:
        Context string or empty if error.
    """
    print("Querying AstraDB.......")
    try:
        collection = database.get_collection(collection_name)
        
        # Step 1: Build the query (filter + vectorize)
        query_filter = {"book_id": book_id} if book_id else {}
        query_vector = {"$vectorize": f"text: {query_text}"}
        
        # Step 2: Execute filtered vector search
        cursor = collection.find(
            filter=query_filter,  # Apply filter FIRST
            sort=query_vector,    # Then vector similarity
            limit=5               # Top 5 matches
        )
        
        results = list(cursor)
        if not results:
            print("⚠️ No matching results found.")
            return ""
        
        # print(results)
        
        # Step 3: Format results for Gemini/LLM input
        doc_context = "\n".join(
            f"{i}. {doc.get('text', 'No text found')}"
            for i, doc in enumerate(results, 1)
        )
        return doc_context

    except Exception as e:
        print(f"❌ Error querying AstraDB: {e}")
        return ""

def generate_chat_response(query, template, context,conversation_history):
    """Generates response using Gemini-Pro."""
    model = GenerativeModel("gemini-2.0-flash")

    # Format conversation history
    history_str = "\n".join(
        f"{msg['role'].upper()}: {msg['content']}" 
        for msg in conversation_history
    )

    prompt = f"""
    {template}

    CONVERSATION HISTORY:
    {history_str}
    -------------
    DOCUMENT CONTEXT:
    {json.dumps(context, indent=2)}
    END CONTEXT
    -------------
    CURRENT QUERY : {query}

    INSTRUCTIONS:
    1. Maintain conversation flow naturally
    2. Reference previous messages when relevant
    3. Keep responses concise but helpful
    """
    response = model.generate_content(prompt)
    return response.text.strip() if response else "No response received."