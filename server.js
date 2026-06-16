const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve static frontend files from this directory
app.use(express.static(__dirname));

// ═══════════════════════════════════════════════════════════════
// Helper: Call a single model and return its response as a promise
// ═══════════════════════════════════════════════════════════════

function callOllama(model, prompt, systemInstruction, format) {
  return new Promise((resolve, reject) => {
    const ollamaBody = { model, prompt, system: systemInstruction, stream: false };
    if (format) ollamaBody.format = format;
    const payload = JSON.stringify(ollamaBody);

    const options = {
      hostname: '127.0.0.1', port: 11434, path: '/api/generate', method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) }
    };

    const request = http.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (apiRes.statusCode >= 400) reject(new Error(parsed.error || 'Ollama Error'));
          else resolve(parsed.response);
        } catch (e) { reject(new Error('Failed to parse Ollama response for model: ' + model)); }
      });
    });
    request.on('error', err => reject(err));
    request.write(payload);
    request.end();
  });
}

function callGemini(apiKey, model, prompt, systemInstruction) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com', port: 443,
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) }
    };

    const request = https.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (apiRes.statusCode >= 400) reject(new Error(parsed.error?.message || 'Gemini Error'));
          else resolve(parsed.candidates[0].content.parts[0].text);
        } catch (e) { reject(new Error('Failed to parse Gemini response')); }
      });
    });
    request.on('error', err => reject(err));
    request.write(payload);
    request.end();
  });
}

// ═══════════════════════════════════════════════════════════════
// Single-model endpoint (existing)
// ═══════════════════════════════════════════════════════════════

app.post('/api/generate', async (req, res) => {
  const { provider, prompt, systemInstruction, apiKey, modelName } = req.body;

  try {
    if (provider === 'ollama') {
      const model = modelName || 'qwen2.5-coder';
      const text = await callOllama(model, prompt, systemInstruction, req.body.format);
      res.json({ text });
    } else {
      if (!apiKey) return res.status(400).json({ error: 'API Key is required for Gemini' });
      const geminiModel = req.body.geminiModel || 'gemini-2.5-flash';
      const text = await callGemini(apiKey, geminiModel, prompt, systemInstruction);
      res.json({ text });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🔥 ENSEMBLE endpoint — calls multiple models in parallel
// Returns all responses + metadata for client-side judging
// ═══════════════════════════════════════════════════════════════

app.post('/api/ensemble', async (req, res) => {
  const { prompt, systemInstruction, apiKey, models } = req.body;
  // models = [{ provider: 'ollama'|'gemini', model: 'qwen2.5-coder', label: 'Qwen 7B' }, ...]

  if (!models || !models.length) {
    return res.status(400).json({ error: 'No models specified for ensemble' });
  }

  const promises = models.map(m => {
    const t0 = Date.now();
    let p;

    if (m.provider === 'ollama') {
      p = callOllama(m.model, prompt, systemInstruction, req.body.format);
    } else if (m.provider === 'gemini') {
      if (!apiKey) return Promise.resolve({ model: m.model, label: m.label || m.model, error: 'No API key', ms: 0 });
      p = callGemini(apiKey, m.model || 'gemini-2.5-flash', prompt, systemInstruction);
    } else {
      return Promise.resolve({ model: m.model, label: m.label || m.model, error: 'Unknown provider', ms: 0 });
    }

    return p
      .then(text => ({ model: m.model, label: m.label || m.model, provider: m.provider, text, ms: Date.now() - t0 }))
      .catch(err => ({ model: m.model, label: m.label || m.model, provider: m.provider, error: err.message, ms: Date.now() - t0 }));
  });

  try {
    const results = await Promise.all(promises);
    const successful = results.filter(r => r.text && !r.error);
    const failed = results.filter(r => r.error);

    res.json({
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      results,
      // Pre-pick the fastest successful response as default
      fastest: successful.length ? successful.reduce((a, b) => a.ms < b.ms ? a : b) : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Ensemble failed: ' + err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// List available Ollama models
// ═══════════════════════════════════════════════════════════════

app.get('/api/ollama-models', (req, res) => {
  const options = {
    hostname: '127.0.0.1', port: 11434, path: '/api/tags', method: 'GET', timeout: 3000
  };

  const request = http.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const models = (parsed.models || []).map(m => ({
          name: m.name,
          size: m.size,
          modified: m.modified_at
        }));
        res.json({ models });
      } catch (e) {
        res.json({ models: [] });
      }
    });
  });
  request.on('error', () => res.json({ models: [] }));
  request.on('timeout', () => { request.destroy(); res.json({ models: [] }); });
  request.end();
});

// ═══════════════════════════════════════════════════════════════
// Ollama status check
// ═══════════════════════════════════════════════════════════════

app.get('/api/ollama-status', (req, res) => {
  const options = {
    hostname: '127.0.0.1', port: 11434, path: '/', method: 'GET', timeout: 1000
  };

  let responded = false;
  const sendResponse = (online) => {
    if (responded) return;
    responded = true;
    res.json({ online });
  };

  const request = http.request(options, (apiRes) => {
    sendResponse(apiRes.statusCode === 200);
  });
  request.on('error', () => sendResponse(false));
  request.on('timeout', () => { request.destroy(); sendResponse(false); });
  request.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 NAP Local Server running at http://localhost:${PORT}`);
});
