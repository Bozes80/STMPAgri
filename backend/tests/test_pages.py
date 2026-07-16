"""CMS Pages API tests — public + admin CRUD."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://stmp-agro-commerce.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@stmpagri.ci"
ADMIN_PASSWORD = "StmpAgri2025!"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def auth_headers(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture(scope="module")
def created_pages(s, auth_headers):
    """Track ids of pages created so we can cleanup at end."""
    ids = []
    yield ids
    for pid in ids:
        try:
            s.delete(f"{API}/admin/pages/{pid}", headers=auth_headers)
        except Exception:
            pass


class TestPagesAuth:
    def test_create_requires_auth(self, s):
        r = requests.post(f"{API}/admin/pages", json={"title": "X"})
        assert r.status_code == 401

    def test_update_requires_auth(self, s):
        r = requests.put(f"{API}/admin/pages/xxx", json={"title": "X"})
        assert r.status_code == 401

    def test_delete_requires_auth(self, s):
        r = requests.delete(f"{API}/admin/pages/xxx")
        assert r.status_code == 401

    def test_status_requires_auth(self, s):
        r = requests.post(f"{API}/admin/pages/xxx/status", params={"status": "published"})
        assert r.status_code == 401


class TestPagesCRUD:
    def test_create_auto_slug(self, s, auth_headers, created_pages):
        r = s.post(f"{API}/admin/pages", headers=auth_headers, json={
            "title": "TEST Auto Slug Page"
        })
        assert r.status_code == 200, r.text
        p = r.json()
        assert p["slug"] == "test-auto-slug-page"
        assert p["status"] == "draft"
        assert p["author_email"] == ADMIN_EMAIL
        assert p["id"]
        assert "seo" in p and p["seo"]["robots"] == "index,follow"
        created_pages.append(p["id"])

    def test_duplicate_slug_gets_suffix(self, s, auth_headers, created_pages):
        r1 = s.post(f"{API}/admin/pages", headers=auth_headers, json={
            "title": "TEST Dup", "slug": "test-dup-slug"
        })
        assert r1.status_code == 200
        created_pages.append(r1.json()["id"])
        r2 = s.post(f"{API}/admin/pages", headers=auth_headers, json={
            "title": "TEST Dup 2", "slug": "test-dup-slug"
        })
        assert r2.status_code == 200, r2.text
        p2 = r2.json()
        # spec: duplicate slug → suffixed automatically (not 409)
        assert p2["slug"] != "test-dup-slug"
        assert p2["slug"].startswith("test-dup-slug-")
        created_pages.append(p2["id"])

    def test_public_list_excludes_draft(self, s, auth_headers, created_pages):
        r = s.post(f"{API}/admin/pages", headers=auth_headers, json={
            "title": "TEST Draft Only", "status": "draft"
        })
        assert r.status_code == 200
        pid = r.json()["id"]
        slug = r.json()["slug"]
        created_pages.append(pid)

        # Public list should not include it
        pub = s.get(f"{API}/pages").json()
        assert not any(p["slug"] == slug for p in pub)

        # Public GET by slug → 404
        r2 = s.get(f"{API}/pages/{slug}")
        assert r2.status_code == 404

    def test_publish_via_status_endpoint(self, s, auth_headers, created_pages):
        r = s.post(f"{API}/admin/pages", headers=auth_headers, json={
            "title": "TEST Publish Me"
        })
        p = r.json()
        pid = p["id"]
        slug = p["slug"]
        created_pages.append(pid)
        assert p["published_at"] is None

        # Publish
        r2 = s.post(f"{API}/admin/pages/{pid}/status", headers=auth_headers,
                    params={"status": "published"})
        assert r2.status_code == 200
        published = r2.json()
        assert published["status"] == "published"
        assert published["published_at"] is not None

        # Public GET now works
        r3 = s.get(f"{API}/pages/{slug}")
        assert r3.status_code == 200
        assert r3.json()["slug"] == slug

    def test_invalid_status(self, s, auth_headers, created_pages):
        r = s.post(f"{API}/admin/pages", headers=auth_headers, json={"title": "TEST Bad Status"})
        pid = r.json()["id"]
        created_pages.append(pid)
        r2 = s.post(f"{API}/admin/pages/{pid}/status", headers=auth_headers,
                    params={"status": "weird"})
        assert r2.status_code == 400

    def test_update_publish_sets_published_at(self, s, auth_headers, created_pages):
        r = s.post(f"{API}/admin/pages", headers=auth_headers, json={
            "title": "TEST Update Publish"
        })
        pid = r.json()["id"]
        created_pages.append(pid)
        payload = {
            "title": "TEST Update Publish",
            "slug": r.json()["slug"],
            "summary": "sum",
            "content_html": "<p>hi</p>",
            "status": "published",
            "seo": {"meta_title": "MT", "meta_description": "MD"}
        }
        r2 = s.put(f"{API}/admin/pages/{pid}", headers=auth_headers, json=payload)
        assert r2.status_code == 200, r2.text
        data = r2.json()
        assert data["status"] == "published"
        assert data["published_at"] is not None
        assert data["seo"]["meta_title"] == "MT"

    def test_update_slug_uniqueness(self, s, auth_headers, created_pages):
        r1 = s.post(f"{API}/admin/pages", headers=auth_headers, json={
            "title": "TEST SU A", "slug": "test-su-a"
        })
        r2 = s.post(f"{API}/admin/pages", headers=auth_headers, json={
            "title": "TEST SU B", "slug": "test-su-b"
        })
        pid_a = r1.json()["id"]
        pid_b = r2.json()["id"]
        created_pages.append(pid_a)
        created_pages.append(pid_b)
        # Update B to slug 'test-su-a' → should be suffixed, not 409
        payload = {"title": "TEST SU B", "slug": "test-su-a", "status": "draft"}
        r3 = s.put(f"{API}/admin/pages/{pid_b}", headers=auth_headers, json=payload)
        assert r3.status_code == 200
        assert r3.json()["slug"] != "test-su-a"
        assert r3.json()["slug"].startswith("test-su-a-")

    def test_nav_only_filter(self, s, auth_headers, created_pages):
        r = s.post(f"{API}/admin/pages", headers=auth_headers, json={
            "title": "TEST Nav Page", "show_in_main_nav": True
        })
        pid = r.json()["id"]
        created_pages.append(pid)
        s.post(f"{API}/admin/pages/{pid}/status", headers=auth_headers,
               params={"status": "published"})
        nav = s.get(f"{API}/pages", params={"nav_only": "true"}).json()
        slugs = [p["slug"] for p in nav]
        assert r.json()["slug"] in slugs
        for p in nav:
            assert p["show_in_main_nav"] is True
            assert p["status"] == "published"

    def test_delete_page(self, s, auth_headers):
        r = s.post(f"{API}/admin/pages", headers=auth_headers, json={"title": "TEST Del"})
        pid = r.json()["id"]
        r2 = s.delete(f"{API}/admin/pages/{pid}", headers=auth_headers)
        assert r2.status_code == 200
        assert "supprim" in r2.json()["message"].lower()
        # Second delete → 404
        r3 = s.delete(f"{API}/admin/pages/{pid}", headers=auth_headers)
        assert r3.status_code == 404

    def test_public_list_sorted(self, s):
        r = s.get(f"{API}/pages")
        assert r.status_code == 200
        pages = r.json()
        # Confirm they are all published
        for p in pages:
            assert p["status"] == "published"

    def test_full_page_model_fields(self, s, auth_headers, created_pages):
        payload = {
            "title": "TEST Full Fields",
            "slug": "test-full-fields",
            "summary": "s",
            "content_html": "<p>c</p>",
            "cover_image": "https://x/img.jpg",
            "gallery": ["a.jpg", "b.jpg"],
            "icon": "star",
            "category": "corp",
            "tags": ["t1", "t2"],
            "status": "draft",
            "parent_id": None,
            "order": 5,
            "show_in_main_nav": True,
            "seo": {
                "meta_title": "MT", "meta_description": "MD",
                "meta_keywords": "k1,k2", "canonical": "https://x/c",
                "robots": "noindex,nofollow",
                "og_title": "og", "og_description": "od", "og_image": "oi",
                "twitter_card": "summary"
            }
        }
        r = s.post(f"{API}/admin/pages", headers=auth_headers, json=payload)
        assert r.status_code == 200, r.text
        p = r.json()
        created_pages.append(p["id"])
        for k in ("title", "slug", "summary", "content_html", "cover_image", "gallery",
                  "icon", "category", "tags", "status", "parent_id", "order",
                  "show_in_main_nav", "author_email", "published_at",
                  "created_at", "updated_at", "seo"):
            assert k in p, f"missing field {k}"
        for k in ("meta_title", "meta_description", "meta_keywords", "canonical",
                  "robots", "og_title", "og_description", "og_image", "twitter_card"):
            assert k in p["seo"], f"missing seo.{k}"
        assert p["seo"]["robots"] == "noindex,nofollow"
