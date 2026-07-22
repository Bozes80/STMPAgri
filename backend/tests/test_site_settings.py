"""Tests pour l'admin des paramètres du site (Header + Footer)."""
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
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


class TestSiteSettingsPublic:
    def test_default_shape(self, s):
        r = s.get(f"{API}/site-settings")
        assert r.status_code == 200
        d = r.json()
        assert "header" in d and "footer" in d
        for k in ("logo_url", "background_image", "background_color"):
            assert k in d["header"]
        for k in ("logo_url", "background_image", "background_color",
                  "address", "phone_fixed", "phone_mobile", "email", "hours"):
            assert k in d["footer"]


class TestSiteSettingsAuth:
    def test_patch_requires_auth(self):
        r = requests.patch(f"{API}/admin/site-settings", json={"header": {}})
        assert r.status_code == 401


class TestSiteSettingsCRUD:
    def test_patch_header_only_preserves_footer(self, s, auth_headers):
        original = s.get(f"{API}/site-settings").json()
        try:
            r = s.patch(f"{API}/admin/site-settings", headers=auth_headers,
                        json={"header": {"background_color": "#F2D400"}})
            assert r.status_code == 200
            d = r.json()
            assert d["header"]["background_color"] == "#F2D400"
            # Footer must be unchanged
            assert d["footer"]["address"] == original["footer"]["address"]
        finally:
            s.patch(f"{API}/admin/site-settings", headers=auth_headers,
                    json={"header": {"background_color": original["header"]["background_color"]}})

    def test_patch_footer_all_fields(self, s, auth_headers):
        original = s.get(f"{API}/site-settings").json()["footer"]
        try:
            payload = {"footer": {
                "background_color": "#0E7A3A",
                "address": "TEST_Rue XYZ",
                "phone_fixed": "+225 00 00 00 00 00",
                "phone_mobile": "+225 07 00 00 00 00",
                "email": "test@example.com",
                "hours": "TEST_24/7",
            }}
            r = s.patch(f"{API}/admin/site-settings", headers=auth_headers, json=payload)
            assert r.status_code == 200
            d = r.json()["footer"]
            for k, v in payload["footer"].items():
                assert d[k] == v
        finally:
            s.patch(f"{API}/admin/site-settings", headers=auth_headers, json={"footer": original})

    def test_rejects_invalid_color(self, s, auth_headers):
        r = s.patch(f"{API}/admin/site-settings", headers=auth_headers,
                    json={"header": {"background_color": "not-a-hex"}})
        assert r.status_code == 400

    def test_accepts_empty_color(self, s, auth_headers):
        r = s.patch(f"{API}/admin/site-settings", headers=auth_headers,
                    json={"header": {"background_color": ""}})
        assert r.status_code == 200
        assert r.json()["header"]["background_color"] == ""

    def test_accepts_hex_variants(self, s, auth_headers):
        for c in ("#fff", "#FFFFFF", "#0E7A3AFF"):
            r = s.patch(f"{API}/admin/site-settings", headers=auth_headers,
                        json={"header": {"background_color": c}})
            assert r.status_code == 200, f"failed for {c}: {r.text}"
        # Reset
        s.patch(f"{API}/admin/site-settings", headers=auth_headers,
                json={"header": {"background_color": ""}})

    def test_public_reflects_changes(self, s, auth_headers):
        try:
            s.patch(f"{API}/admin/site-settings", headers=auth_headers,
                    json={"footer": {"email": "TEST_public@stmp.ci"}})
            pub = s.get(f"{API}/site-settings").json()
            assert pub["footer"]["email"] == "TEST_public@stmp.ci"
        finally:
            s.patch(f"{API}/admin/site-settings", headers=auth_headers,
                    json={"footer": {"email": "contact@stmpagri.ci"}})
