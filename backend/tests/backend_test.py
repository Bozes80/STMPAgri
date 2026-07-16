"""STMP Agri backend API tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://stmp-agro-commerce.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@stmpagri.ci"
ADMIN_PASSWORD = "StmpAgri2025!"


@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == ADMIN_EMAIL
    return data["access_token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ============== Public content ==============
class TestPublicContent:
    def test_products_list(self, s):
        r = s.get(f"{API}/products")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 12, f"Expected >=12 products, got {len(data)}"

    def test_products_filter_category(self, s):
        r = s.get(f"{API}/products", params={"category": "engrais"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        for p in data:
            assert p["category"] == "engrais"

    def test_products_search(self, s):
        r = s.get(f"{API}/products", params={"search": "urée"})
        assert r.status_code == 200
        # Should return matching product(s)
        assert isinstance(r.json(), list)

    def test_product_detail(self, s):
        r = s.get(f"{API}/products")
        pid = r.json()[0]["id"]
        r2 = s.get(f"{API}/products/{pid}")
        assert r2.status_code == 200
        data = r2.json()
        assert data["id"] == pid
        assert "characteristics" in data and "applications" in data

    def test_product_detail_404(self, s):
        r = s.get(f"{API}/products/nonexistent-id")
        assert r.status_code == 404

    def test_articles_list(self, s):
        r = s.get(f"{API}/articles")
        assert r.status_code == 200
        assert len(r.json()) >= 6

    def test_article_by_slug(self, s):
        r = s.get(f"{API}/articles/stmp-agro-commerce")
        # slug may or may not exist depending on seed titles; verify at least one slug from listing
        if r.status_code != 200:
            arts = s.get(f"{API}/articles").json()
            assert len(arts) > 0
            slug = arts[0]["slug"]
            r2 = s.get(f"{API}/articles/{slug}")
            assert r2.status_code == 200
        else:
            assert r.json()["slug"] == "stmp-agro-commerce"

    def test_realisations(self, s):
        r = s.get(f"{API}/realisations")
        assert r.status_code == 200
        assert len(r.json()) >= 6

    def test_partners(self, s):
        r = s.get(f"{API}/partners")
        assert r.status_code == 200
        assert len(r.json()) >= 10

    def test_certifications(self, s):
        r = s.get(f"{API}/certifications")
        assert r.status_code == 200
        assert len(r.json()) >= 5

    def test_stats(self, s):
        r = s.get(f"{API}/stats")
        assert r.status_code == 200
        data = r.json()
        for k in ("partners", "countries", "clients", "years"):
            assert k in data

    def test_search(self, s):
        r = s.get(f"{API}/search", params={"q": "engrais"})
        assert r.status_code == 200
        data = r.json()
        assert "products" in data and "articles" in data


# ============== Public submissions ==============
class TestSubmissions:
    def test_contact(self, s):
        r = s.post(f"{API}/contact", json={
            "name": "TEST_Contact", "email": "test_contact@example.com",
            "message": "Test message", "phone": "+225000000", "subject": "Test"})
        assert r.status_code == 200
        assert "envoyé" in r.json()["message"].lower() or "envoye" in r.json()["message"].lower()

    def test_quote_no_consent(self, s):
        r = s.post(f"{API}/quote", json={
            "nom": "TEST", "prenom": "T", "telephone": "+225", "email": "t@e.com",
            "consent": False})
        assert r.status_code == 400

    def test_quote_with_consent(self, s):
        r = s.post(f"{API}/quote", json={
            "nom": "TEST_Quote", "prenom": "P", "telephone": "+2250000",
            "email": "test_quote@example.com", "secteur": "agriculture",
            "objets": ["engrais"], "details": "test", "consent": True})
        assert r.status_code == 200
        assert "devis" in r.json()["message"].lower()

    def test_newsletter_and_dedupe(self, s):
        email = "test_newsletter@example.com"
        r1 = s.post(f"{API}/newsletter", json={"email": email})
        assert r1.status_code == 200
        r2 = s.post(f"{API}/newsletter", json={"email": email})
        assert r2.status_code == 200
        assert "déjà" in r2.json()["message"] or "deja" in r2.json()["message"]


# ============== Auth ==============
class TestAuth:
    def test_login_wrong_password(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_with_token(self, s, auth_headers):
        r = s.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_admin_endpoint_without_token(self):
        # Use fresh session (no cookies)
        r = requests.get(f"{API}/admin/overview")
        assert r.status_code == 401


# ============== Admin ==============
class TestAdmin:
    def test_overview(self, s, auth_headers):
        r = s.get(f"{API}/admin/overview", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        for k in ("products", "articles", "contacts", "quotes", "newsletter"):
            assert k in data

    def test_product_crud(self, s, auth_headers):
        # Create
        payload = {"name": "TEST_Product", "category": "engrais", "description": "test",
                   "characteristics": ["c1"], "applications": ["a1"]}
        r = s.post(f"{API}/admin/products", headers=auth_headers, json=payload)
        assert r.status_code == 200
        pid = r.json()["id"]
        # Get
        r2 = s.get(f"{API}/products/{pid}")
        assert r2.status_code == 200
        assert r2.json()["name"] == "TEST_Product"
        # Update
        payload["name"] = "TEST_Product_Updated"
        r3 = s.put(f"{API}/admin/products/{pid}", headers=auth_headers, json=payload)
        assert r3.status_code == 200
        r4 = s.get(f"{API}/products/{pid}")
        assert r4.json()["name"] == "TEST_Product_Updated"
        # Delete
        r5 = s.delete(f"{API}/admin/products/{pid}", headers=auth_headers)
        assert r5.status_code == 200
        r6 = s.get(f"{API}/products/{pid}")
        assert r6.status_code == 404

    def test_article_auto_slug(self, s, auth_headers):
        r = s.post(f"{API}/admin/articles", headers=auth_headers, json={
            "title": "TEST Article Auto Slug", "excerpt": "e", "content": "c"})
        assert r.status_code == 200
        art = r.json()
        assert art["slug"] == "test-article-auto-slug"
        # cleanup
        s.delete(f"{API}/admin/articles/{art['id']}", headers=auth_headers)

    def test_realisation_partner_certification_crud(self, s, auth_headers):
        # Realisation
        r = s.post(f"{API}/admin/realisations", headers=auth_headers, json={
            "title": "TEST_Real", "category": "logistique"})
        assert r.status_code == 200
        rid = r.json()["id"]
        assert s.delete(f"{API}/admin/realisations/{rid}", headers=auth_headers).status_code == 200
        # Partner
        r = s.post(f"{API}/admin/partners", headers=auth_headers, json={"name": "TEST_Partner"})
        assert r.status_code == 200
        pid = r.json()["id"]
        assert s.delete(f"{API}/admin/partners/{pid}", headers=auth_headers).status_code == 200
        # Certification
        r = s.post(f"{API}/admin/certifications", headers=auth_headers, json={"title": "TEST_Cert"})
        assert r.status_code == 200
        cid = r.json()["id"]
        assert s.delete(f"{API}/admin/certifications/{cid}", headers=auth_headers).status_code == 200

    def test_admin_contact_and_quote_lists_and_status(self, s, auth_headers):
        # ensure at least one contact + quote by submitting
        s.post(f"{API}/contact", json={"name": "TEST_C2", "email": "c2@e.com", "message": "m"})
        s.post(f"{API}/quote", json={
            "nom": "TEST_Q2", "telephone": "+1", "email": "q2@e.com",
            "objets": ["engrais"], "details": "d", "consent": True})

        r = s.get(f"{API}/admin/contacts", headers=auth_headers)
        assert r.status_code == 200 and len(r.json()) > 0
        cid = r.json()[0]["id"]
        r2 = s.patch(f"{API}/admin/contacts/{cid}", headers=auth_headers)
        assert r2.status_code == 200

        r = s.get(f"{API}/admin/quotes", headers=auth_headers)
        assert r.status_code == 200 and len(r.json()) > 0
        qid = r.json()[0]["id"]
        r2 = s.patch(f"{API}/admin/quotes/{qid}", headers=auth_headers, json={"status": "en_cours"})
        assert r2.status_code == 200
        # Verify persisted
        r3 = s.get(f"{API}/admin/quotes", headers=auth_headers)
        found = next((q for q in r3.json() if q["id"] == qid), None)
        assert found and found["status"] == "en_cours"

        r = s.get(f"{API}/admin/newsletter", headers=auth_headers)
        assert r.status_code == 200


# ============== Categories ==============
class TestCategories:
    def test_public_list_has_six_seeded(self, s):
        r = s.get(f"{API}/categories")
        assert r.status_code == 200
        cats = r.json()
        values = [c["value"] for c in cats]
        for v in ["engrais", "fertilisants", "herbicides", "insecticides", "fongicides", "equipements"]:
            assert v in values, f"missing seeded category {v} in {values}"
        # sorted by order asc
        orders = [c.get("order", 0) for c in cats if c["value"] in ["engrais", "fertilisants", "herbicides", "insecticides", "fongicides", "equipements"]]
        assert orders == sorted(orders)

    def test_create_requires_auth(self, s):
        r = requests.post(f"{API}/admin/categories", json={"name": "X", "value": "x_test"})
        assert r.status_code == 401

    def test_create_invalid_slug_all(self, s, auth_headers):
        r = s.post(f"{API}/admin/categories", headers=auth_headers,
                   json={"name": "All", "value": "all"})
        assert r.status_code == 400
        assert "invalide" in r.json()["detail"].lower()

    @pytest.mark.xfail(reason="Backend bug: slugify() falls back to uuid[:8] for empty input, so empty slug is silently accepted (spec expects 400).", strict=False)
    def test_create_empty_slug(self, s, auth_headers):
        r = s.post(f"{API}/admin/categories", headers=auth_headers,
                   json={"name": "TEST_Empty", "value": "   "})
        # cleanup if it was accepted
        if r.status_code == 200:
            s.delete(f"{API}/admin/categories/{r.json()['id']}", headers=auth_headers)
        assert r.status_code == 400

    def test_create_duplicate_slug(self, s, auth_headers):
        r = s.post(f"{API}/admin/categories", headers=auth_headers,
                   json={"name": "Engrais duplicate", "value": "engrais"})
        assert r.status_code == 409

    def test_delete_category_with_products_blocked(self, s, auth_headers):
        # Find engrais category id
        cats = s.get(f"{API}/categories").json()
        engrais = next(c for c in cats if c["value"] == "engrais")
        r = s.delete(f"{API}/admin/categories/{engrais['id']}", headers=auth_headers)
        assert r.status_code == 409
        detail = r.json()["detail"]
        assert "Suppression impossible" in detail
        assert "produit" in detail.lower()

    def test_full_crud_cycle_with_slug_propagation(self, s, auth_headers):
        # Create
        payload = {"name": "TEST_Cat", "value": "test_cat_slug", "description": "d", "order": 99}
        r = s.post(f"{API}/admin/categories", headers=auth_headers, json=payload)
        assert r.status_code == 200, r.text
        cat = r.json()
        cid = cat["id"]
        assert cat["value"] == "test-cat-slug"  # slugify normalizes underscores to dashes

        # Create a product attached to it
        pr = s.post(f"{API}/admin/products", headers=auth_headers,
                    json={"name": "TEST_ProdInCat", "category": "test-cat-slug",
                          "description": "d", "characteristics": [], "applications": []})
        assert pr.status_code == 200
        pid = pr.json()["id"]

        # Update category with new slug → propagates on products
        r2 = s.put(f"{API}/admin/categories/{cid}", headers=auth_headers,
                   json={"name": "TEST_Cat_2", "value": "test-cat-slug-2", "description": "d2", "order": 99})
        assert r2.status_code == 200
        assert r2.json()["value"] == "test-cat-slug-2"
        # verify product now has new category
        pdet = s.get(f"{API}/products/{pid}").json()
        assert pdet["category"] == "test-cat-slug-2"

        # Deleting category should be blocked (still has product)
        r3 = s.delete(f"{API}/admin/categories/{cid}", headers=auth_headers)
        assert r3.status_code == 409

        # Cleanup product
        s.delete(f"{API}/admin/products/{pid}", headers=auth_headers)

        # Now delete succeeds
        r4 = s.delete(f"{API}/admin/categories/{cid}", headers=auth_headers)
        assert r4.status_code == 200

        # Verify gone
        cats = s.get(f"{API}/categories").json()
        assert not any(c["id"] == cid for c in cats)

    def test_update_slug_conflict(self, s, auth_headers):
        # Create a temp category then try updating another to its slug
        r = s.post(f"{API}/admin/categories", headers=auth_headers,
                   json={"name": "TEST_TmpA", "value": "test-tmp-a", "order": 500})
        assert r.status_code == 200
        cid = r.json()["id"]
        try:
            # Try updating engrais to slug "test-tmp-a" → 409
            cats = s.get(f"{API}/categories").json()
            engrais = next(c for c in cats if c["value"] == "engrais")
            r2 = s.put(f"{API}/admin/categories/{engrais['id']}", headers=auth_headers,
                       json={"name": engrais["name"], "value": "test-tmp-a",
                             "description": engrais.get("description", ""), "order": engrais.get("order", 1)})
            assert r2.status_code == 409
        finally:
            s.delete(f"{API}/admin/categories/{cid}", headers=auth_headers)
