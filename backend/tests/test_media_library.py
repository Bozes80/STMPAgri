"""Tests pour la Médiathèque (Media Library) — upload, list, filter, patch, delete."""
import io
import os
import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
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


def _png_bytes(color=(14, 122, 58), size=(64, 64)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def _seed_and_cleanup(s, auth_headers):
    """Retourne un helper pour créer un média puis nettoyer."""
    created = []

    def upload(section="content", title="test", alt="", tags=""):
        params = {"section": section, "title": title, "alt": alt, "tags": tags}
        files = {"file": ("t.png", _png_bytes(), "image/png")}
        r = s.post(f"{API}/admin/media", headers=auth_headers, params=params, files=files)
        assert r.status_code == 200, r.text
        m = r.json()
        created.append(m["id"])
        return m

    yield upload

    for mid in created:
        s.delete(f"{API}/admin/media/{mid}", headers=auth_headers)


class TestMediaAuth:
    def test_upload_requires_auth(self):
        files = {"file": ("t.png", _png_bytes(), "image/png")}
        r = requests.post(f"{API}/admin/media", files=files)
        assert r.status_code == 401

    def test_list_requires_auth(self):
        r = requests.get(f"{API}/admin/media")
        assert r.status_code == 401

    def test_counts_requires_auth(self):
        r = requests.get(f"{API}/admin/media/counts")
        assert r.status_code == 401


class TestMediaUpload:
    def test_upload_valid_image_returns_metadata(self, s, auth_headers, _seed_and_cleanup):
        m = _seed_and_cleanup(section="header", title="Bannière", alt="Hero", tags="hero,banner")
        assert m["id"]
        assert m["url"].startswith("/api/files/")
        assert m["section"] == "header"
        assert m["title"] == "Bannière"
        assert m["alt"] == "Hero"
        assert m["tags"] == ["hero", "banner"]
        assert m["size"] > 0

    def test_upload_rejects_invalid_extension(self, s, auth_headers):
        files = {"file": ("t.exe", b"MZ", "application/octet-stream")}
        r = s.post(f"{API}/admin/media", headers=auth_headers, files=files, params={"section": "content"})
        assert r.status_code == 400

    def test_upload_rejects_invalid_section(self, s, auth_headers):
        files = {"file": ("t.png", _png_bytes(), "image/png")}
        r = s.post(f"{API}/admin/media", headers=auth_headers, files=files, params={"section": "invalid-xyz"})
        assert r.status_code == 400

    def test_uploaded_file_downloadable(self, s, auth_headers, _seed_and_cleanup):
        m = _seed_and_cleanup()
        # Public download
        r = s.get(f"{BASE_URL}{m['url']}")
        assert r.status_code == 200
        assert r.headers.get("Content-Type", "").startswith("image/")


class TestMediaListFilter:
    def test_list_returns_uploaded_media(self, s, auth_headers, _seed_and_cleanup):
        m = _seed_and_cleanup(section="content", title="unique-XYZ-content")
        r = s.get(f"{API}/admin/media", headers=auth_headers)
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert m["id"] in ids

    def test_filter_by_section(self, s, auth_headers, _seed_and_cleanup):
        mh = _seed_and_cleanup(section="header", title="H1")
        mf = _seed_and_cleanup(section="footer", title="F1")
        r = s.get(f"{API}/admin/media?section=header", headers=auth_headers)
        ids = [x["id"] for x in r.json()]
        assert mh["id"] in ids
        assert mf["id"] not in ids

    def test_search_by_title(self, s, auth_headers, _seed_and_cleanup):
        m = _seed_and_cleanup(title="SUPERUNIQUEQUERY_2026")
        r = s.get(f"{API}/admin/media?q=SUPERUNIQUEQUERY", headers=auth_headers)
        ids = [x["id"] for x in r.json()]
        assert m["id"] in ids

    def test_counts_endpoint(self, s, auth_headers, _seed_and_cleanup):
        _seed_and_cleanup(section="header")
        r = s.get(f"{API}/admin/media/counts", headers=auth_headers)
        assert r.status_code == 200
        c = r.json()
        for k in ("all", "header", "content", "footer"):
            assert k in c
        assert c["header"] >= 1
        assert c["all"] >= c["header"]


class TestMediaPatch:
    def test_patch_all_fields(self, s, auth_headers, _seed_and_cleanup):
        m = _seed_and_cleanup(section="content", title="orig", alt="")
        r = s.patch(f"{API}/admin/media/{m['id']}", headers=auth_headers,
                    json={"section": "footer", "title": "renamed", "alt": "New alt",
                          "tags": ["a", "b"]})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["section"] == "footer"
        assert d["title"] == "renamed"
        assert d["alt"] == "New alt"
        assert d["tags"] == ["a", "b"]

    def test_patch_tags_as_comma_string(self, s, auth_headers, _seed_and_cleanup):
        m = _seed_and_cleanup()
        r = s.patch(f"{API}/admin/media/{m['id']}", headers=auth_headers,
                    json={"tags": "x, y ,z"})
        assert r.status_code == 200
        assert r.json()["tags"] == ["x", "y", "z"]

    def test_patch_rejects_bad_section(self, s, auth_headers, _seed_and_cleanup):
        m = _seed_and_cleanup()
        r = s.patch(f"{API}/admin/media/{m['id']}", headers=auth_headers,
                    json={"section": "sidebar"})
        assert r.status_code == 400

    def test_patch_missing_returns_404(self, s, auth_headers):
        r = s.patch(f"{API}/admin/media/does-not-exist-xyz", headers=auth_headers,
                    json={"title": "x"})
        assert r.status_code == 404


class TestMediaDelete:
    def test_delete_returns_usage_count(self, s, auth_headers, _seed_and_cleanup):
        m = _seed_and_cleanup()
        r = s.delete(f"{API}/admin/media/{m['id']}", headers=auth_headers)
        assert r.status_code == 200
        body = r.json()
        assert "usages" in body
        # not referenced anywhere
        assert body["usages"]["total"] == 0
        # subsequent GET → 404
        r2 = s.get(f"{API}/admin/media/{m['id']}", headers=auth_headers)
        assert r2.status_code == 404

    def test_delete_missing_returns_404(self, s, auth_headers):
        r = s.delete(f"{API}/admin/media/does-not-exist-xyz", headers=auth_headers)
        assert r.status_code == 404


class TestMediaUsages:
    def test_detail_includes_usages_key(self, s, auth_headers, _seed_and_cleanup):
        m = _seed_and_cleanup()
        r = s.get(f"{API}/admin/media/{m['id']}", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        assert "usages" in d
        assert d["usages"]["total"] == 0
        for k in ("products", "articles", "realisations", "partners", "pages"):
            assert k in d["usages"]

    def test_usages_detect_product_reference(self, s, auth_headers, _seed_and_cleanup):
        """Un produit référençant l'URL doit apparaître dans usages.products."""
        m = _seed_and_cleanup()
        # Créer un produit dont l'image pointe vers l'URL du media
        rp = s.post(f"{API}/admin/products", headers=auth_headers, json={
            "name": "TEST_MEDIA_USAGE_PRODUCT",
            "category": "engrais",
            "description": "temp",
            "image": m["url"],
        })
        assert rp.status_code == 200, rp.text
        pid = rp.json()["id"]
        try:
            r = s.get(f"{API}/admin/media/{m['id']}", headers=auth_headers)
            assert r.json()["usages"]["products"] >= 1
            assert r.json()["usages"]["total"] >= 1
        finally:
            s.delete(f"{API}/admin/products/{pid}", headers=auth_headers)
