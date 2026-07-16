"""Tests for upload/download endpoints (Emergent object storage integration)."""
import io
import os
import struct
import zlib
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@stmpagri.ci"
ADMIN_PASSWORD = "StmpAgri2025!"


def _make_png_bytes() -> bytes:
    """Build a tiny valid 1x1 PNG."""
    def chunk(ctype, data):
        return (struct.pack(">I", len(data)) + ctype + data
                + struct.pack(">I", zlib.crc32(ctype + data) & 0xffffffff))
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
    idat = chunk(b"IDAT", zlib.compress(b"\x00\xff\xff\xff"))
    iend = chunk(b"IEND", b"")
    return sig + ihdr + idat + iend


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


class TestUpload:
    def test_upload_requires_auth(self):
        png = _make_png_bytes()
        r = requests.post(f"{API}/admin/upload",
                          files={"file": ("test.png", png, "image/png")})
        assert r.status_code == 401

    def test_upload_disallowed_extension(self, auth_headers):
        r = requests.post(f"{API}/admin/upload",
                          headers=auth_headers,
                          files={"file": ("test.exe", b"MZ\x00\x00", "application/octet-stream")})
        assert r.status_code == 400
        assert "Extension" in r.json()["detail"]

    def test_upload_png_success(self, auth_headers):
        png = _make_png_bytes()
        r = requests.post(f"{API}/admin/upload",
                          headers=auth_headers,
                          files={"file": ("test.png", png, "image/png")})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and "path" in data and "size" in data
        assert data["url"].startswith("/api/files/stmp-agri/uploads/")
        assert data["path"].startswith("stmp-agri/uploads/")
        assert data["size"] == len(png)

        # Public download
        dl = requests.get(f"{BASE_URL}{data['url']}")
        assert dl.status_code == 200
        assert dl.headers.get("content-type", "").startswith("image/")
        assert len(dl.content) == len(png)

    def test_download_404(self):
        r = requests.get(f"{API}/files/stmp-agri/uploads/does-not-exist.png")
        assert r.status_code == 404

    def test_upload_too_large(self, auth_headers):
        # 11 MB junk buffer with png ext (should be rejected on size)
        big = b"\x00" * (11 * 1024 * 1024)
        r = requests.post(f"{API}/admin/upload",
                          headers=auth_headers,
                          files={"file": ("big.png", big, "image/png")})
        assert r.status_code == 413
