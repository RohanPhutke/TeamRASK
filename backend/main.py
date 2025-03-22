import os
import json
import hashlib
from pydantic import BaseModel
from google.cloud import aiplatform
from vertexai.generative_models import GenerativeModel
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader
from dotenv import load_dotenv
from astrapy import DataAPIClient, Database
from connect_to_database import connect_to_database
from connect_to_mongo import db
ASTRA_DB_COLLECTION = os.getenv("ASTRA_DB_COLLECTION")
GOOGLE_PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")
GOOGLE_LOCATION = os.getenv("GOOGLE_LOCATION")
load_dotenv()
# Initialize FastAPI
app = FastAPI()

aiplatform.init(project=GOOGLE_PROJECT_ID, location=GOOGLE_LOCATION)
# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to ["http://localhost:5173"] for better security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from connect_to_database import connect_to_database
from astrapy.constants import VectorMetric
from astrapy.info import CollectionVectorServiceOptions


# GLOBAL VARIABLE
database = connect_to_database()
def generate_collection_name(file_path):
    """Generates a SHA-256 hash of the PDF content to use as a unique collection name."""
    hasher = hashlib.sha256()
    
    with open(file_path, "rb") as f:
        while chunk := f.read(4096):  # Read in chunks to handle large files efficiently
            hasher.update(chunk)

    return hasher.hexdigest()[:16]

def get_or_create_collection(collection_name: str):
    """
    Checks if a collection exists; if not, creates it with vector search enabled.
    """
    try:
        
        collections = database.list_collection_names()
        if collection_name in collections:
            print(f"✅ Collection '{collection_name}' already exists.")
            return database.get_collection(collection_name)

        print(f"⚙️ Creating new collection: {collection_name}...")
        collection = database.create_collection(
            collection_name,
            metric=VectorMetric.COSINE,
            service=CollectionVectorServiceOptions(
                provider="nvidia",
                model_name="NV-Embed-QA",
            ),
        )
        print(f"✅ Collection '{collection.full_name}' created successfully.")
        return collection

    except Exception as e:
        print(f"❌ Error creating collection: {e}")

def upload_json_data(collection, data_file_path: str):
    """
    Uploads JSON data to AstraDB collection with vector embeddings.
    """
    try:
        with open(data_file_path, "r", encoding="utf8") as file:
            json_data = json.load(file)

        documents = [
            {**data, "$vectorize": f"text: {data['text']}"}  
            for data in json_data
        ]

        inserted = collection.insert_many(documents)
        print(f"✅ Inserted {len(inserted.inserted_ids)} items successfully.")

    except Exception as e:
        print(f"❌ Error inserting data: {e}")
# Folder setup
UPLOAD_FOLDER = "uploads"
JSON_FOLDER = "json_files"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(JSON_FOLDER, exist_ok=True)

@app.post("/upload/")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Uploads a PDF, extracts text paragraph-wise, and stores it as JSON.
    """
    try:
        # Save uploaded PDF
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())

        # Extract text paragraph-wise
        json_data = extract_text_from_pdf(file_path)

        # Generate unique collection name
        collection_name = generate_collection_name(file_path)
        existing_collections = database.list_collection_names()
        if collection_name in existing_collections:
            print(f"⚠️ Collection '{collection_name}' already exists. Skipping data insertion.")
            return JSONResponse(content={"collection_name": collection_name, "message": "Collection already exists. Skipping insertion."})
        collection = get_or_create_collection(collection_name)

        # Save JSON file
        json_filename = f"{file.filename}.json"
        json_path = os.path.join(JSON_FOLDER, json_filename)
        with open(json_path, "w", encoding="utf-8") as json_file:
            json.dump(json_data, json_file, ensure_ascii=False, indent=4)

        print(f"✅ Successfully processed: {file.filename}")
        
        # Upload JSON data to the collection
        
        upload_json_data(collection, json_path)
        user_collection = db["user"]  # MongoDB Collection
        user_collection.insert_one({
            "username": "sample_user",
            "book_added": file.filename,
            "collection_name": collection_name
        })
        # Return only the collection name
        print("Added to Mongo DB")
        return JSONResponse(content={"collection_name": collection_name})

    except Exception as e:
        print(f"❌ Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {e}")

@app.get("/download/{filename}")
async def download_json(filename: str):
    """
    Allows downloading the processed JSON file.
    """
    json_path = os.path.join(JSON_FOLDER, filename)
    if os.path.exists(json_path):
        return FileResponse(json_path, media_type="application/json", filename=filename)
    
    raise HTTPException(status_code=404, detail="File not found.")

def extract_text_from_pdf(file_path):
    """
    Extracts text from a PDF and splits it into paragraphs with a max length of 700 characters.
    """
    extracted_paragraphs = []

    try:
        with open(file_path, "rb") as pdf_file:
            reader = PdfReader(pdf_file)

            for i, page in enumerate(reader.pages, 1):
                text = page.extract_text() or ""  # Extract text, avoid None values

                # Splitting into paragraphs when text length exceeds 700 chars
                words = text.split()
                current_paragraph = []
                current_length = 0
                paragraph_count = 1

                for word in words:
                    current_paragraph.append(word)
                    current_length += len(word) + 1  # +1 for spaces

                    if current_length >= 700:
                        extracted_paragraphs.append({
                            "page": i,
                            "paragraph": paragraph_count,
                            "text": " ".join(current_paragraph)
                        })
                        paragraph_count += 1
                        current_paragraph = []
                        current_length = 0

                # Add the last paragraph if it exists
                if current_paragraph:
                    extracted_paragraphs.append({
                        "page": i,
                        "paragraph": paragraph_count,
                        "text": " ".join(current_paragraph)
                    })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading PDF: {e}")

    return extracted_paragraphs
@app.get("/users/")
async def get_all_users():
    """Fetches all users and their uploaded books from MongoDB."""
    try:
        users = list(db["user"].find({}, {"_id": 0}))  # Exclude MongoDB _id
        return JSONResponse(content={"users": users})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {e}")
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

        # print("here is doc Context",doc_context)

        return doc_context

    except Exception as e:
        print(f"âŒ Error querying collection: {e}")
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
    print("🚀 Server running at: http://127.0.0.1:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
