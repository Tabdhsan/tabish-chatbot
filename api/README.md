# Azure OpenAI Chain of Thought API

Quick reference for the FastAPI server. For complete setup instructions, see the main [README.md](../README.md).

## 🚀 Quick Start

```bash
# Navigate to API directory
cd api

# Activate virtual environment
source ../venv/bin/activate

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📚 API Endpoints

### Health Check
```bash
GET /health
```

### Chat (Regular)
```bash
POST /chat
Content-Type: application/json

{
  "query": "What is the capital of France?",
  "system_prompt": "You are a helpful assistant."
}
```

### Chat (Streaming)
```bash
POST /chat/stream
Content-Type: application/json

{
  "query": "Explain quantum computing",
  "system_prompt": "You are a patient teacher."
}
```

## 📖 Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Testing

```bash
# Run test script
python test_api.py

# Or test manually
curl http://localhost:8000/health
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is 2+2?"}'
```

## 🔧 Configuration

The API uses the same environment variables as the CLI application. See the main README for complete configuration details.

## 🚀 Deployment

The API is ready for production deployment. See the main README for Docker and cloud deployment instructions.
