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
default_thresholds = {
    'flooding': 'low',
    'rainfall': 'medium',
    'heat_index': 'medium'
}

PRIORITY_LOCATIONS = [
    "Quezon City", "Manila", "Makati", "Pasig", "Taguig",
    "Mandaluyong", "San Juan", "Marikina", "Caloocan", "Pasay"
]


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

def analyze_multiple_locations():
    """Analyze multiple locations for green infrastructure suitability"""
    results = []
    
    for location in PRIORITY_LOCATIONS:
        try:
            weather_data = get_weather_data(location)
            if not weather_data:
                continue
                
            risk_assessment = get_risk_thresholds(weather_data)
            
            # Calculate suitability score (0-100)
            score = 100
            high_risks = sum(1 for risk in risk_assessment.values() if risk == 'high')
            medium_risks = sum(1 for risk in risk_assessment.values() if risk == 'medium')
            
            score -= (high_risks * 40)  # Deduct 40 points for each high risk
            score -= (medium_risks * 20)  # Deduct 20 points for each medium risk
            
            current = weather_data.get('currentConditions', {})
            daily = weather_data.get('days', [{}])[0]
            
            results.append({
                'location': location,
                'score': max(0, score),
                'risks': risk_assessment,
                'current_conditions': {
                    'temperature': current.get('temp'),
                    'humidity': current.get('humidity'),
                    'precipitation': daily.get('precip'),
                    'precipProbability': daily.get('precipprob')
                },
                'timestamp': current.get('datetime', datetime.now().isoformat())
            })
            
        except Exception as e:
            logging.error(f"Error analyzing {location}: {str(e)}")
            continue
    
    return sorted(results, key=lambda x: x['score'], reverse=True)

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

@app.route('/recommend-locations', methods=['GET'])
def recommend_locations():
    """Get recommended locations for green infrastructure"""
    try:
        results = analyze_multiple_locations()
        
        if not results:
            return jsonify({
                'error': 'Could not analyze locations'
            }), 500
            
        recommendations = []
        for result in results:
            if result['score'] >= 60:  # Only recommend locations with good scores
                recommendations.append({
                    'location': result['location'],
                    'score': result['score'],
                    'recommendation': 'Highly Recommended' if result['score'] >= 80 
                                    else 'Recommended',
                    'risks': result['risks'],
                    'current_conditions': result['current_conditions'],
                    'timestamp': result['timestamp']
                })
        
        return jsonify({
            'recommendations': recommendations,
            'timestamp': datetime.now().isoformat(),
            'message': f"Found {len(recommendations)} suitable locations for green infrastructure"
        })
        
    except Exception as e:
        logging.error(f"Error getting recommendations: {str(e)}")
        return jsonify({'error': 'Failed to generate recommendations'}), 500

@app.route('/weather', methods=['GET'])
def weather_route():
    location = request.args.get('location')
    return jsonify(get_weather_data(location))

def get_weather_data(location):
    """Fetch weather data for a location"""
    if not location:
        logging.error("No location provided")
        return None
        
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
        
        # Validate required fields
        if 'currentConditions' not in data or 'days' not in data:
            logging.error(f"Missing required fields in weather data for {location}")
            return None
            
        logging.info(f"Weather data fetched for {location}")
        return data
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to fetch weather data for {location}: {str(e)}")
        return None

def get_risk_thresholds(weather_data):
    if not weather_data or 'currentConditions' not in weather_data:
        logging.error("Invalid or missing weather data")
        return default_thresholds

    try:
        current = weather_data.get('currentConditions', {})
        daily = weather_data.get('days', [{}])[0]

        # Get current values
        precip = daily.get('precip', 0)          # mm per day
        precip_prob = daily.get('precipprob', 0) # percentage
        temp = current.get('temp', 0)            # Celsius
        humidity = current.get('humidity', 0)     # percentage

        # PAGASA-based flooding risk (mm/day)
        flooding_risk = (
            'high' if precip > 30 or (precip > 20 and precip_prob > 85) else  # Heavy rainfall >30mm
            'medium' if precip > 15 or (precip > 7.5 and precip_prob > 65) else  # Moderate rainfall
            'low'
        )

        # PAGASA rainfall warning system
        rainfall_risk = (
            'high' if precip_prob > 75 or precip > 25 else    # Red warning
            'medium' if precip_prob > 45 or precip > 12.5 else # Orange warning
            'low'                                              # Yellow warning
        )

        # PAGASA heat index danger levels
        heat_index_risk = (
            'high' if temp > 41 or (temp > 35 and humidity > 80) else   # Danger level
            'medium' if temp > 33 or (temp > 32 and humidity > 70) else # Caution required
            'low'
        )

        logging.info(f"PH-based risk assessment - Temp: {temp}°C, Humidity: {humidity}%, Precip: {precip}mm")

        return {
            'flooding': flooding_risk,
            'rainfall': rainfall_risk,
            'heat_index': heat_index_risk
        }

    except Exception as e:
        logging.error(f"Error calculating risk thresholds: {str(e)}")
        return default_thresholds

