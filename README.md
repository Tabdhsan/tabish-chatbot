# Azure OpenAI Chain of Thought Streaming

A production-ready Python application that demonstrates real-time streaming of Azure OpenAI's chain of thought reasoning with compliance logging. Includes both a CLI application and a FastAPI server.

## 🚀 Features

- 🧠 **Real-time Chain of Thought Streaming**: Watch the AI think step-by-step
- 📊 **Compliance Logging**: Complete audit trail with JSONL format -> Can move to Application Insights for when moved to an Azure Functions application
- 🔒 **Environment-based Configuration**: Secure secret management
- 🌐 **FastAPI Server**: RESTful API with auto-generated documentation

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone the repository url
cd tabish-chatbot/api
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate
```

### 3. Install Dependencies

```bash
# Install all dependencies
pip install -r requirements.txt
```

### 4. Environment Configuration

Copy the template and create your `.env` file:

```bash
cp env_template.txt .env
```

Edit `.env` with your Azure OpenAI credentials:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_actual_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_MODEL_DEPLOYMENT=gpt-5-nano
AZURE_OPENAI_API_VERSION=2025-03-01-preview

# Optional: Compliance Logging Configuration
COMPLIANCE_LOG_DIR=compliance_logs
ENABLE_COMPLIANCE_LOGGING=true

# Optional: Application Configuration
APP_ENV=development
LOG_LEVEL=INFO
```


## 🌐 API Server Usage

### Start the API Server

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### API Endpoints

#### Health Check
```bash
curl http://localhost:8000/health
```

#### Streaming Chat Endpoint
```bash
curl -X POST "http://localhost:8000/chat/stream" \
  -H "Content-Type: application/json" \
  -d '{"query": "Explain quantum computing"}' \
  --no-buffer
```

### API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Testing

### Test the API

```bash
# Test with curl (recommended)
curl http://localhost:8000/health

# Or create a simple test script
python -c "
import requests
response = requests.post('http://localhost:8000/chat', 
  json={'query': 'What is 2+2?'})
print(response.json())
"
```

### Test with curl

```bash
# Health check
curl http://localhost:8000/health

# Streaming chat
curl -X POST "http://localhost:8000/chat/stream" \
  -H "Content-Type: application/json" \
  -d '{"query": "Explain quantum computing"}' \
  --no-buffer
```

## 📁 Project Structure

```
ai-azure-test/
├── azure_ai_test.py          # Main CLI application
├── requirements.txt          # All dependencies
├── env_template.txt          # Environment template
├── .env                      # Your environment variables (create this)
├── .gitignore               # Git ignore file
├── README.md                # This file
├── compliance_logs/         # Compliance logs directory
├── api/                     # API server directory
│   ├── main.py             # FastAPI application
│   └── README.md          # API documentation
└── venv/                   # Virtual environment
```

## ⚙️ Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_OPENAI_API_KEY` | ✅ | - | Your Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | ✅ | - | Your Azure OpenAI endpoint URL |
| `AZURE_OPENAI_MODEL_DEPLOYMENT` | ❌ | `gpt-5-nano` | Model deployment name |
| `AZURE_OPENAI_API_VERSION` | ❌ | `2025-03-01-preview` | API version |
| `COMPLIANCE_LOG_DIR` | ❌ | `compliance_logs` | Directory for compliance logs |
| `ENABLE_COMPLIANCE_LOGGING` | ❌ | `true` | Enable/disable compliance logging |

## 📊 Compliance Logging

The application creates detailed JSONL logs for compliance purposes:

- **Session tracking**: Unique session IDs for each run
- **Event logging**: Every streaming event is logged with timestamps
- **Complete audit trail**: Full reasoning and answer content
- **Configurable**: Can be disabled via environment variable

### Log Format

Each line in the JSONL file contains a JSON object with:
- `timestamp`: ISO format timestamp
- `event_type`: Type of event (reasoning_delta, output_delta, etc.)
- `session_id`: Unique session identifier
- `content`: Event content (when applicable)
- `sequence_number`: Event sequence number (when available)

## 🔒 Security

- ✅ Environment variables for secrets
- ✅ `.env` file excluded from version control
- ✅ No hardcoded credentials
- ✅ Configurable compliance logging


### Code Structure

The application uses a clean OOP structure:
- `AzureOpenAIConfig`: Configuration management
- `ComplianceLogger`: Audit trail logging
- `AzureOpenAIStreamingClient`: API client
- `StreamingResponseProcessor`: Response handling
- `AzureOpenAIApp`: Main orchestrator


## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request
