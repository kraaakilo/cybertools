import csv
import json

def convert_csv_to_json(csv_file, json_file):
    """Convert CSV file to JSON format."""
    data = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        csv_reader = csv.DictReader(f)
        for row in csv_reader:
            data.append(row)
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Converted {len(data)} records from {csv_file} to {json_file}")

if __name__ == "__main__":
    convert_csv_to_json("Resources.csv", "resources.json")
