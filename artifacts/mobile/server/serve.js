/**
 * Standalone production server for Expo static builds.
 *
 * Serves the Expo web app from static-build/web/ at all paths.
 * Special routes:
 * - GET / or /manifest with expo-platform header → native platform manifest JSON
 * - GET /status → health check (200 OK)
 * - All other paths → static files from static-build/web/, with SPA fallback to index.html
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const STATIC_ROOT = path.resolve(__dirname, "..", "static-build");
const WEB_ROOT = path.join(STATIC_ROOT, "web");
const basePath = (process.env.BASE_PATH || "/").replace(/\/+$/, "");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
  ".webmanifest": "application/manifest+json",
};

function serveNativeManifest(platform, res) {
  const manifestPath = path.join(STATIC_ROOT, platform, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: `Manifest not found for platform: ${platform}` }));
    return;
  }
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.writeHead(200, {
    "content-type": "application/json",
    "expo-protocol-version": "1",
    "expo-sfv-version": "0",
  });
  res.end(manifest);
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { "content-type": contentType });
  res.end(content);
}

function resolveWebFile(urlPath) {
  const safe = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.join(WEB_ROOT, safe);
  if (!full.startsWith(WEB_ROOT)) return null;
  if (fs.existsSync(full) && !fs.statSync(full).isDirectory()) return full;
  const withHtml = full.endsWith(".html") ? null : full + ".html";
  if (withHtml && fs.existsSync(withHtml)) return withHtml;
  const indexHtml = path.join(full, "index.html");
  if (fs.existsSync(indexHtml)) return indexHtml;
  return null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let pathname = url.pathname;

  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || "/";
  }

  // Health check
  if (pathname === "/status") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // Native Expo manifest (Expo Go / native builds)
  if (pathname === "/" || pathname === "/manifest") {
    const platform = req.headers["expo-platform"];
    if (platform === "ios" || platform === "android") {
      return serveNativeManifest(platform, res);
    }
  }

  // Try to serve the matching static file from web build
  const resolved = resolveWebFile(pathname);
  if (resolved) {
    return serveFile(resolved, res);
  }

  // SPA fallback — serve index.html for all unmatched routes
  // (expo-router handles client-side navigation)
  const indexPath = path.join(WEB_ROOT, "index.html");
  if (fs.existsSync(indexPath)) {
    return serveFile(indexPath, res);
  }

  res.writeHead(404);
  res.end("Not found");
});

const port = parseInt(process.env.PORT || "3000", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`Serving Expo web app on port ${port}`);
});
