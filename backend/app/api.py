# File: app/api.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List
from pathlib import Path
import os
from app.rag_chain import RAGChain
from app.document_processor import DocumentProcessor
from app.config import settings
import logging
from fastapi.responses import StreamingResponse
import asyncio



logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["RAG"])

# Request/Response Models
class ChatItem(BaseModel):
    _id: str
    title: str
class QueryRequest(BaseModel):
    question: str
    max_sources: int = 3

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]
    context_used: bool

class IngestResponse(BaseModel):
    message: str
    chunks_added: int
    file_name: str

class HealthResponse(BaseModel):
    status: str
    chroma_db_ready: bool
    llm_ready: bool

class VerificationResponse(BaseModel):
    status: str
    sample_document: dict = None


# Helper Methods
def ensure_data_directory():
    Path(settings.DATA_DIRECTORY).mkdir(parents=True, exist_ok=True)

# Health Check Endpoint
@router.get("/health", response_model=HealthResponse)
async def health_check(rag_chain: RAGChain = Depends(RAGChain)):
    try:
        # Test vector store
        rag_chain.vector_store.similarity_search("test", k=1)
        chroma_ready = True
    except Exception as e:
        logger.warning(f"ChromaDB check failed: {e}")
        chroma_ready = False

    try:
        # Test LLM
        rag_chain.llm.generate("test")
        llm_ready = True
    except Exception as e:
        logger.warning(f"LLM  check failed: {e}")
        llm_ready = False

    return HealthResponse(
        status="medyouin" if chroma_ready and llm_ready else "degraded",
        chroma_db_ready=chroma_ready,
        llm_ready=llm_ready
    )

# Root Endpoint
@router.get("/")
async def read_root():
    return {
        "message": "MedYouIN RAG API",
        "endpoints": {
            "docs": "/docs",
            "health": "/api/v1/health",
            "query": "/api/v1/query",
            "ingest_pdf": "/api/v1/ingest/pdf",
            "ingest_directory": "/api/v1/ingest/directory",
            "verify_ingestion": "/api/v1/ingest/verify"
        }
    }

# Query Endpoint
@router.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest, rag_chain: RAGChain = Depends(RAGChain)):
    try:
        result = rag_chain.query(
            question=request.question,
            k=request.max_sources
        )
        return QueryResponse(**result)
    except Exception as e:
        logger.error(f"Query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# PDF Ingestion Endpoint
@router.post("/ingest/pdf", response_model=IngestResponse)
async def ingest_pdf(file: UploadFile = File(...), 
                    processor: DocumentProcessor = Depends(DocumentProcessor)):
    try:
        ensure_data_directory()
        
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(400, "Only PDF files are supported")

        file_path = os.path.join(settings.DATA_DIRECTORY, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        chunk_ids = processor.process_pdf(file_path)
        os.remove(file_path)
        
        return IngestResponse(
            message="File processed successfully",
            chunks_added=len(chunk_ids),
            file_name=file.filename
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF ingestion failed: {e}")
        raise HTTPException(500, f"Failed to process PDF: {e}")

# Directory Ingestion Endpoint
@router.post("/ingest/directory", response_model=List[IngestResponse])
async def ingest_directory(processor: DocumentProcessor = Depends(DocumentProcessor)):
    try:
        ensure_data_directory()
        
        if not os.path.exists(settings.DATA_DIRECTORY):
            raise HTTPException(400, f"Directory {settings.DATA_DIRECTORY} not found")
            
        pdf_files = list(Path(settings.DATA_DIRECTORY).glob("*.pdf"))
        if not pdf_files:
            raise HTTPException(404, "No PDF files found")
        
        results = []
        for pdf_file in pdf_files:
            try:
                chunk_ids = processor.process_pdf(str(pdf_file))
                results.append(IngestResponse(
                    message=f"Processed {pdf_file.name}",
                    chunks_added=len(chunk_ids),
                    file_name=pdf_file.name
                ))
            except Exception as e:
                logger.error(f"Failed to process {pdf_file}: {e}")
                results.append(IngestResponse(
                    message=f"Failed to process {pdf_file.name}",
                    chunks_added=0,
                    file_name=pdf_file.name
                ))
                
        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Directory ingestion failed: {e}")
        raise HTTPException(500, f"Failed to process directory: {e}")

# Verification Endpoint
@router.get("/ingest/verify", response_model=VerificationResponse)
async def verify_ingestion(rag_chain: RAGChain = Depends(RAGChain)):
    try:
        docs = rag_chain.vector_store.similarity_search("test", k=1)
        
        if not docs:
            return VerificationResponse(
                status="No documents found",
                suggestion="Ingest documents first"
            )
            
        return VerificationResponse(
            status="Documents found",
            sample_document={
                "source": docs[0].metadata.get("source", "Unknown"),
                "content": docs[0].page_content[:100] + "..."
            }
        )
    except Exception as e:
        logger.error(f"Verification failed: {e}")
        raise HTTPException(500, f"Verification failed: {e}")
@router.get("/userchats", response_model=List[ChatItem])
async def get_user_chats():
    # Replace with real DB call
    return [
        {"_id": "1", "title": "Welcome to MedYouIN"},
        {"_id": "2", "title": "RAG Assistant Session"},
    ]




# SSE Generator
async def sse_generator(question: str, rag_chain: RAGChain, k: int = 3):
    try:
        result = rag_chain.query(question=question, k=k)
        answer = result["answer"]
        for sentence in answer.split(". "):
            if sentence.strip():
                yield f"data: {sentence.strip()}.\n\n"
                await asyncio.sleep(0.3)
        yield f"data: [END]\n\n"
    except Exception as e:
        yield f"data: Error: {str(e)}\n\n"

# SSE Streaming Endpoint
@router.get("/query/stream")
async def stream_query(question: str, k: int = 3, rag_chain: RAGChain = Depends(RAGChain)):
    return StreamingResponse(
        sse_generator(question, rag_chain, k),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )
