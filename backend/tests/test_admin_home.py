"""Tests pour l'admin de la page d'accueil (Hero + About + Stats)."""
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
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


class TestHomePublic:
    def test_default_home_shape(self, s):
        r = s.get(f"{API}/home")
        assert r.status_code == 200
        d = r.json()
        assert "hero" in d and "about" in d
        for k in ("title", "subtitle", "background_image"):
            assert k in d["hero"]
        for k in ("eyebrow", "title", "text", "image"):
            assert k in d["about"]


class TestHomeAuth:
    def test_patch_home_requires_auth(self):
        r = requests.patch(f"{API}/admin/home", json={"hero": {"title": "x"}})
        assert r.status_code == 401

    def test_patch_stats_requires_auth(self):
        r = requests.patch(f"{API}/admin/stats", json={"partners": 1})
        assert r.status_code == 401


class TestHomeCRUD:
    def test_patch_hero(self, s, auth_headers):
        original = s.get(f"{API}/home").json()["hero"]["title"]
        try:
            r = s.patch(f"{API}/admin/home", headers=auth_headers,
                        json={"hero": {"title": "TEST_Titre patché"}})
            assert r.status_code == 200
            assert r.json()["hero"]["title"] == "TEST_Titre patché"
            # Public reflects change
            pub = s.get(f"{API}/home").json()
            assert pub["hero"]["title"] == "TEST_Titre patché"
        finally:
            s.patch(f"{API}/admin/home", headers=auth_headers, json={"hero": {"title": original}})

    def test_patch_about(self, s, auth_headers):
        original = s.get(f"{API}/home").json()["about"]
        try:
            r = s.patch(f"{API}/admin/home", headers=auth_headers,
                        json={"about": {"title": "TEST_À propos", "text": "L1\nL2"}})
            assert r.status_code == 200
            d = r.json()["about"]
            assert d["title"] == "TEST_À propos"
            assert d["text"] == "L1\nL2"
        finally:
            s.patch(f"{API}/admin/home", headers=auth_headers, json={"about": original})

    def test_hero_and_about_isolated(self, s, auth_headers):
        # Modifying hero doesn't wipe about (and vice-versa)
        original = s.get(f"{API}/home").json()
        try:
            s.patch(f"{API}/admin/home", headers=auth_headers,
                    json={"hero": {"subtitle": "TEST_Only subtitle"}})
            after = s.get(f"{API}/home").json()
            assert after["hero"]["subtitle"] == "TEST_Only subtitle"
            # about must be unchanged
            assert after["about"] == original["about"]
        finally:
            s.patch(f"{API}/admin/home", headers=auth_headers,
                    json={"hero": {"subtitle": original["hero"]["subtitle"]}})


class TestStats:
    def test_patch_stats(self, s, auth_headers):
        original = s.get(f"{API}/stats").json()
        try:
            r = s.patch(f"{API}/admin/stats", headers=auth_headers,
                        json={"partners": 99, "countries": 8, "clients": 500, "years": 15})
            assert r.status_code == 200
            d = r.json()
            assert d["partners"] == 99
            assert d["countries"] == 8
            assert d["clients"] == 500
            assert d["years"] == 15
            # Public reflects
            pub = s.get(f"{API}/stats").json()
            assert pub["partners"] == 99
        finally:
            s.patch(f"{API}/admin/stats", headers=auth_headers, json=original)

    def test_patch_stats_partial(self, s, auth_headers):
        original = s.get(f"{API}/stats").json()
        try:
            r = s.patch(f"{API}/admin/stats", headers=auth_headers, json={"partners": 77})
            assert r.status_code == 200
            after = s.get(f"{API}/stats").json()
            assert after["partners"] == 77
            # Other fields unchanged
            for k in ("countries", "clients", "years"):
                assert after[k] == original[k]
        finally:
            s.patch(f"{API}/admin/stats", headers=auth_headers, json=original)

    def test_patch_stats_rejects_non_integer(self, s, auth_headers):
        r = s.patch(f"{API}/admin/stats", headers=auth_headers,
                    json={"partners": "not-a-number"})
        assert r.status_code == 400

    def test_patch_stats_rejects_empty_body(self, s, auth_headers):
        r = s.patch(f"{API}/admin/stats", headers=auth_headers, json={})
        assert r.status_code == 400
