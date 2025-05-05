import json
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import logging
import re
from ollama import generate
from sentence_transformers import SentenceTransformer
import faiss
import os
import time
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
import psutil
from irrelevant_keywords import irrelevant_keywords  # Import the set

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

logging.basicConfig(level=logging.INFO)

API_KEY = 'FBB8KAYBW6NEP57PELECNHWRV'  # Replace with your actual API key

scheduler = BackgroundScheduler()

with open('qa_data.json', 'r', encoding='utf-8') as f:
    qa_data = json.load(f)

with open('qa_data.json', 'w', encoding='utf-8') as f:
    json.dump(qa_data, f, indent=2, ensure_ascii=False)

categories = ['faqs', 'about', 'vague']
questions = []
answers = []
category_map = []

for cat in categories:
    for item in qa_data.get(cat, []):
        questions.append(item['question'])
        answers.append(item['answer'])
        category_map.append(cat)

embed_model = SentenceTransformer('all-MiniLM-L6-v2')
question_embeddings = embed_model.encode(questions)
index = faiss.IndexFlatL2(question_embeddings.shape[1])
index.add(np.array(question_embeddings))

def get_wind_direction(degree):
    directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    ix = round(degree / 45) % 8
    return directions[ix]

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/healthz', methods=['GET'])
def health_check():
    """
    Health check endpoint that returns service status and basic metrics
    """
    try:
        memory_usage = psutil.Process().memory_info().rss / 1024 / 1024  # in MB
        uptime = time.time() - psutil.Process().create_time()

        health_data = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0',
            'metrics': {
                'memory_usage_mb': round(memory_usage, 2),
                'uptime_seconds': round(uptime, 2)
            }
        }
        return jsonify(health_data), 200
    except Exception as e:
        logging.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.now().isoformat(),
            'error': str(e)
        }), 500

def keep_alive():
    try:
        response = requests.get('https://gis-chatbot-app.onrender.com/healthz')
        if response.status_code == 200:
            data = response.json()
            logging.info(f'Health check successful - Status: {data["status"]}, Memory: {data["metrics"]["memory_usage_mb"]}MB')
        else:
            logging.error(f'Health check failed with status code: {response.status_code}')
    except Exception as e:
        logging.error(f'Health check failed: {str(e)}')

def init_scheduler():
    scheduler.add_job(func=keep_alive, trigger="interval", minutes=10)
    scheduler.start()
    logging.info('Scheduler started')

@app.route('/embed', methods=['POST'])
def embed_new_question():
    data = request.json
    question = data.get('question')
    answer = data.get('answer')
    category = data.get('category', 'faqs')

    if not question or not answer:
        return jsonify({'error': 'Both question and answer are required'}), 400

    if category not in qa_data:
        qa_data[category] = []

    qa_data[category].append({'question': question, 'answer': answer})

    with open('qa_data.json', 'w', encoding='utf-8') as f:
        json.dump(qa_data, f, indent=2, ensure_ascii=False)

    questions.append(question)
    answers.append(answer)
    category_map.append(category)

    new_embedding = embed_model.encode([question])
    index.add(np.array(new_embedding))

    return jsonify({'message': f'New Q&A added to "{category}" and embedded.'})

@app.route('/weather', methods=['GET'])
def get_weather():
    location = request.args.get('location')
    if not location:
        return jsonify({'error': 'Location parameter is required'}), 400

    weather_url = f'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{location}'
    params = {
        'key': API_KEY,
        'unitGroup': 'metric',
        'include': 'current,days'
    }

    try:
        response = requests.get(weather_url, params=params)
        response.raise_for_status()
        data = response.json()
        logging.info(f"Weather API Response for '/weather' endpoint, '{location}': {data}")

        current = data.get('currentConditions', {})
        temp_c = current.get('temp')
        humidity = current.get('humidity')
        wind_speed = current.get('windspeed')
        wind_dir_deg = current.get('winddir')
        wind_direction = get_wind_direction(wind_dir_deg) if wind_dir_deg is not None else None

        weather_data = {
            'location': data.get('resolvedAddress'),
            'status': current.get('conditions'),
            'averageTemperature': temp_c,
            'maximumTemperature': data.get('days', [{}])[0].get('tempmax'),
            'minimumTemperature': data.get('days', [{}])[0].get('tempmin'),
            'windSpeed': wind_speed,
            'windDirection': wind_direction,
            'precipitationProbability': data.get('days', [{}])[0].get('precipprob'),
            'cloudCover': current.get('cloudcover')
        }
        return jsonify(weather_data)

    except requests.exceptions.RequestException as e:
        logging.error(f"Weather API error in '/weather': {str(e)}")
        return jsonify({'error': 'Failed to fetch weather data'}), 500

