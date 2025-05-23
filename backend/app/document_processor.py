# Fichier : app/document_processor.py

import logging  # Pour enregistrer des messages dans les logs
from typing import List  # Pour les annotations de type
from pathlib import Path  # Pour manipuler les chemins de fichiers/dossiers
from langchain_community.document_loaders import PyPDFLoader  # Pour charger le contenu d’un fichier PDF
from langchain_text_splitters import RecursiveCharacterTextSplitter  # Pour découper les documents en morceaux
from langchain_core.documents import Document  # Représentation d’un document dans LangChain
from app.config import settings  # Paramètres de configuration personnalisés
from app.chroma import VectorStore  # Classe VectorStore pour la base vectorielle

# Création d’un logger pour suivre les actions et erreurs
logger = logging.getLogger(__name__)

# Classe qui traite les fichiers PDF et les stocke dans la base vectorielle
class DocumentProcessor:
    def __init__(self):
        # Initialisation du découpeur de texte avec les paramètres du fichier config
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        # Instanciation de la base vectorielle (Chroma via VectorStore)
        self.vector_store = VectorStore()
        logger.info("Document processor initialized")  # Log de confirmation

    def process_pdf(self, file_path: str) -> List[str]:
        """
        Traite un fichier PDF : le découpe en morceaux, y ajoute des métadonnées,
        puis envoie les morceaux dans la base vectorielle.
        """
        try:
            loader = PyPDFLoader(file_path)  # Charge le contenu du PDF
            documents = loader.load()  # Liste de documents extraits
            
            chunks = self.text_splitter.split_documents(documents)  # Découpe les documents
            
            for chunk in chunks:
                chunk.metadata["source"] = file_path  # Ajoute le chemin du fichier comme source
            
            return self.vector_store.add_documents(chunks)  # Stocke les morceaux dans Chroma
        except Exception as e:
            logger.error(f"Failed to process PDF {file_path}: {str(e)}")  # En cas d'erreur
            raise  # Propage l'exception

    def process_directory(self, directory: str) -> List[str]:
        """
        Traite tous les fichiers PDF d’un dossier donné.
        Retourne une liste de tous les identifiants de documents stockés.
        """
        doc_ids = []
        path = Path(directory)  # Crée un objet Path pour le dossier
        
        for pdf_file in path.glob("*.pdf"):  # Pour chaque fichier PDF trouvé dans le dossier
            try:
                ids = self.process_pdf(str(pdf_file))  # Traite le fichier
                doc_ids.extend(ids)  # Ajoute les IDs des chunks ajoutés
                logger.info(f"Processed {pdf_file} - {len(ids)} chunks added")  # Log de succès
            except Exception as e:
                logger.error(f"Failed to process {pdf_file}: {str(e)}")  # Log d’erreur
                continue  # Continue avec le fichier suivant en cas d’erreur
                
        return doc_ids  # Retourne tous les IDs ajoutés à la base vectorielle

# Fonction utilitaire pour obtenir une instance de DocumentProcessor
def get_document_processor() -> DocumentProcessor:
    return DocumentProcessor()
