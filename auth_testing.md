# STMP Agri — Auth Testing

Admin credentials (from backend/.env, seeded on startup):
- Email: admin@stmpagri.ci
- Password: StmpAgri2025!

## Flow
- Frontend stores JWT in localStorage key `stmp_token` and sends `Authorization: Bearer <token>`.
- get_current_user reads cookie `access_token` first, then Bearer header.

## API tests
```
curl -s -X POST $URL/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@stmpagri.ci","password":"StmpAgri2025!"}'
# -> {access_token, token_type, user:{...}}

TOKEN=... ; curl -s $URL/api/auth/me -H "Authorization: Bearer $TOKEN"
# -> user object (id, email, name, role)
```
Wrong password -> 401 "Email ou mot de passe incorrect".
Admin endpoints (/api/admin/*) require the Bearer token, else 401.
