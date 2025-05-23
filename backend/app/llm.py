# Fichier : app/llm.py

import logging  # Pour gérer les logs
from tenacity import retry, stop_after_attempt, wait_exponential  # Pour la gestion automatique des tentatives en cas d'échec
from langchain_ollama import OllamaLLM  # Intégration du modèle LLM via Ollama
from app.config import settings  # Fichier de configuration contenant les paramètres de l’application

# Initialisation du logger
logger = logging.getLogger(__name__)

# Service d'accès au LLM (modèle de langage)
class LLMService:
    def __init__(self):
        # Création d'une instance du modèle Ollama avec les paramètres définis dans le fichier de configuration
        self.llm = OllamaLLM(
            model=settings.OLLAMA_MODEL,               # Nom du modèle (ex: "deepseek-r1:7b")
            base_url=settings.OLLAMA_BASE_URL,         # URL du serveur Ollama
            temperature=0.2,                            # Température basse pour des réponses plus déterministes
            top_p=0.7,                                  # Paramètre de filtrage nucleus sampling
            timeout=settings.TIMEOUT,                  # Délai maximum pour répondre
            system="You are a concise assistant. Never include thoughts, commentary, or <think> tags. Only provide final answers."
            # Prompt système pour cadrer le comportement du modèle
        )
        logger.info("LLM service initialized")  # Log d’initialisation

    # Méthode asynchrone avec mécanisme de retry : génère une réponse à un prompt
    @retry(
        stop=stop_after_attempt(settings.MAX_RETRIES),         # Nombre maximum de tentatives
        wait=wait_exponential(multiplier=1, min=4, max=10)     # Attente exponentielle entre les tentatives
    )
    async def generate_async(self, prompt: str) -> str:
        return await self.llm.agenerate([prompt])  # Utilisation asynchrone de Ollama pour générer une réponse

    # Méthode synchrone avec les mêmes paramètres de retry
    @retry(
        stop=stop_after_attempt(settings.MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    def generate(self, prompt: str) -> str:
        return self.llm.invoke(prompt)  # Utilisation synchrone de Ollama

# Fonction utilitaire pour instancier le service LLM (utilisé comme dépendance dans FastAPI par exemple)
def get_llm() -> LLMService:
    return LLMService()
