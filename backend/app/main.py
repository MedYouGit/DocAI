# Fichier : main.py

import logging  # Pour configurer les logs
from fastapi import FastAPI, Depends, HTTPException  # FastAPI pour créer l'API web
from fastapi.middleware.cors import CORSMiddleware  # Middleware pour gérer les autorisations CORS
from sqlalchemy.orm import Session  # (Non utilisé ici, probablement prévu pour un futur usage avec une base de données)
from app.api import ChatItem, router as api_router  # Import de la route API définie dans app/api.py
from app.config import settings  # Import des paramètres de configuration

# Configuration du système de logs
logging.basicConfig(
    level=logging.INFO,  # Niveau d'affichage des logs
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"  # Format des messages de log
)

# Création de l'application FastAPI avec des métadonnées utiles pour la documentation
app = FastAPI(
    title="MedYouIN RAG API",  # Titre de l'application
    description="Professional RAG system for MedYouIN",  # Description dans la doc
    version="1.0.0",  # Version de l’API
    openapi_url="/api/v1/openapi.json",  # URL pour le fichier OpenAPI
    docs_url="/api/v1/docs",  # URL pour la doc Swagger
    redoc_url="/api/v1/redoc"  # URL pour la doc Redoc
)

# Middleware CORS (Cross-Origin Resource Sharing)
# Autorise tous les domaines à accéder à l'API (pratique pour le développement, à restreindre en prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Accepte les requêtes de n'importe quelle origine
    allow_credentials=True,
    allow_methods=["*"],        # Autorise toutes les méthodes HTTP (GET, POST, etc.)
    allow_headers=["*"],        # Autorise tous les en-têtes
)

# Inclusion des routes définies dans le fichier api.py
app.include_router(api_router)

# Événement déclenché au démarrage de l'application
@app.on_event("startup")
async def startup_event():
    logging.info("Application startup complete")  # Log pour indiquer que l'application est prête
