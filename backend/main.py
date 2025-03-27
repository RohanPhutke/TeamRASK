import os
from dotenv import load_dotenv
from pydantic import BaseModel
from datetime import datetime
from passlib.hash import bcrypt
import json


# Google cloud
import google.auth
import openai
from google.cloud import aiplatform
from google.cloud import storage
from google.auth.transport.requests import Request


# Fast API
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Mongo DB
from connect_to_database import database
from connect_to_mongo import db

# Necessary functions
from upload_func import upload_json_data, generate_collection_name, get_or_create_collection, extract_text_from_pdf
from gen_res_func import query_astra_db, generate_chat_response
from image_func import upload_image_to_gcs

load_dotenv()

ASTRA_DB_COLLECTION = os.getenv("ASTRA_DB_COLLECTION")
GOOGLE_PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")
GOOGLE_LOCATION = os.getenv("GOOGLE_LOCATION")
SERVICE_ACCOUNT_JSON = "sincere-song-448114-h6-c6b9c32362d6.json"
BACKEND_URL = os.getenv("BACKEND_URL")
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = SERVICE_ACCOUNT_JSON

app = FastAPI()

# Folder setup
UPLOAD_FOLDER = "uploads"
JSON_FOLDER = "json_files"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(JSON_FOLDER, exist_ok=True)
app.mount("/files", StaticFiles(directory=UPLOAD_FOLDER), name="files")
user_collection = db["user"]
book_collection = db["book"]
auth_collection = db["auth"]

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




# Initialize FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend's URL for security
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],  # Allow all headers
)
aiplatform.init(project=GOOGLE_PROJECT_ID, location=GOOGLE_LOCATION)


@app.get("/")
def root():
    return {"message": "Service is alive!"}


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
        file_url = f"{BACKEND_URL}/files/{file.filename}"

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



if __name__ == "__main__":
    import uvicorn
    from dotenv import load_dotenv
    load_dotenv()
    port = int(os.getenv("PORT",10000))
    print(f"🚀 Server running at: http://0.0.0.0:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
