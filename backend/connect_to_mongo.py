from pymongo import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv
from pymongo.errors import ConnectionFailure, ConfigurationError

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")  # Store this in .env
DB_NAME = "userinfo"  # Database Name

def connect_to_mongo():
    """Connects to MongoDB and returns the database object."""
    try:
        client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
        # Test the connection
        client.admin.command("ping")  
        db = client[DB_NAME]
        print("Connected to MongoDB")

        ensure_indexes(db)

        return db
    except (ConnectionFailure, ConfigurationError) as e:
        print(f"MongoDB Connection Error: {e}")
        return None

def ensure_indexes(db):
    """Ensures required indexes exist for optimal performance."""
    try:
        # Compound index for user+book lookup
        db.chats.create_index([("userId", 1), ("bookId", 1)])
        
        # Descending index for sorting by last activity
        db.chats.create_index([("updatedAt", -1)])
        
        # Index for message timestamp pagination
        db.chats.create_index([("messages.timestamp", 1)])
        
        print("Database indexes verified/created")
    except Exception as e:
        print(f"Index creation failed: {e}")
    
db = connect_to_mongo()  # Global database connection
