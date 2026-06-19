/**
 * ØG Scout AI Scoring API — Cloudflare Worker
 *
 * Endpoints:
 *   POST /api/score     — Score a crypto project (returns score, badge, analysis)
 *   POST /api/chat      — Chat with AI assistant
 *   GET  /api/health    — Health check
 *
 * Providers (tried in order):
 *   1. 0G Router API  (if OG_API_KEY secret is set)
 *   2. Hugging Face   (free tier, no key needed for some models)
 */

// ── Rate limiting (in-memory per isolate, resets on cold start) ──────────────
const rateLimitMap = new Map();

function checkRateLimit(ip, maxRequests = 20, windowMs = 60_000) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.start > windowMs) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }
  record.count++;
  return record.count <= maxRequests;
}

// ── CORS helpers ─────────────────────────────────────────────────────────────
function getCorsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "*";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim());
  const isAllowed = allowed.includes(origin) || allowed.includes("*");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowed[0] || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Provider",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonReply(request, env, body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(request, env),
    },
  });
}

// ── System prompts ───────────────────────────────────────────────────────────
const SCORE_SYSTEM_PROMPT = `You are an expert crypto airdrop analyst. Your job is to evaluate a project's likelihood of doing an airdrop and the potential value.

Scoring criteria (0-10):
- Team & funding (VC backing, team history)
- Token status (no token yet = higher score)
- Community size & engagement
- Testnet/mainnet activity
- Points/rewards programs announced
- Historical patterns (similar projects that did airdrops)

You MUST respond in this EXACT JSON format and nothing else:
{
  "score": <number 0-10 with one decimal>,
  "badge": "<S-TIER|A-TIER|B-TIER|C-TIER|D-TIER>",
  "confidence": "<high|medium|low>",
  "airdrop_probability": "<very likely|likely|possible|unlikely|very unlikely>",
  "analysis": "<2-3 sentence summary>",
  "signals": ["<signal 1>", "<signal 2>", "<signal 3>"],
  "risks": ["<risk 1>", "<risk 2>"]
}

Badge mapping: S-TIER (9-10), A-TIER (7.5-8.9), B-TIER (6-7.4), C-TIER (4-5.9), D-TIER (0-3.9).`;

const CHAT_SYSTEM_PROMPT = `You are ØG Scout, an AI-powered airdrop discovery assistant. You help users evaluate crypto projects for airdrop potential.

Key knowledge:
- 0G (ØG) Protocol: Decentralized AI infrastructure with Chain, Storage, and Compute layers. EVM L1. Very likely airdrop.
- EigenLayer: Restaking protocol, already launched token (EIGEN).
- Monad: Parallel EVM L1, high funding, no token yet.
- Berachain: Proof of Liquidity L1, BERA token launched.
- Linea: zkEVM L2 by Consensys, no token yet.
- Scroll: zkEVM L2, no token yet.
- Eclipse: SVM L2 on Ethereum, no token yet.
- Initia: Interwoven rollup L1, no token yet.

Be concise, helpful, and crypto-native. Use emojis sparingly. If asked about a specific project, give a quick assessment with a score.`;

// ── AI provider calls ────────────────────────────────────────────────────────

async function call0GRouter(env, messages) {
  if (!env.OG_API_KEY) return null;
  try {
    const resp = await fetch("https://router-api.0g.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OG_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OG_MODEL || "zai-org/GLM-5-FP8",
        messages,
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });
    if (!resp.ok) {
      console.error(`0G Router error: ${resp.status} ${await resp.text()}`);
      return null;
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error("0G Router fetch error:", e.message);
    return null;
  }
}

async function callHuggingFace(env, messages) {
  const model = env.HF_MODEL || "mistralai/Mistral-7B-Instruct-v0.3";
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const headers = { "Content-Type": "application/json" };
  if (env.HF_API_KEY) {
    headers["Authorization"] = `Bearer ${env.HF_API_KEY}`;
  }
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        inputs: formatMessagesForHF(messages),
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.3,
          return_full_text: false,
        },
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`HuggingFace error: ${resp.status} ${errText}`);
      return null;
    }
    const data = await resp.json();
    // HF returns array of generated texts
    if (Array.isArray(data)) {
      return data[0]?.generated_text || null;
    }
    // Some models return chat format
    return data.choices?.[0]?.message?.content || data.generated_text || null;
  } catch (e) {
    console.error("HuggingFace fetch error:", e.message);
    return null;
  }
}

