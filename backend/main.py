import os
from dotenv import load_dotenv
from pydantic import BaseModel
from datetime import datetime
from passlib.hash import bcrypt
import json
from bson import ObjectId

# Google cloud
import google.auth
import openai
from google.cloud import aiplatform
from google.cloud import storage
from google.auth.transport.requests import Request


# Fast API
from fastapi import FastAPI, UploadFile, File, HTTPException, Form,WebSocket
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
from image_func import upload_and_share

load_dotenv()
GLOBAL_COLLECTION = os.getenv("ASTRA_DB_COLLECTION") 
GOOGLE_PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")
GOOGLE_LOCATION = os.getenv("GOOGLE_LOCATION")
SERVICE_ACCOUNT_JSON = "sincere-song-448114-h6-c6b9c32362d6.json"
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
    template: str = Form(None),
    userId: str = Form(...),  # Added for statefulness
    bookId: str = Form(...)   # Added for statefulness
):
    # Validate at least one input exists
    if not image and not user_query:
        raise HTTPException(status_code=422, detail="Either image or query must be provided")

    try:
        # 1. Get conversation history
        chat = db.chats.find_one({
            "userId": ObjectId(userId),
            "bookId": ObjectId(bookId)
        })
        
        conversation_history = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in chat.get("messages", [])
        ][-10:]  # Last 10 messages

        image_url = None
        if image:
            # Generate unique filename for each upload
            image_url = upload_image_to_gcs(image, collection_name or "default")
            if not image_url:
                return JSONResponse(
                    status_code=500, 
                    content={"error": "Image upload failed"}
                )
        
        # 3. Prepare multimodal messages with history
        messages = []
        
        # Add conversation history first
        for msg in conversation_history:
            messages.append({
                "role": msg["role"],
                "content": [{"type": "text", "text": msg["content"]}]
            })
        
        # Add current message (can be text, image, or both)
        current_message = {"role": "user", "content": []}
        
        if user_query:
            current_message["content"].append({
                "type": "text",
                "text": f"{template}\n\n{user_query}"  # Include template in query
            })
        
        if image_url:
            current_message["content"].append({
                "type": "image_url",
                "image_url": image_url
            })
        
        messages.append(current_message)

        # 4. Get response from Gemini
        response = client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=messages,
        )

        return {
            "description": response.choices[0].message.content,
            "image_url": image_url
        }

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
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())

        json_data = extract_text_from_pdf(file_path)  # Implement extract_text_from_pdf()
        drive_url = upload_and_share(file_path, file.filename, username)
        if(drive_url == None):
            raise HTTPException(status_code=500, detail="Failed to upload file to GCS")

        # Generate unique collection name
        collection_name = generate_collection_name(file_path)

        collection = get_or_create_collection(GLOBAL_COLLECTION)

        print(f"✅ Successfully processed: {file.filename}")

        existing_in_astra = collection.find_one({"collectionName": collection_name})
        existing_in_mongo = book_collection.find_one({"collectionName": collection_name})

        if existing_in_astra and existing_in_mongo:
            print(f"✅ Document exists in both databases: {collection_name}")
            return JSONResponse(
                content={
                    "status": "exists",
                    "collection_name": collection_name,
                    "file_url": drive_url,
                    "message": "Document exists in both databases"
                }
            )
        
        if existing_in_astra and not existing_in_mongo:
            print(f"⚠️ Document only in AstraDB, adding to MongoDB: {collection_name}")
            book_data = {
                "title": file.filename,
                "fileUrl": drive_url,
                "uploadDate": datetime.utcnow().isoformat(),
                "progress": 0,
                "collectionName": collection_name,
                "lastReadPage": None,
                "username": username
            }
            book_collection.insert_one(book_data)
            return JSONResponse(
                content={
                    "status": "repaired",
                    "collection_name": collection_name,
                    "file_url": drive_url,
                    "message": "Added missing MongoDB record"
                }
            )
        
        if not existing_in_astra and existing_in_mongo:
            print(f"⚠️ Document only in MongoDB, adding to AstraDB: {collection_name}")
            upload_json_data(collection, file_path, collection_name)
            return JSONResponse(
                content={
                    "status": "repaired",
                    "collection_name": collection_name,
                    "file_url": drive_url,
                    "message": "Added missing AstraDB record"
                }
            )
        
        # 3. Only proceed with full upload if doesn't exist in either
        json_filename = f"{file.filename}.json"
        json_path = os.path.join(JSON_FOLDER, json_filename)
        with open(json_path, "w", encoding="utf-8") as json_file:
            json.dump(json_data, json_file, ensure_ascii=False, indent=4)

        # Upload to both databases
        upload_json_data(collection, json_path, collection_name)
        
        book_collection.insert_one({
            "title": file.filename,
            "fileUrl": drive_url,
            "uploadDate": datetime.utcnow().isoformat(),
            "progress": 0,
            "collectionName": collection_name,
            "lastReadPage": None,
            "username": username
        })

        print("✅ Successfully added to both databases")
        return JSONResponse(
            content={
                "status": "success",
                "collection_name": collection_name,
                "file_url": drive_url
            }
        )

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
    userId: str
    bookId: str

