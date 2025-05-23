

# Fichier : app/dependencies.py

from typing import Annotated  # Pour annoter les dépendances avec plus de clarté
from fastapi import Depends  # Permet de déclarer des dépendances dans FastAPI
from app.chroma import get_vector_store  # Fonction qui retourne l'instance de VectorStore (singleton)
from app.llm import get_llm  # Fonction qui retourne l'instance du modèle LLM (non montré ici)
from app.rag_chain import RAGChain  # Classe qui gère la chaîne RAG (retrieval-augmented generation)

# Fonction qui crée une nouvelle instance de la chaîne RAG
def get_rag_chain() -> RAGChain:
    return RAGChain()

# Dépendance annotée pour être utilisée dans les routes ou services FastAPI
# Elle permet d'injecter automatiquement une instance de RAGChain
RAGChainDep = Annotated[RAGChain, Depends(get_rag_chain)]
