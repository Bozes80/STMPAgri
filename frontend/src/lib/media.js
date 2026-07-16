// Utilitaire pour résoudre l'URL d'affichage des images.
// Les images stockées via /api/admin/upload retournent une URL relative
// commençant par "/api/files/..." — on la préfixe avec REACT_APP_BACKEND_URL.
// Les URLs externes (Pexels, Unsplash) sont utilisées telles quelles.
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("/api/")) return `${BACKEND_URL}${url}`;
  return url;
}
