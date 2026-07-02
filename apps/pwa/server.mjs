// SthirMind backend — accounts + data + AI. No deps, no build.
// Persists to /data/db.json (mount a volume). Run: node server.mjs
import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';

const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const GROQ_KEY = process.env.GROQ_API_KEY || '';
const PORT = process.env.PORT || 8080;
const SECRET = process.env.APP_SECRET || 'sthirmind-hope-secret-change-me';
const DB_FILE = process.env.DB_FILE || '/data/db.json';

// ── tiny file DB ──────────────────────────────────────────────
function load() { try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch { return { users: {} }; } }
function save(db) { try { fs.mkdirSync('/data', { recursive: true }); } catch {} fs.writeFileSync(DB_FILE, JSON.stringify(db)); }
let db = load();

// ── auth helpers ──────────────────────────────────────────────
function hashPw(pw, salt) { salt = salt || crypto.randomBytes(16).toString('hex'); const h = crypto.scryptSync(pw, salt, 64).toString('hex'); return salt + ':' + h; }
function checkPw(pw, stored) { const [salt, h] = stored.split(':'); const test = crypto.scryptSync(pw, salt, 64).toString('hex'); return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(test)); }
function sign(uid) { const body = uid + '.' + Date.now(); const sig = crypto.createHmac('sha256', SECRET).update(body).digest('hex'); return Buffer.from(body).toString('base64url') + '.' + sig; }
function verify(token) { try { const [b64, sig] = token.split('.'); const body = Buffer.from(b64, 'base64url').toString(); const good = crypto.createHmac('sha256', SECRET).update(body).digest('hex'); if (good !== sig) return null; return body.split('.')[0]; } catch { return null; } }
function publicUser(u) { return { id: u.id, name: u.name, email: u.email, phone: u.phone, data: u.data || {} }; }

const SYSTEM = `You are the SthirMind AI Coach, created by Jitendra Gupta and offered FREE to young people through the Hope Commoners Foundation.
You blend 8 years of Vipassana meditation with 22 years of leadership. You teach the 5H philosophy: Heart (empathy, values), Hope (resilience, purpose), Health (body & mind), Help (service), Happiness (the emergent outcome).
Voice: warm, wise, calm, practical — like a caring mentor to a young person. Keep answers concise (2-5 short paragraphs), simple language. Use wisdom from great books when helpful. If the user writes Hindi/Hinglish, reply naturally with some Hindi. Always end with one small doable action step. Never mention being an AI model or your provider. You are simply "the SthirMind Coach".`;

const AGENT_PERSONAS = {
  life: 'Focus on holistic life guidance and balance across all 5H pillars.',
  health: 'Focus on physical & mental health: sleep, movement, breath, energy.',
  purpose: 'Focus on goals, meaning, motivation and building hope/agency.',
  heart: 'Focus on relationships, empathy, love and emotional connection.',
  mind: 'Focus on emotional wellness, stress, anxiety and mindfulness.',
  study: 'Focus on focus, study habits, exams, procrastination for students.',
};

function send(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); }
function body(req) { return new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { try { r(JSON.parse(b || '{}')); } catch { r({}); } }); }); }

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const url = req.url.split('?')[0];
  const auth = () => verify((req.headers.authorization || '').replace('Bearer ', ''));

  try {
    if (url === '/api/health') return send(res, 200, { ok: true, ai: !!API_KEY });

    // ── Signup ──
    if (url === '/api/signup' && req.method === 'POST') {
      const { name, email, phone, password } = await body(req);
      if (!name || !email || !password) return send(res, 400, { error: 'Name, email and password are required.' });
      const key = email.toLowerCase().trim();
      if (Object.values(db.users).find((u) => u.email === key)) return send(res, 409, { error: 'An account with this email already exists. Please log in.' });
      const id = crypto.randomBytes(8).toString('hex');
      const user = { id, name: name.trim(), email: key, phone: (phone || '').trim(), pw: hashPw(password), data: {}, created: Date.now() };
      db.users[id] = user; save(db);
      return send(res, 200, { token: sign(id), user: publicUser(user) });
    }

    // ── Login ──
    if (url === '/api/login' && req.method === 'POST') {
      const { email, password } = await body(req);
      const key = (email || '').toLowerCase().trim();
      const user = Object.values(db.users).find((u) => u.email === key);
      if (!user || !checkPw(password || '', user.pw)) return send(res, 401, { error: 'Wrong email or password.' });
      return send(res, 200, { token: sign(user.id), user: publicUser(user) });
    }

    // ── Me (load) ──
    if (url === '/api/me' && req.method === 'GET') {
      const uid = auth(); if (!uid || !db.users[uid]) return send(res, 401, { error: 'Not logged in' });
      return send(res, 200, { user: publicUser(db.users[uid]) });
    }

    // ── Sync (save data) ──
    if (url === '/api/sync' && req.method === 'POST') {
      const uid = auth(); if (!uid || !db.users[uid]) return send(res, 401, { error: 'Not logged in' });
      const { data } = await body(req);
      db.users[uid].data = data || {}; save(db);
      return send(res, 200, { ok: true });
    }

    // ── AI Chat (Anthropic → Gemini → Groq, whichever key exists) ──
    if (url === '/api/chat' && req.method === 'POST') {
      const { messages = [], book = '', agent = 'life' } = await body(req);
      const persona = AGENT_PERSONAS[agent] || AGENT_PERSONAS.life;
      const sys = SYSTEM + '\n\n' + (book ? `The user is reading "${book}". Relate guidance to it.\n` : '') + persona;
      const hist = messages.slice(-10);
      let reply = '';

      if (API_KEY) {
        try {
          const r = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: MODEL, max_tokens: 700, system: sys, messages: hist }),
          });
          const data = await r.json();
          reply = data?.content?.[0]?.text || '';
        } catch {}
      }

      if (!reply && GEMINI_KEY) {
        try {
          const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: sys }] },
              contents: hist.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
              generationConfig: { maxOutputTokens: 700 },
            }),
          });
          const data = await r.json();
          reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch {}
      }

      if (!reply && GROQ_KEY) {
        try {
          const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: 'Bearer ' + GROQ_KEY },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              max_tokens: 700,
              messages: [{ role: 'system', content: sys }, ...hist],
            }),
          });
          const data = await r.json();
          reply = data?.choices?.[0]?.message?.content || '';
        } catch {}
      }

      if (!reply) return send(res, 200, { reply: 'The AI Coach is warming up. (Server API key not set yet.)' });
      return send(res, 200, { reply });
    }

    send(res, 404, { error: 'not found' });
  } catch (e) {
    send(res, 500, { error: 'Something went wrong. Please try again.' });
  }
});
server.listen(PORT, () => console.log('SthirMind backend on :' + PORT));