# Update the predict-location route
@app.route('/predict-location', methods=['POST'])
def predict_location():
    data = request.json
    location = data.get('location')
    risks = data.get('risks', {})

    if not location or not risks:
        return jsonify({'error': 'Location and risks data are required'}), 400

    try:
        # Get current weather data for the location
        weather_data = get_weather_data(location)
        if not weather_data:
            return jsonify({'error': 'Could not fetch weather data'}), 500
        
        # Get dynamic thresholds based on current conditions
        risk_assessment = get_risk_thresholds(weather_data)
        
        # Add timestamp to response
        current_time = weather_data.get('currentConditions', {}).get('datetime', 
            datetime.now().isoformat())

        # Evaluate risks using current weather data
        suitability = True
        reasons = []
        
        # Update risk evaluation logic
        current_conditions = weather_data.get('currentConditions', {})
        daily_forecast = weather_data.get('days', [{}])[0]

        # Determine suitability based on risk levels
        high_risks = sum(1 for risk in risk_assessment.values() if risk == 'high')
        medium_risks = sum(1 for risk in risk_assessment.values() if risk == 'medium')
        
        suitability = high_risks == 0 and medium_risks <= 1  # Suitable only if no high risks and at most one medium risk
        
        reasons = []
        if high_risks > 0:
            reasons.append("High risk levels detected")
        if medium_risks > 1:
            reasons.append("Multiple medium risk factors present")

        return jsonify({
            'suitable': suitability,
            'message': f"{location} is {'suitable' if suitability else 'not suitable'} for green infrastructure development.",
            'reasons': reasons,
            'thresholds': risk_assessment,
            'timestamp': current_time,
            'current_conditions': {
                'temperature': current_conditions.get('temp'),
                'humidity': current_conditions.get('humidity'),
                'precipitation': daily_forecast.get('precip'),
                'precipProbability': daily_forecast.get('precipprob')
            }
        })

    except Exception as e:
        logging.error(f"Error in predict_location: {str(e)}")
        return jsonify({'error': 'Failed to evaluate location suitability'}), 500

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

            if not data or 'currentConditions' not in data:
                logging.error(f"Invalid weather data received for {location_query}")
                return jsonify({'response': "Sorry, I couldn't get valid weather data for that location."})

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

    try:
        query_embedding = embed_model.encode([user_input])
        if query_embedding.size == 0:
            logging.error("Failed to generate embedding for user input")
            return jsonify({'response': "I couldn't process your question. Please try rephrasing it."})
        
        D, I = index.search(np.array(query_embedding), k=1)
        
        if len(I) == 0 or len(I[0]) == 0:
            logging.error("No matching question found")
            return jsonify({'response': "I couldn't find a relevant answer. Please try rephrasing your question."})
            
        retrieved_question = questions[I[0][0]]
        retrieved_answer = answers[I[0][0]]

        logging.info(f"Matched (embedding): {retrieved_question} → {retrieved_answer}")

        start_time = time.time()
        try:
            response = generate("tinyllama", prompt=retrieved_question)
            end_time = time.time()
            logging.info(f"Ollama response time: {end_time - start_time:.2f} seconds")
            logging.info(f"Ollama Response: {response.response.strip()}")
            return jsonify({'response': response.response.strip()})
        except Exception as e:
            logging.error(f"An error occurred during Ollama interaction: {e}")
            return jsonify({'error': 'AI response failed'}), 500
    except Exception as e:
        logging.error(f"Error processing chat request: {str(e)}")
        return jsonify({'error': 'Failed to process request'}), 500

if __name__ == '__main__':
    init_scheduler()
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)