@app.route('/predict-location', methods=['POST'])
def predict_location():
    data = request.json
    location = data.get('location')
    risks = data.get('risks', {})

    if not location or not risks:
        return jsonify({'error': 'Location and risks data are required'}), 400

    # Example risk thresholds (adjust as needed)
    risk_thresholds = {
        'flooding': 'low',  # Only allow "low" risk for flooding
        'rainfall': 'medium',  # Allow "medium" or lower for rainfall
        'heat_index': 'medium',  # Allow "medium" or lower for heat index
    }

    # Evaluate risks
    suitability = True
    reasons = []
    for risk_type, risk_level in risks.items():
        allowed_level = risk_thresholds.get(risk_type)
        if allowed_level and risk_level.lower() not in ['low', allowed_level]:
            suitability = False
            reasons.append(f"{risk_type.capitalize()} risk is too high ({risk_level}).")

    if suitability:
        return jsonify({
            'suitable': True,
            'message': f"{location} is suitable for green infrastructure development."
        })
    else:
        return jsonify({
            'suitable': False,
            'message': f"{location} is not suitable for green infrastructure development.",
            'reasons': reasons
        })       

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')
    if not user_input:
        return jsonify({'error': 'Message is required'}), 400

    logging.info(f"Received message: {user_input}")

    user_input_lower = user_input.lower().strip()
    user_input_cleaned = re.sub(r'[^a-z\s]', '', user_input_lower) # Keep only letters and spaces
    user_words = user_input_cleaned.split()

    logging.info(f"Cleaned user input: '{user_input_cleaned}'")
    logging.info(f"User input words: {user_words}")
    logging.info(f"Irrelevant keywords: {irrelevant_keywords}")

    greetings = ["hi", "hello", "hey", "good morning", "good evening"]
    if user_input_lower in [greet for greet in greetings] or any(greet + ' ' in user_input_lower for greet in greetings) or any(' ' + greet in user_input_lower for greet in greetings):
        return jsonify({'response': "Greetings! How can I assist you today? 😊"})

    for word in user_words:
        logging.info(f"Checking word '{word}' against irrelevant keywords...")
        if word in irrelevant_keywords:
            logging.info(f"Irrelevant keyword '{word}' detected. Declining to answer.")
            return jsonify({'response': "Let's focus on GIS, weather, and urban planning. 🗺️🌦️"})
        elif word.endswith('s') and word[:-1] in irrelevant_keywords:
            singular_word = word[:-1]
            logging.info(f"Irrelevant (plural) keyword '{word}' (singular: '{singular_word}') detected. Declining to answer.")
            return jsonify({'response': "Let's focus on GIS, weather, and urban planning. 🗺️🌦️"})
        else:
            logging.info(f"Word '{word}' not found (singular or plural) in irrelevant keywords.")

    for i, question in enumerate(questions):
        logging.info(f"Checking exact match against: {questions[i]}") # Log exact match attempt
        if question.lower().strip() == user_input_lower:  # Exact match
            logging.info(f"Exact match found. Responding with: {answers[i]}")
            return jsonify({'response': answers[i]})

    if "weather" in user_input_lower or "heat index" in user_input_lower or "wind speed" in user_input_lower or "how hot" in user_input_lower or "how strong is the wind" in user_input_lower:
        location_parts = user_input_lower.split("in")
        location_query = location_parts[-1].strip() if len(location_parts) > 1 else user_input_lower.replace("weather", "").replace("heat index", "").replace("wind speed", "").replace("how hot", "").replace("how strong is the wind", "").strip()
        logging.info(f"Weather query detected. Location: {location_query}")

        weather_url = f'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{location_query}'
        params = {
            'key': API_KEY,
            'unitGroup': 'metric',
            'include': 'current,days'
        }

        try:
            response = requests.get(weather_url, params=params)
            response.raise_for_status()
            data = response.json()
            logging.info(f"Weather API Response for '/chat', '{location_query}': {data}")

            current = data.get('currentConditions', {})
            temp_c = current.get('temp')
            humidity = current.get('humidity')
            wind_speed = current.get('windspeed')
            wind_dir_deg = current.get('winddir')
            wind_direction = get_wind_direction(wind_dir_deg) if wind_dir_deg is not None else None
            precip_prob = data.get('days', [{}])[0].get('precipprob')
            cloud_cover = current.get('cloudcover')
            temp_max_c = data.get('days', [{}])[0].get('tempmax')
            temp_min_c = data.get('days', [{}])[0].get('tempmin')
            conditions = current.get('conditions')

            response_parts = [f"Weather in {data.get('resolvedAddress', location_query)}, Philippines:"]
            if conditions:
                response_parts.append(f"Status: {conditions}")
            if temp_c is not None:
                response_parts.append(f"Average Temperature: {temp_c:.1f}°C 🌡️")
            if temp_max_c is not None:
                response_parts.append(f"Maximum Temperature: {temp_max_c:.1f}°C")
            if temp_min_c is not None:
                response_parts.append(f"Minimum Temperature: {temp_min_c:.1f}°C")
            if wind_speed is not None and wind_direction:
                response_parts.append(f"Wind: {wind_speed} km/h {wind_direction} 🌬️")
            elif wind_speed is not None:
                response_parts.append(f"Wind Speed: {wind_speed} km/h 🌬️")
            if precip_prob is not None:
                response_parts.append(f"Precipitation Probability: {precip_prob}%")
            if cloud_cover is not None:
                response_parts.append(f"Cloud Cover: {cloud_cover}% ☁️")

            weather_response = "\n".join(response_parts).strip()
            logging.info(f"Weather response: {weather_response}")
            return jsonify({'response': weather_response})

        except requests.exceptions.RequestException as e:
            logging.error(f"Weather fetch error in '/chat': {e}")
            return jsonify({'response': "Sorry, I couldn't retrieve the weather data."})

    if len(user_input.split()) < 3:
        return jsonify({'response': "Please be more specific."})

    query_embedding = embed_model.encode([user_input])
    D, I = index.search(np.array(query_embedding), k=1)
    retrieved_question = questions[I[0][0]]
    retrieved_answer = answers[I[0][0]]

    logging.info(f"Matched (embedding): {retrieved_question} → {retrieved_answer}")

    prompt = (
        "You are Malia, a helpful AI assistant focused on GIS, weather, and urban planning.\n"
        "You were created in 2025 by Remuel Bongat Fernan.\n"
        "Your purpose is to answer user questions concisely (maximum 10 words) if they are related to GIS, weather, or urban planning.\n"
        "Do not include any information about your development, creators, or purpose in your answer unless the user specifically asks about it.\n"
        "If the user asks a question outside of GIS, weather, or urban planning, respond with: 'That question is outside my area of expertise. I can help with GIS, weather, and urban planning inquiries. 🗺️🌦️'\n"
        "If asked 'What are you?', respond with: 'I am Malia, your GIS assistant.'\n"
        "If asked 'Who made you?', respond with: 'I was created by Remuel Bongat Fernan.'\n"
        "Be polite and helpful within your defined scope.\n"
        f"User Question: {user_input}\n"
        "Answer:"
    )
    logging.info(f"Ollama Prompt being sent: {prompt}") # Log the prompt

    start_time = time.time()
    try:
        response = generate("tinyllama", prompt=prompt)
        end_time = time.time()
        logging.info(f"Ollama response time: {end_time - start_time:.2f} seconds")
        logging.info(f"Ollama Response: {response.response.strip()}") # Log the response
        return jsonify({'response': response.response.strip()})
    except Exception as e:
        logging.error(f"An error occurred during Ollama interaction: {e}")
        return jsonify({'error': 'AI response failed'}), 500

if __name__ == '_main_':
    init_scheduler()
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)