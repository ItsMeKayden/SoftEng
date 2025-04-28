import os
import json
import re

def clean_city_name(filename):
    # Remove months and year suffix
    name = re.sub(r'janapril|_2025', '', filename)
    # Remove special characters and normalize spaces
    name = re.sub(r'[_-]', ' ', name)
    name = name.strip().lower()
    return name

def generate_city_variations(city_name):
    variations = [city_name]
    
    # Add common variations
    if not city_name.endswith(' city'):
        variations.append(f"{city_name} city")
    
    # Province mappings with their variations
    province_mappings = {
        'albay': ['albay province', 'legazpi', 'legaspi'],
        'pangasinan': ['pangasinan province'],
        'isabela': ['isabela province'],
        'nueva ecija': ['nueva ecija province'],
        'quezon': ['quezon province'],
        'batangas': ['batangas province'],
        'cagayan': ['cagayan province', 'tuguegarao'],
        'leyte': ['leyte province', 'tacloban'],
        'bulacan': ['bulacan province', 'malolos'],
        'pampanga': ['pampanga province', 'san fernando'],
        'rizal': ['rizal province', 'antipolo'],
        'davao': ['davao city', 'davao province'],
        'cebu': ['cebu city', 'cebu province'],
        'iloilo': ['iloilo city', 'iloilo province']
    }
    
    for province, variants in province_mappings.items():
        if province in city_name:
            variations.extend(variants)
    
    return variations

def generate_dataset_code():
    # Get absolute path to JSON files
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_dir = os.path.join(current_dir, "components", "Datasets")
    
    imports = []
    weather_datasets = []
    city_mappings = []
    
    # Process each JSON file
    for filename in os.listdir(json_dir):
        if filename.endswith('_2025.json'):
            # Remove .json extension
            name = filename[:-5]
            var_name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
            
            # Create import statement
            import_line = f"import {var_name} from './{filename}';"
            imports.append(import_line)
            
            # Add to weatherDatasets
            weather_line = f"  {var_name}: {var_name},"
            weather_datasets.append(weather_line)
            
            # Generate city mapping with variations
            city_name = clean_city_name(name)
            variations = generate_city_variations(city_name)
            mapping_line = f"  {var_name}: {json.dumps(variations, ensure_ascii=False)},"
            city_mappings.append(mapping_line)
    
    # Generate the complete code
    code = "// Auto-generated dataset imports and mappings\n\n"
    code += "\n".join(imports)
    code += "\n\nexport const weatherDatasets = {\n"
    code += "  // ...existing datasets...,\n"
    code += "\n".join(weather_datasets)
    code += "\n};\n\n"
    code += "export const cityMappings = {\n"
    code += "  // ...existing mappings...,\n"
    code += "\n".join(city_mappings)
    code += "\n};\n"
    
    # Write output to JS file
    output_path = os.path.join(json_dir, 'dataset_additions.js')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(code)
    
    print(f"Generated dataset code in: {output_path}")

if __name__ == "__main__":
    generate_dataset_code()