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
        return db
    except (ConnectionFailure, ConfigurationError) as e:
        print(f"MongoDB Connection Error: {e}")
        return None

db = connect_to_mongo()  # Global database connection
