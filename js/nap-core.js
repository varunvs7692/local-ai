// ================================================================
// NAP Core — EventBus · State · Utilities · Initialization
// ================================================================
(function () {
  'use strict';

  window.Nap = window.Nap || {};

  // ─── EventBus ───────────────────────────────────────────────────
  class EventBus {
    constructor() { this._h = {}; }
    on(e, fn) {
      (this._h[e] = this._h[e] || []).push(fn);
      return () => this.off(e, fn);
    }
    off(e, fn) {
      if (!this._h[e]) return;
      this._h[e] = this._h[e].filter(f => f !== fn);
    }
    emit(e, d) {
      (this._h[e] || []).forEach(fn => {
        try { fn(d); } catch (err) { console.error(`[EventBus] ${e}:`, err); }
      });
    }
  }

  const events = new EventBus();
  window.Nap.events = events;

  // ─── State ──────────────────────────────────────────────────────
  window.Nap.state = {
    project: { name: 'Untitled Project', description: '' },
    pipeline: { running: false, currentAgent: -1 },
    settings: { autoFix: false },
  };

  // ─── Utilities ──────────────────────────────────────────────────
  window.Nap.utils = {
    delay(ms) { return new Promise(r => setTimeout(r, ms)); },

    getExtension(path) {
      const parts = path.split('.');
      return parts.length > 1 ? parts.pop().toLowerCase() : '';
    },

    getFilename(path) { return path.split('/').pop(); },

    languageFromExt(ext) {
      const map = {
        js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
        py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
        html: 'xml', css: 'css', scss: 'scss', json: 'json', md: 'markdown',
        yml: 'yaml', yaml: 'yaml', xml: 'xml', sql: 'sql', sh: 'bash',
        env: 'plaintext', txt: 'plaintext', prisma: 'plaintext',
        graphql: 'graphql', toml: 'ini',
      };
      return map[ext] || 'plaintext';
    },
  };

  // ─── Stats updater ──────────────────────────────────────────────
  function updateStats() {
    const fs = window.Nap.fs;
    if (!fs) return;

    const files = fs.listFiles();
    let totalLines = 0;
    let totalChars = 0;

    files.forEach(p => {
      const c = fs.readFile(p);
      if (c) { totalLines += c.split('\n').length; totalChars += c.length; }
    });

    document.getElementById('stat-files').textContent  = files.length;
    document.getElementById('stat-lines').textContent  = totalLines.toLocaleString();
    document.getElementById('stat-tokens').textContent = Math.ceil(totalChars / 4).toLocaleString();
  }

  // ─── Init ───────────────────────────────────────────────────────
  function init() {
    const buildBtn       = document.getElementById('build-btn');
    const fixBtn         = document.getElementById('fix-btn');
    const promptInput    = document.getElementById('prompt-input');
    const exportBtn      = document.getElementById('export-btn');
    const runBtn         = document.getElementById('run-btn');
    const templateSelect = document.getElementById('template-select');

    // API Config Elements
    const providerSelect = document.getElementById('provider-select');
    const modelInput     = document.getElementById('model-input');
    const apiKeyInput    = document.getElementById('api-key-input');

    // Load saved settings
    const savedProvider = localStorage.getItem('nap_provider') || 'simulation';
    const savedModel     = localStorage.getItem('nap_model') || 'qwen2.5-coder';
    const savedApiKey    = localStorage.getItem('nap_api_key') || '';

    providerSelect.value = savedProvider;
    modelInput.value     = savedModel;
    apiKeyInput.value    = savedApiKey;

    window.Nap.state.settings.provider = savedProvider;
    window.Nap.state.settings.modelName = savedModel;
    window.Nap.state.settings.apiKey = savedApiKey;

    const ollamaStatus = document.getElementById('ollama-status');
    const ensembleConfig = document.getElementById('ensemble-config');
    const ensembleModels = document.getElementById('ensemble-models');
    const ensembleApiKey = document.getElementById('ensemble-api-key');
    const ensembleConfigToggle = document.getElementById('ensemble-config-toggle');
    const closeEnsembleConfig = document.getElementById('close-ensemble-config');

    if (ensembleApiKey) {
      ensembleApiKey.value = savedApiKey;
    }

    // Ensemble state
    window.Nap.state.settings.ensembleModels = [];

    async function checkOllamaStatus() {
      const p = providerSelect.value;
      if (p !== 'ollama' && p !== 'ensemble') {
        ollamaStatus.classList.add('hidden');
        return;
      }
      ollamaStatus.classList.remove('hidden');
      try {
        const res = await fetch('/api/ollama-status');
        const data = await res.json();
        if (data.online) {
          ollamaStatus.textContent = '🟢 Online';
          ollamaStatus.className = 'status-indicator online';
        } else {
          ollamaStatus.textContent = '🔴 Offline';
          ollamaStatus.className = 'status-indicator offline';
        }
      } catch (e) {
        ollamaStatus.textContent = '🔴 Offline';
        ollamaStatus.className = 'status-indicator offline';
      }
    }

    // Fetch installed Ollama models and populate ensemble picker
    async function loadOllamaModels() {
      try {
        const res = await fetch('/api/ollama-models');
        const data = await res.json();
        return (data.models || []).map(m => m.name);
      } catch (e) {
        return [];
      }
    }

    async function renderEnsembleConfig() {
      ensembleModels.innerHTML = '<div class="ensemble-title">🔥 Select Models for Ensemble</div>';

      // Load Ollama models
      const ollamaModelNames = await loadOllamaModels();

      // Add Ollama models
      ollamaModelNames.forEach(name => {
        const item = document.createElement('label');
        item.className = 'ensemble-model-item';
        item.innerHTML =
          '<input type="checkbox" data-provider="ollama" data-model="' + name + '" checked />' +
          '<span>' + name + '</span>' +
          '<span class="model-provider local">LOCAL</span>';
        ensembleModels.appendChild(item);
      });

      if (ollamaModelNames.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'ensemble-model-item';
        empty.style.color = 'var(--dormant)';
        empty.textContent = 'No Ollama models found. Install with: ollama run qwen2.5-coder';
        ensembleModels.appendChild(empty);
      }

      // Add Gemini option
      const geminiItem = document.createElement('label');
      geminiItem.className = 'ensemble-model-item';
      geminiItem.innerHTML =
        '<input type="checkbox" data-provider="gemini" data-model="gemini-2.5-flash" />' +
        '<span>gemini-2.5-flash</span>' +
        '<span class="model-provider cloud">CLOUD</span>';
      ensembleModels.appendChild(geminiItem);

      // Count label
      const countEl = document.createElement('div');
      countEl.className = 'ensemble-count';
      countEl.id = 'ensemble-count';
      countEl.textContent = ollamaModelNames.length + ' model(s) selected';
      ensembleModels.appendChild(countEl);

      // Wire up checkboxes
      ensembleModels.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', updateEnsembleSelection);
      });
      updateEnsembleSelection();
    }

    function updateEnsembleSelection() {
      const checked = ensembleModels.querySelectorAll('input[type="checkbox"]:checked');
      const models = [];
      checked.forEach(cb => {
        models.push({
          provider: cb.dataset.provider,
          model: cb.dataset.model,
          label: cb.dataset.model
        });
      });
      window.Nap.state.settings.ensembleModels = models;
      const countEl = document.getElementById('ensemble-count');
      if (countEl) countEl.textContent = models.length + ' model(s) selected';
    }

    function updateInputVisibility() {
      const p = providerSelect.value;
      modelInput.classList.add('hidden');
      apiKeyInput.classList.add('hidden');
      if (ensembleConfigToggle) ensembleConfigToggle.classList.add('hidden');
      if (ensembleConfig) ensembleConfig.classList.add('hidden');

      if (p === 'ollama') {
        modelInput.classList.remove('hidden');
      } else if (p === 'gemini') {
        apiKeyInput.classList.remove('hidden');
      } else if (p === 'ensemble') {
        if (ensembleConfigToggle) ensembleConfigToggle.classList.remove('hidden');
        renderEnsembleConfig();
      }
      checkOllamaStatus();
    }
    updateInputVisibility();

    // Check Ollama status periodically
    setInterval(checkOllamaStatus, 5000);

    providerSelect.addEventListener('change', () => {
      const val = providerSelect.value;
      localStorage.setItem('nap_provider', val);
      window.Nap.state.settings.provider = val;
      updateInputVisibility();
    });

    modelInput.addEventListener('input', () => {
      const val = modelInput.value.trim();
      localStorage.setItem('nap_model', val);
      window.Nap.state.settings.modelName = val;
    });

    apiKeyInput.addEventListener('input', () => {
      const val = apiKeyInput.value.trim();
      localStorage.setItem('nap_api_key', val);
      if (ensembleApiKey) ensembleApiKey.value = val;
      window.Nap.state.settings.apiKey = val;
    });

    if (ensembleApiKey) {
      ensembleApiKey.addEventListener('input', () => {
        const val = ensembleApiKey.value.trim();
        localStorage.setItem('nap_api_key', val);
        apiKeyInput.value = val;
        window.Nap.state.settings.apiKey = val;
      });
    }

    if (ensembleConfigToggle && ensembleConfig) {
      ensembleConfigToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        ensembleConfig.classList.toggle('hidden');
      });
    }

    if (closeEnsembleConfig && ensembleConfig) {
      closeEnsembleConfig.addEventListener('click', (e) => {
        e.stopPropagation();
        ensembleConfig.classList.add('hidden');
      });
    }

    // Close config panel when clicking outside of it
    document.addEventListener('click', (e) => {
      if (ensembleConfig && !ensembleConfig.classList.contains('hidden')) {
        if (!ensembleConfig.contains(e.target) && e.target !== ensembleConfigToggle) {
          ensembleConfig.classList.add('hidden');
        }
      }
    });

    // Auto-resize textarea
    promptInput.addEventListener('input', () => {
      promptInput.style.height = 'auto';
      promptInput.style.height = Math.min(promptInput.scrollHeight, 120) + 'px';
    });

    // Build
    buildBtn.addEventListener('click', async () => {
      const prompt = promptInput.value.trim();
      if (!prompt && !templateSelect.value) return;
      if (window.Nap.state.pipeline.running) return;

      buildBtn.disabled = true;
      buildBtn.querySelector('span').textContent = 'Building…';

      const welcome = document.getElementById('welcome-screen');
      if (welcome) welcome.classList.add('hidden');

      const name = prompt.split(/[\s,.!?]+/).slice(0, 3).join('-').toLowerCase() || 'project';
      window.Nap.state.project.name = name;
      window.Nap.state.project.description = prompt;
      document.getElementById('project-name').textContent = name;

      try {
        await window.Nap.agents.runPipeline(prompt, templateSelect.value);
      } catch (e) {
        console.error('Pipeline error:', e);
      }

      buildBtn.disabled = false;
      buildBtn.querySelector('span').textContent = 'Build';
    });

    // Ctrl+Enter to build
    promptInput.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        buildBtn.click();
      }
    });

    // Auto-fix toggle
    fixBtn.addEventListener('click', () => {
      window.Nap.state.settings.autoFix = !window.Nap.state.settings.autoFix;
      fixBtn.classList.toggle('active', window.Nap.state.settings.autoFix);
    });

    // Export
    exportBtn.addEventListener('click', () => {
      if (window.Nap.export) window.Nap.export.downloadZip();
    });

    // Run
    runBtn.addEventListener('click', () => events.emit('run:execute'));

    // Template quick-apply
    templateSelect.addEventListener('change', () => {
      if (templateSelect.value && window.Nap.templates) {
        window.Nap.templates.apply(templateSelect.value);
        const welcome = document.getElementById('welcome-screen');
        if (welcome) welcome.classList.add('hidden');
      }
    });

    // Stats listeners
    events.on('file:created', updateStats);
    events.on('file:updated', updateStats);
    events.on('file:deleted', updateStats);
    events.on('project:reset', updateStats);
    updateStats();

    // Autoplay query parameter handler
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autoplay') === 'true') {
      const p = urlParams.get('provider');
      const k = urlParams.get('key');
      const promptVal = urlParams.get('prompt');
      const tpl = urlParams.get('template');

      if (p) {
        providerSelect.value = p;
        localStorage.setItem('nap_provider', p);
        window.Nap.state.settings.provider = p;
      }
      if (k) {
        apiKeyInput.value = k;
        localStorage.setItem('nap_api_key', k);
        window.Nap.state.settings.apiKey = k;
      }
      updateInputVisibility();

      if (tpl) {
        templateSelect.value = tpl;
        if (window.Nap.templates) {
          window.Nap.templates.apply(tpl);
          const welcome = document.getElementById('welcome-screen');
          if (welcome) welcome.classList.add('hidden');
        }
      }
      if (promptVal) {
        promptInput.value = promptVal;
        promptInput.style.height = 'auto';
        promptInput.style.height = Math.min(promptInput.scrollHeight, 120) + 'px';
      }

      // Delay slightly and trigger build click
      setTimeout(() => {
        buildBtn.click();
      }, 1000);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
