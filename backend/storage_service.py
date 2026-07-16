"""Service de stockage objet — intégration gérée par Emergent.

Fournit un upload/download asynchrone pour les fichiers (images) du back-office.
Le storage_key est initialisé une seule fois (au démarrage) et réutilisé pour
toutes les opérations. Les fichiers sont préfixés par le nom de l'app pour
isoler ce projet des autres.
"""
import os
import logging
from typing import Tuple

import httpx

logger = logging.getLogger("stmp.storage")

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ["EMERGENT_LLM_KEY"]
APP_NAME = "stmp-agri"

_storage_key: str | None = None


async def init_storage() -> str:
    """Initialise et met en cache le storage_key. À appeler une fois au démarrage."""
    global _storage_key
    if _storage_key:
        return _storage_key
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY})
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    logger.info("Storage initialisé (préfixe: %s)", APP_NAME)
    return _storage_key


async def _ensure_key() -> str:
    if _storage_key:
        return _storage_key
    return await init_storage()


async def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload un fichier au chemin donné. Retourne le dict {path, size, etag}."""
    key = await _ensure_key()
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            content=data,
        )
    resp.raise_for_status()
    return resp.json()


async def get_object(path: str) -> Tuple[bytes, str]:
    """Télécharge un fichier. Retourne (bytes, content_type)."""
    key = await _ensure_key()
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
        )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
