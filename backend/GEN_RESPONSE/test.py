from astrapy.db import AstraDB
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

ASTRA_DB_API_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
ASTRA_DB_APPLICATION_TOKEN = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_DB_NAMESPACE = os.getenv("ASTRA_DB_NAMESPACE")
ASTRA_DB_COLLECTION = os.getenv("ASTRA_DB_COLLECTION")

# Connect to AstraDB
db =AstraDB(
    api_endpoint=ASTRA_DB_API_ENDPOINT,
    application_token=ASTRA_DB_APPLICATION_TOKEN
)

# Test connection
try:
    collection = db.collection(ASTRA_DB_COLLECTION)
    print(f"✅ Connected to Collection: {ASTRA_DB_COLLECTION}")
    
    # Test inserting data
    test_data = {"id": "test123", "name": "Test Entry"}
    collection.insert(test_data)
    print("✅ Test data inserted successfully!")
    
    # Fetch test data
    result = collection.find_one({"id": "test123"})
    print("✅ Fetched Data:", result)

except Exception as e:
    print("❌ Error:", e)
