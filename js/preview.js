// ================================================================
// NAP Live Preview — Virtual Browser & Backend Simulator
// ================================================================
(function () {
  'use strict';

  const { events, utils } = window.Nap;

  class LivePreview {
    constructor() {
      this.previewBtn = null;
      this.previewPanel = null;
      this.iframe = null;
      this.isVisible = false;
    }

    init() {
      this.previewBtn = document.getElementById('preview-btn');
      this.previewPanel = document.getElementById('preview-panel');
      this.iframe = document.getElementById('preview-iframe');

      if (this.previewBtn) {
        this.previewBtn.addEventListener('click', () => this.toggle());
      }

      const closeBtn = document.getElementById('close-preview');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hide());
      }

      const refreshBtn = document.getElementById('refresh-preview');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => this.refresh());
      }

      // Listen for pipeline completion to auto-refresh if open
      events.on('pipeline:complete', () => {
        if (this.isVisible) this.refresh();
      });

      // Auto-refresh when files change
      events.on('file:updated', () => {
        if (this.isVisible) this.refresh();
      });
    }

    toggle() {
      if (this.isVisible) {
        this.hide();
      } else {
        this.show();
      }
    }

    show() {
      this.isVisible = true;
      if (this.previewPanel) this.previewPanel.classList.remove('hidden');
      if (this.previewBtn) this.previewBtn.classList.add('active');
      this.refresh();
      window.Nap.toast('Live Preview Started', 'success');
    }

    hide() {
      this.isVisible = false;
      if (this.previewPanel) this.previewPanel.classList.add('hidden');
      if (this.previewBtn) this.previewBtn.classList.remove('active');
    }

    refresh() {
      if (!this.iframe) return;
      const fs = window.Nap.fs;
      if (!fs) return;

      const templateType = window.Nap.state.settings.template || this._detectTemplate();

      // Toggle phone mode styling on preview container wrapper
      const container = document.getElementById('preview-iframe-container');
      if (container) {
        if (templateType === 'reactnative') {
          container.classList.add('phone-mode');
        } else {
          container.classList.remove('phone-mode');
        }
      }

      if (templateType === 'react') {
        this._renderReactPreview();
      } else if (templateType === 'reactnative') {
        this._renderReactNativePreview();
      } else if (templateType === 'static') {
        this._renderStaticPreview();
      } else if (['express', 'flask', 'nextjs'].includes(templateType)) {
        this._renderBackendPreview(templateType);
      } else {
        this._renderCliPreview();
      }
    }

    _detectTemplate() {
      const files = window.Nap.fs.listFiles();
      if (files.some(f => f.includes('screens/') || f.includes('App.tsx'))) return 'reactnative';
      if (files.some(f => f.includes('App.jsx') || f.includes('main.jsx'))) return 'react';
      if (files.some(f => f.includes('server.js') || f.includes('app.js'))) return 'express';
      if (files.some(f => f.includes('app.py'))) return 'flask';
      if (files.some(f => f.includes('page.tsx') || f.includes('layout.tsx'))) return 'nextjs';
      if (files.some(f => f.includes('cli.js'))) return 'cli';
      return 'static';
    }

    /* ─── React Preview Compiler (Dynamic CommonJS in Browser) ─── */
    _renderReactPreview() {
      const fs = window.Nap.fs;
      const files = {};
      fs.listFiles().forEach(p => {
        files[p] = fs.readFile(p);
      });

      const srcdoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>React Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      background-color: #0b0f19;
      color: #f1f5f9;
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, sans-serif;
    }
    #loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-size: 14px;
      color: #94a3b8;
    }
    .spinner {
      border: 3px solid rgba(255,255,255,0.1);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border-left-color: #3b82f6;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .error-box {
      background: #7f1d1d;
      border: 1px solid #f87171;
      padding: 16px;
      margin: 16px;
      border-radius: 8px;
      font-family: monospace;
      white-space: pre-wrap;
      color: #fca5a5;
    }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    <div>Compiling React components...</div>
  </div>
  <div id="root"></div>

  <script>
    window.VIRTUAL_FILES = ${JSON.stringify(files)};

    const modules = {};
    const exportsCache = {};

    function define(name, factory) {
      modules[name] = factory;
    }

    function require(name) {
      if (name === 'react') return window.React;
      if (name === 'react-dom') return window.ReactDOM;
      if (name === 'react-dom/client') return {
        createRoot: (el) => window.ReactDOM.createRoot(el)
      };

      // Resolve relative path
      let clean = name.replace(/^\.\/?/, '').replace(/\.jsx?$/, '');
      
      let key = Object.keys(modules).find(k => k === clean || k === 'src/' + clean || k.endsWith('/' + clean));
      if (!key) key = clean;

      if (exportsCache[key]) return exportsCache[key];
      if (!modules[key]) {
        throw new Error("Cannot find module '" + name + "'");
      }

      const module = { exports: {} };
      exportsCache[key] = module.exports;
      modules[key](require, module.exports, module);
      exportsCache[key] = module.exports;
      return module.exports;
    }

    window.onload = function() {
      try {
        // 1. Inject CSS files
        Object.keys(window.VIRTUAL_FILES).forEach(path => {
          if (path.endsWith('.css')) {
            const style = document.createElement('style');
            style.textContent = window.VIRTUAL_FILES[path];
            document.head.appendChild(style);
          }
        });

        // 2. Transpile and define JS/JSX modules
        Object.keys(window.VIRTUAL_FILES).forEach(path => {
          if (path.endsWith('.js') || path.endsWith('.jsx')) {
            let code = window.VIRTUAL_FILES[path];
            
            // Strip imports & exports that Babel Standalone might complain about in CJS mode
            // or transpile them to CommonJS
            const cleanPath = path.replace(/\.jsx?$/, '');
            try {
              const transpiled = Babel.transform(code, {
                presets: ['react'],
                plugins: ['transform-modules-commonjs']
              }).code;

              define(cleanPath, function(require, exports, module) {
                // Execute code
                const fn = new Function('require', 'exports', 'module', transpiled);
                fn(require, exports, module);
              });
            } catch (err) {
              throw new Error("Compilation error in " + path + ":\\n" + err.message);
            }
          }
        });

        // Remove loading state
        const loading = document.getElementById('loading');
        if (loading) loading.remove();

        // 3. Run entry point (usually src/main or index.js)
        const entry = Object.keys(modules).find(k => k.includes('main') || k.includes('index'));
        if (entry) {
          require(entry);
        } else {
          throw new Error("No entrypoint (main.jsx or index.js) found in workspace!");
        }

      } catch (err) {
        document.getElementById('loading').remove();
        const box = document.createElement('div');
        box.className = 'error-box';
        box.innerHTML = '<h3>💥 Build Failure</h3>' + err.message;
        document.body.appendChild(box);
      }
    }
  </script>
