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

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)

API_KEY = 'KWSMMFCN6WSP7JTU45KYV5BJV'

with open('qa_data.json', 'r', encoding='utf-8') as f:
    qa_data = json.load(f)

new_qa = {
    "question": "Who specifically made you?",
    "answer": "Remuel Bongat Fernan made me."
}
qa_data.setdefault('about', []).append(new_qa)

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

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

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

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')
    if not user_input:
        return jsonify({'error': 'Message is required'}), 400

    user_input_lower = user_input.lower().strip()

    if not re.match(r'^[\x00-\x7F]+$', user_input_lower):
        return jsonify({'response': "Sorry, I can only understand English 🚣️"})

    greetings = ["hi", "hello", "hey", "good morning", "good evening"]
    if any(greet in user_input_lower for greet in greetings):
        return jsonify({'response': "Hello! 😊"})

    for i, question in enumerate(questions):
        if question.lower().strip() in user_input_lower:
            return jsonify({'response': answers[i]})

    if any(keyword in user_input_lower for keyword in ["weather", "gis", "meteorology"]):
        location_query = user_input_lower.split("in")[-1].strip() if "in" in user_input_lower else user_input_lower
        location_query = location_query.replace("weather", "").strip()

        weather_url = f'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{location_query}'
        params = {
            'key': API_KEY,
            'include': 'current'
        }

        try:
            response = requests.get(weather_url, params=params)
            response.raise_for_status()
            data = response.json()

            current = data.get('currentConditions', {})
            temp_f = current.get('temp')
            temp_c = (temp_f - 32) * 5 / 9 if temp_f is not None else None

            weather_data = {
                'temperature': temp_c,
                'conditions': current.get('conditions'),
                'humidity': current.get('humidity'),
                'windSpeed': current.get('windspeed'),
                'windDirection': current.get('winddirection'),
                'location': data.get('resolvedAddress')
            }

            return jsonify({
                'response': (
                    f"Current weather in {weather_data['location']}: {weather_data['conditions']}, "
                    f"{weather_data['temperature']:.1f}°C 🌡️, Wind: {weather_data['windSpeed']} km/h 🌬️"
                )
            })

        except Exception as e:
            logging.error(f"Weather fetch error: {e}")
            return jsonify({'response': "Sorry, I couldn't retrieve the weather data."})

    if len(user_input.split()) < 3:
        return jsonify({'response': "Please be more specific."})

    irrelevant_keywords = [
        "tiktok", "facebook", "instagram", "twitter", "snapchat", "reddit", "netflix", "hulu",
        "youtube", "spotify", "apple music", "soundcloud", "gaming", "fortnite", "minecraft", "valorant",
        "roblox", "league of legends", "taylor swift", "drake", "bts", "blackpink", "kpop", "celebrity",
        "gossip", "memes", "jokes", "funny", "movies", "tv shows", "anime", "manga", "fanfic", "romance",
        "dating", "love", "crush", "relationship", "heartbreak", "breakup", "marriage", "wedding",
        "divorce", "parenting", "baby", "pets", "dog", "cat", "food", "recipes", "cooking", "baking",
        "restaurant", "fast food", "shopping", "fashion", "clothing", "makeup", "skincare", "beauty",
        "fitness", "workout", "exercise", "gym", "diet", "weight loss", "mental health", "therapy",
        "self-care", "finance", "money", "stocks", "investing", "crypto", "bitcoin", "nft", "real estate",
        "cars", "motorcycles", "travel", "vacation", "flight", "hotel", "airbnb", "beach", "mountain",
        "holiday", "birthday", "party", "event", "school", "exam", "homework", "assignment", "teacher",
        "classmate", "friend", "bullying", "drugs", "alcohol", "smoking", "crime", "murder", "violence",
        "war", "politics", "president", "election", "government", "law", "religion", "god", "atheism",
        "philosophy", "history", "art", "music", "book", "novel", "author", "poetry", "literature"
    ]

    if any(re.search(rf'\b{re.escape(k)}\b', user_input) for k in irrelevant_keywords):
        return jsonify({'response': "Let's focus on GIS, weather, and urban planning. 🗺️🌦️"})

    query_embedding = embed_model.encode([user_input])
    D, I = index.search(np.array(query_embedding), k=1)
    retrieved_question = questions[I[0][0]]
    retrieved_answer = answers[I[0][0]]

    logging.info(f"User: {user_input}")
    logging.info(f"Matched (embedding): {retrieved_question} → {retrieved_answer}")

    prompt = (
        "Answer the user's question directly and briefly (maximum 5 words). Do not start your answer with any introductory phrases or acknowledge your identity unless specifically asked.\n"
        "Your name is Malya\n"
        "You were developed and made in 2025. \n"
        "You are a concise AI assistant for a GIS web app. \n"
        "Do not use aliases.\n"
        "Do not engage in conversation beyond answering the current question.\n"
        "Do not mention a 'team' unless specifically describing EcoUrban Initiatives' creation of you.\n"
        "Do not offer demos or alternatives.\n"
        "You can use emojis. \n"
        "Answer only in English.\n"
        "Do not ask the user any questions.\n"
        "If asked for future updates, tell them that your developers are currently working on it. \n"
        "Do not answer private or sensitive questions.\n"
        "If asked 'What are you?' or similar identity questions, respond with: 'I am Malia, your GIS assistant.'\n"
        "If asked 'Who made you?' or 'Who specifically made you?', respond with: 'Remuel Bongat Fernan made me.'\n"
        "If asked about EcoUrban Initiatives, mention they are a dedicated team focused on sustainable urban development.\n"
        "Be polite.\n"
        "Decline to answer personal questions.\n"
        "Provide factual GIS and urban planning info if relevant.\n"
        f"Question: {user_input}\n"
        "Answer:"
    )

    start_time = time.time()
    try:
        response = generate("tinyllama", prompt=prompt)
        end_time = time.time()
        logging.info(f"Ollama response time: {end_time - start_time:.2f} seconds")
        return jsonify({'response': response.response.strip()})
    except Exception as e:
        logging.error(f"TinyLlama Error: {e}")
        return jsonify({'error': 'AI response failed'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)