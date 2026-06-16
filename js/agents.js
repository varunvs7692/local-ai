// ================================================================
// NAP Agents v2 — 7 Specialists + PipelineContext + Iterative Loops
// ================================================================
(function () {
  'use strict';

  const { events, utils } = window.Nap;

  /* ─── Agent Definitions ──────────────────────────────────────── */
  const AGENTS = [
    { id: 'planner',   name: 'Planner',   icon: '🧠', role: 'Requirements & structure', color: '#38bdf8' },
    { id: 'architect', name: 'Architect', icon: '🏗️', role: 'System design',            color: '#818cf8' },
    { id: 'coder',     name: 'Coder',     icon: '💻', role: 'Code generation',          color: '#34d399' },
    { id: 'reviewer',  name: 'Reviewer',  icon: '🔍', role: 'Quality audit',            color: '#fbbf24' },
    { id: 'security',  name: 'Security',  icon: '🛡️', role: 'Vulnerability scan',       color: '#fb7185' },
    { id: 'tester',    name: 'Tester',    icon: '🧪', role: 'Test generation',          color: '#22d3ee' },
    { id: 'docs',      name: 'Docs',      icon: '📚', role: 'Documentation',            color: '#c4b5fd' },
  ];

  const MAX_REFINEMENT_ROUNDS = 3;

  /* ═══════════════════════════════════════════════════════════════
     PipelineContext — Shared Memory Across All Agents
     ═══════════════════════════════════════════════════════════════ */
  class PipelineContext {
    constructor(userPrompt) {
      this.userPrompt = userPrompt;
      this.history = [];           // Full conversation log
      this.artifacts = {};         // Named outputs from each agent
      this.decisions = [];         // Key decisions made
      this.errors = [];            // Errors encountered
      this.generatedFiles = {};    // path → code (for dependency-aware gen)
      this.refinementRound = 0;    // Current Coder↔Reviewer round
    }

    addAgentResult(agentId, summary, data) {
      this.history.push({
        agent: agentId,
        timestamp: Date.now(),
        summary: typeof summary === 'string' ? summary.substring(0, 1500) : '',
        data: data
      });
    }

    // Build compressed context for the next agent
    getContextFor(agentId) {
      const sections = [];
      sections.push('## Original User Request\n' + this.userPrompt);

      for (const h of this.history) {
        if (h.agent === agentId) continue; // don't repeat self
        sections.push(`## [${h.agent.toUpperCase()}] Output\n${h.summary}`);
      }

      if (this.decisions.length) {
        sections.push('## Key Decisions\n' + this.decisions.map(d => '• ' + d).join('\n'));
      }

      if (this.errors.length) {
        sections.push('## Known Issues to Fix\n' + this.errors.map(e => '⚠ ' + e).join('\n'));
      }

      return sections.join('\n\n');
    }

    // Get all generated code for dependency-aware generation
    getGeneratedCodeSummary() {
      const entries = Object.entries(this.generatedFiles);
      if (!entries.length) return '(no files generated yet)';
      return entries.map(([path, code]) =>
        `// ═══ ${path} ═══\n${code.substring(0, 2000)}${code.length > 2000 ? '\n// ... (truncated)' : ''}`
      ).join('\n\n');
    }
  }

  /* ─── Pipeline UI helpers ────────────────────────────────────── */
  function renderPipeline() {
    const el = document.getElementById('agent-pipeline');
    el.innerHTML = '';
    AGENTS.forEach((a, i) => {
      const node = document.createElement('div');
      node.className = 'agent-node idle';
      node.id = 'agent-' + a.id;
      node.innerHTML =
        '<div class="agent-dot"></div>' +
        '<div class="agent-info">' +
          '<div class="agent-name">' + a.icon + ' ' + a.name + '</div>' +
          '<div class="agent-role">' + a.role + '</div>' +
        '</div>' +
        '<div class="agent-status">—</div>';
      el.appendChild(node);
      if (i < AGENTS.length - 1) {
        const c = document.createElement('div');
        c.className = 'agent-connector';
        c.id = 'connector-' + i;
        el.appendChild(c);
      }
    });
  }

  function setState(id, state, text) {
    const n = document.getElementById('agent-' + id);
    if (!n) return;
    n.className = 'agent-node ' + state;
    const s = n.querySelector('.agent-status');
    if (s) s.textContent = text || '—';
  }

  function setConn(i, state) {
    const c = document.getElementById('connector-' + i);
    if (c) c.className = 'agent-connector ' + state;
  }

  /* ─── Output helpers ─────────────────────────────────────────── */
  const outEl = () => document.getElementById('agent-output');

  function clearOutput() { const e = outEl(); if (e) e.innerHTML = ''; }

  async function stream(text, label, cls) {
    cls = cls || 'output-text';
    const el = outEl(); if (!el) return;

    const lbl = document.createElement('span');
    lbl.className = 'output-agent-label';
    lbl.textContent = '[' + label + '] ';
    el.appendChild(lbl);

    const span = document.createElement('span');
    span.className = cls;
    el.appendChild(span);

    for (let i = 0; i < text.length; i++) {
      span.textContent += text[i];
      el.scrollTop = el.scrollHeight;
      const ch = text[i];
      await utils.delay(ch === '\n' ? 12 : ch === ' ' ? 2 : 6);
    }
    el.appendChild(document.createElement('br'));
    el.scrollTop = el.scrollHeight;
  }

  async function line(text, cls) {
    const el = outEl(); if (!el) return;
    const s = document.createElement('span');
    s.className = cls || 'output-text';
    s.textContent = text;
    el.appendChild(s);
    el.appendChild(document.createElement('br'));
    el.scrollTop = el.scrollHeight;
  }

  /* ─── Prompt analyser ────────────────────────────────────────── */
  function analyse(prompt) {
    const lo = prompt.toLowerCase();
    const r = { name: '', type: 'static', stack: [], features: [] };
    r.name = prompt.split(/[\s,.!?]+/).filter(w => w.length > 2).slice(0, 3).join('-').toLowerCase();

    if (/interpreter|compiler|parser|ast|debugger|vm/i.test(lo)) { r.type = 'interpreter'; r.stack = ['HTML5 Canvas','Vanilla JS','Algorithms']; }
    else if (/react-native|react.native|mobile|expo|ios|android/i.test(lo)) { r.type = 'reactnative'; r.stack = ['React Native','Expo','StyleSheet']; }
    else if (/react|jsx|component/i.test(lo))            { r.type = 'react';   r.stack = ['React','CSS','Vite']; }
    else if (/express|api|rest|server|backend/i.test(lo)) { r.type = 'express'; r.stack = ['Node.js','Express','REST']; }
    else if (/python|flask|django/i.test(lo))        { r.type = 'flask';   r.stack = ['Python','Flask','Jinja2']; }
    else if (/next\.?js|fullstack|full.stack/i.test(lo)) { r.type = 'nextjs';  r.stack = ['Next.js','React','Prisma']; }
    else if (/cli|command.line|terminal/i.test(lo))  { r.type = 'cli';     r.stack = ['Node.js','Commander']; }
    else                                             { r.type = 'static';  r.stack = ['HTML','CSS','JavaScript']; }

    if (/auth|login|sign.?up/i.test(lo))   r.features.push('authentication');
    if (/database|db|sql|mongo/i.test(lo)) r.features.push('database');
    if (/test|jest|pytest/i.test(lo))      r.features.push('testing');
    if (/deploy|docker|ci/i.test(lo))      r.features.push('deployment');
    return r;
  }

  /* ═══════════════════════════════════════════════════════════════
     API Call Layer — supports Ollama, Gemini, and 🔥 Ensemble mode
     (calls multiple models in parallel, picks best answer)
     ═══════════════════════════════════════════════════════════════ */

  async function callProxyAPI(prompt, systemInstruction, options = {}) {
    const isBrowser = typeof window !== 'undefined' && typeof window.location !== 'undefined';

    let provider = 'simulation';
    let apiKey = '';
    let modelName = 'qwen2.5-coder';

    if (isBrowser) {
      const settings = window.Nap.state.settings || {};
      provider = settings.provider || 'simulation';
      apiKey = settings.apiKey || '';
      modelName = settings.modelName || 'qwen2.5-coder';
    } else {
      provider = process.env.NAP_PROVIDER || 'simulation';
      apiKey = process.env.GEMINI_API_KEY || '';
      modelName = process.env.OLLAMA_MODEL || 'qwen2.5-coder';
    }

    if (provider === 'simulation') return null;

    // ─── ENSEMBLE MODE ────────────────────────────────────────────
    if (provider === 'ensemble' && isBrowser) {
      const ensembleModels = window.Nap.state.settings.ensembleModels || [];
      if (ensembleModels.length === 0) {
        await line('⚠️ No models selected for ensemble. Select models in the config panel.', 'output-warning');
        return null;
      }

      // If only 1 model selected, just call it directly
      if (ensembleModels.length === 1) {
        const m = ensembleModels[0];
        const singleBody = {
          provider: m.provider,
          prompt,
          systemInstruction,
          apiKey,
          modelName: m.model
        };
        if (options.jsonSchema && m.provider === 'ollama') {
          singleBody.format = options.jsonSchema;
        }
        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(singleBody)
          });
          if (!res.ok) throw new Error((await res.json()).error || 'Error');
          return (await res.json()).text;
        } catch (e) {
          await line(`❌ [${m.model}] ${e.message}`, 'output-warning');
          return null;
        }
      }

      // Multiple models: call all in parallel
      await line(`🔥 Ensemble: calling ${ensembleModels.length} models in parallel…`, 'output-warning');

      try {
        const res = await fetch('/api/ensemble', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            systemInstruction,
            apiKey,
            models: ensembleModels,
            format: options.jsonSchema
          })
        });

        if (!res.ok) throw new Error((await res.json()).error || 'Ensemble error');
        const data = await res.json();

        // Show results from each model
        const successful = data.results.filter(r => r.text && !r.error);
        const failed = data.results.filter(r => r.error);

        for (const r of successful) {
          await line(`  ✓ ${r.label} (${(r.ms / 1000).toFixed(1)}s, ${r.text.length} chars)`, 'output-success');
        }
        for (const r of failed) {
          await line(`  ✗ ${r.label}: ${r.error}`, 'output-error');
        }

        if (successful.length === 0) {
          await line('❌ All ensemble models failed.', 'output-error');
          return null;
        }

        if (successful.length === 1) {
          await line(`  → Using only successful response: ${successful[0].label}`, 'output-text');
          return successful[0].text;
        }

        // ─── EVALUATION & CONSENSUS SCORING ──────────────────────
        const isJsonExpected = !!options.jsonSchema || 
          (systemInstruction && systemInstruction.toLowerCase().includes('json')) || 
          (prompt && prompt.toLowerCase().includes('json'));
        const isCodeGeneration = !!options.filePath;

        const candidateScores = successful.map((r, idx) => {
          let score = 50; // base score
          const reasons = [];

          // Syntactic check for JSON
          let parsedJson = null;
          let isValidJson = false;
          if (isJsonExpected) {
            parsedJson = extractJSON(r.text);
            isValidJson = parsedJson !== null;
            if (isValidJson) {
              score += 40;
              reasons.push('+40 valid JSON structure');
            } else {
              score -= 30;
              reasons.push('-30 invalid JSON structure');
            }
          }

          // Code Generation Heuristics (if it's Coder generating a file)
          if (isCodeGeneration) {
            const text = r.text || '';
            const rawCode = cleanCodeBlock(text);

            // 1. Penalize markdown codeblock formatting leak
            if (text.includes('```')) {
              score -= 10;
              reasons.push('-10 leaked markdown formatting');
            }

            // 2. Bracket Balance check (curly, parenthesis, square)
            const openBraces = (rawCode.match(/\{/g) || []).length;
            const closeBraces = (rawCode.match(/\}/g) || []).length;
            const openParens = (rawCode.match(/\(/g) || []).length;
            const closeParens = (rawCode.match(/\)/g) || []).length;
            const openBrackets = (rawCode.match(/\[/g) || []).length;
            const closeBrackets = (rawCode.match(/\]/g) || []).length;

            const braceDiff = Math.abs(openBraces - closeBraces);
            const parenDiff = Math.abs(openParens - closeParens);
            const bracketDiff = Math.abs(openBrackets - closeBrackets);

            if (braceDiff > 0) {
              const penalty = Math.min(braceDiff * 15, 45);
              score -= penalty;
              reasons.push(`-${penalty} unbalanced curly braces ({: ${openBraces}, }: ${closeBraces})`);
            }
            if (parenDiff > 0) {
              const penalty = Math.min(parenDiff * 10, 30);
              score -= penalty;
              reasons.push(`-${penalty} unbalanced parenthesis ((: ${openParens}, ): ${closeParens})`);
            }
            if (bracketDiff > 0) {
              const penalty = Math.min(bracketDiff * 10, 30);
              score -= penalty;
              reasons.push(`-${penalty} unbalanced brackets ([: ${openBrackets}, ]: ${closeBrackets})`);
            }

            // 3. Penalize lazy code/placeholders (e.g., '// ...', '/* TODO */')
            const placeholders = [
              /\/\/\s*\.\.\./i,
              /\/\*\s*\.\.\.\s*\*\//,
              /\/\/\s*todo/i,
              /\/\*\s*todo/i,
              /\/\/\s*rest of/i,
              /\/\*\s*rest of/i,
              /\/\/\s*insert code here/i
            ];

            let hasPlaceholder = false;
            for (const rx of placeholders) {
              if (rx.test(rawCode)) {
                hasPlaceholder = true;
                break;
              }
            }

            if (hasPlaceholder) {
              score -= 50;
              reasons.push('-50 contains lazy code placeholder');
            }

            // 4. Length check
            if (rawCode.trim().length < 100) {
              score -= 20;
              reasons.push('-20 code length extremely short');
            }
          }

          // Length reward
          const lenBonus = Math.min(Math.floor(r.text.length / 800), 10);
          if (lenBonus > 0) {
            score += lenBonus;
            reasons.push(`+${lenBonus} length bonus`);
          }

          return {
            candidateIndex: idx + 1,
            r,
            score,
            parsedJson,
            isValidJson,
            reasons
          };
        });

        // ─── CONSENSUS VOTING ────────────────────────────────────
        if (isJsonExpected) {
          // A. Planner consensus (agreement on planned files)
          const allPlannedFiles = [];
          candidateScores.forEach(c => {
            if (c.isValidJson && c.parsedJson && Array.isArray(c.parsedJson.files)) {
              c.parsedJson.files.forEach(f => {
                if (f && f.path) allPlannedFiles.push(f.path);
              });
            }
          });

          if (allPlannedFiles.length > 0) {
            const fileFreqs = {};
            allPlannedFiles.forEach(f => { fileFreqs[f] = (fileFreqs[f] || 0) + 1; });

            candidateScores.forEach(c => {
              if (c.isValidJson && c.parsedJson && Array.isArray(c.parsedJson.files)) {
                let agreementCount = 0;
                c.parsedJson.files.forEach(f => {
                  if (f && f.path && fileFreqs[f.path] > 1) {
                    agreementCount += fileFreqs[f.path] - 1;
                  }
                });
                if (agreementCount > 0) {
                  const bonus = Math.min(agreementCount * 3, 25);
                  c.score += bonus;
                  c.reasons.push(`+${bonus} file consensus bonus`);
                }
              }
            });
          }

          // B. Reviewer consensus (agreement on rating)
          const ratings = [];
          candidateScores.forEach(c => {
            if (c.isValidJson && c.parsedJson && typeof c.parsedJson.rating === 'string') {
              ratings.push(c.parsedJson.rating.toUpperCase().trim());
            }
          });

          if (ratings.length > 0) {
            const ratingFreqs = {};
            ratings.forEach(rt => { ratingFreqs[rt] = (ratingFreqs[rt] || 0) + 1; });

            let majorityRating = null;
            let maxFreq = 0;
            for (const rt in ratingFreqs) {
              if (ratingFreqs[rt] > maxFreq) {
                maxFreq = ratingFreqs[rt];
                majorityRating = rt;
              }
            }

            if (maxFreq > 1) {
              candidateScores.forEach(c => {
                if (c.isValidJson && c.parsedJson && typeof c.parsedJson.rating === 'string') {
                  if (c.parsedJson.rating.toUpperCase().trim() === majorityRating) {
                    c.score += 20;
                    c.reasons.push(`+20 rating consensus bonus (${majorityRating})`);
                  }
                }
              });
            }
          }
        }

        // Print ranking & metrics
        await line(`📊 Ensemble Evaluation & Scoring:`, 'output-warning');
        for (const c of candidateScores) {
          const reasonStr = c.reasons.join(', ');
          await line(`  • [Candidate ${c.candidateIndex}] ${c.r.label} → Score: ${c.score} (${reasonStr || 'base'})`, 'output-text');
        }

        // Use the fastest model as the judge to compare outputs
        const judgeModel = successful.reduce((a, b) => a.ms < b.ms ? a : b);
        const candidates = candidateScores.map((c) =>
          `=== CANDIDATE ${c.candidateIndex} (${c.r.label}) ===\n[Evaluation Score: ${c.score}]\n[Heuristic Assessment: ${c.reasons.join('; ')}]\n\n${c.r.text.substring(0, 3500)}\n=== END CANDIDATE ${c.candidateIndex} ===`
        ).join('\n\n');

        const judgePrompt = `You are a senior code quality judge. Below are ${successful.length} candidate responses generated by different LLM models for the same prompt.
Your task is to select the absolute best candidate based on:
1. Syntactic validity (valid JSON matching schema if JSON expected, compiling code if code expected)
2. Completeness and production readiness (penalize placeholders, comments replacing actual code, and incomplete lines)
3. Correct logic, safety, and readability.

Below are the candidates, enriched with automated syntax/completeness evaluation scores:
${candidates}

Reply with ONLY the number of the best candidate (e.g. "1" or "2"). Do NOT write any reasoning, explanations, or other text. Just the single digit number.`;

        const bestCandidate = candidateScores.reduce((a, b) => a.score > b.score ? a : b);

        try {
          const judgeRes = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: judgeModel.provider,
              prompt: judgePrompt,
              systemInstruction: 'Reply with only a number. No explanation.',
              apiKey,
              modelName: judgeModel.model
            })
          });

          if (judgeRes.ok) {
            const judgeData = await judgeRes.json();
            const pick = parseInt((judgeData.text || '').trim());
            if (pick >= 1 && pick <= successful.length) {
              const chosen = candidateScores[pick - 1];
              await line(`  🏆 Judge (${judgeModel.label}) selected: CANDIDATE ${pick} (${chosen.r.label}) with score ${chosen.score}`, 'output-success');
              return chosen.r.text;
            }
          }
        } catch (e) {
          // Judge failed, fall through to highest scored
        }

        await line(`  🏆 Selected highest scored candidate: CANDIDATE ${bestCandidate.candidateIndex} (${bestCandidate.r.label}) with score ${bestCandidate.score}`, 'output-success');
        return bestCandidate.r.text;

      } catch (e) {
        await line(`❌ [Ensemble Error] ${e.message}`, 'output-warning');
        return null;
      }
    }

    // ─── SINGLE MODEL MODE ────────────────────────────────────────
    if (!apiKey && provider !== 'ollama') {
      await line(`⚠️ No API key provided for ${provider}. Running in simulation mode.`, 'output-warning');
      return null;
    }

    const body = {
      provider,
      prompt,
      systemInstruction,
      apiKey,
      modelName
    };

    if (options.jsonSchema && provider === 'ollama') {
      body.format = options.jsonSchema;
    }

    if (isBrowser) {
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Server error');
        }
        const data = await res.json();
        return data.text;
      } catch (e) {
        await line(`❌ [Proxy API Error] ${e.message}. Running in simulation mode.`, 'output-warning');
        return null;
      }
    } else {
      // Node CLI execution
      try {
        if (provider === 'ollama') {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          const ollamaBody = {
            model: modelName,
            prompt,
            system: systemInstruction,
            stream: false
          };
          if (options.jsonSchema) ollamaBody.format = options.jsonSchema;

          const res = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ollamaBody),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          const data = await res.json();
          return data.response;
        } else {
          // Gemini (Free Cloud AI)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          const data = await res.json();
          return data.candidates[0].content.parts[0].text;
        }
      } catch (e) {
        await line(`❌ [CLI API Error] ${e.message}. Running in simulation mode.`, 'output-warning');
        return null;
      }
    }
  }

  /* ─── JSON / Code extraction helpers ─────────────────────────── */

  function extractJSON(text) {
    if (!text) return null;
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const candidate = match ? match[1] : text;
    try {
      return JSON.parse(candidate.trim());
    } catch (e) {
      const firstBrace = candidate.indexOf('{');
      const lastBrace = candidate.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          return JSON.parse(candidate.substring(firstBrace, lastBrace + 1).trim());
        } catch (err) {}
      }
      // Try array
      const firstBracket = candidate.indexOf('[');
      const lastBracket = candidate.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        try {
          return JSON.parse(candidate.substring(firstBracket, lastBracket + 1).trim());
        } catch (err) {}
      }
    }
    return null;
  }

  function cleanCodeBlock(text) {
    if (!text) return '';
    let cleaned = text;
    if (cleaned.startsWith('```')) {
      const lines = cleaned.split('\n');
      if (lines[0].startsWith('```')) lines.shift();
      if (lines[lines.length - 1].startsWith('```')) lines.pop();
      cleaned = lines.join('\n');
    }
    return cleaned;
  }

  /* ─── Topological sort for dependency-aware file generation ──── */

  function topoSort(files) {
    // Build adjacency map
    const fileMap = {};
    files.forEach(f => { fileMap[f.path] = f; });

    const visited = new Set();
    const sorted = [];

    function visit(file) {
      if (visited.has(file.path)) return;
      visited.add(file.path);
      if (file.dependencies) {
        file.dependencies.forEach(dep => {
          if (fileMap[dep]) visit(fileMap[dep]);
        });
      }
      sorted.push(file);
    }

    files.forEach(f => visit(f));
    return sorted;
  }

  /* ═══════════════════════════════════════════════════════════════
     Agent Processors — Now with Chain-of-Thought & Context
     ═══════════════════════════════════════════════════════════════ */

  // ──────────────────────── PLANNER (2-phase: think → extract) ──
  async function plannerRun(prompt, a, ctx) {
    // Phase 1: Let the model THINK deeply (chain-of-thought)
    const thinkSystem = `You are a senior software architect and project planner. Think step by step about the user's request. Consider:
1. What files are needed and why
2. What dependencies exist between files (which file imports from which)
3. What the correct build/generation order should be
4. What edge cases, error handling, and best practices to apply
5. What the ideal tech stack and patterns are for this type of project

Be thorough. Think through architecture decisions before committing.`;

    const thinkPrompt = `User request: "${prompt}"
Project type detected: ${a.type}
Stack: ${a.stack.join(', ')}
Features requested: ${a.features.length ? a.features.join(', ') : 'core functionality'}

Think through the entire project plan step by step.`;

    const thinking = await callProxyAPI(thinkPrompt, thinkSystem);

    if (thinking) {
      // Phase 2: Extract structured plan from the thinking
      const extractSystem = `Based on your analysis, output a JSON object with this exact structure:
{
  "files": [
    {
      "path": "string — file path like src/App.jsx",
      "explanation": "string — what this file does",
      "dependencies": ["string — paths of files this imports from"]
    }
  ],
  "decisions": ["string — key architectural decisions made"],
  "stack": ["string — technologies chosen"]
}
Output ONLY valid JSON wrapped in a codeblock. No other text.`;

      const extractPrompt = `Here is your detailed analysis:\n\n${thinking}\n\nNow convert this into the structured JSON plan.`;
      const planRaw = await callProxyAPI(extractPrompt, extractSystem);

      try {
        const plan = extractJSON(planRaw);
        if (!plan || !plan.files) throw new Error('Invalid plan JSON');

        // Store in context
        ctx.artifacts.plan = plan;
        ctx.artifacts.thinking = thinking;
        if (plan.decisions) ctx.decisions = plan.decisions;
        ctx.addAgentResult('planner', thinking.substring(0, 1500), plan);

        const fileList = plan.files.map(f =>
          `${f.path} (${f.explanation})${f.dependencies && f.dependencies.length ? ' ← depends on: ' + f.dependencies.join(', ') : ''}`
        ).join('\n│   ├── ');

        await stream(
          '📋 Project Analysis (AI — Chain-of-Thought)\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Project: ' + a.name + '\n' +
          'Type: ' + a.type + '\n' +
          'Stack: ' + (plan.stack || a.stack).join(', ') + '\n\n' +
          '🧠 Thinking Excerpt:\n' + thinking.substring(0, 400) + '…\n\n' +
          '📁 Planned Structure:\n│   ├── ' + fileList + '\n\n' +
          (plan.decisions ? '🎯 Key Decisions:\n' + plan.decisions.map(d => '• ' + d).join('\n') + '\n\n' : '') +
          '✓ Planning complete (' + plan.files.length + ' files planned)',
          'Planner'
        );
        return;
      } catch (e) {
        await line('⚠️ Planner: failed to parse AI plan. Falling back to template.', 'output-warning');
      }
    }

    // ── Fallback: template-based plan ──
    const tpl = window.Nap.templates ? window.Nap.templates.getTemplate(a.type) : null;
    const fileList = tpl
      ? tpl.files.map(f => f.path).join('\n│   ├── ')
      : 'index.html\n│   ├── css/style.css\n│   ├── js/main.js';

    ctx.addAgentResult('planner', 'Template-based plan for ' + a.type, { files: tpl ? tpl.files.map(f => ({ path: f.path, explanation: 'scaffold' })) : [] });

    await stream(
      '📋 Project Analysis\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      'Project: ' + a.name + '\n' +
      'Type: ' + a.type + '\n' +
      'Stack: ' + a.stack.join(', ') + '\n' +
      'Features: ' + (a.features.length ? a.features.join(', ') : 'core functionality') + '\n\n' +
      '📁 Planned Structure:\n│   ├── ' + fileList + '\n\n' +
      '🎯 Key Decisions:\n' +
      '• ' + a.stack[0] + ' as the primary framework\n' +
      '• Modular architecture for maintainability\n' +
      '• Clean separation of concerns\n' +
      '• Production-ready error handling\n\n' +
      '✓ Planning complete',
      'Planner'
    );
  }

  // ──────────────────────── ARCHITECT (context-aware) ────────────
  async function architectRun(prompt, a, ctx) {
    const contextSummary = ctx.getContextFor('architect');
    const system = `You are the Architect agent. You have access to the Planner's analysis. Design the system architecture, patterns, module boundaries, and data flow. Draw an ASCII system diagram. Be specific about how modules connect.`;
    const fullPrompt = contextSummary + '\n\nDesign the architecture for this project. Include a system diagram.';

    const aiResponse = await callProxyAPI(fullPrompt, system);
    if (aiResponse) {
      ctx.addAgentResult('architect', aiResponse.substring(0, 1500), { architecture: aiResponse });
      ctx.artifacts.architecture = aiResponse;

      await stream(
        '🏗️ Architecture Design (AI — Context-Aware)\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        aiResponse + '\n\n' +
        '✓ Architecture defined',
        'Architect'
      );
      return;
    }

    // Fallback
    const diagrams = {
      react:
        '\n┌─────────────────────────────────┐\n' +
        '│           App Shell             │\n' +
        '├──────────┬──────────┬───────────┤\n' +
        '│  Header  │  Main    │  Sidebar  │\n' +
        '│          │ Content  │           │\n' +
        '├──────────┴──────────┴───────────┤\n' +
        '│        State (Hooks)            │\n' +
        '├─────────────────────────────────┤\n' +
        '│       Utils / Services          │\n' +
        '└─────────────────────────────────┘',
      express:
        '\n┌──────────────┐     ┌──────────────┐\n' +
        '│   Client     │────▶│   Express    │\n' +
        '│  (Frontend)  │◀────│   Server     │\n' +
        '└──────────────┘     ├──────────────┤\n' +
        '                     │  Middleware   │\n' +
        '                     ├──────────────┤\n' +
        '                     │   Routes     │\n' +
        '                     ├──────┬───────┤\n' +
        '                     │ Ctrl │ Model │\n' +
        '                     └──────┴───────┘',
      flask:
        '\n┌──────────────┐     ┌──────────────┐\n' +
        '│   Browser    │────▶│    Flask     │\n' +
        '│              │◀────│   Server     │\n' +
        '└──────────────┘     ├──────────────┤\n' +
        '                     │  Blueprints  │\n' +
        '                     ├──────────────┤\n' +
        '                     │  Templates   │\n' +
        '                     ├──────────────┤\n' +
        '                     │   Models     │\n' +
        '                     └──────────────┘',
    };
    const d = diagrams[a.type] || diagrams.react;

    ctx.addAgentResult('architect', 'Template architecture for ' + a.type, {});

    await stream(
      '🏗️ Architecture Design\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      'Pattern: ' + (a.type === 'express' ? 'MVC' : 'Component-based') + '\n' +
      'Data Flow: ' + (a.type === 'express'
        ? 'Request → Middleware → Route → Controller → Response'
        : 'Unidirectional (props down, events up)') + '\n\n' +
      '📐 System Diagram:' + d + '\n\n' +
      '🔗 Dependencies:\n' + a.stack.map(s => '• ' + s).join('\n') + '\n\n' +
      '📦 Module Boundaries:\n' +
      '• Core — entry point & configuration\n' +
      '• Components — reusable UI / logic\n' +
      '• Services — data & business logic\n' +
      '• Utils — shared helpers\n\n' +
      '✓ Architecture defined',
      'Architect'
    );
  }

  // ──────────────────────── CODER (dependency-aware, context-fed) ──
  async function coderRun(prompt, a, ctx, templateId) {
    const plan = ctx.artifacts.plan;
    const isRefinement = ctx.refinementRound > 0;

    // AI path: generate files in dependency order
    if (plan && plan.files && plan.files.length > 0) {
      const sorted = topoSort(plan.files);

      if (isRefinement) {
        await stream(`💻 Refinement Round ${ctx.refinementRound}: Fixing issues from Reviewer…`, 'Coder');
      } else {
        await stream('💻 Generating ' + sorted.length + ' files (AI — Dependency-Aware)…', 'Coder');
      }

      const fs = window.Nap.fs;

      for (const file of sorted) {
        // Build context: architecture + previously generated files
        const prevCode = ctx.getGeneratedCodeSummary();
        const archContext = ctx.artifacts.architecture ? ctx.artifacts.architecture.substring(0, 800) : '';

        let system;
        if (isRefinement && ctx.artifacts.reviewIssues) {
          // Refinement mode: fix specific issues
          const issuesForFile = (ctx.artifacts.reviewIssues || [])
            .filter(i => i.file === file.path || i.file === '*')
            .map(i => '• ' + i.message)
            .join('\n');

          system = `You are the Coder agent (REFINEMENT ROUND ${ctx.refinementRound}).
You are fixing issues found by the Reviewer in: ${file.path}

Issues to fix:
${issuesForFile || '• General quality improvements'}

Architecture context:
${archContext}

Previously generated files (use consistent interfaces):
${prevCode}

Output ONLY the complete, corrected file contents. No markdown code blocks, no descriptions.`;
        } else {
          system = `You are the Coder agent. Write the complete, production-quality code for: ${file.path}
Purpose: ${file.explanation}

Architecture context:
${archContext}

Previously generated files in this project (you MUST use consistent imports, interfaces, and naming):
${prevCode}

Requirements:
• Write clean, well-commented, production-ready code
• Use proper error handling
• Follow the architecture decisions from the Architect
• Ensure imports match the actual file paths and exports of other files

Output ONLY the raw file contents. No markdown code blocks, no descriptions, no warnings.`;
        }

        const filePrompt = `Project: ${prompt}\nFile to generate: ${file.path} (${file.explanation})`;
        const aiResponse = await callProxyAPI(filePrompt, system, { filePath: file.path });

        if (aiResponse) {
          const cleanedCode = cleanCodeBlock(aiResponse);
          fs.createFile(file.path, cleanedCode);
          ctx.generatedFiles[file.path] = cleanedCode;
          await line('  ✓ ' + file.path + ' (' + cleanedCode.split('\n').length + ' lines)', 'output-success');
        } else {
          await line('  ✗ Failed to generate: ' + file.path, 'output-error');
          ctx.errors.push('Failed to generate ' + file.path);
        }
        await utils.delay(80);
      }

      ctx.addAgentResult('coder', `Generated ${sorted.length} files (round ${ctx.refinementRound})`, Object.keys(ctx.generatedFiles));
      await line('✓ All files generated' + (isRefinement ? ` (round ${ctx.refinementRound + 1})` : ''), 'output-success');
      return;
    }

    // Fallback: template
    const fs  = window.Nap.fs;
    const tpl = window.Nap.templates
      ? window.Nap.templates.getTemplate(templateId || a.type)
      : null;

    if (tpl) {
      await stream('💻 Generating ' + tpl.files.length + ' files…', 'Coder');
      for (const f of tpl.files) {
        fs.createFile(f.path, f.content, f.language);
        ctx.generatedFiles[f.path] = f.content;
        await line('  ✓ ' + f.path, 'output-success');
        await utils.delay(120);
      }
      ctx.addAgentResult('coder', `Template: ${tpl.files.length} files`, tpl.files.map(f => f.path));
      await line('✓ All ' + tpl.files.length + ' files generated', 'output-success');
    } else {
      const defaultFiles = {
        'index.html':
          '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>' +
          a.name + '</title>\n  <link rel="stylesheet" href="css/style.css">\n</head>\n<body>\n  <h1>' +
          a.name + '</h1>\n  <script src="js/main.js"><\/script>\n</body>\n</html>',
        'css/style.css':
          '* { margin:0; padding:0; box-sizing:border-box; }\nbody { font-family:system-ui,sans-serif; padding:2rem; }\nh1 { margin-bottom:1rem; }',
        'js/main.js':
          "document.addEventListener('DOMContentLoaded', () => {\n  console.log('" + a.name + " loaded');\n});"
      };

      for (const [path, content] of Object.entries(defaultFiles)) {
        fs.createFile(path, content);
        ctx.generatedFiles[path] = content;
      }

      ctx.addAgentResult('coder', 'Fallback scaffold: 3 files', Object.keys(defaultFiles));
      await stream('💻 Generated 3 files (fallback scaffold)', 'Coder');
      for (const p of Object.keys(defaultFiles)) {
        await line('  ✓ ' + p, 'output-success');
      }
    }
  }

  // ──────────────────────── REVIEWER (returns structured issues) ──
  async function reviewerRun(ctx) {
    const fs = window.Nap.fs;
    const files = fs.listFiles();
    const fileContents = files.map(p => `File: ${p}\n---\n${fs.readFile(p)}\n---`).join('\n\n');

    const contextSummary = ctx ? ctx.getContextFor('reviewer') : '';
    const system = `You are the Reviewer agent. You have context from the Planner and Architect.
Perform a thorough code quality review. Check for:
1. Broken imports / mismatched interfaces between files
2. Missing error handling
3. Code style issues (var vs const/let, naming conventions)
4. Logic bugs or edge cases
5. Missing accessibility or security practices

Output a JSON object:
{
  "rating": "A" | "A-" | "B+" | "B" | "C",
  "issues": [{ "file": "path", "type": "error" | "warning" | "info", "line": 0, "message": "description" }],
  "summary": "brief overall assessment"
}
Output ONLY valid JSON wrapped in a codeblock.`;

    const fullPrompt = contextSummary + '\n\nReview these files:\n\n' + fileContents;
    const aiResponse = await callProxyAPI(fullPrompt, system);

    let reviewResult = null;

    if (aiResponse) {
      try {
        reviewResult = extractJSON(aiResponse);
        if (!reviewResult) throw new Error('Invalid review JSON');

        // Store issues in context for the Coder feedback loop
        if (ctx) {
          ctx.artifacts.reviewIssues = reviewResult.issues || [];
          ctx.artifacts.reviewRating = reviewResult.rating;
          ctx.addAgentResult('reviewer', `Rating: ${reviewResult.rating}, Issues: ${(reviewResult.issues || []).length}`, reviewResult);
        }

        let txt = '🔍 Code Review (AI — Deep Analysis)\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Files reviewed: ' + files.length + '\n' +
          'Overall rating: ' + reviewResult.rating + '\n';

        if (reviewResult.summary) txt += 'Summary: ' + reviewResult.summary + '\n';
        txt += '\n';

        if (!reviewResult.issues || reviewResult.issues.length === 0) {
          txt += '✓ No issues — code looks clean!';
        } else {
          const iconMap = { error: '🔴', warning: '⚠️', info: 'ℹ️' };
          txt += `Found ${reviewResult.issues.length} note(s):\n`;
          reviewResult.issues.forEach(i => {
            txt += `${iconMap[i.type] || '⚠️'} ${i.file}: ${i.message}\n`;
          });
        }
        txt += '\n\n✓ Review complete';
        await stream(txt, 'Reviewer');
        return reviewResult;
      } catch(e) {
        await line('⚠️ Reviewer: could not parse AI response. Using static analysis.', 'output-warning');
      }
    }

    // Fallback: static analysis
    const issues = [];
    files.forEach(p => {
      const c = fs.readFile(p); if (!c) return;
      if (c.length > 5000)              issues.push({ file: p, type: 'warning', message: 'Large file — consider splitting' });
      if (/console\.log/.test(c))       issues.push({ file: p, type: 'info', message: 'Contains console.log' });
      if (/TODO|FIXME|HACK/.test(c))    issues.push({ file: p, type: 'info', message: 'Has TODO / FIXME comments' });
      if (/\bvar\s/.test(c) && /\.js$/.test(p)) issues.push({ file: p, type: 'warning', message: 'Uses var — prefer const / let' });
    });

    const score = issues.length === 0 ? 'A' : issues.length <= 2 ? 'A-' : issues.length <= 5 ? 'B+' : 'B';
    reviewResult = { rating: score, issues, summary: 'Static analysis complete' };

    if (ctx) {
      ctx.artifacts.reviewIssues = issues;
      ctx.artifacts.reviewRating = score;
      ctx.addAgentResult('reviewer', `Rating: ${score}, Issues: ${issues.length}`, reviewResult);
    }

    let txt = '🔍 Code Review\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      'Files reviewed: ' + files.length + '\n' +
      'Overall rating: ' + score + '\n\n';

    if (issues.length === 0) {
      txt += '✓ No issues — code looks clean!';
    } else {
      txt += 'Found ' + issues.length + ' note(s):\n';
      issues.forEach(i => { txt += '⚠ ' + i.file + ': ' + i.message + '\n'; });
    }
    txt += '\n\n✓ Review complete';
    await stream(txt, 'Reviewer');
    return reviewResult;
  }

  // ──────────────────────── SECURITY (context-aware) ─────────────
  async function securityRun(ctx) {
    const fs = window.Nap.fs;
    const files = fs.listFiles();
    const fileContents = files.map(p => `File: ${p}\n---\n${fs.readFile(p)}\n---`).join('\n\n');

    const contextSummary = ctx ? ctx.getContextFor('security') : '';
    const system = `You are the Security agent. You have full context of the project.
Perform a deep security vulnerability audit. Check for:
1. XSS (innerHTML, dangerouslySetInnerHTML, unsanitized user input)
2. Injection attacks (eval, SQL injection, command injection)
3. Hardcoded secrets/credentials
4. Insecure HTTP usage
5. Missing CSRF protection
6. Insecure dependencies
7. Authentication/authorization flaws

Output a JSON object:
{ "findings": [{ "file": "path", "severity": "HIGH" | "MEDIUM" | "LOW", "category": "XSS" | "INJECTION" | "SECRETS" | "OTHER", "message": "description", "fix": "how to fix" }] }
Output ONLY valid JSON wrapped in a codeblock.`;

    const fullPrompt = contextSummary + '\n\nAudit these files:\n\n' + fileContents;
    const aiResponse = await callProxyAPI(fullPrompt, system);

    if (aiResponse) {
      try {
        const audit = extractJSON(aiResponse);
        if (!audit) throw new Error('Invalid audit JSON');

        if (ctx) ctx.addAgentResult('security', `Findings: ${(audit.findings || []).length}`, audit);

        let txt = '🛡️ Security Audit (AI — Deep Scan)\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Files scanned: ' + files.length + '\n' +
          'Findings: ' + (audit.findings || []).length + '\n\n';

        if (!audit.findings || audit.findings.length === 0) {
          txt += '✓ No vulnerabilities detected';
        } else {
          const icon = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🔵' };
          audit.findings.forEach(h => {
            txt += `${icon[h.severity] || '⚠️'} [${h.severity}] ${h.file}\n   ${h.message}\n`;
            if (h.fix) txt += `   💡 Fix: ${h.fix}\n`;
            txt += '\n';
          });
        }
        txt += '✓ Security audit complete';
        await stream(txt, 'Security');
        return;
      } catch(e) {}
    }

    // Fallback: static analysis
    const hits = [];
    files.forEach(p => {
      const c = fs.readFile(p); if (!c) return;
      if (/eval\s*\(/.test(c))                    hits.push({ p, s: 'HIGH',   m: 'eval() — code injection risk' });
      if (/innerHTML\s*=/.test(c))                 hits.push({ p, s: 'MEDIUM', m: 'innerHTML — potential XSS' });
      if (/(password|secret|api.?key)\s*[:=]\s*['"][^'"]+/i.test(c))
                                                    hits.push({ p, s: 'HIGH',   m: 'Hardcoded credentials' });
      if (/http:\/\/(?!localhost)/.test(c))         hits.push({ p, s: 'LOW',    m: 'HTTP instead of HTTPS' });
    });

    if (ctx) ctx.addAgentResult('security', `Findings: ${hits.length}`, hits);

    let txt = '🛡️ Security Audit\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      'Files scanned: ' + files.length + '\n' +
      'Findings: ' + hits.length + '\n\n';

    if (hits.length === 0) {
      txt += '✓ No vulnerabilities detected';
    } else {
      const icon = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🔵' };
      hits.forEach(h => { txt += icon[h.s] + ' [' + h.s + '] ' + h.p + '\n   ' + h.m + '\n\n'; });
    }
    txt += '\n✓ Security audit complete';
    await stream(txt, 'Security');
  }

  // ──────────────────────── TESTER (context-aware) ───────────────
  async function testerRun(a, ctx) {
    const fs = window.Nap.fs;
    const files = fs.listFiles().filter(f => !f.includes('test'));
    if (files.length > 0) {
      const fileContents = files.map(p => `File: ${p}\n---\n${fs.readFile(p)}\n---`).join('\n\n');
      const contextSummary = ctx ? ctx.getContextFor('tester') : '';
      const system = `You are the Tester agent. You have full context of the project plan and architecture.
Generate comprehensive unit tests that cover:
1. Core functionality and happy paths
2. Edge cases and error handling
3. Integration between modules
4. Input validation

Use ${a.type === 'flask' ? 'pytest' : 'Jest'} as the testing framework.
Output ONLY the test code. No markdown code blocks, no descriptions.`;

      const testPath = a.type === 'flask' ? 'tests/test_app.py' : 'src/__tests__/app.test.js';
      const fullPrompt = contextSummary + '\n\nGenerate tests for:\n\n' + fileContents;
      const aiResponse = await callProxyAPI(fullPrompt, system);

      if (aiResponse) {
        const cleanedCode = cleanCodeBlock(aiResponse);
        fs.createFile(testPath, cleanedCode);
        if (ctx) ctx.addAgentResult('tester', `Created ${testPath}`, { path: testPath });

        await stream(
          '🧪 Test Generation (AI — Context-Aware)\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Created: ' + testPath + '\n' +
          'Framework: ' + (a.type === 'flask' ? 'pytest' : 'Jest') + '\n' +
          'Lines: ' + cleanedCode.split('\n').length + '\n\n' +
          '✓ Test generation complete',
          'Tester'
        );
        return;
      }
    }

    // Fallback: template tests
    let path, content;
    if (a.type === 'react') {
      path = 'src/__tests__/App.test.jsx';
      content =
        "import { render, screen } from '@testing-library/react';\n" +
        "import App from '../App';\n\n" +
        "describe('App', () => {\n" +
        "  test('renders without crashing', () => {\n" +
        "    render(<App />);\n" +
        "    expect(screen.getByRole('main')).toBeDefined();\n" +
        "  });\n\n" +
        "  test('displays heading', () => {\n" +
        "    render(<App />);\n" +
        "    expect(screen.getByRole('heading')).toBeDefined();\n" +
        "  });\n\n" +
        "  test('matches snapshot', () => {\n" +
        "    const { container } = render(<App />);\n" +
        "    expect(container.firstChild).toMatchSnapshot();\n" +
        "  });\n" +
        "});\n";
    } else if (a.type === 'reactnative') {
      path = 'src/__tests__/App.test.tsx';
      content =
        "import React from 'react';\n" +
        "import { render, screen } from '@testing-library/react-native';\n" +
        "import App from '../App';\n\n" +
        "describe('App Container', () => {\n" +
        "  test('renders welcome and inquiry views', () => {\n" +
        "    render(<App />);\n" +
        "    expect(screen.getByText(/Appu Mobile/i)).toBeTruthy();\n" +
        "  });\n" +
        "});\n";
    } else if (a.type === 'interpreter') {
      path = 'src/__tests__/interpreter.test.js';
      content =
        "const { Lexer, Parser } = require('../parser');\n" +
        "const { Interpreter } = require('../interpreter');\n\n" +
        "describe('AST Interpreter VM', () => {\n" +
        "  test('lexes expression correctly', () => {\n" +
        "    const lex = new Lexer('x = 5;');\n" +
        "    const tokens = lex.tokenize();\n" +
        "    expect(tokens.map(t => t.type)).toContain('IDENTIFIER');\n" +
        "  });\n\n" +
        "  test('parses assignment', () => {\n" +
        "    const lex = new Lexer('x = 10;');\n" +
        "    const parser = new Parser(lex.tokenize());\n" +
        "    const ast = parser.parse();\n" +
        "    expect(ast.type).toBe('Program');\n" +
        "    expect(ast.body[0].type).toBe('Assign');\n" +
        "  });\n\n" +
        "  test('interprets execution steps', () => {\n" +
        "    const lex = new Lexer('x = 2; y = x + 3;');\n" +
        "    const parser = new Parser(lex.tokenize());\n" +
        "    const ast = parser.parse();\n" +
        "    const interpreter = new Interpreter(ast);\n" +
        "    const gen = interpreter.execute();\n" +
        "    let res = gen.next();\n" +
        "    while(!res.done) { res = gen.next(); }\n" +
        "    expect(interpreter.variables['y']).toBe(5);\n" +
        "  });\n" +
        "});\n";
    } else if (a.type === 'express') {
      path = 'tests/api.test.js';
      content =
        "const request = require('supertest');\n" +
        "const app = require('../src/server');\n\n" +
        "describe('API', () => {\n" +
        "  test('GET /api/health → 200', async () => {\n" +
        "    const res = await request(app).get('/api/health');\n" +
        "    expect(res.statusCode).toBe(200);\n" +
        "  });\n\n" +
        "  test('GET /api/items → array', async () => {\n" +
        "    const res = await request(app).get('/api/items');\n" +
        "    expect(Array.isArray(res.body)).toBe(true);\n" +
        "  });\n" +
        "});\n";
    } else if (a.type === 'flask') {
      path = 'tests/test_app.py';
      content =
        "import pytest\nfrom app import create_app\n\n" +
        "@pytest.fixture\ndef client():\n" +
        "    app = create_app({'TESTING': True})\n" +
        "    with app.test_client() as c:\n" +
        "        yield c\n\n" +
        "def test_index(client):\n" +
        "    assert client.get('/').status_code == 200\n\n" +
        "def test_health(client):\n" +
        "    r = client.get('/health')\n" +
        "    assert r.status_code == 200\n" +
        "    assert r.json['status'] == 'ok'\n";
    } else {
      path = 'tests/test.js';
      content =
        "const assert = require('assert');\n\n" +
        "describe('Application', () => {\n" +
        "  it('initialises', () => assert.ok(true));\n" +
        "  it('basic math', () => assert.strictEqual(1+1, 2));\n" +
        "});\n";
    }

    fs.createFile(path, content);
    if (ctx) ctx.addAgentResult('tester', `Template test: ${path}`, { path });

    const count = (content.match(/(test|it)\s*\(/g) || []).length;
    await stream(
      '🧪 Test Generation\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      'Created: ' + path + '\n' +
      'Tests: ' + count + '\n' +
      'Framework: ' + (a.type === 'flask' ? 'pytest' : 'Jest') + '\n' +
      'Coverage estimate: ~75%\n\n' +
      '✓ Test generation complete',
      'Tester'
    );
  }

  // ──────────────────────── DOCS (context-rich) ──────────────────
  async function docsRun(prompt, a, ctx) {
    const fs = window.Nap.fs;
    const files = fs.listFiles();
    const contextSummary = ctx ? ctx.getContextFor('docs') : '';

    const system = `You are the Docs agent. You have full context from the Planner, Architect, Coder, Reviewer, Security, and Tester agents.
Generate a comprehensive README.md that includes:
1. Project title and description
2. Architecture overview (reference the Architect's design)
3. Tech stack with versions
4. Installation and setup instructions
5. Usage examples
6. API documentation (if applicable)
7. Testing instructions
8. Security notes from the audit
9. File structure
10. Contributing guidelines
11. License

Make it professional and thorough. Output ONLY the raw README.md contents.`;

    const fullPrompt = contextSummary + '\n\nFiles in project:\n' + files.join('\n');
    const aiResponse = await callProxyAPI(fullPrompt, system);

    if (aiResponse) {
      const readme = cleanCodeBlock(aiResponse);
      fs.createFile('README.md', readme);
      if (ctx) ctx.addAgentResult('docs', 'Generated comprehensive README.md', { lines: readme.split('\n').length });

      await stream(
        '📚 Documentation (AI — Full Context)\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '✓ README.md (' + readme.split('\n').length + ' lines)\n\n' +
        '✓ Documentation complete',
        'Docs'
      );
      return;
    }

    // Fallback
    const name = a.name || 'project';
    const readme =
      '# ' + name + '\n\n' +
      prompt + '\n\n' +
      '## Tech Stack\n\n' +
      a.stack.map(s => '- ' + s).join('\n') + '\n\n' +
      '## Getting Started\n\n' +
      '### Prerequisites\n\n' +
      (a.type === 'flask'
        ? '- Python 3.8+\n- pip\n'
        : '- Node.js 18+\n- npm or yarn\n') + '\n' +
      '### Install\n\n```bash\n' +
      (a.type === 'flask'
        ? 'python -m venv venv\nsource venv/bin/activate\npip install -r requirements.txt'
        : 'npm install') + '\n```\n\n' +
      '### Develop\n\n```bash\n' +
      (a.type === 'flask' ? 'flask run --debug' : 'npm run dev') + '\n```\n\n' +
      '### Test\n\n```bash\n' +
      (a.type === 'flask' ? 'pytest' : 'npm test') + '\n```\n\n' +
      '## Project Structure\n\n```\n' +
      fs.listFiles().join('\n') + '\n```\n\n' +
      '## License\n\nMIT\n';

    fs.createFile('README.md', readme);
    if (ctx) ctx.addAgentResult('docs', 'Template README.md', {});

    await stream(
      '📚 Documentation\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '✓ README.md\n' +
      '  • Description\n' +
      '  • Stack & prerequisites\n' +
      '  • Install / develop / test\n' +
      '  • Project structure\n' +
      '  • License\n\n' +
      '✓ Documentation complete',
      'Docs'
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     Pipeline Runner v2 — Iterative with Feedback Loops
     ═══════════════════════════════════════════════════════════════ */
  async function runPipeline(prompt, templateId) {
    const st = window.Nap.state;
    if (st.pipeline.running) return;
    st.pipeline.running = true;
    clearOutput();

    // Create shared context
    const ctx = new PipelineContext(prompt);

    AGENTS.forEach(a => setState(a.id, 'queued', 'queued'));
    events.emit('pipeline:start', { prompt });

    const a = analyse(prompt);
    if (templateId) a.type = templateId;

    // Clear previous files
    window.Nap.fs.clear();

    await line('🚀 NAP v2 Pipeline — Iterative Self-Correcting Architecture', 'output-success');
    await line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ── Phase 1: Planning ─────────────────────────────────────────
    st.pipeline.currentAgent = 0;
    setState('planner', 'active', 'running…');
    events.emit('pipeline:agent:start', { agentId: 'planner' });
    let t0 = Date.now();
    try {
      await plannerRun(prompt, a, ctx);
      setState('planner', 'complete', ((Date.now() - t0) / 1000).toFixed(1) + 's');
      setConn(0, 'complete');
      events.emit('pipeline:agent:complete', { agentId: 'planner' });
    } catch (err) {
      setState('planner', 'error', 'failed');
      await line('✗ Planner: ' + err.message, 'output-error');
      ctx.errors.push('Planner failed: ' + err.message);
    }
    await utils.delay(200);

    // ── Phase 2: Architecture ─────────────────────────────────────
    st.pipeline.currentAgent = 1;
    setConn(0, 'active');
    setState('architect', 'active', 'running…');
    events.emit('pipeline:agent:start', { agentId: 'architect' });
    t0 = Date.now();
    try {
      await architectRun(prompt, a, ctx);
      setState('architect', 'complete', ((Date.now() - t0) / 1000).toFixed(1) + 's');
      setConn(1, 'complete');
      events.emit('pipeline:agent:complete', { agentId: 'architect' });
    } catch (err) {
      setState('architect', 'error', 'failed');
      await line('✗ Architect: ' + err.message, 'output-error');
      ctx.errors.push('Architect failed: ' + err.message);
    }
    await utils.delay(200);

    // ── Phase 3: Iterative Coder ↔ Reviewer Loop ──────────────────
    await line('\n🔄 Entering iterative Coder ↔ Reviewer loop (max ' + MAX_REFINEMENT_ROUNDS + ' rounds)…\n');

    for (let round = 0; round < MAX_REFINEMENT_ROUNDS; round++) {
      ctx.refinementRound = round;

      // ─ Coder ─
      st.pipeline.currentAgent = 2;
      setConn(1, 'active');
      setState('coder', 'active', round === 0 ? 'generating…' : `fixing (r${round + 1})…`);
      events.emit('pipeline:agent:start', { agentId: 'coder' });
      t0 = Date.now();
      try {
        await coderRun(prompt, a, ctx, templateId);
        setState('coder', 'complete', ((Date.now() - t0) / 1000).toFixed(1) + 's');
        setConn(2, 'complete');
        events.emit('pipeline:agent:complete', { agentId: 'coder' });
      } catch (err) {
        setState('coder', 'error', 'failed');
        await line('✗ Coder: ' + err.message, 'output-error');
        ctx.errors.push('Coder failed (round ' + round + '): ' + err.message);
        break;
      }
      await utils.delay(200);

      // ─ Reviewer ─
      st.pipeline.currentAgent = 3;
      setConn(2, 'active');
      setState('reviewer', 'active', 'reviewing…');
      events.emit('pipeline:agent:start', { agentId: 'reviewer' });
      t0 = Date.now();
      let reviewResult;
      try {
        reviewResult = await reviewerRun(ctx);
        setState('reviewer', 'complete', ((Date.now() - t0) / 1000).toFixed(1) + 's');
        setConn(3, 'complete');
        events.emit('pipeline:agent:complete', { agentId: 'reviewer' });
      } catch (err) {
        setState('reviewer', 'error', 'failed');
        await line('✗ Reviewer: ' + err.message, 'output-error');
        break;
      }
      await utils.delay(200);

      // Check if code is good enough to exit the loop
      const rating = reviewResult ? reviewResult.rating : 'A';
      const issueCount = reviewResult && reviewResult.issues ? reviewResult.issues.length : 0;
      const errorCount = reviewResult && reviewResult.issues
        ? reviewResult.issues.filter(i => i.type === 'error').length
        : 0;

      if (rating === 'A' || rating === 'A-' || (issueCount === 0) || (errorCount === 0 && round > 0)) {
        await line(`\n✅ Code quality: ${rating} — exiting refinement loop after ${round + 1} round(s).\n`, 'output-success');
        break;
      }

      if (round < MAX_REFINEMENT_ROUNDS - 1) {
        await line(`\n🔄 Round ${round + 1} complete — rating: ${rating}, ${issueCount} issues. Refining…\n`, 'output-warning');
      } else {
        await line(`\n⚠️ Max refinement rounds reached (${MAX_REFINEMENT_ROUNDS}). Proceeding with current code.\n`, 'output-warning');
      }
    }

    // ── Phase 4: Security ─────────────────────────────────────────
    st.pipeline.currentAgent = 4;
    setConn(3, 'active');
    setState('security', 'active', 'scanning…');
    events.emit('pipeline:agent:start', { agentId: 'security' });
    t0 = Date.now();
    try {
      await securityRun(ctx);
      setState('security', 'complete', ((Date.now() - t0) / 1000).toFixed(1) + 's');
      setConn(4, 'complete');
      events.emit('pipeline:agent:complete', { agentId: 'security' });
    } catch (err) {
      setState('security', 'error', 'failed');
      await line('✗ Security: ' + err.message, 'output-error');
    }
    await utils.delay(200);

    // ── Phase 5: Tester ───────────────────────────────────────────
    st.pipeline.currentAgent = 5;
    setConn(4, 'active');
    setState('tester', 'active', 'generating tests…');
    events.emit('pipeline:agent:start', { agentId: 'tester' });
    t0 = Date.now();
    try {
      await testerRun(a, ctx);
      setState('tester', 'complete', ((Date.now() - t0) / 1000).toFixed(1) + 's');
      setConn(5, 'complete');
      events.emit('pipeline:agent:complete', { agentId: 'tester' });
    } catch (err) {
      setState('tester', 'error', 'failed');
      await line('✗ Tester: ' + err.message, 'output-error');
    }
    await utils.delay(200);

    // ── Phase 6: Docs ─────────────────────────────────────────────
    st.pipeline.currentAgent = 6;
    setConn(5, 'active');
    setState('docs', 'active', 'writing docs…');
    events.emit('pipeline:agent:start', { agentId: 'docs' });
    t0 = Date.now();
    try {
      await docsRun(prompt, a, ctx);
      setState('docs', 'complete', ((Date.now() - t0) / 1000).toFixed(1) + 's');
      events.emit('pipeline:agent:complete', { agentId: 'docs' });
    } catch (err) {
      setState('docs', 'error', 'failed');
      await line('✗ Docs: ' + err.message, 'output-error');
    }

    // ── Done ──────────────────────────────────────────────────────
    st.pipeline.running = false;
    st.pipeline.currentAgent = -1;

    await line('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await line(`✓ Pipeline complete — ${ctx.history.length} agent passes, ${Object.keys(ctx.generatedFiles).length} files generated.`, 'output-success');

    if (ctx.decisions.length) {
      await line('\n🎯 Key Decisions:', 'output-text');
      for (const d of ctx.decisions) {
        await line('  • ' + d, 'output-text');
      }
    }

    events.emit('pipeline:complete');

    if (st.settings.autoFix) {
      await line('\n🔧 Auto-fix: running additional review pass…', 'output-warning');
      setState('reviewer', 'active', 'fixing…');
      await reviewerRun(ctx);
      setState('reviewer', 'complete', 'done');
    }
  }

  /* ─── Public API ─────────────────────────────────────────────── */
  window.Nap.agents = { getAll: () => AGENTS, runPipeline };

  document.addEventListener('DOMContentLoaded', () => {
    renderPipeline();
    const cb = document.getElementById('clear-output-btn');
    if (cb) cb.addEventListener('click', clearOutput);
  });
})();
