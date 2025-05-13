from sentence_transformers import SentenceTransformer
import pinecone
from dotenv import load_dotenv
import os 
from google.genai import types
from pathlib import Path
from google import genai
from fastapi import FastAPI , Request
from fastapi.middleware.cors import CORSMiddleware
from databases import Database
from pydantic import BaseModel
from fastapi import HTTPException
import logging

load_dotenv()

app = FastAPI()

PINECODE_API_KEY = os.getenv("PINECODE_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DATABASE_URL = os.getenv("NEON_DB")

model = SentenceTransformer("all-MiniLM-L6-v2")

# Initialize Pinecone client using the new API
pc = pinecone.Pinecone(api_key=PINECODE_API_KEY)

# Example of creating an index if it doesn't exist
if 'rag-update' not in pc.list_indexes().names():
    pc.create_index(
        name='rag-update',
        dimension=1536,
        metric='euclidean',
        spec=pinecone.ServerlessSpec(
            cloud='aws',
            region='us-west-2'
        )
    )

index = pc.Index('rag-update')

client = genai.Client(api_key=GEMINI_API_KEY)
database = Database(DATABASE_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.ERROR, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

# User model
class User(BaseModel):
    username: str
    password: str

# Chat model
class Chat(BaseModel):
    user_id: int
    message: str

# User login endpoint
@app.post("/login")
async def login(user: User):
    try:
        query = "SELECT id FROM users WHERE username = :username AND password = :password"
        result = await database.fetch_one(query, values={"username": user.username, "password": user.password})
        if not result:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return {"user_id": result["id"]}
    except Exception as e:
        logger.error(f"Error in /login: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Add detailed logging to capture errors and stack traces
@app.post("/register")
async def register(user: User):
    try:
        # Check if the 'users' table exists
        table_check_query = "SELECT to_regclass('public.users')"
        table_exists = await database.fetch_one(table_check_query)
        if not table_exists or not table_exists["to_regclass"]:
            # Create the 'users' table if it does not exist
            create_table_query = """
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            )
            """
            await database.execute(create_table_query)

        # Check if the username already exists
        query = "SELECT id FROM users WHERE username = :username"
        result = await database.fetch_one(query, values={"username": user.username})
        if not result:
            return {"status": "error", "message": "User does not exist"}

        # Insert the new user into the database
        query = "INSERT INTO users (username, password) VALUES (:username, :password)"
        await database.execute(query, values={"username": user.username, "password": user.password})
        return {"status": "success", "message": "User registered successfully"}
    except Exception as e:
        logger.error(f"Error in /register: {e}", exc_info=True)  # Log the full stack trace
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Save chat endpoint
@app.post("/save_chat")
async def save_chat(chat: Chat):
    query = "INSERT INTO chats (user_id, message) VALUES (:user_id, :message)"
    await database.execute(query, values={"user_id": chat.user_id, "message": chat.message})
    return {"status": "success"}

# Get recent chats endpoint
@app.get("/recent_chats/{user_id}")
async def recent_chats(user_id: int):
    query = "SELECT message FROM chats WHERE user_id = :user_id ORDER BY id DESC LIMIT 10"
    results = await database.fetch_all(query, values={"user_id": user_id})
    return {"chats": [result["message"] for result in results]}

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

