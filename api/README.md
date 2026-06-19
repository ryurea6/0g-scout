# ØG Scout API — Cloudflare Worker

Serverless API proxy for AI-powered crypto project scoring.

## Endpoints

| Method | Path         | Description                  |
|--------|-------------|------------------------------|
| POST   | /api/score  | Score a crypto project       |
| POST   | /api/chat   | Chat with AI assistant       |
| GET    | /api/health | Health check & provider status|

## Quick Start

### 1. Install dependencies

```bash
cd api
npm install
```

### 2. Set secrets

```bash
# Optional — HuggingFace (some models work without key)
wrangler secret put HF_API_KEY

# Optional — 0G Router (for better quality, requires API key)
wrangler secret put OG_API_KEY
```

### 3. Deploy

```bash
npm run deploy
```

### 4. Local development

```bash
npm run dev
# Starts on http://localhost:8787
```

## API Usage

### POST /api/score

```bash
curl -X POST https://your-worker.workers.dev/api/score \
  -H "Content-Type: application/json" \
  -d '{"project": "0G Protocol - Decentralized AI infrastructure, EVM L1, backed by Hack VC"}'
```

**Response:**
```json
{
  "score": 9.2,
  "badge": "S-TIER",
  "confidence": "high",
  "airdrop_probability": "very likely",
  "analysis": "0G Protocol is building decentralized AI infrastructure...",
  "signals": ["No token yet", "Strong VC backing", "Active testnet"],
  "risks": ["Competitive landscape", "Timeline uncertainty"],
  "project": "0G Protocol",
  "provider": "huggingface",
  "timestamp": "2026-06-20T..."
}
```

### POST /api/chat

```bash
curl -X POST https://your-worker.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the hottest airdrops right now?"}'
```

## Providers

The worker tries providers in order:

1. **0G Router** (`router-api.0g.ai`) — Uses `zai-org/GLM-5-FP8`, requires `OG_API_KEY`
2. **Hugging Face** (`api-inference.huggingface.co`) — Uses `Mistral-7B-Instruct-v0.3`, works without key on some models

## Rate Limits

- 20 requests per minute per IP (in-memory, resets on worker cold start)
- Cloudflare free tier: 100,000 requests/day

## Configuration

Edit `wrangler.toml` to change:
- `ALLOWED_ORIGINS` — Comma-separated list of allowed CORS origins
- `HF_MODEL` — HuggingFace model to use
- `OG_MODEL` — 0G Router model to use
