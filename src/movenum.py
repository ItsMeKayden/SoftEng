import os
import re

def rename_weather_files():
    # Get absolute path to JSON files
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_dir = os.path.join(current_dir, "components", "Datasets")
    
    # Process each file in the directory
    for filename in os.listdir(json_dir):
        if filename.startswith('2025') and filename.endswith('.json'):
            # Extract parts of the filename
            year_pattern = r'^(2025)(janapril)(.*?)(\.json)$'
            match = re.match(year_pattern, filename)
            
            if match:
                year = match.group(1)
                months = match.group(2)
                location = match.group(3)
                extension = match.group(4)
                
                # Create new filename
                new_filename = f"{months}{location}_{year}{extension}"
                
                # Get full file paths
                old_path = os.path.join(json_dir, filename)
                new_path = os.path.join(json_dir, new_filename)
                
                try:
                    # Rename the file
                    os.rename(old_path, new_path)
                    print(f"Renamed: {filename} -> {new_filename}")
                except Exception as e:
                    print(f"Error renaming {filename}: {str(e)}")

if __name__ == "__main__":
    rename_weather_files()