@app.post("/generate-response/")
async def generate_response(request: QueryRequest):
    try:

        # Get chat history
        chat = db.chats.find_one({
            "userId": ObjectId(request.userId),
            "bookId": ObjectId(request.bookId)
        })

        user_query = request.query
        template_text = request.template
        collection_name = request.collection_name
        # Format conversation history
        conversation_history = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in chat.get("messages", [])
        ][-10:]  # Last 10 messages for context



        # print(f"Received query: {user_query}")
        # print(f"Using template: {template_text}")
        # print(f"Using collection: {collection_name}")

        # Step 1: Query AstraDB dynamically using the provided collection
        doc_context = query_astra_db(user_query,GLOBAL_COLLECTION,collection_name)

        # Step 2: Generate response using Gemini
        response = generate_chat_response(user_query, template_text, doc_context,conversation_history)
        # print(f"Generated response: {response}")

        return {"response": response}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# -------> For storing chat history <----------------

# --- Models ---
class ChatCreate(BaseModel):
    userId: str
    bookId: str

class MessageRequest(BaseModel):
    userId: str
    role: str
    content: str

# --- Endpoints ---
@app.get("/get-chat-ids")
async def get_chat_ids(collection_name: str):
    book = db.book.find_one({"collectionName": collection_name})
    if not book:
        raise HTTPException(404, "Book not found")
    
    user = db.auth.find_one({"username": book["username"]})
    if not user:
        raise HTTPException(404, "User not found")
    
    return {
        "userId": str(user["_id"]),
        "bookId": str(book["_id"]),
        "bookTitle": book.get("title", "")
    }

@app.get("/chats/{book_id}")
async def get_chat_messages(book_id: str, userId: str):
    # Validate user exists
    if not db.auth.find_one({"_id": ObjectId(userId)}):
        raise HTTPException(404, "User not found")
    
    # Find the chat
    chat = db.chats.find_one({
        "bookId": ObjectId(book_id),
        "userId": ObjectId(userId)
    })
    
    if not chat:
        raise HTTPException(404, "Chat not found")
    
    # Return messages with proper serialization
    return {
        "messages": chat.get("messages", []),
        "chatId": str(chat["_id"])
    }

@app.post("/chats/")
async def create_chat(chat_data: ChatCreate):
    # Validate IDs
    if not db.auth.find_one({"_id": ObjectId(chat_data.userId)}):
        raise HTTPException(404, "User not found")
    if not db.book.find_one({"_id": ObjectId(chat_data.bookId)}):
        raise HTTPException(404, "Book not found")
    
    # Create or return existing chat
    chat = db.chats.find_one({
        "userId": ObjectId(chat_data.userId),
        "bookId": ObjectId(chat_data.bookId)
    })
    
    if chat:
        return {"chatId": str(chat["_id"])}
    
    new_chat = {
        "userId": ObjectId(chat_data.userId),
        "bookId": ObjectId(chat_data.bookId),
        "messages": [],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    result = db.chats.insert_one(new_chat)
    return {"chatId": str(result.inserted_id)}

@app.post("/chats/{book_id}/messages")
async def add_message(book_id: str, request:MessageRequest):
   # Validate
    if not db.auth.find_one({"_id": ObjectId(request.userId)}):
        raise HTTPException(404, "User not found")
    
    # Update chat
    db.chats.update_one(
        {
            "bookId": ObjectId(book_id),
            "userId": ObjectId(request.userId)
        },
        {
            "$push": {"messages": {
                "role": request.role,
                "content": request.content,
                "timestamp": datetime.utcnow()
            }},
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )
    
    # Return updated messages
    chat = db.chats.find_one({
        "bookId": ObjectId(book_id),
        "userId": ObjectId(request.userId)
    })
    return {"messages": chat["messages"]}

# # --- WebSocket ---
# @app.websocket("/ws/chats/{chat_id}")
# async def websocket_chat(websocket: WebSocket, chat_id: str):
#     await websocket.accept()
#     while True:
#         data = await websocket.receive_text()
#         message = json.loads(data)
        
#         # Validate and save message
#         db.chats.update_one(
#             {"_id": ObjectId(chat_id)},
#             {"$push": {"messages": message}}
#         )
        
#         # Broadcast to other clients if needed
#         await websocket.send_text(json.dumps(message))


if __name__ == "__main__":
    import uvicorn
    from dotenv import load_dotenv
    load_dotenv()
    port = int(os.getenv("PORT",10000))
    print(f"🚀 Server running at: http://0.0.0.0:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