function formatMessagesForHF(messages) {
  // Format as a simple prompt for text generation models
  let prompt = "";
  for (const msg of messages) {
    if (msg.role === "system") {
      prompt += `[INST] ${msg.content} [/INST]\n\n`;
    } else if (msg.role === "user") {
      prompt += `[INST] ${msg.content} [/INST]\n\n`;
    } else if (msg.role === "assistant") {
      prompt += `${msg.content}\n\n`;
    }
  }
  return prompt.trim();
}

async function callAI(env, messages) {
  // Try 0G Router first, fallback to HuggingFace
  let result = await call0GRouter(env, messages);
  if (result) return { text: result, provider: "0g-router" };

  result = await callHuggingFace(env, messages);
  if (result) return { text: result, provider: "huggingface" };

  return null;
}

// ── Response parsing ─────────────────────────────────────────────────────────

function parseScoreResponse(text) {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(10, Math.max(0, parseFloat(parsed.score) || 0)),
        badge: parsed.badge || getBadge(parsed.score),
        confidence: parsed.confidence || "medium",
        airdrop_probability: parsed.airdrop_probability || "unknown",
        analysis: parsed.analysis || text.slice(0, 300),
        signals: parsed.signals || [],
        risks: parsed.risks || [],
      };
    } catch (e) {
      // JSON parse failed, extract score manually
    }
  }
  // Fallback: try to find a number like "score: 7.5" or "7.5/10"
  const scoreMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:\/10|out of 10)/i);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : 5.0;
  return {
    score: Math.min(10, Math.max(0, score)),
    badge: getBadge(score),
    confidence: "low",
    airdrop_probability: "unknown",
    analysis: text.slice(0, 300),
    signals: [],
    risks: [],
  };
}

function getBadge(score) {
  if (score >= 9) return "S-TIER";
  if (score >= 7.5) return "A-TIER";
  if (score >= 6) return "B-TIER";
  if (score >= 4) return "C-TIER";
  return "D-TIER";
}

// ── Request handlers ─────────────────────────────────────────────────────────

async function handleScore(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonReply(request, env, { error: "Invalid JSON body" }, 400);
  }

  const { project, description, provider } = body;
  if (!project && !description) {
    return jsonReply(request, env, { error: "Missing 'project' or 'description' field" }, 400);
  }

  const projectInfo = description || project;
  const messages = [
    { role: "system", content: SCORE_SYSTEM_PROMPT },
    { role: "user", content: `Evaluate this crypto project for airdrop potential:\n\n${projectInfo}` },
  ];

  const result = await callAI(env, messages);
  if (!result) {
    return jsonReply(request, env, {
      error: "All AI providers failed. Please try again later.",
      providers_tried: ["0g-router", "huggingface"],
    }, 503);
  }

  const parsed = parseScoreResponse(result.text);
  return jsonReply(request, env, {
    ...parsed,
    project: project || description.slice(0, 100),
    provider: result.provider,
    timestamp: new Date().toISOString(),
  });
}

async function handleChat(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonReply(request, env, { error: "Invalid JSON body" }, 400);
  }

  const { message, history = [] } = body;
  if (!message) {
    return jsonReply(request, env, { error: "Missing 'message' field" }, 400);
  }

  const messages = [
    { role: "system", content: CHAT_SYSTEM_PROMPT },
    ...history.slice(-6), // Keep last 6 messages for context
    { role: "user", content: message },
  ];

  const result = await callAI(env, messages);
  if (!result) {
    return jsonReply(request, env, {
      error: "All AI providers failed. Please try again later.",
    }, 503);
  }

  return jsonReply(request, env, {
    response: result.text,
    provider: result.provider,
    timestamp: new Date().toISOString(),
  });
}

// ── Main fetch handler ───────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request, env),
      });
    }

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return jsonReply(request, env, {
        error: "Rate limit exceeded. Try again in 60 seconds.",
        retry_after: 60,
      }, 429);
    }

    // Health check
    if (url.pathname === "/api/health" || url.pathname === "/health") {
      return jsonReply(request, env, {
        status: "ok",
        service: "0g-scout-api",
        version: "1.0.0",
        providers: {
          "0g-router": !!env.OG_API_KEY,
          "huggingface": true,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Score endpoint
    if (url.pathname === "/api/score" && method === "POST") {
      return handleScore(request, env);
    }

    // Chat endpoint
    if (url.pathname === "/api/chat" && method === "POST") {
      return handleChat(request, env);
    }

    // 404
    return jsonReply(request, env, {
      error: "Not found",
      endpoints: [
        "POST /api/score  — Score a crypto project",
        "POST /api/chat   — Chat with AI assistant",
        "GET  /api/health — Health check",
      ],
    }, 404);
  },
};
