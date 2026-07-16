"""Tests pour la gestion des Réseaux Sociaux (Socials) — public + admin CRUD."""
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
    """Supprime les réseaux créés pendant le test (préfixés TEST_)."""
    created = []
    def track(sid):
        created.append(sid)
    yield track
    for sid in created:
        s.delete(f"{API}/admin/socials/{sid}", headers=auth_headers)


class TestSocialsPublic:
    def test_get_seeded_socials(self, s):
        r = s.get(f"{API}/socials")
        assert r.status_code == 200
        socials = r.json()
        names = {sc["name"] for sc in socials}
        assert "Facebook" in names
        assert "LinkedIn" in names
        assert "Instagram" in names
        assert "WhatsApp" in names

    def test_socials_sorted_by_order(self, s):
        r = s.get(f"{API}/socials")
        orders = [sc["order"] for sc in r.json()]
        assert orders == sorted(orders)

    def test_socials_are_active_only(self, s):
        r = s.get(f"{API}/socials")
        for sc in r.json():
            assert sc["is_active"] is True


class TestSocialsAuth:
    def test_admin_list_requires_auth(self):
        r = requests.get(f"{API}/admin/socials")
        assert r.status_code == 401

    def test_create_requires_auth(self):
        r = requests.post(f"{API}/admin/socials", json={"name": "X", "url": "https://x.com"})
        assert r.status_code == 401

    def test_delete_requires_auth(self):
        r = requests.delete(f"{API}/admin/socials/xxx")
        assert r.status_code == 401


class TestSocialsCRUD:
    def test_create_valid_social(self, s, auth_headers, _cleanup):
        r = s.post(f"{API}/admin/socials", headers=auth_headers,
                   json={"name": "TEST_YouTube", "url": "https://youtube.com/@stmpagri", "icon_url": ""})
        assert r.status_code == 200, r.text
        d = r.json()
        _cleanup(d["id"])
        assert d["id"]
        assert d["name"] == "TEST_YouTube"
        assert d["is_active"] is True
        assert d["order"] >= 0

    def test_create_rejects_empty_name(self, s, auth_headers):
        r = s.post(f"{API}/admin/socials", headers=auth_headers,
                   json={"name": "", "url": "https://x.com"})
        assert r.status_code == 400

    def test_create_rejects_bad_url(self, s, auth_headers):
        r = s.post(f"{API}/admin/socials", headers=auth_headers,
                   json={"name": "Bad", "url": "not-a-url"})
        assert r.status_code == 400

    def test_create_accepts_mailto_tel(self, s, auth_headers, _cleanup):
        for url in ["mailto:contact@stmp.ci", "tel:+2250101010101"]:
            r = s.post(f"{API}/admin/socials", headers=auth_headers,
                       json={"name": f"TEST_{url[:4]}", "url": url})
            assert r.status_code == 200, r.text
            _cleanup(r.json()["id"])

    def test_admin_list_includes_inactive(self, s, auth_headers, _cleanup):
        r = s.post(f"{API}/admin/socials", headers=auth_headers,
                   json={"name": "TEST_Inactive", "url": "https://x.com", "is_active": False})
        _cleanup(r.json()["id"])
        # Public list must NOT include it
        pub = s.get(f"{API}/socials").json()
        assert not any(sc["name"] == "TEST_Inactive" for sc in pub)
        # Admin list must include it
        adm = s.get(f"{API}/admin/socials", headers=auth_headers).json()
        assert any(sc["name"] == "TEST_Inactive" for sc in adm)

    def test_patch_updates_fields(self, s, auth_headers, _cleanup):
        r = s.post(f"{API}/admin/socials", headers=auth_headers,
                   json={"name": "TEST_ToPatch", "url": "https://a.com"})
        sid = r.json()["id"]
        _cleanup(sid)
        r2 = s.patch(f"{API}/admin/socials/{sid}", headers=auth_headers,
                     json={"name": "TEST_Patched", "url": "https://b.com",
                           "icon_url": "https://cdn.example/i.png", "is_active": False})
        assert r2.status_code == 200
        d = r2.json()
        assert d["name"] == "TEST_Patched"
        assert d["url"] == "https://b.com"
        assert d["icon_url"] == "https://cdn.example/i.png"
        assert d["is_active"] is False

    def test_patch_rejects_bad_url(self, s, auth_headers, _cleanup):
        r = s.post(f"{API}/admin/socials", headers=auth_headers,
                   json={"name": "TEST_Toto", "url": "https://a.com"})
        sid = r.json()["id"]
        _cleanup(sid)
        r2 = s.patch(f"{API}/admin/socials/{sid}", headers=auth_headers,
                     json={"url": "javascript:alert(1)"})
        assert r2.status_code == 400

    def test_patch_missing_returns_404(self, s, auth_headers):
        r = s.patch(f"{API}/admin/socials/does-not-exist-xyz", headers=auth_headers,
                    json={"name": "x"})
        assert r.status_code == 404

    def test_delete_success(self, s, auth_headers):
        r = s.post(f"{API}/admin/socials", headers=auth_headers,
                   json={"name": "TEST_ToDelete", "url": "https://x.com"})
        sid = r.json()["id"]
        r2 = s.delete(f"{API}/admin/socials/{sid}", headers=auth_headers)
        assert r2.status_code == 200
        # Confirm gone
        r3 = s.patch(f"{API}/admin/socials/{sid}", headers=auth_headers, json={"name": "x"})
        assert r3.status_code == 404

    def test_delete_missing_returns_404(self, s, auth_headers):
        r = s.delete(f"{API}/admin/socials/does-not-exist-xyz", headers=auth_headers)
        assert r.status_code == 404


class TestSocialsReorder:
    def test_reorder_requires_auth(self):
        r = requests.post(f"{API}/admin/socials/reorder", json={"ids": []})
        assert r.status_code == 401

    def test_reorder_updates_orders(self, s, auth_headers):
        # Create 3 dedicated TEST_ items to reorder (avoids race with seeded/other tests)
        created_ids = []
        for i in range(3):
            r = s.post(f"{API}/admin/socials", headers=auth_headers,
                       json={"name": f"TEST_Reorder_{i}", "url": f"https://ex{i}.com"})
            created_ids.append(r.json()["id"])
        try:
            reversed_ids = list(reversed(created_ids))
            r = s.post(f"{API}/admin/socials/reorder", headers=auth_headers, json={"ids": reversed_ids})
            assert r.status_code == 200
            assert r.json()["updated"] == 3
            # Verify that within the admin list, our created_ids appear in the new order
            adm = s.get(f"{API}/admin/socials", headers=auth_headers).json()
            positions = {sc["id"]: sc["order"] for sc in adm}
            # positions should reflect the reversed order (id 2 has smaller order than id 0)
            assert positions[reversed_ids[0]] < positions[reversed_ids[1]] < positions[reversed_ids[2]]
        finally:
            for sid in created_ids:
                s.delete(f"{API}/admin/socials/{sid}", headers=auth_headers)

    def test_reorder_invalid_body(self, s, auth_headers):
        r = s.post(f"{API}/admin/socials/reorder", headers=auth_headers, json={"ids": "not-a-list"})
        assert r.status_code == 400


class TestRegression:
    def test_public_socials_still_reachable(self, s):
        r = s.get(f"{API}/socials")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 4  # 4 seeded

    def test_categories_still_seeded(self, s):
        r = s.get(f"{API}/categories")
        assert r.status_code == 200
        assert len(r.json()) >= 6
