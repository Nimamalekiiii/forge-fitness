// Forge AI server — keeps your API key off the phone.
// Zero dependencies (Node 20.6+). Fill in server/.env, then run:  node --env-file=.env index.mjs
// Then set EXPO_PUBLIC_AI_URL=http://<your-computer-ip>:8787 in the app's .env
// (or paste the URL in Profile → AI settings).
import http from 'node:http';

const PORT = process.env.PORT || 8787;
const KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_MODEL;
const API_URL = process.env.AI_API_URL;

if (!KEY || !MODEL || !API_URL) {
  console.error('Missing AI_API_KEY, AI_MODEL or AI_API_URL (see server/.env.example)');
  process.exit(1);
}

async function askModel(messages, system, maxTokens = 1024) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content.filter((c) => c.type === 'text').map((c) => c.text).join('');
}

const extractJson = (text) => {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No JSON in model reply');
  return JSON.parse(m[0]);
};

const SCAN_SYSTEM = `You are a nutrition analyst. Identify the foods in the photo and estimate portion sizes in grams from visual cues (plate size, utensils).
Return ONLY JSON: {"name": string (short dish name), "emoji": string, "confidence": number 0-1,
"items": [{"name": string, "grams": number, "kcal": number, "protein": number, "carbs": number, "fat": number}]}.
Use realistic values for cooked foods. If no food is visible, return {"name":"No food detected","confidence":0,"items":[]}.`;

const COACH_SYSTEM = `You are Forge, an evidence-based AI fitness and nutrition coach inside a mobile app.
You get the user's question plus a JSON snapshot of their profile, targets, today's intake, recovery and recent training.
Answer in at most 120 words, concrete and personal, using their numbers. Reply in the same language as the question.
Never give medical diagnoses; suggest a professional for injuries, pain or medical conditions.`;

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString() || '{}');
}

const send = (res, code, obj) => {
  res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
  res.end(JSON.stringify(obj));
};

http
  .createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') return send(res, 204, {});
      if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true, model: MODEL });

      if (req.method === 'POST' && req.url === '/scan-food') {
        const { image, mediaType = 'image/jpeg' } = await readBody(req);
        const text = await askModel(
          [
            {
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
                { type: 'text', text: 'Analyse this meal.' },
              ],
            },
          ],
          SCAN_SYSTEM
        );
        return send(res, 200, extractJson(text));
      }

      if (req.method === 'POST' && req.url === '/coach') {
        const { question, context } = await readBody(req);
        const reply = await askModel(
          [{ role: 'user', content: `User data:\n${JSON.stringify(context)}\n\nQuestion: ${question}` }],
          COACH_SYSTEM,
          600
        );
        return send(res, 200, { reply });
      }

      send(res, 404, { error: 'Not found' });
    } catch (e) {
      console.error(e);
      send(res, 500, { error: String(e.message || e) });
    }
  })
  .listen(PORT, () => console.log(`Forge AI server on http://localhost:${PORT} (model ${MODEL})`));
