# # File: app/github_loader.py
# import logging
# import tempfile
# from pathlib import Path
# from fastapi import HTTPException

# from typing import List
# from git import Repo
# from langchain_community.document_loaders import (
#     PyPDFLoader,
#     TextLoader,
#     UnstructuredMarkdownLoader
# )
# from langchain_core.documents import Document

# logger = logging.getLogger(__name__)

# class GitHubLoader:
#     def __init__(self):
#         self.supported_extensions = {
#             '.pdf': PyPDFLoader,
#             '.txt': TextLoader,
#             '.md': UnstructuredMarkdownLoader,
#             # Add more supported file types as needed
#         }
    
#     def clone_repo(self, repo_url: str, branch: str = "main") -> str:
#         """Clone a GitHub repository to a temporary directory"""
#         temp_dir = tempfile.mkdtemp()
#         try:
#             Repo.clone_from(repo_url, temp_dir, branch=branch)
#             logger.info(f"Cloned repository {repo_url} to {temp_dir}")
#             return temp_dir
#         except Exception as e:
#             logger.error(f"Failed to clone repository {repo_url}: {str(e)}")
#             raise HTTPException(status_code=400, detail=f"Repository cloning failed: {str(e)}")

#     def load_documents_from_repo(self, repo_url: str, branch: str = "main") -> List[Document]:
#         """Load documents from a GitHub repository"""
#         temp_dir = self.clone_repo(repo_url, branch)
#         docs = []
        
#         try:
#             for ext, loader_class in self.supported_extensions.items():
#                 for file_path in Path(temp_dir).rglob(f"*{ext}"):
#                     try:
#                         loader = loader_class(str(file_path))
#                         docs.extend(loader.load())
#                         logger.info(f"Loaded {len(docs)} documents from {file_path}")
#                     except Exception as e:
#                         logger.warning(f"Failed to load {file_path}: {str(e)}")
#                         continue
            
#             return docs
#         finally:
#             # Clean up temporary directory
#             import shutil
#             shutil.rmtree(temp_dir, ignore_errors=True)

# def get_github_loader() -> GitHubLoader:
#     return GitHubLoader()