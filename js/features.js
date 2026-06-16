// ================================================================
// NAP Features — Command Palette · Terminal · Search · Themes
//                   Toast · Shortcuts · Status Bar
// ================================================================
(function () {
  'use strict';

  var events = window.Nap.events;
  var utils  = window.Nap.utils;

  /* ═══════════════════════════════════════════════════════════════
     THEMES — 4 palettes, switch by overriding CSS custom properties
     ═══════════════════════════════════════════════════════════════ */
  var THEMES = {
    void:     { name: 'Void',     vars: {} },
    midnight: { name: 'Midnight', vars: { '--abyss':'#000000','--cortex':'#0a0a0f','--synapse':'#151520','--axon':'#00d4ff','--impulse':'#ff6b35' } },
    aurora:   { name: 'Aurora',   vars: { '--abyss':'#060f0b','--cortex':'#0c1a14','--synapse':'#142920','--axon':'#5eead4','--impulse':'#c084fc','--resolved':'#86efac' } },
    ember:    { name: 'Ember',    vars: { '--abyss':'#100806','--cortex':'#1a0f08','--synapse':'#281810','--axon':'#fb923c','--impulse':'#ef4444','--resolved':'#fbbf24' } },
  };

  var currentTheme = 'void';
  var defaultVars  = {};

  function captureDefaults() {
    var s = getComputedStyle(document.documentElement);
    ['--abyss','--cortex','--synapse','--axon','--impulse','--resolved'].forEach(function (v) {
      defaultVars[v] = s.getPropertyValue(v).trim();
    });
  }

  function setTheme(id) {
    var t = THEMES[id]; if (!t) return;
    Object.keys(defaultVars).forEach(function (v) {
      document.documentElement.style.setProperty(v, defaultVars[v]);
    });
    Object.keys(t.vars).forEach(function (v) {
      document.documentElement.style.setProperty(v, t.vars[v]);
    });
    currentTheme = id;
    toast('Theme: ' + t.name, 'info');
  }

  function cycleTheme() {
    var keys = Object.keys(THEMES);
    setTheme(keys[(keys.indexOf(currentTheme) + 1) % keys.length]);
  }

  /* ═══════════════════════════════════════════════════════════════
     TOAST NOTIFICATIONS
     ═══════════════════════════════════════════════════════════════ */
  function toast(msg, type) {
    type = type || 'info';
    var box = document.getElementById('toast-container'); if (!box) return;
    var el  = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.textContent = msg;
    box.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 300);
    }, 2500);
  }
  window.Nap.toast = toast;

  /* ═══════════════════════════════════════════════════════════════
     COMMAND PALETTE  (Ctrl+K)
     ═══════════════════════════════════════════════════════════════ */
  var COMMANDS = [
    { label: '▶  Build Project',         action: function () { document.getElementById('build-btn').click(); } },
    { label: '🌐 Toggle Live Preview',    action: function () { if (window.Nap.preview) window.Nap.preview.toggle(); } },
    { label: '🔄 Refresh Live Preview',   action: function () { if (window.Nap.preview) window.Nap.preview.refresh(); } },
    { label: '↓  Export as ZIP',          action: function () { document.getElementById('export-btn').click(); } },
    { label: '▶  Run Active File',        action: function () { document.getElementById('run-btn').click(); } },
    { label: '⌨  Toggle Terminal',        action: function () { toggleTerminal(); } },
    { label: '🔍 Search in Files',         action: function () { toggleSearch(); } },
    { label: '🎨 Theme → Void',           action: function () { setTheme('void'); } },
    { label: '🎨 Theme → Midnight',       action: function () { setTheme('midnight'); } },
    { label: '🎨 Theme → Aurora',         action: function () { setTheme('aurora'); } },
    { label: '🎨 Theme → Ember',          action: function () { setTheme('ember'); } },
    { label: '🔧 Toggle Auto-Fix',        action: function () { document.getElementById('fix-btn').click(); } },
    { label: '⌫  Clear Pipeline Output',  action: function () { document.getElementById('clear-output-btn').click(); } },
    { label: '⌨  Keyboard Shortcuts',     action: function () { toggleShortcuts(); } },
    { label: '+  New File',               action: function () { promptNewFile(); } },
    { label: '✕  Close Active Tab',       action: function () { closeActiveTab(); } },
    { label: '◧  Toggle Sidebar',         action: function () { toggleSidebar(); } },
    { label: '◨  Toggle Pipeline Panel',  action: function () { togglePipeline(); } },
  ];

  function fileCmds() {
    var fs = window.Nap.fs; if (!fs) return [];
    return fs.listFiles().map(function (p) {
      return { label: '📄 Open ' + p, action: function () { events.emit('file:opened', { path: p }); } };
    });
  }

  function openPalette() {
    var ov = document.getElementById('cmd-palette');
    var ip = document.getElementById('cmd-search');
    ov.classList.remove('hidden');
    ip.value = '';
    ip.focus();
    renderPalette('');
  }

  function closePalette() { document.getElementById('cmd-palette').classList.add('hidden'); }

  function renderPalette(q) {
    var el = document.getElementById('cmd-results');
    var all = COMMANDS.concat(fileCmds());
    var lo  = q.toLowerCase();
    var list = lo ? all.filter(function (c) { return c.label.toLowerCase().indexOf(lo) !== -1; }) : all;

    el.innerHTML = '';
    list.slice(0, 14).forEach(function (c, i) {
      var row = document.createElement('div');
      row.className = 'cmd-row' + (i === 0 ? ' active' : '');
      row.textContent = c.label;
      row.addEventListener('click', function () { closePalette(); c.action(); });
      row.addEventListener('mouseenter', function () {
        el.querySelectorAll('.cmd-row').forEach(function (r) { r.classList.remove('active'); });
        row.classList.add('active');
      });
      el.appendChild(row);
    });
  }

  function paletteNav(dir) {
    var rows = document.querySelectorAll('#cmd-results .cmd-row');
    if (!rows.length) return;
    var ai = -1;
    rows.forEach(function (r, i) { if (r.classList.contains('active')) ai = i; });
    rows.forEach(function (r) { r.classList.remove('active'); });
    var ni = (ai + dir + rows.length) % rows.length;
    rows[ni].classList.add('active');
    rows[ni].scrollIntoView({ block: 'nearest' });
  }

  function paletteExec() {
    var a = document.querySelector('#cmd-results .cmd-row.active');
    if (a) a.click();
  }

  /* ═══════════════════════════════════════════════════════════════
     INTEGRATED TERMINAL  (Ctrl+`)
     ═══════════════════════════════════════════════════════════════ */
  var termVisible = false;

  function toggleTerminal() {
    termVisible = !termVisible;
    document.getElementById('terminal').classList.toggle('hidden', !termVisible);
    if (termVisible) document.getElementById('terminal-input').focus();
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function termRun(cmd) {
    var fs = window.Nap.fs;
    var out = document.getElementById('terminal-output');
    var p  = cmd.trim().split(/\s+/);
    var b  = p[0];
    var r  = '';

    switch (b) {
      case 'ls': case 'dir':
        r = fs ? fs.listFiles().join('\n') : '(empty)'; break;
      case 'cat': case 'type':
        if (!p[1]) { r = 'Usage: cat <file>'; break; }
        var c = fs ? fs.readFile(p[1]) : null;
        r = c !== null ? c : 'File not found: ' + p[1]; break;
      case 'echo':  r = p.slice(1).join(' '); break;
      case 'pwd':   r = '/' + (window.Nap.state.project.name || 'project'); break;
      case 'clear': out.innerHTML = ''; return;
      case 'whoami': r = 'nap-agent'; break;
      case 'date':   r = new Date().toString(); break;
      case 'uname':  r = 'NAP v2.0.0 (Enhanced Agentic IDE)'; break;
      case 'help':
        r = 'Commands:\n  ls / dir        List files\n  cat <file>      Show file\n  echo <text>     Print text\n  pwd             Working dir\n  clear           Clear terminal\n  node <file>     Run JS sandbox\n  python <file>   Run Python\n  git status      Git status\n  git log         Git log\n  npm install     Install deps\n  npm test        Run tests\n  npm run dev     Dev server & Web Preview\n  nap <cmd>       NAP CLI interactive agent\n  help            This list';
        break;
      case 'node':
        if (!p[1]) { r = 'Usage: node <file>'; break; }
        var js = fs ? fs.readFile(p[1]) : null;
        if (!js) { r = 'File not found: ' + p[1]; break; }
        
        // Real JS sandbox execution in terminal!
        const logs = [];
        const customConsole = {
          log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          error: (...args) => logs.push('ERROR: ' + args.join(' ')),
          warn: (...args) => logs.push('WARN: ' + args.join(' ')),
        };
        try {
          const fn = new Function('console', js);
          fn(customConsole);
          r = '$ node ' + p[1] + '\n' + (logs.length ? logs.join('\n') : '(no console output)') + '\n\n✓ exit 0';
        } catch (err) {
          r = '$ node ' + p[1] + '\n' + (logs.length ? logs.join('\n') + '\n' : '') + 'Runtime Error: ' + err.message + '\n\n✗ exit 1';
        }
        break;
      case 'python':
        if (!p[1]) { r = 'Usage: python <file>'; break; }
        if (p[1] === 'app.py' || p[1] === 'main.py') {
          r = '* Serving Flask app "app.py" (lazy loading)\n* Environment: production\n  WARNING: This is a development server.\n* Debug mode: on\n* Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)';
          setTimeout(function() { if (window.Nap.preview) window.Nap.preview.show(); }, 500);
          break;
        }
        var py = fs ? fs.readFile(p[1]) : null;
        if (!py) { r = 'File not found: ' + p[1]; break; }
        var pr = []; var prx = /print\(\s*(['"`])(.*?)\1/g; var pm;
        while ((pm = prx.exec(py))) pr.push(pm[2]);
        r = pr.length ? pr.join('\n') : '(no output)'; break;
      case 'git':
        if (p[1] === 'status') {
          var fl = fs ? fs.listFiles() : [];
          r = 'On branch main\n\nChanges to be committed:\n' + fl.map(function(f){return '  new file: '+f;}).join('\n');
        } else if (p[1] === 'log') {
          r = 'commit a1b2c3d (HEAD → main)\nAuthor: NAP <nap@agent.ai>\nDate:   ' + new Date().toUTCString() + '\n\n    Initial commit by NAP pipeline';
        } else { r = 'git: unknown "' + (p[1]||'') + '"'; }
        break;
      case 'npm':
        if (p[1]==='install'||p[1]==='i') r = 'added 142 packages in 3.2s\n\n14 packages looking for funding\n  run npm fund for details';
        else if (p[1]==='test') r = '> jest\n\n PASS  tests/test.js\n  ✓ initialises (2ms)\n  ✓ basic math (1ms)\n\nTests: 2 passed\nTime:  0.83s';
        else if (p[1]==='run'&&p[2]==='dev') {
          r = '> vite\n\n  VITE v5.0.0  ready in 312ms\n\n  ➜  Local:   http://localhost:3000/\n  ➜  Press c to open browser';
          setTimeout(function() { if (window.Nap.preview) window.Nap.preview.show(); }, 550);
        }
        else r = 'npm: unknown "' + (p[1]||'') + '"';
        break;
      case 'pip':
        r = p[1]==='install' ? 'Successfully installed ' + (p.slice(2).join(', ')||'requirements') : 'pip: unknown';
        break;
      case 'nap':
        const sub = p[1];
        if (sub === 'chat') {
          const query = p.slice(2).join(' ').replace(/^['"]|['"]$/g, '');
          if (!query) { r = 'Usage: nap chat "<your question>"'; break; }
          r = '🤖 NAP Agent:\n' + simulateAgentChat(query);
        } else if (sub === 'edit') {
          const file = p[2];
          const inst = p.slice(3).join(' ').replace(/^['"]|['"]$/g, '');
          if (!file || !inst) { r = 'Usage: nap edit <file> "<instructions>"'; break; }
          if (!fs || !fs.readFile(file)) { r = 'File not found: ' + file; break; }
          
          const oldContent = fs.readFile(file);
          const newContent = simulateAgentEdit(file, oldContent, inst);
          fs.updateFile(file, newContent);
          events.emit('file:updated', { path: file });
          toast('File updated: ' + file, 'success');
          r = '🤖 NAP Agent: Modified ' + file + ' based on instructions.\nCheck active tab to see updates!';
        } else if (sub === 'audit') {
          r = '🤖 Running Security Scan...\n';
          const hits = [];
          fs.listFiles().forEach(path => {
            const c = fs.readFile(path); if (!c) return;
            if (/eval\s*\(/.test(c)) hits.push('🔴 [HIGH] ' + path + ' - Use of eval() is highly insecure.');
            if (/innerHTML\s*=/.test(c)) hits.push('🟡 [MEDIUM] ' + path + ' - Use of innerHTML can lead to XSS vulnerabilities.');
            if (/(password|secret|api.?key)\s*[:=]\s*['"][^'"]+/i.test(c)) hits.push('🔴 [HIGH] ' + path + ' - Hardcoded API Keys / secrets found.');
          });
          r += hits.length ? hits.join('\n') : '💚 No vulnerability hits found!';
        } else if (sub === 'lint') {
          r = '🤖 Running Linter...\n';
          const issues = [];
          fs.listFiles().forEach(path => {
            const c = fs.readFile(path); if (!c) return;
            if (/\bvar\s/.test(c) && /\.js$/.test(path)) issues.push('⚠ [WARNING] ' + path + ' - Found usage of "var", consider refactoring to "const" or "let".');
            if (/console\.log/.test(c)) issues.push('ℹ [INFO] ' + path + ' - Active console.log statements left in code.');
          });
          r += issues.length ? issues.join('\n') : '💚 Code style looks excellent!';
        } else {
          r = 'Usage: nap <command>\n\nCommands:\n  chat "<question>"    Chat with the coding agent\n  edit <file> "<inst>" Edit a file using agent instructions\n  audit                Run security audit\n  lint                 Run quality linter';
        }
        break;
      default:
        r = 'Command not found: ' + b + '. Type "help" for options.';
    }

    var line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = '<span class="terminal-prompt-text">$ </span><span class="terminal-cmd">' + esc(cmd) + '</span>';
    out.appendChild(line);
    if (r) {
      var res = document.createElement('div');
      res.className = 'terminal-result';
      res.textContent = r;
      out.appendChild(res);
    }
    out.scrollTop = out.scrollHeight;
  }

  /* ─── Interactive Agent CLI Helpers ─── */
  function simulateAgentChat(query) {
    const fs = window.Nap.fs;
    const files = fs ? fs.listFiles() : [];
    const lo = query.toLowerCase();
    
    if (lo.includes('file') || lo.includes('structure')) {
      return 'I analyzed the project structure. We have ' + files.length + ' files:\n' + files.map(f => ' - ' + f).join('\n') + '\n\nAll files are generated using clean separation of concerns.';
    }
    if (lo.includes('react') || lo.includes('hooks')) {
      return 'The React architecture leverages functional components and the `useState` hook. State flows downwards to components, maintaining unidirectional flow.';
    }
    if (lo.includes('explain') || lo.includes('how work')) {
      return 'This project is a multi-agent modular application. Its frontend uses custom ES modules, and a pub/sub EventBus for decoupled communication. Code generation is sandboxed and previewed in real-time.';
    }
    return 'I am the NAP Local Coding Agent. I have full read/write access to your virtual filesystem. You can ask me to edit files (e.g. `nap edit src/App.jsx "add a footer"`) or run audits (`nap audit`).';
  }

  function simulateAgentEdit(file, content, inst) {
    const lo = inst.toLowerCase();
    
    if (file.endsWith('.html')) {
      if (lo.includes('title') || lo.includes('heading')) {
        const match = inst.match(/["'](.*?)["']/);
        const val = match ? match[1] : 'NAP Enhanced Webpage';
        return content.replace(/<h1>(.*?)<\/h1>/, '<h1>' + val + '</h1>')
                      .replace(/<title>(.*?)<\/title>/, '<title>' + val + '</title>');
      }
    }
    if (file.endsWith('.jsx') || file.endsWith('.js')) {
      if (lo.includes('title') || lo.includes('heading')) {
        const match = inst.match(/["'](.*?)["']/);
        const val = match ? match[1] : 'NAP Enhanced Webpage';
        return content.replace(/<h1>(.*?)<\/h1>/, '<h1>' + val + '</h1>');
      }
      if (lo.includes('color') || lo.includes('style') || lo.includes('css')) {
        return content.replace('className="app"', 'className="app" style={{ border: "2px solid #3b82f6", borderRadius: "12px", padding: "20px" }}');
      }
      if (lo.includes('state') || lo.includes('count') || lo.includes('counter')) {
        return content.replace('useState(0)', 'useState(100) /* modified by NAP agent */');
      }
    }
    if (file.endsWith('.css')) {
      if (lo.includes('red') || lo.includes('color')) {
        return content + '\n\n/* Modified by NAP */\nbody { background: #450a0a !important; color: #fca5a5 !important; }';
      }
      if (lo.includes('font') || lo.includes('serif')) {
        return content + '\n\n/* Modified by NAP */\n* { font-family: Georgia, serif !important; }';
      }
      return content + '\n\n/* Style tweak: ' + inst + ' */\n.app { box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3); }';
    }
    const comment = file.endsWith('.py') ? '\n# Agent edit: ' + inst : '\n// Agent edit: ' + inst;
    return content + comment;
  }

  /* ═══════════════════════════════════════════════════════════════
     GLOBAL SEARCH  (Ctrl+Shift+F)
     ═══════════════════════════════════════════════════════════════ */
  var searchOpen = false;

  function toggleSearch() {
    searchOpen = !searchOpen;
    document.getElementById('search-panel').classList.toggle('hidden', !searchOpen);
    if (searchOpen) document.getElementById('search-input').focus();
  }

  function doSearch(q) {
    var el = document.getElementById('search-results');
    var elOutput = el; if (!elOutput) return;
    elOutput.innerHTML = '';
    var fs = window.Nap.fs; if (!fs || !q) return;
    var lo = q.toLowerCase();
    var hits = [];

    fs.listFiles().forEach(function (path) {
      var c = fs.readFile(path); if (!c) return;
      c.split('\n').forEach(function (line, i) {
        if (line.toLowerCase().indexOf(lo) !== -1) hits.push({ path: path, ln: i + 1, text: line.trim() });
      });
    });

    if (!hits.length) { elOutput.innerHTML = '<div class="search-empty">No results for "' + esc(q) + '"</div>'; return; }

    var count = document.createElement('div');
    count.className = 'search-count';
    count.textContent = hits.length + ' result' + (hits.length === 1 ? '' : 's');
    elOutput.appendChild(count);

    hits.slice(0, 60).forEach(function (h) {
      var row = document.createElement('div');
      row.className = 'search-result';
      row.innerHTML =
        '<span class="search-file">' + esc(h.path) + '</span>' +
        '<span class="search-ln">:' + h.ln + '</span>' +
        '<div class="search-preview">' + highlight(h.text, q) + '</div>';
      row.addEventListener('click', function () { events.emit('file:opened', { path: h.path }); toggleSearch(); });
      elOutput.appendChild(row);
    });
  }

  function highlight(text, q) {
    var e = esc(text);
    var idx = e.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return e;
    return e.slice(0, idx) + '<mark>' + e.slice(idx, idx + q.length) + '</mark>' + e.slice(idx + q.length);
  }

  /* ═══════════════════════════════════════════════════════════════
     SHORTCUTS MODAL  (Ctrl+/)
     ═══════════════════════════════════════════════════════════════ */
  function toggleShortcuts() { document.getElementById('shortcuts-modal').classList.toggle('hidden'); }

  /* ═══════════════════════════════════════════════════════════════
     SIDEBAR / PIPELINE TOGGLE  (Ctrl+B)
     ═══════════════════════════════════════════════════════════════ */
  function toggleSidebar() {
    var sb = document.getElementById('sidebar');
    sb.classList.toggle('panel-collapsed');
    document.getElementById('workspace').style.gridTemplateColumns =
      sb.classList.contains('panel-collapsed') ? '0px 1fr var(--pipeline-w)' : '';
  }

  function togglePipeline() {
    var ap = document.getElementById('agent-panel');
    ap.classList.toggle('panel-collapsed');
    document.getElementById('workspace').style.gridTemplateColumns =
      ap.classList.contains('panel-collapsed') ? 'var(--sidebar-w) 1fr 0px' : '';
  }

  /* ═══════════════════════════════════════════════════════════════
     STATUS BAR
     ═══════════════════════════════════════════════════════════════ */
  function updateStatus() {
    var ed = window.Nap.editor; if (!ed) return;
    var path = ed.getActiveTab();
    var langEl = document.getElementById('status-lang');
    var lnEl   = document.getElementById('status-lines');
    if (!path) { if (langEl) langEl.textContent = ''; if (lnEl) lnEl.textContent = ''; return; }
    var fs = window.Nap.fs;
    var c  = fs ? fs.readFile(path) : '';
    if (langEl) langEl.textContent = utils.languageFromExt(utils.getExtension(path));
    if (lnEl)   lnEl.textContent   = c ? c.split('\n').length + ' ln' : '';
  }

  /* ═══════════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════════ */
  function promptNewFile() {
    var name = prompt('File path (e.g. src/utils.js):');
    if (!name) return;
    var fs = window.Nap.fs;
    if (fs) { fs.createFile(name, '// ' + name + '\n'); events.emit('file:opened', { path: name }); toast('Created ' + name, 'success'); }
  }

  function closeActiveTab() {
    var ed = window.Nap.editor;
    if (ed && ed.getActiveTab()) ed.close(ed.getActiveTab());
  }

  /* ═══════════════════════════════════════════════════════════════
     INIT — wire everything up
     ═══════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    captureDefaults();

    // Command palette
    var cmdIn = document.getElementById('cmd-search');
    if (cmdIn) {
      cmdIn.addEventListener('input', function () { renderPalette(cmdIn.value); });
      cmdIn.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown')  { e.preventDefault(); paletteNav(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); paletteNav(-1); }
        else if (e.key === 'Enter')   { e.preventDefault(); paletteExec(); }
        else if (e.key === 'Escape')  closePalette();
      });
    }
    var palBg = document.getElementById('cmd-palette');
    if (palBg) palBg.addEventListener('click', function (e) { if (e.target === palBg) closePalette(); });

    // Terminal
    var termIn = document.getElementById('terminal-input');
    if (termIn) termIn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var v = termIn.value.trim(); if (v) termRun(v); termIn.value = ''; }
    });
    var ct = document.getElementById('close-terminal');
    if (ct) ct.addEventListener('click', toggleTerminal);

    // Search
    var si = document.getElementById('search-input');
    if (si) {
      var db;
      si.addEventListener('input', function () { clearTimeout(db); db = setTimeout(function () { doSearch(si.value); }, 200); });
      si.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggleSearch(); });
    }
    var cs = document.getElementById('close-search');
    if (cs) cs.addEventListener('click', toggleSearch);

    // Header buttons
    var tb = document.getElementById('theme-btn');    if (tb) tb.addEventListener('click', cycleTheme);
    var tmb = document.getElementById('terminal-btn'); if (tmb) tmb.addEventListener('click', toggleTerminal);

    // Shortcuts modal backdrop
    var sm = document.getElementById('shortcuts-modal');
    if (sm) sm.addEventListener('click', function (e) { if (e.target === sm) toggleShortcuts(); });

    // New file
    var nf = document.getElementById('new-file-btn');
    if (nf) nf.addEventListener('click', promptNewFile);

    // ── Global keyboard shortcuts ────────────────────────────────
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey||e.metaKey) && e.key === 'k') { e.preventDefault(); openPalette(); }
      if ((e.ctrlKey||e.metaKey) && e.shiftKey && (e.key==='F'||e.key==='f')) { e.preventDefault(); toggleSearch(); }
      if ((e.ctrlKey||e.metaKey) && e.key === '`') { e.preventDefault(); toggleTerminal(); }
      if ((e.ctrlKey||e.metaKey) && e.key === 'w') { e.preventDefault(); closeActiveTab(); }
      if ((e.ctrlKey||e.metaKey) && e.key === 'b') { e.preventDefault(); toggleSidebar(); }
      if ((e.ctrlKey||e.metaKey) && e.key === 'g') { e.preventDefault(); if (window.Nap.preview) window.Nap.preview.toggle(); }
      if ((e.ctrlKey||e.metaKey) && e.key === '/') { e.preventDefault(); toggleShortcuts(); }
      if (e.key === 'Escape') {
        closePalette();
        if (searchOpen) toggleSearch();
        var smod = document.getElementById('shortcuts-modal');
        if (smod && !smod.classList.contains('hidden')) toggleShortcuts();
      }
    });

    // Status bar
    events.on('tab:switched', updateStatus);
    events.on('tab:closed',   updateStatus);
    events.on('file:updated', updateStatus);

    // Pipeline toast
    events.on('pipeline:complete', function () { toast('Pipeline complete!', 'success'); });
  });
})();
