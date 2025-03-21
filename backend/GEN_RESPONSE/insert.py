import json
from establish_connection import connect_to_database
from create_collec import get_or_create_collection

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

if __name__ == "__main__":
    db = connect_to_database()
    collection = get_or_create_collection("quickstart")
    upload_json_data(collection, "quick_dataset.json")