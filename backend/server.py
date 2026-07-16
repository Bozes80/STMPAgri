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
    if await db.articles.count_documents({}) == 0:
        arts = [Article(**a, slug=slugify(a["title"])).model_dump() for a in SEED_ARTICLES]
        await db.articles.insert_many(arts)
    if await db.realisations.count_documents({}) == 0:
        await db.realisations.insert_many([Realisation(**r).model_dump() for r in SEED_REALISATIONS])
    if await db.partners.count_documents({}) == 0:
        await db.partners.insert_many([Partner(**p).model_dump() for p in SEED_PARTNERS])
    if await db.certifications.count_documents({}) == 0:
        await db.certifications.insert_many([Certification(**c).model_dump() for c in SEED_CERTIFICATIONS])
    if await db.site_stats.find_one({"_id": "singleton"}) is None:
        await db.site_stats.insert_one({"_id": "singleton", **SEED_STATS})

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
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
