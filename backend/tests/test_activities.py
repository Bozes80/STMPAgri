"""Tests pour le CRUD des Activités (rubriques + sous-rubriques)."""
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


@pytest.fixture
def _cleanup(s, auth_headers):
    """Track puis supprime les activités créées pendant le test."""
    created = []
    def track(aid):
        created.append(aid)
        return aid
    yield track
    for aid in reversed(created):
        s.delete(f"{API}/admin/activities/{aid}", headers=auth_headers)


class TestActivitiesPublic:
    def test_get_seeded_activities(self, s):
        r = s.get(f"{API}/activities")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 5
        keys = {a["key"] for a in items}
        for expected in ("achat-vente-engrais", "produits-phytosanitaires",
                         "agroalimentaire", "transport-marchandises", "commerce-general"):
            assert expected in keys

    def test_public_only_active(self, s):
        r = s.get(f"{API}/activities")
        for a in r.json():
            assert a["is_active"] is True

    def test_get_by_key(self, s):
        r = s.get(f"{API}/activities/achat-vente-engrais")
        assert r.status_code == 200
        a = r.json()
        assert a["key"] == "achat-vente-engrais"
        assert a["title"] == "Achat et vente d'engrais"
        assert len(a["features"]) >= 3
        assert "children" in a

    def test_get_by_missing_key_404(self, s):
        r = s.get(f"{API}/activities/does-not-exist-xyz-abc")
        assert r.status_code == 404


class TestActivitiesAuth:
    def test_admin_list_requires_auth(self):
        r = requests.get(f"{API}/admin/activities")
        assert r.status_code == 401

    def test_create_requires_auth(self):
        r = requests.post(f"{API}/admin/activities", json={"title": "x"})
        assert r.status_code == 401

    def test_delete_requires_auth(self):
        r = requests.delete(f"{API}/admin/activities/xxx")
        assert r.status_code == 401


class TestActivitiesCRUD:
    def test_create_valid_activity(self, s, auth_headers, _cleanup):
        r = s.post(f"{API}/admin/activities", headers=auth_headers,
                   json={"title": "TEST_Nouvelle activité de test", "tagline": "Test",
                         "teaser": "Un test", "features": ["A", "B"]})
        assert r.status_code == 200
        d = r.json()
        _cleanup(d["id"])
        assert d["title"] == "TEST_Nouvelle activité de test"
        assert d["key"] == "test-nouvelle-activite-de-test"
        assert d["features"] == ["A", "B"]

    def test_create_generates_unique_slug(self, s, auth_headers, _cleanup):
        r1 = s.post(f"{API}/admin/activities", headers=auth_headers,
                    json={"title": "TEST_Duplication"})
        r2 = s.post(f"{API}/admin/activities", headers=auth_headers,
                    json={"title": "TEST_Duplication"})
        _cleanup(r1.json()["id"])
        _cleanup(r2.json()["id"])
        k1, k2 = r1.json()["key"], r2.json()["key"]
        assert k1 != k2
        assert k2.startswith(k1) and k2[-1].isdigit()

    def test_create_rejects_empty_title(self, s, auth_headers):
        r = s.post(f"{API}/admin/activities", headers=auth_headers, json={"title": ""})
        assert r.status_code in (400, 422)

    def test_patch_updates_content(self, s, auth_headers, _cleanup):
        r = s.post(f"{API}/admin/activities", headers=auth_headers,
                   json={"title": "TEST_ToPatch"})
        aid = _cleanup(r.json()["id"])
        r2 = s.patch(f"{API}/admin/activities/{aid}", headers=auth_headers,
                     json={"title": "TEST_Renamed", "intro": "Nouveau", "features": ["x", "y"]})
        assert r2.status_code == 200
        d = r2.json()
        assert d["title"] == "TEST_Renamed"
        assert d["intro"] == "Nouveau"
        assert d["features"] == ["x", "y"]

    def test_slug_immutable(self, s, auth_headers, _cleanup):
        r = s.post(f"{API}/admin/activities", headers=auth_headers,
                   json={"title": "TEST_Slug immuable"})
        aid = _cleanup(r.json()["id"])
        original_key = r.json()["key"]
        # Try to change key — must be silently ignored
        r2 = s.patch(f"{API}/admin/activities/{aid}", headers=auth_headers,
                     json={"key": "nouvelle-cle-tentative"})
        assert r2.status_code == 200
        assert r2.json()["key"] == original_key

    def test_delete_and_confirm(self, s, auth_headers):
        r = s.post(f"{API}/admin/activities", headers=auth_headers,
                   json={"title": "TEST_ToDelete"})
        aid = r.json()["id"]
        r2 = s.delete(f"{API}/admin/activities/{aid}", headers=auth_headers)
        assert r2.status_code == 200
        # Confirm gone
        r3 = s.patch(f"{API}/admin/activities/{aid}", headers=auth_headers, json={"title": "x"})
        assert r3.status_code == 404

    def test_delete_missing_returns_404(self, s, auth_headers):
        r = s.delete(f"{API}/admin/activities/does-not-exist-xyz", headers=auth_headers)
        assert r.status_code == 404


