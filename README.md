# DocAI - IT Documentation Assistant  
DocAI is a Retrieval-Augmented Generation (RAG) system designed to assist with IT documentation, knowledge bases, and technical support, featuring user and admin interfaces with a powerful backend.  

---  

## **Project Structure**  
```plaintext
docai/  
├── frontend/          # Frontend applications  
│   ├── user/          # Employee-facing assistant  
│   └── admin/         # IT Admin dashboard  
└── backend/           # Backend RAG system  
    ├── app/           # Application code  
    │   ├── api.py  
    │   ├── chroma.py  
    │   ├── config.py  
    │   └── dependencies.py  
    ├── document_processor.py  
    ├── llm.py  
    ├── rag_chain.py  
    ├── main.py        # FastAPI entry point  
    ├── requirements.txt  
    └── README.md  


---
```
## ⚙️ Backend RAG System

### 🔍 Features

- PDF, Markdown, and code document ingestion and processing  
- Vector embedding using Ollama/MXBAAI  
- LLM-powered question answering with source attribution  
- Streaming responses for real-time interaction  
- Health monitoring and verification endpoints

### 🧰 Prerequisites

- Python 3.9+  
- Ollama running locally (for LLM and embeddings)  
- ChromaDB for vector storage

### 🛠 Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/docai.git
cd docai/backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```


⚙️ Set up Ollama

ollama pull deepseek-r1:7b
ollama pull mxbai-embed-large
🔧 Configuration
Edit app/config.py or use environment variables:
OLLAMA_BASE_URL=http://localhost:11434
CHROMA_DB_PATH=./chroma_db
DATA_DIRECTORY=./data


🚀 Run the Backend
uvicorn main:app --reload


📡 API Endpoints
POST /api/v1/query – Submit questions to the RAG system

POST /api/v1/ingest/pdf – Upload and process PDF or code documents

GET /api/v1/query/stream – Stream responses in real-time

GET /api/v1/health – System health check

💬 Frontend Applications
👩‍💻 Employee User Interface
Interface for employees to ask questions and search IT documentation.

Features
Chat interface for querying IT docs and knowledge base

View source documents for answers

Session history

Setup:
```bash
cd frontend/user
npm install
npm run dev
```

🛠 IT Admin Dashboard
Administrative interface for managing documents and monitoring usage.

Features
Document upload and management

System monitoring

Usage analytics

Setup:
```bash
cd frontend/admin
npm install
npm run dev
```


