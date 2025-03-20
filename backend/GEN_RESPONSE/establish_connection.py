import os
from dotenv import load_dotenv
from astrapy import DataAPIClient, Database

# Load environment variables from .env file
load_dotenv()

def connect_to_database() -> Database:
    """
    Connects to a DataStax Astra database using environment variables from .env.
    """
    endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")  
    token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")

    if not token or not endpoint:
        raise RuntimeError("Missing ASTRA_DB_API_ENDPOINT or ASTRA_DB_APPLICATION_TOKEN in .env file")

    client = DataAPIClient(token)
    database = client.get_database(endpoint)

    print(f"Connected to database {database.info().name}")
    return database