class TestActivitiesHierarchy:
    def test_create_subactivity(self, s, auth_headers, _cleanup):
        # Get seeded parent
        parent = s.get(f"{API}/activities/achat-vente-engrais").json()
        r = s.post(f"{API}/admin/activities", headers=auth_headers,
                   json={"title": "TEST_Sous-rubrique NPK",
                         "parent_id": parent["id"]})
        aid = _cleanup(r.json()["id"])
        d = r.json()
        assert d["parent_id"] == parent["id"]
        # Public GET of parent must include this child
        parent_full = s.get(f"{API}/activities/{parent['key']}").json()
        child_ids = [c["id"] for c in parent_full["children"]]
        assert aid in child_ids
        # Public GET of child includes parent info
        child_full = s.get(f"{API}/activities/{d['key']}").json()
        assert child_full.get("parent", {}).get("id") == parent["id"]

    def test_cannot_nest_under_child(self, s, auth_headers, _cleanup):
        parent = s.get(f"{API}/activities/agroalimentaire").json()
        r1 = s.post(f"{API}/admin/activities", headers=auth_headers,
                    json={"title": "TEST_Niveau 1", "parent_id": parent["id"]})
        c1 = _cleanup(r1.json()["id"])
        # Try to create a child of the child → must 400
        r2 = s.post(f"{API}/admin/activities", headers=auth_headers,
                    json={"title": "TEST_Niveau 2", "parent_id": c1})
        assert r2.status_code == 400
        assert "sous-rubrique" in r2.json()["detail"].lower()

    def test_cannot_be_own_parent(self, s, auth_headers, _cleanup):
        r = s.post(f"{API}/admin/activities", headers=auth_headers,
                   json={"title": "TEST_SelfParent"})
        aid = _cleanup(r.json()["id"])
        r2 = s.patch(f"{API}/admin/activities/{aid}", headers=auth_headers,
                     json={"parent_id": aid})
        assert r2.status_code == 400

    def test_cannot_attach_parent_with_children(self, s, auth_headers, _cleanup):
        # Create parent P + child C
        r_parent = s.post(f"{API}/admin/activities", headers=auth_headers,
                          json={"title": "TEST_P"})
        pid = _cleanup(r_parent.json()["id"])
        r_child = s.post(f"{API}/admin/activities", headers=auth_headers,
                         json={"title": "TEST_C", "parent_id": pid})
        _cleanup(r_child.json()["id"])
        # Try to make P a child of another activity → must 400
        target = s.get(f"{API}/activities/transport-marchandises").json()
        r = s.patch(f"{API}/admin/activities/{pid}", headers=auth_headers,
                    json={"parent_id": target["id"]})
        assert r.status_code == 400

    def test_delete_parent_detaches_children(self, s, auth_headers, _cleanup):
        r_parent = s.post(f"{API}/admin/activities", headers=auth_headers,
                          json={"title": "TEST_ParentToRemove"})
        pid = r_parent.json()["id"]
        r_child = s.post(f"{API}/admin/activities", headers=auth_headers,
                         json={"title": "TEST_ChildOrphan", "parent_id": pid})
        cid = _cleanup(r_child.json()["id"])
        # Delete parent
        s.delete(f"{API}/admin/activities/{pid}", headers=auth_headers)
        # Child still exists, parent_id detached
        adm_list = s.get(f"{API}/admin/activities", headers=auth_headers).json()
        child = next((a for a in adm_list if a["id"] == cid), None)
        assert child is not None
        assert child["parent_id"] is None


class TestActivitiesReorder:
    def test_reorder_requires_auth(self):
        r = requests.post(f"{API}/admin/activities/reorder", json={"items": []})
        assert r.status_code == 401

    def test_reorder_updates_orders(self, s, auth_headers, _cleanup):
        # Create 3 top-level TEST_
        ids = []
        for i in range(3):
            r = s.post(f"{API}/admin/activities", headers=auth_headers,
                       json={"title": f"TEST_Order_{i}"})
            ids.append(_cleanup(r.json()["id"]))
        # Reorder reversed
        reversed_ids = list(reversed(ids))
        r = s.post(f"{API}/admin/activities/reorder", headers=auth_headers,
                   json={"items": [{"id": aid, "parent_id": None, "order": idx}
                                   for idx, aid in enumerate(reversed_ids)]})
        assert r.status_code == 200
        assert r.json()["updated"] == 3
        # Verify orders
        adm = s.get(f"{API}/admin/activities", headers=auth_headers).json()
        positions = {a["id"]: a["order"] for a in adm}
        assert positions[reversed_ids[0]] < positions[reversed_ids[1]] < positions[reversed_ids[2]]


class TestActivitiesRegression:
    def test_categories_still_seeded(self, s):
        r = s.get(f"{API}/categories")
        assert r.status_code == 200

    def test_menus_still_seeded(self, s):
        r = s.get(f"{API}/menus/main")
        assert r.status_code == 200
        assert len(r.json()["items"]) > 0

    def test_socials_still_seeded(self, s):
        r = s.get(f"{API}/socials")
        assert r.status_code == 200
        assert len(r.json()) >= 4
