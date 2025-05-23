from pydantic_settings import BaseSettings  # Importe la classe de base pour gérer les paramètres d'application
from typing import Optional  # Permet de déclarer des attributs optionnels dans la classe

# Définition d'une classe de configuration de l'application
class Settings(BaseSettings):
    # Chemin où la base de données Chroma sera stockée
    CHROMA_DB_PATH: str = "./chroma_db"
    
    # Dossier contenant les données à traiter ou indexer
    DATA_DIRECTORY: str = "./data"
    
    # Modèle utilisé par Ollama pour la génération de texte
    OLLAMA_MODEL: str = "deepseek-r1:7b"
    
    # Modèle utilisé pour générer les embeddings vectoriels
    OLLAMA_EMBEDDING_MODEL: str = "mxbai-embed-large"
    
    # Taille des morceaux de texte lors du découpage des documents (chunking)
    CHUNK_SIZE: int = 600
    
    # Chevauchement entre les morceaux de texte (évite la perte de contexte)
    CHUNK_OVERLAP: int = 150
    
    # Adresse locale de l’API Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    
    # Nombre maximum de tentatives pour une requête (utile pour la robustesse)
    MAX_RETRIES: int = 2
    
    # Délai maximum (en secondes) pour qu’une requête aboutisse avant d’abandonner
    TIMEOUT: int = 60

# Création d'une instance unique de la configuration
settings = Settings()
