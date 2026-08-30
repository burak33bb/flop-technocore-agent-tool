import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { makeKit } from "./lib/technocore.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const host = "127.0.0.1";
const startPort = Number(process.env.PORT || 5173);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 64_000) throw new Error("Request body is too large.");
  }
  return JSON.parse(body || "{}");
}

async function serveStatic(pathname, res) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const resolved = normalize(join(publicDir, requested));
  if (!resolved.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }

  try {
    const file = await readFile(resolved);
    res.writeHead(200, { "content-type": mime[extname(resolved)] || "application/octet-stream" });
    res.end(file);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === "POST" && url.pathname === "/api/create-kit") {
      const form = await readJson(req);
      const kit = makeKit(form);
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(kit));
      return;
    }

    if (req.method === "GET") {
      await serveStatic(url.pathname, res);
      return;
    }

    res.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
    res.end("method not allowed");
  } catch (error) {
    res.writeHead(error.status || 500, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: error.message || "Unexpected error" }));
  }
});

function listen(port) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && port < startPort + 20) {
      listen(port + 1);
      return;
    }
    throw error;
  });

  server.listen(port, host, () => {
    console.log(`FLOP Technocore DID Tool running at http://${host}:${port}`);
  });
}

listen(startPort);
