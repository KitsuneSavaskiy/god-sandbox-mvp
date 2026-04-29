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

---

# god-sandbox-local-game-data

Local file storage layer for game data (PBI-BE-FS-001).

Uses only Node.js standard `fs/promises` and `path` — no external dependencies, no REST server.

## Data root

`god-sandbox-data/` is created in the working directory at runtime and is git-ignored.

```text
god-sandbox-data/
  config/
    local-config.json
  saves/
    <saveName>.json
  sessions/
    <sessionName>.json
```

## API

| Function | Description |
|---|---|
| `readConfig()` | Read local config JSON |
| `writeConfig(data)` | Write local config JSON |
| `readSave(saveName)` | Read a named save JSON |
| `writeSave(saveName, data)` | Write a named save JSON |
| `readSession(sessionName)` | Read a named session JSON |
| `writeSession(sessionName, data)` | Write a named session JSON |

Returns `null` if the file does not exist. Throws on malformed JSON.
`saveName` / `sessionName` must not contain `/`, `\`, or `..`.

## Smoke test

```bash
npm run data:smoke
```
