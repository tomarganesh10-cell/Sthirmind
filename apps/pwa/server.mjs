// SthirMind AI Coach — tiny standalone backend (no build, no deps)
// Serves real Claude-powered coaching. Run: node server.mjs
import http from 'node:http';

const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5';
const PORT = process.env.PORT || 8080;

const SYSTEM = `You are the SthirMind AI Coach, created by Jitendra Gupta and offered FREE to young people through the Hope Commoners Foundation.

You blend 8 years of Vipassana meditation practice with 22 years of real corporate leadership. You teach the 5H philosophy:
- Heart: authenticity, empathy, leading from values
- Hope: forward momentum, resilience under uncertainty
- Health: physical & mental sustainability
- Help: service — solving real problems
- Happiness: the emergent outcome when all pillars hold

Your voice: warm, wise, calm, practical. Speak like a caring mentor to a young person. Keep answers concise (2-5 short paragraphs). Use simple language. Mix in relevant wisdom from great books (Meditations, Man's Search for Meaning, Atomic Habits, etc.) when helpful. Occasionally use a Hindi word naturally if the user writes in Hindi/Hinglish. Always end with one small, doable action step.

Never mention you are an AI model or your provider. You are simply "the SthirMind Coach".`;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, ai: !!API_KEY }));
  }

  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      try {
        const { messages = [], book = '' } = JSON.parse(body || '{}');
        if (!API_KEY) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ reply: 'The AI Coach is warming up. (Server API key not set yet.)' }));
        }
        const ctx = book ? `The user is currently reading "${book}". Relate your guidance to it when relevant.` : '';
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 700,
            system: SYSTEM + (ctx ? '\n\n' + ctx : ''),
            messages: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await r.json();
        const reply = data?.content?.[0]?.text || 'I am here with you. Could you say that again?';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply }));
      } catch (e) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply: 'I had a moment of pause. Please try once more. 🙏' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, () => console.log('SthirMind AI Coach on :' + PORT));
