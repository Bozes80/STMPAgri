"""Tests for Phase 2 CMS: Menus + Pages bulk-delete + reorder."""
import os
import pytest
import requests

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


# ============== Menus public ==============
class TestMenusPublic:
    def test_get_main_menu_seeded(self, s):
        r = s.get(f"{API}/menus/main")
        assert r.status_code == 200
        data = r.json()
        assert data["location"] == "main"
        items = data["items"]
        assert len(items) == 12, f"Expected 12 items, got {len(items)}"
        # 7 top-level (parent_id None)
        top = [i for i in items if not i.get("parent_id")]
        assert len(top) == 7
        # 5 subs of "Nos activités"
        activites = next(i for i in items if i["label"] == "Nos activités")
        subs = [i for i in items if i.get("parent_id") == activites["id"]]
        assert len(subs) == 5
        for sub in subs:
            assert sub["url"].startswith("/activites/")

    def test_get_footer_menu(self, s):
        r = s.get(f"{API}/menus/footer")
        assert r.status_code == 200
        data = r.json()
        assert data["location"] == "footer"
        assert len(data["items"]) >= 6

    def test_get_unknown_menu_returns_empty_not_404(self, s):
        r = s.get(f"{API}/menus/does-not-exist-xyz")
        assert r.status_code == 200
        data = r.json()
        assert data["location"] == "does-not-exist-xyz"
        assert data["items"] == []


