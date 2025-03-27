import os
import json
import hashlib
from pydantic import BaseModel
from datetime import datetime

# Google cloud
import uuid
import google.auth
import openai
from google.cloud import aiplatform
from google.cloud import storage
from vertexai.generative_models import GenerativeModel
from google.auth.transport.requests import Request

from passlib.context import CryptContext
from passlib.hash import bcrypt
# Fast API
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from PyPDF2 import PdfReader
from dotenv import load_dotenv

# Astra DB
from astrapy import DataAPIClient, Database

# Mongo DB
from connect_to_database import connect_to_database
from connect_to_mongo import db


ASTRA_DB_COLLECTION = os.getenv("ASTRA_DB_COLLECTION")
GOOGLE_PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")
GOOGLE_LOCATION = os.getenv("GOOGLE_LOCATION")
SERVICE_ACCOUNT_JSON = "sincere-song-448114-h6-c6b9c32362d6.json"
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = SERVICE_ACCOUNT_JSON


# Google Cloud Storage setup
storage_client = storage.Client()
BUCKET_NAME = "test-bucket-rohan-2025"

# Google AI setup
project_id = "sincere-song-448114-h6"
location = "us-central1"

credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
credentials.refresh(Request())

client = openai.OpenAI(
    base_url=f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/endpoints/openapi",
    api_key=credentials.token,
)


load_dotenv()
# Initialize FastAPI
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend's URL for security
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
)
aiplatform.init(project=GOOGLE_PROJECT_ID, location=GOOGLE_LOCATION)

from connect_to_database import connect_to_database
from astrapy.constants import VectorMetric
from astrapy.info import CollectionVectorServiceOptions


# Check if a file already exists in the bucket
def file_exists(bucket_name, file_path):
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(file_path)
    return blob.exists()



def upload_image_to_gcs(file, book_name):
    try:
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'png'
        unique_filename = f"screenshot_{timestamp}_{unique_id}.{file_extension}"
        
        folder_name = book_name.replace(" ", "-").lower()
        gcs_path = f"{folder_name}/{unique_filename}"

        print(f"🔄 Uploading {gcs_path} to GCS...")

        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(gcs_path)
        blob.upload_from_file(file.file)
        blob.make_public()

        return blob.public_url

    except Exception as e:
        print(f"❌ Error uploading image: {e}")
        return None

@app.post("/image-response")
async def image_response(
    image: UploadFile = File(None),
    user_query: str = Form(...),
    collection_name: str = Form(None),
    template: str = Form(None)
):
    # Validate at least one input exists
    if not image and not user_query:
        raise HTTPException(status_code=422, detail="Either image or query must be provided")

    image_url = None
    if image:
        # Generate unique filename for each upload
        image_url = upload_image_to_gcs(image, collection_name or "default")
        if not image_url:
            return JSONResponse(
                status_code=500, 
                content={"error": "Image upload failed"}
            )

    try:
        # Prepare messages for Gemini
        messages = [{"role": "user", "content": []}]
        
        if user_query:
            messages[0]["content"].append({
                "type": "text", 
                "text": user_query
            })
        
        if image_url:
            messages[0]["content"].append({
                "type": "image_url", 
                "image_url": image_url
            })

        # Get response from Gemini
        response = client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=messages,
        )

        return JSONResponse(content={
            "description": response.choices[0].message.content,
            "image_url": image_url
        })

    except Exception as e:
        print(f"❌ Error during Gemini analysis: {e}")
        return JSONResponse(
            status_code=500, 
            content={"error": str(e)}
        )

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
app.mount("/files", StaticFiles(directory=UPLOAD_FOLDER), name="files")
user_collection = db["user"]
book_collection = db["book"]
auth_collection = db["auth"]

class User(BaseModel):
    username: str
    password: str

@app.post("/register")
def register(user: User):
    if auth_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="User already exists")
    hashed_password = bcrypt.hash(user.password)
    auth_collection.insert_one({"username": user.username, "password": hashed_password})
    return {"success": True}

@app.post("/login")
def login(user: User):
    existing_user = auth_collection.find_one({"username": user.username})
    if not existing_user or not bcrypt.verify(user.password, existing_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    return {"success": True}

@app.get("/books")
async def get_books(username: str):
    """Fetch all books stored in MongoDB."""
    try:
        books = list(book_collection.find({"username": username}, {"_id": 0})) # Exclude MongoDB _id field
        return books
    except Exception as e:
        return {"error": f"Failed to fetch books: {str(e)}"}
@app.post("/upload/")
async def upload_pdf(file: UploadFile = File(...), username: str = Form(...)):
    """Upload a PDF, extract text, store JSON, and generate embeddings."""
    try:
        # Save uploaded file
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())

        # Extract text (replace this with actual text extraction logic)
        json_data = extract_text_from_pdf(file_path)  # Implement extract_text_from_pdf()
        file_url = f"http://127.0.0.1:8000/files/{file.filename}"

        # Generate unique collection name
        collection_name = generate_collection_name(file_path)
        existing_collections = database.list_collection_names()

        if collection_name in existing_collections:
            print(f"⚠️ Collection '{collection_name}' already exists. Skipping data insertion.")
            return JSONResponse(content={"collection_name": collection_name, "file_url": file_url, "message": "Collection already exists. Skipping insertion."})

        # Create AstraDB collection
        collection = get_or_create_collection(collection_name)

        # Save JSON file
        json_filename = f"{file.filename}.json"
        json_path = os.path.join(JSON_FOLDER, json_filename)
        with open(json_path, "w", encoding="utf-8") as json_file:
            json.dump(json_data, json_file, ensure_ascii=False, indent=4)

        print(f"✅ Successfully processed: {file.filename}")

        # Upload JSON data to AstraDB
        upload_json_data(collection, json_path)

        # Store metadata in MongoDB
          # Your book collection
        book_data = {
            "title": file.filename,
            "fileUrl": file_url,
            "uploadDate": datetime.utcnow().isoformat(),
            "progress": 0,  # Default progress
            "collectionName": collection_name,
            "lastReadPage": None,  # Optional, initially set to None
            "username": username
        }
        book_id = book_collection.insert_one(book_data).inserted_id
        user_collection.insert_one({
            "username": "sample_user",
            "book_added": file.filename,
            "collection_name": collection_name,
            "file_url": file_url
        })
        print("✅ Added to MongoDB")

        return JSONResponse(content={"collection_name": collection_name, "file_url": file_url})

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

if __name__ == "__main__":
    import uvicorn
    print("🚀 Server running at: http://127.0.0.1:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
