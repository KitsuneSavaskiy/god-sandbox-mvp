import { createServer } from "node:http";

const PORT = process.env.PORT ?? 8787;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
    ...CORS_HEADERS,
  });
  res.end(payload);
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

async function parseJSON(req) {
  const raw = await readBody(req);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new SyntaxError("Invalid JSON");
  }
}

const server = createServer(async (req, res) => {
  const { method, url } = req;

  if (method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  try {
    if (method === "GET" && url === "/api/health") {
      json(res, 200, { ok: true, service: "god-sandbox-api" });
      return;
    }

    if (method === "POST" && url === "/api/login") {
      const body = await parseJSON(req);
      const name = body.playerName ?? "Guest";
      json(res, 200, {
        ok: true,
        user: { id: "local-user", name },
        token: "local-dev-token",
      });
      return;
    }

    if (method === "GET" && url === "/api/session") {
      json(res, 200, { ok: true, authenticated: false });
      return;
    }

    if (method === "POST" && url === "/api/logout") {
      json(res, 200, { ok: true });
      return;
    }

    json(res, 404, { ok: false, error: "Not found" });
  } catch (err) {
    if (err instanceof SyntaxError) {
      json(res, 400, { ok: false, error: "Invalid JSON" });
    } else {
      json(res, 500, { ok: false, error: "Internal server error" });
    }
  }
});

server.listen(PORT, () => {
  console.log(`god-sandbox-api listening on http://localhost:${PORT}`);
});
