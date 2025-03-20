from astrapy import Database, Collection
from astrapy.constants import VectorMetric
from astrapy.info import CollectionVectorServiceOptions
from establish_connection import connect_to_database

import json

print("Starting create_collec.py...")


def get_or_create_collection(database: Database, collection_name: str) -> Collection:
    """
    Checks if a collection exists; if not, creates it with vector search enabled.
    """
    existing_collections = database.list_collections()
    
    if collection_name in existing_collections:
        print(f"Using existing collection: {collection_name}")
        return database.get_collection(collection_name)
    
    print(f"Creating new collection: {collection_name}")
    collection = database.create_collection(
        collection_name,
        metric=VectorMetric.COSINE,
        service=CollectionVectorServiceOptions(
            provider="nvidia",
            model_name="NV-Embed-QA",
        ),
    )

    print(f"Created collection {collection.full_name}")
    return collection

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