</body>
</html>`;
      this.iframe.srcdoc = srcdoc;
    }

    /* ─── React Native Mobile App Preview Compiler ─── */
    _renderReactNativePreview() {
      const fs = window.Nap.fs;
      const files = {};
      fs.listFiles().forEach(p => {
        files[p] = fs.readFile(p);
      });

      const srcdoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>React Native App Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      background-color: #030712;
      color: #f3f4f6;
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, sans-serif;
      user-select: none;
      height: 100vh;
      overflow: hidden;
    }
    #loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-size: 13px;
      color: #6b7280;
    }
    .spinner {
      border: 2px solid rgba(255,255,255,0.05);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border-left-color: #a78bfa;
      animation: spin 0.8s linear infinite;
      margin-bottom: 10px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .error-box {
      background: #450a0a;
      border: 1px solid #f87171;
      padding: 12px;
      margin: 12px;
      border-radius: 8px;
      font-family: monospace;
      white-space: pre-wrap;
      color: #fca5a5;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    <div>Booting Expo simulator...</div>
  </div>
  <div id="root" class="h-full"></div>

  <script>
    window.VIRTUAL_FILES = ` + JSON.stringify(files) + `;

    const modules = {};
    const exportsCache = {};

    function define(name, factory) {
      modules[name] = factory;
    }

    function require(name) {
      if (name === 'react') return window.React;
      if (name === 'react-dom') return window.ReactDOM;
      if (name === 'react-native') {
        const React = window.React;
        return {
          View: React.forwardRef((props, ref) => {
            const { className, style, children, ...rest } = props;
            return React.createElement('div', { 
              ...rest, 
              ref, 
              className: 'flex flex-col relative shrink-0 box-border ' + (className || ''),
              style
            }, children);
          }),
          Text: (props) => {
            const { className, style, children, ...rest } = props;
            return React.createElement('span', { 
              ...rest, 
              className: 'text-slate-200 ' + (className || ''),
              style 
            }, children);
          },
          TouchableOpacity: (props) => {
            const { className, style, children, ...rest } = props;
            return React.createElement('button', { 
              ...rest, 
              className: 'active:opacity-60 transition-opacity focus:outline-none ' + (className || ''),
              style 
            }, children);
          },
          ScrollView: (props) => {
            const { className, style, children, ...rest } = props;
            return React.createElement('div', { 
              ...rest, 
              className: 'overflow-y-auto flex-1 ' + (className || ''),
              style 
            }, children);
          },
          TextInput: (props) => {
            const { className, style, placeholder, value, onChangeText, ...rest } = props;
            return React.createElement('input', {
              ...rest,
              placeholder,
              value,
              onChange: (e) => onChangeText && onChangeText(e.target.value),
              className: 'bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-4 py-2 focus:outline-none focus:border-violet-500 ' + (className || ''),
              style
            });
          },
          Image: (props) => {
            const { className, style, source, ...rest } = props;
            const src = source && (source.uri || source);
            return React.createElement('img', { 
              ...rest, 
              src, 
              className: 'object-cover ' + (className || ''),
              style 
            });
          },
          ActivityIndicator: (props) => {
            const { className, style, ...rest } = props;
            return React.createElement('div', { 
              ...rest, 
              className: 'animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500 ' + (className || ''),
              style 
            });
          },
          StyleSheet: {
            create: (s) => s
          }
        };
      }

      // Resolve relative path
      let clean = name.replace(/^\\.\\/?/, '').replace(/\\.tsx?$/, '').replace(/\\.jsx?$/, '');
      if (clean.startsWith('src/')) clean = clean.substring(4);
      
      let key = Object.keys(modules).find(k => {
        let ck = k;
        if (ck.startsWith('src/')) ck = ck.substring(4);
        return ck === clean || ck.endsWith('/' + clean);
      });

      if (!key) key = clean;

      if (exportsCache[key]) return exportsCache[key];
      if (!modules[key]) {
        throw new Error("Cannot find module '" + name + "'");
      }

      const module = { exports: {} };
      exportsCache[key] = module.exports;
      modules[key](require, module.exports, module);
      exportsCache[key] = module.exports;
      return module.exports;
    }

    window.onload = function() {
      try {
        // Transpile and define TSX/TS/JS/JSX modules
        Object.keys(window.VIRTUAL_FILES).forEach(path => {
          if (path.endsWith('.js') || path.endsWith('.jsx') || path.endsWith('.ts') || path.endsWith('.tsx')) {
            let code = window.VIRTUAL_FILES[path];
            
            // Clean paths for matching imports
            let cleanPath = path.replace(/\\.tsx?$/, '').replace(/\\.jsx?$/, '');
            if (cleanPath.startsWith('src/')) cleanPath = cleanPath.substring(4);

            try {
              const transpiled = Babel.transform(code, {
                presets: ['react', 'typescript'],
                plugins: ['transform-modules-commonjs'],
                filename: path
              }).code;

              define(cleanPath, function(require, exports, module) {
                const fn = new Function('require', 'exports', 'module', transpiled);
                fn(require, exports, module);
              });
            } catch (err) {
              throw new Error("Compilation error in " + path + ":\\n" + err.message);
            }
          }
        });

        // Remove loading state
        const loading = document.getElementById('loading');
        if (loading) loading.remove();

        // Run entry point App.tsx or App.jsx or main.tsx
        const AppRoot = require('App');
        const rootComponent = AppRoot.default || AppRoot;

        const rootEl = document.getElementById('root');
        const root = ReactDOM.createRoot(rootEl);
        root.render(React.createElement(rootComponent));

      } catch (err) {
        const loading = document.getElementById('loading');
        if (loading) loading.remove();
        const box = document.createElement('div');
        box.className = 'error-box';
        box.innerHTML = '<h3>💥 Expo Compilation Failure</h3>' + err.message;
        document.body.appendChild(box);
      }
    }
  </script>
</body>
</html>\`;
      this.iframe.srcdoc = srcdoc;
    }

    /* ─── Static Preview ─── */
    _renderStaticPreview() {
      const fs = window.Nap.fs;
      let html = fs.readFile('index.html');
      if (!html) {
        html = `<h3>Error</h3><p>index.html not found in virtual filesystem.</p>`;
      }

      // Inline styles
      const linkRegex = /<link\s+[^>]*href=["']([^"']+\.css)["'][^>]*>/gi;
      html = html.replace(linkRegex, (match, href) => {
        const cleanHref = href.replace(/^\//, '');
        const cssContent = fs.readFile(cleanHref) || fs.readFile('src/' + cleanHref) || '';
        return `<style>${cssContent}</style>`;
      });

      // Inline scripts
      const scriptRegex = /<script\s+[^>]*src=["']([^"']+\.js)["'][^>]*>\s*<\/script>/gi;
      html = html.replace(scriptRegex, (match, src) => {
        const cleanSrc = src.replace(/^\//, '');
        const jsContent = fs.readFile(cleanSrc) || fs.readFile('src/' + cleanSrc) || '';
        return `<script>${jsContent}</script>`;
      });

      this.iframe.srcdoc = html;
    }

    /* ─── Backend Mock Playground (Express / Flask / Next.js) ─── */
    _renderBackendPreview(type) {
      const fs = window.Nap.fs;
      
      // We will look at files to extract api endpoints description or generate simulated data
      const files = fs.listFiles();
      let endpoints = [
        { method: 'GET', path: '/api/health', desc: 'Checks backend health status' },
      ];

      // Scan code to detect potential mock endpoints
      files.forEach(p => {
        const code = fs.readFile(p);
        if (!code) return;
        const expressMatch = code.match(/app\.(get|post|put|delete)\(\s*['"]([^'"]+)['"]/g);
        if (expressMatch) {
          expressMatch.forEach(m => {
            const parts = m.match(/app\.(get|post|put|delete)\(\s*['"]([^'"]+)['"]/);
            if (parts && parts[2] !== '/api/health') {
              endpoints.push({
                method: parts[1].toUpperCase(),
                path: parts[2],
                desc: 'Generated endpoint from ' + utils.getFilename(p)
              });
            }
          });
        }
        const flaskMatch = code.match(/@app\.route\(\s*['"]([^'"]+)['"](?:,\s*methods=\[([^\]]+)\])?/g);
        if (flaskMatch) {
          flaskMatch.forEach(m => {
            const routeParts = m.match(/@app\.route\(\s*['"]([^'"]+)['"]/);
            const methodsPart = m.match(/methods=\[([^\]]+)\]/);
            const path = routeParts ? routeParts[1] : '/';
            let methods = ['GET'];
            if (methodsPart) {
              methods = methodsPart[1].replace(/['"\s]/g, '').split(',');
            }
            methods.forEach(met => {
              if (path !== '/health') {
                endpoints.push({
                  method: met.toUpperCase(),
                  path: path,
                  desc: 'Flask Endpoint route'
                });
              }
            });
          });
        }
      });

      // De-duplicate endpoints
      const seen = new Set();
      endpoints = endpoints.filter(el => {
        const dupId = el.method + ':' + el.path;
        if (seen.has(dupId)) return false;
        seen.add(dupId);
        return true;
      });

      // Default mock DB state
      let mockDb = [
        { id: 1, title: 'Learn React Hooks', completed: true },
        { id: 2, title: 'Build NAP IDE', completed: false },
        { id: 3, title: 'Deploy Backend Server', completed: false }
      ];

      const srcdoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Backend Console</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: #090d16;
      color: #e2e8f0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      margin: 0;
      padding: 16px;
    }
    .panel {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 8px;
    }
  </style>
</head>
<body class="flex flex-col h-screen overflow-hidden gap-4">
  
  <div class="flex items-center justify-between border-b border-slate-800 pb-2">
    <div>
      <span class="text-emerald-400 font-bold">● ONLINE</span>
      <span class="text-slate-400 ml-2">${type.toUpperCase()} Mock Server running on http://localhost:3000</span>
    </div>
  </div>

  <div class="flex flex-1 overflow-hidden gap-4">
    <!-- Endpoints List -->
    <div class="w-1/3 flex flex-col gap-2 overflow-y-auto">
      <div class="text-xs text-slate-500 uppercase tracking-wider mb-1">Endpoints detected</div>
      ${endpoints.map((e, idx) => `
        <button onclick="selectEndpoint('${e.method}', '${e.path}', ${idx})" class="w-full text-left p-3 panel hover:border-sky-500 transition-all flex flex-col gap-1 group">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-xs font-bold ${
              e.method === 'GET' ? 'bg-sky-500/10 text-sky-400' :
              e.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400' :
              e.method === 'DELETE' ? 'bg-rose-500/10 text-rose-400' :
              'bg-amber-500/10 text-amber-400'
            }">${e.method}</span>
            <span class="font-bold text-slate-300 group-hover:text-sky-300">${e.path}</span>
          </div>
          <span class="text-[11px] text-slate-500">${e.desc}</span>
        </button>
      `).join('')}
    </div>

    <!-- Request/Response Console -->
    <div class="flex-1 flex flex-col gap-4">
      <div class="flex-1 panel p-4 flex flex-col overflow-hidden">
        <div class="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
          <div class="text-slate-300 font-bold" id="console-title">Select an endpoint to start</div>
          <button id="send-btn" disabled onclick="sendRequest()" class="bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white font-bold py-1 px-4 rounded text-xs transition-all">Send Request</button>
        </div>

        <div id="request-body-section" class="hidden mb-4">
          <div class="text-[11px] text-slate-500 mb-1">Request Body (JSON)</div>
          <textarea id="req-body" class="w-full h-24 bg-slate-950 border border-slate-800 rounded p-2 focus:outline-none focus:border-sky-500 text-xs text-emerald-400" spellcheck="false">{\n  "title": "New Item",\n  "completed": false\n}</textarea>
        </div>

        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="text-[11px] text-slate-500 mb-1">Response JSON</div>
          <pre id="response-output" class="flex-1 bg-slate-950 border border-slate-800 rounded p-3 text-emerald-400 text-xs overflow-auto">(awaiting request)</pre>
        </div>
      </div>

      <!-- Database Inspector -->
      <div class="h-1/3 panel p-4 flex flex-col overflow-hidden">
        <div class="text-slate-300 font-bold border-b border-slate-800 pb-2 mb-2 flex justify-between items-center">
          <span>💾 Virtual Database Console</span>
          <span class="text-[10px] text-slate-500" id="db-size">3 entries</span>
        </div>
        <div class="flex-1 overflow-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-800 text-slate-500">
                <th class="py-1">id</th>
                <th class="py-1">title</th>
                <th class="py-1">completed</th>
              </tr>
            </thead>
            <tbody id="db-rows"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Server Log Console -->
  <div class="h-40 panel p-3 flex flex-col overflow-hidden">
    <div class="text-[11px] text-slate-500 uppercase border-b border-slate-800 pb-1 mb-1">Server Log Trace</div>
    <div id="log-output" class="flex-1 overflow-y-auto text-sky-400 text-[11px] flex flex-col gap-0.5">
      <div>[INFO] 12:40:00 - Server initialized</div>
      <div>[INFO] 12:40:01 - Express routing bound to endpoints</div>
      <div>[INFO] 12:40:01 - SQL Database synced (in-memory)</div>
    </div>
  </div>

  <script>
    let currentEndpoint = null;
    let db = ${JSON.stringify(mockDb)};

    function renderDb() {
      const tbody = document.getElementById('db-rows');
      tbody.innerHTML = '';
      db.forEach(item => {
        tbody.innerHTML += \`<tr class="border-b border-slate-900 hover:bg-slate-950">
          <td class="py-1 text-slate-400">\${item.id}</td>
          <td class="py-1 text-emerald-400 font-bold">\${item.title}</td>
          <td class="py-1 text-amber-500">\${item.completed}</td>
        </tr>\`;
      });
      document.getElementById('db-size').textContent = db.length + ' entries';
    }

    function addLog(msg) {
      const logs = document.getElementById('log-output');
      const time = new Date().toTimeString().split(' ')[0];
      logs.innerHTML += \`<div>[LOG] \${time} - \${msg}</div>\`;
      logs.scrollTop = logs.scrollHeight;
    }

    function selectEndpoint(method, path, idx) {
      currentEndpoint = { method, path };
      document.getElementById('console-title').innerHTML = \`<span class="text-sky-400">\${method}</span> \${path}\`;
      document.getElementById('send-btn').disabled = false;
      
      const bodySection = document.getElementById('request-body-section');
      if (method === 'POST' || method === 'PUT') {
        bodySection.classList.remove('hidden');
      } else {
        bodySection.classList.add('hidden');
      }
    }

    function sendRequest() {
      if (!currentEndpoint) return;
      
      const { method, path } = currentEndpoint;
      addLog(\`Incoming HTTP request: \${method} \${path}\`);

      let response = {};
      let status = 200;

      if (path === '/api/health') {
        response = { status: 'healthy', database: 'connected', uptime: processUptime() };
      } else if (path.includes('items') || path.includes('tasks')) {
        if (method === 'GET') {
          response = db;
        } else if (method === 'POST') {
          try {
            const body = JSON.parse(document.getElementById('req-body').value);
            const newItem = {
              id: db.length > 0 ? Math.max(...db.map(d => d.id)) + 1 : 1,
              title: body.title || 'New Item',
              completed: body.completed || false
            };
            db.push(newItem);
            response = newItem;
            status = 201;
            renderDb();
            addLog(\`Row inserted into Database with ID: \${newItem.id}\`);
          } catch (e) {
            response = { error: 'Bad Request', message: 'Invalid JSON payload' };
            status = 400;
          }
        } else if (method === 'DELETE') {
          // Mock delete last element or match URL
          const deleted = db.pop();
          response = deleted ? { message: 'Deleted item', item: deleted } : { error: 'Not Found' };
          status = deleted ? 200 : 404;
          renderDb();
          addLog(\`Row deleted from Database\`);
        }
      } else {
        // Fallback endpoint handler
        if (method === 'GET') {
          response = { status: 'success', endpoint: path, message: 'Returned simulated data' };
        } else {
          response = { status: 'created', endpoint: path, data: { status: 'processed' } };
          status = 201;
        }
      }

      document.getElementById('response-output').textContent = 
        \`HTTP/1.1 \${status} \${status === 200 ? 'OK' : status === 201 ? 'Created' : 'Bad Request'}\\n\` +
        \`Content-Type: application/json\\n\` +
        \`Date: \${new Date().toUTCString()}\\n\\n\` +
        JSON.stringify(response, null, 2);

      addLog(\`HTTP response sent: \${status} (took 8ms)\`);
    }

    function processUptime() {
      return (performance.now() / 1000).toFixed(2) + 's';
    }

    // Initialize
    renderDb();
  </script>
</body>
</html>`;
      this.iframe.srcdoc = srcdoc;
    }

    /* ─── CLI Terminal Simulator ─── */
    _renderCliPreview() {
      const fs = window.Nap.fs;
      const files = fs.listFiles();
      const cliFile = files.find(f => f.includes('cli.js') || f.includes('bin/')) || 'index.js';

      const srcdoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CLI Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: #0b0f19;
      color: #38bdf8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      margin: 0;
      padding: 16px;
    }
  </style>
