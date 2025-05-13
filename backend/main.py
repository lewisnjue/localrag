from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from dotenv import load_dotenv
import os 
from google.genai import types
from pathlib import Path
from google import genai
from fastapi import FastAPI , Request

from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


app = FastAPI()


PINECODE_API_KEY = os.getenv("PINECODE_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")



model = SentenceTransformer("all-MiniLM-L6-v2")
pc  = Pinecone(api_key=PINECODE_API_KEY)
client = genai.Client(api_key=GEMINI_API_KEY)
index = pc.Index('rag-update')


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post('/predict')
async def handle_request(request: Request):
    data = await request.json()
    question = data.get('question', '')

    query_embedding = model.encode(question).tolist()
    results = index.query(
        vector=query_embedding,
        top_k=100,
        include_metadata=True
    )

    text = []
    results['matches']
    for match in results['matches']:
        text.append(match['metadata']['text'])
    context_text = ''.join(text) 

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"Question: {question}\nContext: {context_text}",
        config=types.GenerateContentConfig(
            system_instruction="You are a helpful assistant. Answer the question based on the provided context only. You can use extra knowledge if needed, and if the question is not relevant, respond with 'Sorry, I cannot help you.'"
        ),
    )

    return {"answer": response.text}

