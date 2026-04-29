# god-sandbox-api

Local REST API skeleton for development use (PBI-BE-API-001).

Built with Node.js standard `http` module — no external dependencies.

## Start

```bash
npm run api:dev
# or
PORT=8787 node server/rest-api.mjs
```

## Endpoints

| Method | Path           | Description              |
|--------|----------------|--------------------------|
| GET    | /api/health    | Server liveness check    |
| POST   | /api/login     | Stub login               |
| GET    | /api/session   | Stub session check       |
| POST   | /api/logout    | Stub logout              |

### GET /api/health

```json
{ "ok": true, "service": "god-sandbox-api" }
```

### POST /api/login

Request body:
```json
{ "playerName": "Kitsune" }
```

Response:
```json
{ "ok": true, "user": { "id": "local-user", "name": "Kitsune" }, "token": "local-dev-token" }
```

### GET /api/session

```json
{ "ok": true, "authenticated": false }
```

### POST /api/logout

```json
{ "ok": true }
```

## Notes

- CORS is open (`*`) for local development.
- No persistent session or real authentication.
- Front-end integration is out of scope for this PBI.