</head>
<body class="flex flex-col h-screen overflow-hidden">
  <div class="border-b border-slate-800 pb-2 mb-4">
    <span class="text-slate-400">Interactive CLI Helper Terminal</span>
  </div>

  <div class="flex-1 bg-slate-950 border border-slate-800 rounded p-4 overflow-y-auto flex flex-col gap-2">
    <div>$ node ${cliFile} --help</div>
    <div class="text-slate-300">
      Usage: my-cli-tool [options] [command]<br><br>
      Options:<br>
      &nbsp;&nbsp;-V, --version &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;output the version number<br>
      &nbsp;&nbsp;-h, --help &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;display help for command<br><br>
      Commands:<br>
      &nbsp;&nbsp;run [options] [script] &nbsp;&nbsp;Execute script file<br>
      &nbsp;&nbsp;test [options] &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Execute test suites<br>
      &nbsp;&nbsp;init [name] &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Scaffold a new project configuration
    </div>
    <div class="mt-4">$ node ${cliFile} init project-alpha</div>
    <div class="text-emerald-400">
      🔧 Scaffolded configuration...<br>
      ✓ Created project-alpha/config.json<br>
      ✓ Created project-alpha/package.json<br>
      ✨ Project project-alpha initialized successfully!
    </div>
    <div class="mt-2 text-slate-500 cursor-blink animate-pulse">$ █</div>
  </div>
</body>
</html>`;
      this.iframe.srcdoc = srcdoc;
    }
  }

  // Bootstrap
  const lp = new LivePreview();
  window.Nap.preview = lp;
  document.addEventListener('DOMContentLoaded', () => lp.init());
})();