# ============== Menus admin ==============
class TestMenusAdmin:
    def test_admin_list_menus_requires_auth(self, s):
        r = requests.get(f"{API}/admin/menus")
        assert r.status_code == 401

    def test_admin_list_menus(self, s, auth_headers):
        r = s.get(f"{API}/admin/menus", headers=auth_headers)
        assert r.status_code == 200
        locations = [m["location"] for m in r.json()]
        assert "main" in locations and "footer" in locations

    def test_admin_get_menu(self, s, auth_headers):
        r = s.get(f"{API}/admin/menus/main", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["location"] == "main"

    def test_admin_get_empty_menu(self, s, auth_headers):
        r = s.get(f"{API}/admin/menus/test-empty-loc", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["items"] == []

    def test_upsert_menu_requires_auth(self, s):
        r = requests.put(f"{API}/admin/menus/test-loc", json={"name": "x", "items": []})
        assert r.status_code == 401

    def test_upsert_menu_auto_generates_ids(self, s, auth_headers):
        loc = "test-menu-loc"
        payload = {
            "name": "Test",
            "items": [
                {"label": "A", "url": "/a", "target": "_self"},  # no id
                {"label": "B", "url": "/b", "target": "_blank", "id": "fixed-id-b"},
            ],
        }
        r = s.put(f"{API}/admin/menus/{loc}", headers=auth_headers, json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["location"] == loc
        assert data["name"] == "Test"
        assert len(data["items"]) == 2
        # missing id has been generated
        assert data["items"][0]["id"] and len(data["items"][0]["id"]) > 0
        assert data["items"][1]["id"] == "fixed-id-b"

        # persistence via public GET
        r2 = s.get(f"{API}/menus/{loc}")
        assert r2.status_code == 200
        assert len(r2.json()["items"]) == 2

        # update: remove one item
        r3 = s.put(f"{API}/admin/menus/{loc}", headers=auth_headers,
                   json={"name": "Test2", "items": [{"label": "Only", "url": "/o"}]})
        assert r3.status_code == 200
        assert len(r3.json()["items"]) == 1
        assert r3.json()["name"] == "Test2"

        # cleanup: empty items
        s.put(f"{API}/admin/menus/{loc}", headers=auth_headers,
              json={"name": "x", "items": []})


# ============== Pages bulk-delete ==============
class TestBulkDelete:
    def test_bulk_delete_requires_auth(self):
        r = requests.post(f"{API}/admin/pages/bulk-delete", json={"ids": []})
        assert r.status_code == 401

    def test_bulk_delete_empty_list(self, s, auth_headers):
        r = s.post(f"{API}/admin/pages/bulk-delete", headers=auth_headers, json={"ids": []})
        assert r.status_code == 200
        assert r.json() == {"deleted": 0}

    def test_bulk_delete_detaches_children(self, s, auth_headers):
        # Create parent + 2 children
        rp = s.post(f"{API}/admin/pages", headers=auth_headers,
                    json={"title": "TEST_BULK_Parent"})
        assert rp.status_code == 200, rp.text
        parent_id = rp.json()["id"]
        rc1 = s.post(f"{API}/admin/pages", headers=auth_headers,
                     json={"title": "TEST_BULK_Child1", "parent_id": parent_id})
        rc2 = s.post(f"{API}/admin/pages", headers=auth_headers,
                     json={"title": "TEST_BULK_Child2", "parent_id": parent_id})
        assert rc1.status_code == 200 and rc2.status_code == 200
        c1, c2 = rc1.json()["id"], rc2.json()["id"]

        # Bulk-delete the parent — children should be orphaned (parent_id=null)
        r = s.post(f"{API}/admin/pages/bulk-delete", headers=auth_headers,
                   json={"ids": [parent_id]})
        assert r.status_code == 200
        assert r.json()["deleted"] == 1

        # Children still exist but with parent_id=None
        all_pages = s.get(f"{API}/admin/pages", headers=auth_headers).json()
        ch1 = next(p for p in all_pages if p["id"] == c1)
        ch2 = next(p for p in all_pages if p["id"] == c2)
        assert ch1.get("parent_id") in (None, "")
        assert ch2.get("parent_id") in (None, "")

        # Bulk delete children too
        r2 = s.post(f"{API}/admin/pages/bulk-delete", headers=auth_headers,
                    json={"ids": [c1, c2]})
        assert r2.status_code == 200
        assert r2.json()["deleted"] == 2


# ============== Pages reorder ==============
class TestReorder:
    def test_reorder_requires_auth(self):
        r = requests.post(f"{API}/admin/pages/reorder", json={"items": []})
        assert r.status_code == 401

    def test_reorder_updates_parent_and_order(self, s, auth_headers):
        # Create 2 temp pages
        rp = s.post(f"{API}/admin/pages", headers=auth_headers,
                    json={"title": "TEST_REORDER_Parent"})
        rc = s.post(f"{API}/admin/pages", headers=auth_headers,
                    json={"title": "TEST_REORDER_Child"})
        pid, cid = rp.json()["id"], rc.json()["id"]

        # reorder: attach child to parent, order 5
        r = s.post(f"{API}/admin/pages/reorder", headers=auth_headers,
                   json={"items": [{"id": cid, "parent_id": pid, "order": 5}]})
        assert r.status_code == 200
        assert r.json()["updated"] == 1

        pages = s.get(f"{API}/admin/pages", headers=auth_headers).json()
        child = next(p for p in pages if p["id"] == cid)
        assert child["parent_id"] == pid
        assert child["order"] == 5

        # Detach again
        r2 = s.post(f"{API}/admin/pages/reorder", headers=auth_headers,
                    json={"items": [{"id": cid, "parent_id": None, "order": 0}]})
        assert r2.status_code == 200

        # Cleanup
        s.post(f"{API}/admin/pages/bulk-delete", headers=auth_headers,
               json={"ids": [pid, cid]})


# ============== Regression ==============
class TestRegression:
    def test_pages_public_list(self, s):
        r = s.get(f"{API}/pages")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_about_page_still_exists(self, s):
        r = s.get(f"{API}/pages/a-propos-de-stmp-agri")
        # may be draft or published; if published → 200; if draft → 404. We accept either but confirm no 500.
        assert r.status_code in (200, 404)

    def test_admin_pages_list(self, s, auth_headers):
        r = s.get(f"{API}/admin/pages", headers=auth_headers)
        assert r.status_code == 200
        titles = [p.get("title") for p in r.json()]
        assert "À propos de STMP Agri" in titles or "A propos de STMP Agri" in titles

    def test_categories_still_seeded(self, s):
        r = s.get(f"{API}/categories")
        assert r.status_code == 200
        vals = [c["value"] for c in r.json()]
        for v in ["engrais", "fertilisants", "herbicides", "insecticides", "fongicides", "equipements"]:
            assert v in vals
