from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends, Response, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import uuid
import logging
import bcrypt
import jwt
import re

import email_service
import storage_service

# ------------------------------------------------------------------ DB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_HOURS = 12

app = FastAPI(title="STMP Agri API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("stmp")

# ------------------------------------------------------------------ helpers
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def new_id() -> str:
    return str(uuid.uuid4())

def slugify(text: str) -> str:
    text = (text or "").lower().strip()
    text = re.sub(r"[àâä]", "a", text)
    text = re.sub(r"[éèêë]", "e", text)
    text = re.sub(r"[îï]", "i", text)
    text = re.sub(r"[ôö]", "o", text)
    text = re.sub(r"[ùûü]", "u", text)
    text = re.sub(r"[ç]", "c", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or new_id()[:8]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Type de jeton invalide")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur introuvable")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expirée")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Jeton invalide")

def clean(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc

# ------------------------------------------------------------------ Models
class LoginInput(BaseModel):
    email: EmailStr
    password: str

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    name: str
    category: str            # engrais | fertilisants | herbicides | insecticides | fongicides | equipements
    subcategory: Optional[str] = None
    description: str = ""
    characteristics: List[str] = []
    applications: List[str] = []
    image: str = ""
    featured: bool = False
    order: int = 0
    created_at: str = Field(default_factory=now_iso)

class ProductInput(BaseModel):
    name: str
    category: str
    subcategory: Optional[str] = None
    description: str = ""
    characteristics: List[str] = []
    applications: List[str] = []
    image: str = ""
    featured: bool = False
    order: int = 0

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    name: str
    value: str  # slug utilisé sur products.category
    description: Optional[str] = ""
    order: int = 0
    created_at: str = Field(default_factory=now_iso)

class CategoryInput(BaseModel):
    name: str
    value: str
    description: Optional[str] = ""
    order: int = 0

# ------------------------------------------------------------------ Page (CMS)
class PageSeo(BaseModel):
    meta_title: str = ""
    meta_description: str = ""
    meta_keywords: str = ""
    canonical: str = ""
    robots: str = "index,follow"
    og_title: str = ""
    og_description: str = ""
    og_image: str = ""
    twitter_card: str = "summary_large_image"

class Page(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    title: str
    slug: str = ""
    summary: str = ""
    content_html: str = ""
    cover_image: str = ""
    gallery: List[str] = []
    icon: str = ""
    category: str = ""
    tags: List[str] = []
    status: str = "draft"       # draft | published | archived
    parent_id: Optional[str] = None
    order: int = 0
    show_in_main_nav: bool = False
    author_email: str = ""
    seo: PageSeo = Field(default_factory=PageSeo)
    published_at: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)

class PageInput(BaseModel):
    title: str
    slug: str = ""
    summary: str = ""
    content_html: str = ""
    cover_image: str = ""
    gallery: List[str] = []
    icon: str = ""
    category: str = ""
    tags: List[str] = []
    status: str = "draft"
    parent_id: Optional[str] = None
    order: int = 0
    show_in_main_nav: bool = False
    seo: PageSeo = Field(default_factory=PageSeo)
    published_at: Optional[str] = None

# ------------------------------------------------------------------ Menus
class MenuItem(BaseModel):
    id: str = Field(default_factory=new_id)
    label: str
    url: str = ""
    target: str = "_self"      # _self | _blank
    icon: Optional[str] = ""
    parent_id: Optional[str] = None   # référence un autre MenuItem.id du même menu
    order: int = 0

class Menu(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    location: str              # main | footer | <custom slug>
    name: str = ""
    items: List[MenuItem] = []
    updated_at: str = Field(default_factory=now_iso)

class MenuInput(BaseModel):
    name: str = ""
    items: List[MenuItem] = []

class BulkIdsInput(BaseModel):
    ids: List[str]

class ReorderItem(BaseModel):
    id: str
    parent_id: Optional[str] = None
    order: int = 0

class ReorderInput(BaseModel):
    items: List[ReorderItem]

class Article(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    title: str
    slug: str = ""
    excerpt: str = ""
    content: str = ""
    category: str = "conseils"
    image: str = ""
    author: str = "STMP Agri"
    published: bool = True
    created_at: str = Field(default_factory=now_iso)

class ArticleInput(BaseModel):
    title: str
    excerpt: str = ""
    content: str = ""
    category: str = "conseils"
    image: str = ""
    author: str = "STMP Agri"
    published: bool = True

class Realisation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    title: str
    description: str = ""
    category: str = "logistique"
    image: str = ""
    location: Optional[str] = None
    year: Optional[str] = None
    order: int = 0
    created_at: str = Field(default_factory=now_iso)

class RealisationInput(BaseModel):
    title: str
    description: str = ""
    category: str = "logistique"
    image: str = ""
    location: Optional[str] = None
    year: Optional[str] = None
    order: int = 0

class Partner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    name: str
    logo: str = ""
    type: str = "partenaire"
    order: int = 0

class PartnerInput(BaseModel):
    name: str
    logo: str = ""
    type: str = "partenaire"
    order: int = 0

class Certification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    title: str
    issuer: str = ""
    description: str = ""
    year: str = ""
    pdf_url: Optional[str] = None
    order: int = 0

class CertificationInput(BaseModel):
    title: str
    issuer: str = ""
    description: str = ""
    year: str = ""
    pdf_url: Optional[str] = None
    order: int = 0

class ContactInput(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    subject: str = ""
    message: str

class QuoteInput(BaseModel):
    nom: str
    prenom: str = ""
    societe: Optional[str] = ""
    fonction: Optional[str] = ""
    telephone: str
    email: EmailStr
    secteur: str = ""
    objets: List[str] = []
    details: str = ""
    quantite: Optional[str] = ""
    pays: Optional[str] = ""
    ville: Optional[str] = ""
    adresse: Optional[str] = ""
    date_souhaitee: Optional[str] = None
    consent: bool = False

class NewsletterInput(BaseModel):
    email: EmailStr

class Social(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    name: str
    url: str
    icon_url: str = ""
    is_active: bool = True
    order: int = 0
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)

class SocialInput(BaseModel):
    name: str
    url: str
    icon_url: str = ""
    is_active: bool = True
    order: int = 0

# ------------------------------------------------------------------ Auth routes
@api_router.post("/auth/login")
async def login(payload: LoginInput, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    uid = str(user["_id"])
    token = create_access_token(uid, email)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=False,
                        samesite="lax", max_age=ACCESS_TOKEN_HOURS * 3600, path="/")
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": uid, "email": email, "name": user.get("name", "Admin"), "role": user.get("role", "admin")}}

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Déconnecté"}

# ------------------------------------------------------------------ Public content routes
@api_router.get("/products", response_model=List[Product])
async def list_products(category: Optional[str] = None, search: Optional[str] = None):
    q: dict = {}
    if category and category != "all":
        q["category"] = category
    if search:
        q["$or"] = [{"name": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}}]
    docs = await db.products.find(q, {"_id": 0}).sort("order", 1).to_list(500)
    return docs

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return doc

# ------------------------------------------------------------------ Categories (public)
@api_router.get("/categories", response_model=List[Category])
async def list_categories():
    return await db.categories.find({}, {"_id": 0}).sort([("order", 1), ("name", 1)]).to_list(500)

@api_router.get("/articles", response_model=List[Article])
async def list_articles(category: Optional[str] = None):
    q: dict = {"published": True}
    if category and category != "all":
        q["category"] = category
    docs = await db.articles.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs

@api_router.get("/articles/{slug}", response_model=Article)
async def get_article(slug: str):
    doc = await db.articles.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Article introuvable")
    return doc

@api_router.get("/realisations", response_model=List[Realisation])
async def list_realisations():
    return await db.realisations.find({}, {"_id": 0}).sort("order", 1).to_list(200)

@api_router.get("/partners", response_model=List[Partner])
async def list_partners():
    return await db.partners.find({}, {"_id": 0}).sort("order", 1).to_list(200)

@api_router.get("/certifications", response_model=List[Certification])
async def list_certifications():
    return await db.certifications.find({}, {"_id": 0}).sort("order", 1).to_list(200)

@api_router.get("/search")
async def global_search(q: str = ""):
    if not q or len(q) < 2:
        return {"products": [], "articles": []}
    rx = {"$regex": q, "$options": "i"}
    products = await db.products.find(
        {"$or": [{"name": rx}, {"description": rx}]}, {"_id": 0}).to_list(20)
    articles = await db.articles.find(
        {"published": True, "$or": [{"title": rx}, {"excerpt": rx}]}, {"_id": 0}).to_list(20)
    return {"products": products, "articles": articles}

@api_router.get("/stats")
async def public_stats():
    stats = await db.site_stats.find_one({"_id": "singleton"})
    if not stats:
        return {"partners": 45, "countries": 12, "clients": 350, "years": 10}
    return {k: v for k, v in stats.items() if k != "_id"}

# ------------------------------------------------------------------ Public submissions
@api_router.post("/contact")
async def create_contact(payload: ContactInput):
    doc = payload.model_dump()
    doc.update({"id": new_id(), "created_at": now_iso(), "read": False})
    await db.contacts.insert_one(doc)
    # Notifications e-mail (non bloquantes)
    if email_service.NOTIFICATION_EMAILS:
        await email_service.send_email(
            to=email_service.NOTIFICATION_EMAILS,
            subject=f"Nouveau message de contact — {payload.name}",
            html_content=email_service.build_contact_notification(doc),
            reply_to=payload.email,
        )
    await email_service.send_email(
        to=[payload.email],
        subject="STMP Agri — Nous avons bien reçu votre message",
        html_content=email_service.build_contact_ack(payload.name),
    )
    return {"message": "Votre message a bien été envoyé. Nous vous répondrons rapidement."}

@api_router.post("/quote")
async def create_quote(payload: QuoteInput):
    if not payload.consent:
        raise HTTPException(status_code=400, detail="Vous devez accepter le traitement de vos données.")
    doc = payload.model_dump()
    doc.update({"id": new_id(), "created_at": now_iso(), "status": "nouveau"})
    await db.quotes.insert_one(doc)
    # Notifications e-mail (non bloquantes)
    if email_service.NOTIFICATION_EMAILS:
        await email_service.send_email(
            to=email_service.NOTIFICATION_EMAILS,
            subject=f"Nouvelle demande de devis — {payload.prenom} {payload.nom}".strip(),
            html_content=email_service.build_quote_notification(doc),
            reply_to=payload.email,
        )
    await email_service.send_email(
        to=[payload.email],
        subject="STMP Agri — Votre demande de devis a bien été reçue",
        html_content=email_service.build_quote_ack(payload.prenom, payload.nom),
    )
    return {"message": "Merci pour votre demande de devis. Votre dossier a bien été reçu. "
                       "Un conseiller STMP Agri vous contactera dans les plus brefs délais "
                       "afin de vous proposer une offre adaptée à vos besoins."}

@api_router.post("/newsletter")
async def subscribe_newsletter(payload: NewsletterInput):
    email = payload.email.lower().strip()
    existing = await db.newsletter.find_one({"email": email})
    if existing:
        return {"message": "Vous êtes déjà inscrit à notre newsletter."}
    await db.newsletter.insert_one({"id": new_id(), "email": email, "created_at": now_iso()})
    return {"message": "Merci ! Votre inscription à la newsletter est confirmée."}

# ------------------------------------------------------------------ Réseaux sociaux (public + admin)
@api_router.get("/socials")
async def list_socials_public():
    """Retourne la liste des réseaux sociaux actifs, triés par order."""
    items = await db.socials.find({"is_active": True}, {"_id": 0}).sort([("order", 1), ("created_at", 1)]).to_list(100)
    return items

@api_router.get("/admin/socials")
async def list_socials_admin(user: dict = Depends(get_current_user)):
    """Retourne tous les réseaux (actifs et inactifs)."""
    items = await db.socials.find({}, {"_id": 0}).sort([("order", 1), ("created_at", 1)]).to_list(100)
    return items

@api_router.post("/admin/socials")
async def create_social(payload: SocialInput, user: dict = Depends(get_current_user)):
    name = (payload.name or "").strip()
    url = (payload.url or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Le nom du réseau est requis.")
    if not url:
        raise HTTPException(status_code=400, detail="L'URL du réseau est requise.")
    if not re.match(r"^(https?:)?//", url) and not url.startswith("mailto:") and not url.startswith("tel:"):
        raise HTTPException(status_code=400, detail="L'URL doit commencer par http:// ou https:// (ou mailto:/tel:).")
    max_order_doc = await db.socials.find_one({}, sort=[("order", -1)])
    next_order = payload.order if payload.order else ((max_order_doc.get("order", 0) + 1) if max_order_doc else 0)
    doc = Social(
        name=name, url=url, icon_url=payload.icon_url or "",
        is_active=payload.is_active, order=next_order,
    ).model_dump()
    await db.socials.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.patch("/admin/socials/{item_id}")
async def update_social(item_id: str, body: dict, user: dict = Depends(get_current_user)):
    existing = await db.socials.find_one({"id": item_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Réseau introuvable.")
    updates: dict = {}
    if "name" in body:
        n = (body.get("name") or "").strip()
        if not n:
            raise HTTPException(status_code=400, detail="Le nom ne peut pas être vide.")
        updates["name"] = n
    if "url" in body:
        u = (body.get("url") or "").strip()
        if not u:
            raise HTTPException(status_code=400, detail="L'URL ne peut pas être vide.")
        if not re.match(r"^(https?:)?//", u) and not u.startswith("mailto:") and not u.startswith("tel:"):
            raise HTTPException(status_code=400, detail="L'URL doit commencer par http:// ou https:// (ou mailto:/tel:).")
        updates["url"] = u
    if "icon_url" in body:
        updates["icon_url"] = str(body.get("icon_url") or "")
    if "is_active" in body:
        updates["is_active"] = bool(body.get("is_active"))
    if "order" in body:
        updates["order"] = int(body.get("order") or 0)
    if not updates:
        raise HTTPException(status_code=400, detail="Aucun champ modifiable fourni.")
    updates["updated_at"] = now_iso()
    await db.socials.update_one({"id": item_id}, {"$set": updates})
    existing.update(updates)
    return existing

@api_router.delete("/admin/socials/{item_id}")
async def delete_social(item_id: str, user: dict = Depends(get_current_user)):
    res = await db.socials.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Réseau introuvable.")
    return {"message": "Réseau supprimé."}

@api_router.post("/admin/socials/reorder")
async def reorder_socials(body: dict, user: dict = Depends(get_current_user)):
    """Body: {ids: [id_in_new_order, …]}"""
    ids = body.get("ids") or []
    if not isinstance(ids, list):
        raise HTTPException(status_code=400, detail="Corps invalide : 'ids' doit être une liste.")
    for idx, item_id in enumerate(ids):
        await db.socials.update_one({"id": item_id}, {"$set": {"order": idx, "updated_at": now_iso()}})
    return {"updated": len(ids)}

# ------------------------------------------------------------------ Admin - dashboard stats
@api_router.get("/admin/overview")
async def admin_overview(user: dict = Depends(get_current_user)):
    return {
        "products": await db.products.count_documents({}),
        "articles": await db.articles.count_documents({}),
        "realisations": await db.realisations.count_documents({}),
        "partners": await db.partners.count_documents({}),
        "certifications": await db.certifications.count_documents({}),
        "contacts": await db.contacts.count_documents({}),
        "contacts_unread": await db.contacts.count_documents({"read": False}),
        "quotes": await db.quotes.count_documents({}),
        "quotes_new": await db.quotes.count_documents({"status": "nouveau"}),
        "newsletter": await db.newsletter.count_documents({}),
    }

# ------------------------------------------------------------------ Admin - Products
@api_router.post("/admin/products", response_model=Product)
async def create_product(payload: ProductInput, user: dict = Depends(get_current_user)):
    product = Product(**payload.model_dump())
    await db.products.insert_one(product.model_dump())
    return product

@api_router.put("/admin/products/{product_id}", response_model=Product)
async def update_product(product_id: str, payload: ProductInput, user: dict = Depends(get_current_user)):
    res = await db.products.find_one_and_update(
        {"id": product_id}, {"$set": payload.model_dump()}, return_document=True)
    if not res:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return clean(res)

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    await db.products.delete_one({"id": product_id})
    return {"message": "Produit supprimé"}

# ------------------------------------------------------------------ Admin - Categories
def _normalize_cat_value(value: str) -> str:
    raw = (value or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="Slug de catégorie invalide.")
    v = slugify(raw)
    if not v or v == "all" or not re.match(r"^[a-z0-9][a-z0-9-]*$", v):
        raise HTTPException(status_code=400, detail="Slug de catégorie invalide.")
    return v

@api_router.post("/admin/categories", response_model=Category)
async def create_category(payload: CategoryInput, user: dict = Depends(get_current_user)):
    value = _normalize_cat_value(payload.value)
    if await db.categories.find_one({"value": value}):
        raise HTTPException(status_code=409, detail=f"Une catégorie avec le slug « {value} » existe déjà.")
    data = payload.model_dump()
    data["value"] = value
    cat = Category(**data)
    await db.categories.insert_one(cat.model_dump())
    return cat

@api_router.put("/admin/categories/{item_id}", response_model=Category)
async def update_category(item_id: str, payload: CategoryInput, user: dict = Depends(get_current_user)):
    existing = await db.categories.find_one({"id": item_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Catégorie introuvable")
    new_value = _normalize_cat_value(payload.value)
    if new_value != existing["value"]:
        # slug changed → vérifier unicité + propager sur les produits
        if await db.categories.find_one({"value": new_value, "id": {"$ne": item_id}}):
            raise HTTPException(status_code=409, detail=f"Une catégorie avec le slug « {new_value} » existe déjà.")
        await db.products.update_many({"category": existing["value"]}, {"$set": {"category": new_value}})
    data = payload.model_dump()
    data["value"] = new_value
    res = await db.categories.find_one_and_update(
        {"id": item_id}, {"$set": data}, return_document=True)
    return clean(res)

@api_router.delete("/admin/categories/{item_id}")
async def delete_category(item_id: str, user: dict = Depends(get_current_user)):
    cat = await db.categories.find_one({"id": item_id}, {"_id": 0})
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie introuvable")
    count = await db.products.count_documents({"category": cat["value"]})
    if count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Suppression impossible : {count} produit(s) sont rattaché(s) à cette catégorie. Réaffectez-les avant de supprimer.",
        )
    await db.categories.delete_one({"id": item_id})
    return {"message": "Catégorie supprimée"}

# ------------------------------------------------------------------ Pages (CMS - public)
def _clean_page(p: dict) -> dict:
    """Retire les clés Mongo et normalise le doc pour l'API."""
    p.pop("_id", None)
    return p

@api_router.get("/pages", response_model=List[Page])
async def list_pages_public(nav_only: bool = False):
    q: dict = {"status": "published"}
    if nav_only:
        q["show_in_main_nav"] = True
    docs = await db.pages.find(q, {"_id": 0}).sort([("order", 1), ("title", 1)]).to_list(500)
    return docs

@api_router.get("/pages/{slug}", response_model=Page)
async def get_page_public(slug: str):
    doc = await db.pages.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Page introuvable")
    return doc

# ------------------------------------------------------------------ Pages (CMS - admin)
async def _ensure_unique_slug(base: str, ignore_id: Optional[str] = None) -> str:
    slug = slugify(base) or new_id()[:8]
    q: dict = {"slug": slug}
    if ignore_id:
        q["id"] = {"$ne": ignore_id}
    if await db.pages.find_one(q):
        slug = f"{slug}-{new_id()[:6]}"
    return slug

@api_router.get("/admin/pages")
async def admin_list_pages(user: dict = Depends(get_current_user)):
    return await db.pages.find({}, {"_id": 0}).sort([("updated_at", -1)]).to_list(1000)

@api_router.get("/admin/pages/{page_id}", response_model=Page)
async def admin_get_page(page_id: str, user: dict = Depends(get_current_user)):
    doc = await db.pages.find_one({"id": page_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Page introuvable")
    return doc

@api_router.post("/admin/pages", response_model=Page)
async def create_page(payload: PageInput, user: dict = Depends(get_current_user)):
    data = payload.model_dump()
    data["slug"] = await _ensure_unique_slug(data.get("slug") or data["title"])
    if data["status"] == "published" and not data.get("published_at"):
        data["published_at"] = now_iso()
    data["author_email"] = user["email"]
    page = Page(**data)
    doc = page.model_dump()
    await db.pages.insert_one(doc)
    return page

@api_router.put("/admin/pages/{page_id}", response_model=Page)
async def update_page(page_id: str, payload: PageInput, user: dict = Depends(get_current_user)):
    existing = await db.pages.find_one({"id": page_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Page introuvable")
    data = payload.model_dump()
    # normalisation du slug
    desired_slug = slugify(data.get("slug") or data["title"])
    if desired_slug != existing.get("slug"):
        data["slug"] = await _ensure_unique_slug(desired_slug, ignore_id=page_id)
    else:
        data["slug"] = existing["slug"]
    # date de publication : la fixer si passage à "published" et pas déjà définie
    if data["status"] == "published" and not (data.get("published_at") or existing.get("published_at")):
        data["published_at"] = now_iso()
    data["updated_at"] = now_iso()
    data["author_email"] = existing.get("author_email") or user["email"]
    res = await db.pages.find_one_and_update(
        {"id": page_id}, {"$set": data}, return_document=True)
    return _clean_page(res)

@api_router.delete("/admin/pages/{page_id}")
async def delete_page(page_id: str, user: dict = Depends(get_current_user)):
    r = await db.pages.delete_one({"id": page_id})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page introuvable")
    return {"message": "Page supprimée"}

@api_router.post("/admin/pages/{page_id}/status")
async def set_page_status(page_id: str, status: str, user: dict = Depends(get_current_user)):
    if status not in ("draft", "published", "archived"):
        raise HTTPException(status_code=400, detail="Statut invalide.")
    updates: dict = {"status": status, "updated_at": now_iso()}
    if status == "published":
        existing = await db.pages.find_one({"id": page_id}, {"_id": 0, "published_at": 1})
        if not (existing or {}).get("published_at"):
            updates["published_at"] = now_iso()
    res = await db.pages.find_one_and_update(
        {"id": page_id}, {"$set": updates}, return_document=True)
    if not res:
        raise HTTPException(status_code=404, detail="Page introuvable")
    return _clean_page(res)

@api_router.post("/admin/pages/bulk-delete")
async def bulk_delete_pages(payload: BulkIdsInput, user: dict = Depends(get_current_user)):
    if not payload.ids:
        return {"deleted": 0}
    r = await db.pages.delete_many({"id": {"$in": payload.ids}})
    # Détacher les enfants orphelins (parent_id → null)
    await db.pages.update_many({"parent_id": {"$in": payload.ids}}, {"$set": {"parent_id": None}})
    return {"deleted": r.deleted_count}

@api_router.post("/admin/pages/reorder")
async def reorder_pages(payload: ReorderInput, user: dict = Depends(get_current_user)):
    now = now_iso()
    for it in payload.items:
        await db.pages.update_one(
            {"id": it.id},
            {"$set": {"parent_id": it.parent_id, "order": it.order, "updated_at": now}},
        )
    return {"updated": len(payload.items)}

# ------------------------------------------------------------------ Menus (public)
@api_router.get("/menus/{location}", response_model=Menu)
async def get_menu_public(location: str):
    doc = await db.menus.find_one({"location": location}, {"_id": 0})
    if not doc:
        # Retourne un menu vide plutôt qu'une 404 côté public (fallback front)
        return Menu(location=location, name=location.capitalize(), items=[]).model_dump()
    return doc

# ------------------------------------------------------------------ Menus (admin)
@api_router.get("/admin/menus")
async def admin_list_menus(user: dict = Depends(get_current_user)):
    return await db.menus.find({}, {"_id": 0}).sort("location", 1).to_list(50)

@api_router.get("/admin/menus/{location}", response_model=Menu)
async def admin_get_menu(location: str, user: dict = Depends(get_current_user)):
    doc = await db.menus.find_one({"location": location}, {"_id": 0})
    if not doc:
        return Menu(location=location, name=location.capitalize(), items=[]).model_dump()
    return doc

@api_router.put("/admin/menus/{location}", response_model=Menu)
async def admin_upsert_menu(location: str, payload: MenuInput, user: dict = Depends(get_current_user)):
    data = payload.model_dump()
    # Recalcule les ids manquants et normalise l'ordre
    items = data.get("items") or []
    for i, it in enumerate(items):
        if not it.get("id"):
            it["id"] = new_id()
        if it.get("order") is None:
            it["order"] = i
    existing = await db.menus.find_one({"location": location}, {"_id": 0})
    doc = {
        "id": (existing or {}).get("id", new_id()),
        "location": location,
        "name": data.get("name") or location.capitalize(),
        "items": items,
        "updated_at": now_iso(),
    }
    await db.menus.update_one({"location": location}, {"$set": doc}, upsert=True)
    return doc

# ------------------------------------------------------------------ Admin - Articles
@api_router.get("/admin/articles", response_model=List[Article])
async def admin_list_articles(user: dict = Depends(get_current_user)):
    return await db.articles.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api_router.post("/admin/articles", response_model=Article)
async def create_article(payload: ArticleInput, user: dict = Depends(get_current_user)):
    data = payload.model_dump()
    slug = slugify(data["title"])
    if await db.articles.find_one({"slug": slug}):
        slug = f"{slug}-{new_id()[:6]}"
    article = Article(**data, slug=slug)
    await db.articles.insert_one(article.model_dump())
    return article

@api_router.put("/admin/articles/{article_id}", response_model=Article)
async def update_article(article_id: str, payload: ArticleInput, user: dict = Depends(get_current_user)):
    existing = await db.articles.find_one({"id": article_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Article introuvable")
    data = payload.model_dump()
    if data["title"] != existing.get("title"):
        slug = slugify(data["title"])
        if await db.articles.find_one({"slug": slug, "id": {"$ne": article_id}}):
            slug = f"{slug}-{new_id()[:6]}"
        data["slug"] = slug
    res = await db.articles.find_one_and_update(
        {"id": article_id}, {"$set": data}, return_document=True)
    return clean(res)

@api_router.delete("/admin/articles/{article_id}")
async def delete_article(article_id: str, user: dict = Depends(get_current_user)):
    await db.articles.delete_one({"id": article_id})
    return {"message": "Article supprimé"}

# ------------------------------------------------------------------ Admin - Realisations
@api_router.post("/admin/realisations", response_model=Realisation)
async def create_realisation(payload: RealisationInput, user: dict = Depends(get_current_user)):
    item = Realisation(**payload.model_dump())
    await db.realisations.insert_one(item.model_dump())
    return item

@api_router.put("/admin/realisations/{item_id}", response_model=Realisation)
async def update_realisation(item_id: str, payload: RealisationInput, user: dict = Depends(get_current_user)):
    res = await db.realisations.find_one_and_update(
        {"id": item_id}, {"$set": payload.model_dump()}, return_document=True)
    if not res:
        raise HTTPException(status_code=404, detail="Réalisation introuvable")
    return clean(res)

@api_router.delete("/admin/realisations/{item_id}")
async def delete_realisation(item_id: str, user: dict = Depends(get_current_user)):
    await db.realisations.delete_one({"id": item_id})
    return {"message": "Réalisation supprimée"}

# ------------------------------------------------------------------ Admin - Partners
@api_router.post("/admin/partners", response_model=Partner)
async def create_partner(payload: PartnerInput, user: dict = Depends(get_current_user)):
    item = Partner(**payload.model_dump())
    await db.partners.insert_one(item.model_dump())
    return item

@api_router.put("/admin/partners/{item_id}", response_model=Partner)
async def update_partner(item_id: str, payload: PartnerInput, user: dict = Depends(get_current_user)):
    res = await db.partners.find_one_and_update(
        {"id": item_id}, {"$set": payload.model_dump()}, return_document=True)
    if not res:
        raise HTTPException(status_code=404, detail="Partenaire introuvable")
    return clean(res)

@api_router.delete("/admin/partners/{item_id}")
async def delete_partner(item_id: str, user: dict = Depends(get_current_user)):
    await db.partners.delete_one({"id": item_id})
    return {"message": "Partenaire supprimé"}

# ------------------------------------------------------------------ Admin - Certifications
@api_router.post("/admin/certifications", response_model=Certification)
async def create_certification(payload: CertificationInput, user: dict = Depends(get_current_user)):
    item = Certification(**payload.model_dump())
    await db.certifications.insert_one(item.model_dump())
    return item

@api_router.put("/admin/certifications/{item_id}", response_model=Certification)
async def update_certification(item_id: str, payload: CertificationInput, user: dict = Depends(get_current_user)):
    res = await db.certifications.find_one_and_update(
        {"id": item_id}, {"$set": payload.model_dump()}, return_document=True)
    if not res:
        raise HTTPException(status_code=404, detail="Certification introuvable")
    return clean(res)

@api_router.delete("/admin/certifications/{item_id}")
async def delete_certification(item_id: str, user: dict = Depends(get_current_user)):
    await db.certifications.delete_one({"id": item_id})
    return {"message": "Certification supprimée"}

# ------------------------------------------------------------------ Admin - Submissions
@api_router.get("/admin/contacts")
async def admin_contacts(user: dict = Depends(get_current_user)):
    return await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.patch("/admin/contacts/{item_id}")
async def mark_contact_read(item_id: str, user: dict = Depends(get_current_user)):
    await db.contacts.update_one({"id": item_id}, {"$set": {"read": True}})
    return {"message": "OK"}

@api_router.delete("/admin/contacts/{item_id}")
async def delete_contact(item_id: str, user: dict = Depends(get_current_user)):
    await db.contacts.delete_one({"id": item_id})
    return {"message": "Message supprimé"}

@api_router.get("/admin/quotes")
async def admin_quotes(user: dict = Depends(get_current_user)):
    return await db.quotes.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.patch("/admin/quotes/{item_id}")
async def update_quote_status(item_id: str, body: dict, user: dict = Depends(get_current_user)):
    status = body.get("status", "nouveau")
    await db.quotes.update_one({"id": item_id}, {"$set": {"status": status}})
    return {"message": "OK"}

@api_router.delete("/admin/quotes/{item_id}")
async def delete_quote(item_id: str, user: dict = Depends(get_current_user)):
    await db.quotes.delete_one({"id": item_id})
    return {"message": "Demande supprimée"}

@api_router.get("/admin/newsletter")
async def admin_newsletter(user: dict = Depends(get_current_user)):
    return await db.newsletter.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)

# ------------------------------------------------------------------ Uploads / Files
_MIME_BY_EXT = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp", "svg": "image/svg+xml",
    "pdf": "application/pdf",
}
_ALLOWED_IMAGE_EXTS = {"jpg", "jpeg", "png", "gif", "webp", "svg"}
_MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

@api_router.post("/admin/upload")
async def admin_upload(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload d'une image dans le stockage objet. Renvoie une URL relative
    servie par l'API (`/api/files/<path>`) à enregistrer sur l'entité."""
    filename = file.filename or "file"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in _ALLOWED_IMAGE_EXTS:
        raise HTTPException(status_code=400, detail=f"Extension non autorisée : .{ext}")
    data = await file.read()
    if len(data) > _MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Fichier trop volumineux (max 10 Mo).")
    content_type = file.content_type or _MIME_BY_EXT.get(ext, "application/octet-stream")
    file_id = new_id()
    path = f"{storage_service.APP_NAME}/uploads/{file_id}.{ext}"
    try:
        result = await storage_service.put_object(path, data, content_type)
    except Exception as e:  # noqa: BLE001
        logger.error("Upload storage échec : %s", str(e))
        raise HTTPException(status_code=502, detail="Échec de l'upload vers le stockage.")
    stored_path = result.get("path", path)
    await db.files.insert_one({
        "id": file_id,
        "storage_path": stored_path,
        "original_filename": filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "uploaded_by": user["email"],
        "created_at": now_iso(),
    })
    return {"url": f"/api/files/{stored_path}", "path": stored_path, "size": result.get("size", len(data))}

@api_router.get("/files/{path:path}")
async def download_file(path: str):
    """Sert un fichier stocké. Public (les images doivent être visibles sur le site)."""
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Fichier introuvable.")
    try:
        data, content_type = await storage_service.get_object(path)
    except Exception as e:  # noqa: BLE001
        logger.error("Download storage échec : %s", str(e))
        raise HTTPException(status_code=502, detail="Échec de la récupération du fichier.")
    return Response(
        content=data,
        media_type=record.get("content_type") or content_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )

# ------------------------------------------------------------------ Médiathèque (Media Library)
_MEDIA_SECTIONS = {"header", "content", "footer"}

async def _count_media_usages(url: str) -> dict:
    """Compte le nombre d'endroits où une URL est référencée (produits, articles, réalisations,
    partenaires, pages)."""
    if not url:
        return {"total": 0, "products": 0, "articles": 0, "realisations": 0, "partners": 0, "pages": 0}
    async def count(coll, field):
        return await coll.count_documents({field: url})
    products      = await count(db.products, "image")
    articles      = await count(db.articles, "cover_image")
    realisations  = await count(db.realisations, "image")
    partners      = await count(db.partners, "logo")
    # Pages : cover_image OU dans gallery OU contenu HTML
    pages_cover   = await count(db.pages, "cover_image")
    pages_gallery = await db.pages.count_documents({"gallery": url})
    pages_content = await db.pages.count_documents({"content_html": {"$regex": re.escape(url)}})
    pages_total   = pages_cover + pages_gallery + pages_content
    total = products + articles + realisations + partners + pages_total
    return {
        "total": total,
        "products": products,
        "articles": articles,
        "realisations": realisations,
        "partners": partners,
        "pages": pages_total,
    }

@api_router.post("/admin/media")
async def create_media(
    file: UploadFile = File(...),
    section: str = "content",
    alt: str = "",
    title: str = "",
    tags: str = "",
    user: dict = Depends(get_current_user),
):
    """Upload d'une image dans la médiathèque avec metadata (section, alt, title, tags)."""
    section = (section or "content").lower().strip()
    if section not in _MEDIA_SECTIONS:
        raise HTTPException(status_code=400, detail=f"Section invalide : {section}")
    filename = file.filename or "file"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in _ALLOWED_IMAGE_EXTS:
        raise HTTPException(status_code=400, detail=f"Extension non autorisée : .{ext}")
    data = await file.read()
    if len(data) > _MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Fichier trop volumineux (max 10 Mo).")
    content_type = file.content_type or _MIME_BY_EXT.get(ext, "application/octet-stream")
    file_id = new_id()
    path = f"{storage_service.APP_NAME}/media/{file_id}.{ext}"
    try:
        result = await storage_service.put_object(path, data, content_type)
    except Exception as e:  # noqa: BLE001
        logger.error("Media upload storage échec : %s", str(e))
        raise HTTPException(status_code=502, detail="Échec de l'upload vers le stockage.")
    stored_path = result.get("path", path)
    url = f"/api/files/{stored_path}"
    # Enregistre aussi dans `files` pour permettre le download public via /api/files
    await db.files.insert_one({
        "id": file_id,
        "storage_path": stored_path,
        "original_filename": filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "uploaded_by": user["email"],
        "created_at": now_iso(),
    })
    media_id = new_id()
    tag_list = [t.strip() for t in (tags or "").split(",") if t.strip()]
    doc = {
        "id": media_id,
        "url": url,
        "storage_path": stored_path,
        "filename": filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "section": section,
        "alt": alt or "",
        "title": title or filename.rsplit(".", 1)[0],
        "tags": tag_list,
        "uploaded_by": user["email"],
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.media.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/admin/media")
async def list_media(
    section: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 200,
    user: dict = Depends(get_current_user),
):
    """Liste les médias (filtrables par section + recherche titre/alt/filename/tag)."""
    query: dict = {}
    if section and section != "all":
        s = section.lower().strip()
        if s not in _MEDIA_SECTIONS:
            raise HTTPException(status_code=400, detail=f"Section invalide : {section}")
        query["section"] = s
    if q:
        rx = {"$regex": re.escape(q.strip()), "$options": "i"}
        query["$or"] = [{"title": rx}, {"alt": rx}, {"filename": rx}, {"tags": rx}]
    limit = max(1, min(int(limit or 200), 1000))
    items = await db.media.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return items

@api_router.get("/admin/media/counts")
async def media_counts(user: dict = Depends(get_current_user)):
    """Retourne le nombre d'images par section (pour badges de la sidebar)."""
    out = {"all": 0, "header": 0, "content": 0, "footer": 0}
    pipeline = [{"$group": {"_id": "$section", "n": {"$sum": 1}}}]
    async for row in db.media.aggregate(pipeline):
        sec = row.get("_id") or "content"
        if sec in _MEDIA_SECTIONS:
            out[sec] = row.get("n", 0)
        out["all"] += row.get("n", 0)
    return out

@api_router.get("/admin/media/{media_id}")
async def get_media(media_id: str, user: dict = Depends(get_current_user)):
    m = await db.media.find_one({"id": media_id}, {"_id": 0})
    if not m:
        raise HTTPException(status_code=404, detail="Média introuvable.")
    m["usages"] = await _count_media_usages(m.get("url", ""))
    return m

@api_router.patch("/admin/media/{media_id}")
async def update_media(media_id: str, body: dict, user: dict = Depends(get_current_user)):
    """Met à jour les metadata (section/alt/title/tags) d'un média."""
    m = await db.media.find_one({"id": media_id}, {"_id": 0})
    if not m:
        raise HTTPException(status_code=404, detail="Média introuvable.")
    updates: dict = {}
    if "section" in body:
        sec = (body.get("section") or "content").lower().strip()
        if sec not in _MEDIA_SECTIONS:
            raise HTTPException(status_code=400, detail=f"Section invalide : {sec}")
        updates["section"] = sec
    if "alt" in body:
        updates["alt"] = str(body.get("alt") or "")
    if "title" in body:
        updates["title"] = str(body.get("title") or "")
    if "tags" in body:
        raw = body.get("tags")
        if isinstance(raw, list):
            tags = [str(t).strip() for t in raw if str(t).strip()]
        else:
            tags = [t.strip() for t in str(raw or "").split(",") if t.strip()]
        updates["tags"] = tags
    if not updates:
        raise HTTPException(status_code=400, detail="Aucun champ modifiable fourni.")
    updates["updated_at"] = now_iso()
    await db.media.update_one({"id": media_id}, {"$set": updates})
    m.update(updates)
    return m

@api_router.delete("/admin/media/{media_id}")
async def delete_media(media_id: str, user: dict = Depends(get_current_user)):
    """Supprime un média (fichier storage + entrée DB). Retourne le nombre d'usages
    trouvés (informatif — l'admin a confirmé côté frontend)."""
    m = await db.media.find_one({"id": media_id}, {"_id": 0})
    if not m:
        raise HTTPException(status_code=404, detail="Média introuvable.")
    usages = await _count_media_usages(m.get("url", ""))
    # Suppression logique du fichier stockage : on flag `is_deleted` sur files (préserve
    # d'éventuels caches, permet une restauration future manuelle).
    await db.files.update_many({"storage_path": m.get("storage_path")},
                               {"$set": {"is_deleted": True, "deleted_at": now_iso()}})
    await db.media.delete_one({"id": media_id})
    return {"message": "Média supprimé.", "usages": usages}

# ------------------------------------------------------------------ Register router + CORS
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------ Startup: seed
async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@stmpagri.ci").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "StmpAgri2025!")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "Administrateur STMP", "role": "admin", "created_at": now_iso()})
        logger.info("Admin seeded: %s", admin_email)
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")

async def seed_content():
    from seed_data import (SEED_PRODUCTS, SEED_ARTICLES, SEED_REALISATIONS,
                           SEED_PARTNERS, SEED_CERTIFICATIONS, SEED_STATS)
    if await db.products.count_documents({}) == 0:
        await db.products.insert_many([Product(**p).model_dump() for p in SEED_PRODUCTS])
    if await db.categories.count_documents({}) == 0:
        seed_cats = [
            {"name": "Engrais",               "value": "engrais",       "order": 1, "description": "Engrais minéraux et organo-minéraux"},
            {"name": "Fertilisants",          "value": "fertilisants",  "order": 2, "description": "Fertilisants foliaires et amendements"},
            {"name": "Herbicides",            "value": "herbicides",    "order": 3, "description": "Désherbants sélectifs et totaux"},
            {"name": "Insecticides",          "value": "insecticides",  "order": 4, "description": "Traitements contre les ravageurs"},
            {"name": "Fongicides",            "value": "fongicides",    "order": 5, "description": "Protection contre les maladies fongiques"},
            {"name": "Équipements agricoles", "value": "equipements",   "order": 6, "description": "Matériel et outils agricoles"},
        ]
        await db.categories.insert_many([Category(**c).model_dump() for c in seed_cats])
    if await db.menus.count_documents({}) == 0:
        activites_parent_id = new_id()
        seed_menus = [
            {
                "id": new_id(),
                "location": "main",
                "name": "Menu principal",
                "items": [
                    {"id": new_id(), "label": "Accueil",          "url": "/",              "target": "_self", "icon": "", "parent_id": None, "order": 0},
                    {"id": new_id(), "label": "Nos métiers",      "url": "/#metiers",      "target": "_self", "icon": "", "parent_id": None, "order": 1},
                    {"id": activites_parent_id, "label": "Nos activités", "url": "/activites", "target": "_self", "icon": "", "parent_id": None, "order": 2},
                    {"id": new_id(), "label": "Achat et vente d'engrais",             "url": "/activites/achat-vente-engrais",      "target": "_self", "icon": "", "parent_id": activites_parent_id, "order": 0},
                    {"id": new_id(), "label": "Vente de produits phytosanitaires",    "url": "/activites/produits-phytosanitaires", "target": "_self", "icon": "", "parent_id": activites_parent_id, "order": 1},
                    {"id": new_id(), "label": "Distribution de produits agroalimentaires", "url": "/activites/agroalimentaire",   "target": "_self", "icon": "", "parent_id": activites_parent_id, "order": 2},
                    {"id": new_id(), "label": "Transport de marchandises",            "url": "/activites/transport-marchandises",   "target": "_self", "icon": "", "parent_id": activites_parent_id, "order": 3},
                    {"id": new_id(), "label": "Commerce général",                      "url": "/activites/commerce-general",         "target": "_self", "icon": "", "parent_id": activites_parent_id, "order": 4},
                    {"id": new_id(), "label": "Nos produits",     "url": "/produits",      "target": "_self", "icon": "", "parent_id": None, "order": 3},
                    {"id": new_id(), "label": "Nos réalisations", "url": "/realisations",  "target": "_self", "icon": "", "parent_id": None, "order": 4},
                    {"id": new_id(), "label": "Actualités",       "url": "/actualites",    "target": "_self", "icon": "", "parent_id": None, "order": 5},
                    {"id": new_id(), "label": "Contact",          "url": "/contact",       "target": "_self", "icon": "", "parent_id": None, "order": 6},
                ],
                "updated_at": now_iso(),
            },
            {
                "id": new_id(),
                "location": "footer",
                "name": "Menu pied de page",
                "items": [
                    {"id": new_id(), "label": "Accueil",          "url": "/",              "target": "_self", "icon": "", "parent_id": None, "order": 0},
                    {"id": new_id(), "label": "Nos métiers",      "url": "/#metiers",      "target": "_self", "icon": "", "parent_id": None, "order": 1},
                    {"id": new_id(), "label": "Nos produits",     "url": "/produits",      "target": "_self", "icon": "", "parent_id": None, "order": 2},
                    {"id": new_id(), "label": "Nos réalisations", "url": "/realisations",  "target": "_self", "icon": "", "parent_id": None, "order": 3},
                    {"id": new_id(), "label": "Actualités",       "url": "/actualites",    "target": "_self", "icon": "", "parent_id": None, "order": 4},
                    {"id": new_id(), "label": "Contact",          "url": "/contact",       "target": "_self", "icon": "", "parent_id": None, "order": 5},
                    {"id": new_id(), "label": "Nos activités",    "url": "/activites",     "target": "_self", "icon": "", "parent_id": None, "order": 6},
                    {"id": new_id(), "label": "Partenaires",      "url": "/partenaires",   "target": "_self", "icon": "", "parent_id": None, "order": 7},
                    {"id": new_id(), "label": "Certifications",   "url": "/certifications","target": "_self", "icon": "", "parent_id": None, "order": 8},
                    {"id": new_id(), "label": "RSE",              "url": "/rse",           "target": "_self", "icon": "", "parent_id": None, "order": 9},
                ],
                "updated_at": now_iso(),
            },
        ]
        await db.menus.insert_many(seed_menus)
    if await db.articles.count_documents({}) == 0:
        arts = [Article(**a, slug=slugify(a["title"])).model_dump() for a in SEED_ARTICLES]
        await db.articles.insert_many(arts)
    if await db.realisations.count_documents({}) == 0:
        await db.realisations.insert_many([Realisation(**r).model_dump() for r in SEED_REALISATIONS])
    if await db.partners.count_documents({}) == 0:
        await db.partners.insert_many([Partner(**p).model_dump() for p in SEED_PARTNERS])
    if await db.certifications.count_documents({}) == 0:
        await db.certifications.insert_many([Certification(**c).model_dump() for c in SEED_CERTIFICATIONS])
    if await db.socials.count_documents({}) == 0:
        # Icônes SVG monochromes blanches (paths simplifiés des logos officiels), encodées en data-url.
        # L'utilisateur pourra les remplacer via la médiathèque plus tard.
        SVG_FB = (
            "data:image/svg+xml;utf8,"
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'>"
            "<path d='M13.5 21v-7.5H16l.5-3H13.5V8.6c0-.9.3-1.6 1.7-1.6H16.5V4.3C16.2 4.2 15.2 4 14 4c-2.6 0-4.3 1.6-4.3 4.4v2.1H7v3h2.7V21h3.8z'/></svg>"
        )
        SVG_LI = (
            "data:image/svg+xml;utf8,"
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'>"
            "<path d='M4.98 3.5c0 1.38-1.12 2.5-2.5 2.5S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.24 8h4.5V23H.24V8zm7.5 0h4.3v2.05h.06c.6-1.13 2.07-2.32 4.26-2.32 4.55 0 5.4 3 5.4 6.9V23h-4.5v-6.6c0-1.58-.03-3.62-2.2-3.62-2.2 0-2.54 1.72-2.54 3.5V23h-4.5V8z'/></svg>"
        )
        SVG_IG = (
            "data:image/svg+xml;utf8,"
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>"
            "<rect x='3' y='3' width='18' height='18' rx='5'/><circle cx='12' cy='12' r='4'/><circle cx='17.5' cy='6.5' r='0.9' fill='%23ffffff' stroke='none'/></svg>"
        )
        SVG_WA = (
            "data:image/svg+xml;utf8,"
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'>"
            "<path d='M12.05 2C6.5 2 2.04 6.44 2.04 11.94c0 1.94.55 3.75 1.5 5.29L2 22l4.9-1.53c1.48.81 3.18 1.27 4.99 1.28h.01c5.53 0 10-4.45 10-9.95 0-2.66-1.04-5.15-2.94-7.03A9.86 9.86 0 0012.05 2zm5.83 14.13c-.25.7-1.44 1.34-2 1.42-.51.08-1.17.11-1.88-.12-.43-.13-1-.31-1.72-.62-3.02-1.3-4.98-4.32-5.13-4.52-.15-.2-1.24-1.63-1.24-3.11 0-1.48.78-2.2 1.05-2.5.28-.3.6-.37.8-.37.2 0 .4 0 .58.01.19.01.44-.07.68.52.25.61.85 2.09.92 2.24.08.15.13.32.02.52-.1.2-.15.32-.3.5-.15.17-.32.39-.46.52-.15.13-.31.28-.13.55.17.28.77 1.27 1.66 2.05 1.14 1 2.1 1.32 2.4 1.47.3.15.47.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.66-.15.28.1 1.77.83 2.07.98.3.15.5.22.58.35.07.12.07.7-.17 1.38z'/></svg>"
        )
        SVG_TW = (
            "data:image/svg+xml;utf8,"
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'>"
            "<path d='M18.244 2H21l-6.52 7.454L22 22h-6.812l-4.79-6.253L4.8 22H2.045l6.977-7.973L2 2h6.914l4.334 5.734L18.244 2zm-1.194 18h1.522L7.05 4H5.412l11.638 16z'/></svg>"
        )
        seed_socials = [
            {"name": "Facebook",  "url": "https://facebook.com",  "icon_url": SVG_FB, "is_active": True, "order": 0},
            {"name": "LinkedIn",  "url": "https://linkedin.com",  "icon_url": SVG_LI, "is_active": True, "order": 1},
            {"name": "Instagram", "url": "https://instagram.com", "icon_url": SVG_IG, "is_active": True, "order": 2},
            {"name": "WhatsApp",  "url": "https://wa.me/2250707070707", "icon_url": SVG_WA, "is_active": True, "order": 3},
        ]
        await db.socials.insert_many([Social(**s).model_dump() for s in seed_socials])
        _ = SVG_TW  # placeholder pour ajout Twitter/X plus tard depuis l'admin
    if await db.site_stats.find_one({"_id": "singleton"}) is None:
        await db.site_stats.insert_one({"_id": "singleton", **SEED_STATS})

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.pages.create_index("slug", unique=True, sparse=True)
    await db.media.create_index([("section", 1), ("created_at", -1)])
    await db.media.create_index("url")
    await seed_admin()
    await seed_content()
    try:
        await storage_service.init_storage()
    except Exception as e:  # noqa: BLE001
        logger.error("Storage init échec (upload indisponible) : %s", str(e))
    logger.info("STMP Agri API ready")

@app.on_event("shutdown")
async def shutdown():
    client.close()
