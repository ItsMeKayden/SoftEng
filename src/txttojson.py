import json
import os

def convert_txt_to_json():
    # Get absolute paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    input_dir = os.path.join(current_dir, "VCDatasets2025")
    output_dir = os.path.join(current_dir, "json_datasets")

    # Create output directory if needed
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Process each TXT file
    for filename in os.listdir(input_dir):
        if filename.endswith(".txt"):
            try:
                # Read TXT file
                with open(os.path.join(input_dir, filename), 'r', encoding='utf-8') as txt_file:
                    content = txt_file.read()

                # Parse the content as JSON
                weather_data = json.loads(content)

                # Write as formatted JSON
                output_file = os.path.join(output_dir, filename.replace(".txt", ".json"))
                with open(output_file, 'w', encoding='utf-8') as json_file:
                    json.dump(weather_data, json_file, indent=2)

                print(f"Successfully converted {filename}")

            except Exception as e:
                print(f"Error converting {filename}: {str(e)}")

if __name__ == "__main__":
    convert_txt_to_json()