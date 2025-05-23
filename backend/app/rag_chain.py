# Fichier : app/rag_chain.py

import logging
from typing import Dict, List
from langchain_core.documents import Document  # Représente un document structuré utilisé par LangChain
from app.chroma import VectorStore  # Classe personnalisée pour accéder à la base vectorielle Chroma
from app.llm import LLMService  # Classe pour interagir avec le LLM via Ollama
from app.config import settings  # Paramètres de configuration

logger = logging.getLogger(__name__)  # Logger pour enregistrer les événements

# Classe principale de la chaîne RAG
class RAGChain:
    def __init__(self):
        self.llm = LLMService()  # Initialisation du modèle de langage
        self.vector_store = VectorStore()  # Initialisation de la base vectorielle
        logger.info("RAG chain initialized")

    # Méthode interne pour formater les documents récupérés comme contexte texte
    def _format_context(self, docs: List[Document]) -> str:
        return "\n\n".join(
            f"Source: {doc.metadata.get('source', 'Unknown')}\n"
            f"Content: {doc.page_content}"
            for doc in docs
        )

    # Méthode principale : exécute une requête RAG avec recherche + génération
    def query(self, question: str, k: int = 3) -> Dict[str, str | List[str]]:
        try:
            # Recherche les k documents les plus similaires à la question
            docs = self.vector_store.similarity_search(question, k=k)
            
            # Formate les documents comme contexte pour le prompt
            context = self._format_context(docs)
            
            # Crée un prompt structuré avec instructions strictes
            prompt = f"""
                You are DocAI, an AI assistant for MedYouIN.

                You must follow these rules:
                - Do NOT include thoughts, reflections, or reasoning (no "<think>" or explanations).
                - Only answer based on the context below.
                - If the answer is not in the context, say: "I don't know based on the provided documents."

                Format your response exactly as follows:
                1. A concise answer based strictly on the context  
                2. The exact source document reference (filename)  
                3. The relevant excerpt that supports your answer

                Context:
                {context}

                Question:
                {question}
                """

            # Envoie le prompt au modèle de langage
            response = self.llm.generate(prompt)

            # Renvoie une réponse formatée avec l’info utile
            return {
                "answer": response,
                "sources": [doc.metadata.get("source", "Unknown") for doc in docs],  # Fichiers sources
                "context_used": bool(docs)  # True si des documents ont été utilisés
            }
        except Exception as e:
            logger.error(f"RAG query failed: {str(e)}")  # Log d’erreur
            raise  # Relance l’exception pour propagation

# Rend la classe accessible à l’import (utile pour éviter d’exporter tout le fichier)
__all__ = ['RAGChain']
