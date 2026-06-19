#!/usr/bin/env node
/**
 * Local development server for ØG Scout API
 * Usage: node api/server.js
 *
 * Runs on http://localhost:8787 (same port as wrangler dev)
 * Uses the same Cloudflare Worker code via a simple Node.js HTTP adapter
 */

const http = require("http");

// Import the worker handler
// In production this runs as a Cloudflare Worker; locally we wrap it in Node HTTP
const workerPath = require("path").join(__dirname, "src", "index.js");
const worker = require(workerPath);

const PORT = process.env.PORT || 8787;

// Polyfill Request/Response for Node if needed (Node 18+ has fetch)
const server = http.createServer(async (req, res) => {
  // Build a standard Request object
  const url = `http://localhost:${PORT}${req.url}`;
  const headers = {};
  for (let i = 0; i < req.rawHeaders.length; i += 2) {
    headers[req.rawHeaders[i]] = req.rawHeaders[i + 1];
  }

  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await new Promise((resolve) => {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    });
  }

  const request = new Request(url, {
    method: req.method,
    headers,
    body,
  });

  // Env vars (read from process.env for local dev)
  const env = {
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "http://localhost:8080,http://localhost:3000,*",
    HF_MODEL: process.env.HF_MODEL || "mistralai/Mistral-7B-Instruct-v0.3",
    OG_MODEL: process.env.OG_MODEL || "zai-org/GLM-5-FP8",
    HF_API_KEY: process.env.HF_API_KEY || "",
    OG_API_KEY: process.env.OG_API_KEY || "",
  };

  try {
    const response = await worker.default.fetch(request, env, {});
    res.writeHead(response.status, Object.fromEntries(response.headers));
    const responseBody = await response.text();
    res.end(responseBody);
  } catch (err) {
    console.error("Worker error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error", details: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`\n  🔍 ØG Scout API running on http://localhost:${PORT}\n`);
  console.log(`  Endpoints:`);
  console.log(`    POST /api/score  — Score a crypto project`);
  console.log(`    POST /api/chat   — Chat with AI assistant`);
  console.log(`    GET  /api/health — Health check\n`);
  console.log(`  Environment:`);
  console.log(`    OG_API_KEY:  ${process.env.OG_API_KEY ? "✅ set" : "❌ not set"}`);
  console.log(`    HF_API_KEY:  ${process.env.HF_API_KEY ? "✅ set" : "❌ not set (free tier)"}\n`);
});
