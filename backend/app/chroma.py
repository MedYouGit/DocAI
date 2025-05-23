# Fichier : app/chroma.py

import logging  # Module standard pour la journalisation
from typing import List  # Pour l'annotation de types
from langchain_chroma import Chroma  # Classe Chroma de LangChain pour le stockage vectoriel
from langchain_core.embeddings import Embeddings  # Base de classe pour les embeddings
from langchain_core.documents import Document  # Représente un document manipulé par LangChain
from langchain_ollama import OllamaEmbeddings  # Intégration des embeddings via Ollama
from app.config import settings  # Paramètres de configuration personnalisés

# Création d'un logger pour suivre les événements dans ce fichier
logger = logging.getLogger(__name__)

# Classe Singleton pour gérer un store vectoriel (VectorStore)
class VectorStore:
    _instance = None  # Attribut de classe pour stocker l'instance unique
    
    # Redéfinition du constructeur pour appliquer le pattern Singleton
    def __new__(cls):
        if cls._instance is None:
            # Si aucune instance n'existe, on en crée une et on l'initialise
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance  # On retourne toujours la même instance

    # Méthode d'initialisation du store vectoriel
    def _initialize(self):
        # Création d'une instance d'embeddings via Ollama
        self.embeddings = OllamaEmbeddings(
            model=settings.OLLAMA_EMBEDDING_MODEL,  # Nom du modèle à utiliser
            base_url=settings.OLLAMA_BASE_URL       # URL du serveur Ollama
        )

        # Initialisation du client Chroma avec le chemin de la base de données
        # et la fonction d'embedding à utiliser
        self.client = Chroma(
            persist_directory=settings.CHROMA_DB_PATH,
            embedding_function=self.embeddings
        )

        logger.info("Vector store initialized")  # Message de confirmation dans les logs

    # Méthode pour ajouter des documents dans le store
    def add_documents(self, documents: List[Document]) -> List[str]:
        return self.client.add_documents(documents)  # Retourne les IDs des documents ajoutés

    # Méthode pour effectuer une recherche par similarité dans le store
    def similarity_search(self, query: str, k: int = 3) -> List[Document]:
        return self.client.similarity_search(query, k=k)  # Retourne les k documents les plus similaires

# Fonction utilitaire pour accéder à l’instance unique du VectorStore
def get_vector_store() -> VectorStore:
    return VectorStore()
