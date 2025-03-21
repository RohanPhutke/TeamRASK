from astrapy import Database, Collection
from astrapy.constants import VectorMetric
from astrapy.info import CollectionVectorServiceOptions
from establish_connection import connect_to_database

import json

print("Starting create_collec.py...")


def get_or_create_collection(collection_name: str):
    """
    Checks if a collection exists; if not, creates it with vector search enabled.
    """
    try:
        database = connect_to_database()
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

def upload_json_data(collection: Collection, data_file_path: str) -> None:
    """
    Uploads JSON data to the collection with vector embeddings.
    """
    with open(data_file_path, "r", encoding="utf8") as file:
        json_data = json.load(file)

    documents = [
        {**data, "$vectorize": f"summary: {data['summary']} | genres: {', '.join(data['genres'])}"}
        for data in json_data
    ]

    inserted = collection.insert_many(documents)
    print(f"Inserted {len(inserted.inserted_ids)} items.")

def main():
    database = connect_to_database()
    collection = get_or_create_collection(database, "quickstart")  
    # upload_json_data(collection, "quick_dataset.json")

if __name__ == "__main__": 
    main()
