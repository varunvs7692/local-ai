// ================================================================
// NAP Editor — Tab Manager + Syntax-Highlighted Code Display
// ================================================================
(function () {
  'use strict';

  const { events, utils } = window.Nap;

  class TabManager {
    constructor() {
      this.tabs = [];
      this.activeTab = null;
      this.tabBar = null;
      this.editorArea = null;
      this.editorContent = null;
      this.lineNumbers = null;
      this.welcomeScreen = null;
    }

    init() {
      this.tabBar        = document.getElementById('tab-bar');
      this.editorArea    = document.getElementById('editor-area');
      this.editorContent = document.getElementById('editor-content');
      this.lineNumbers   = document.getElementById('line-numbers');
      this.welcomeScreen = document.getElementById('welcome-screen');

      events.on('file:opened',  d => this.open(d.path));
      events.on('file:deleted', d => this.close(d.path));
      events.on('file:updated', d => { if (d.path === this.activeTab) this._display(d.path); });
      events.on('file:created', d => { if (this.tabs.length === 0) this.open(d.path); });
      events.on('run:execute',  () => this._simulateRun());
    }

    open(path) {
      if (!this.tabs.includes(path)) this.tabs.push(path);
      this.activeTab = path;
      this._renderTabs();
      this._display(path);
      events.emit('tab:switched', { path });
      this.editorArea.classList.add('visible');
      if (this.welcomeScreen) this.welcomeScreen.classList.add('hidden');
    }

    close(path) {
      const idx = this.tabs.indexOf(path);
      if (idx === -1) return;
      this.tabs.splice(idx, 1);

      if (this.activeTab === path) {
        if (this.tabs.length > 0) {
          const ni = Math.min(idx, this.tabs.length - 1);
          this.activeTab = this.tabs[ni];
          this._display(this.activeTab);
          events.emit('tab:switched', { path: this.activeTab });
        } else {
          this.activeTab = null;
          this.editorArea.classList.remove('visible');
          if (this.welcomeScreen) this.welcomeScreen.classList.remove('hidden');
        }
      }
      this._renderTabs();
      events.emit('tab:closed', { path });
    }

    _renderTabs() {
      this.tabBar.innerHTML = '';
      this.tabs.forEach(path => {
        const tab = document.createElement('div');
        tab.className = 'tab' + (path === this.activeTab ? ' active' : '');

        const name = utils.getFilename(path);
        tab.innerHTML =
          '<span class="tab-name">' + name + '</span>' +
          '<button class="tab-close" title="Close">✕</button>';

        tab.addEventListener('click', e => {
          if (!e.target.classList.contains('tab-close')) this.open(path);
        });
        tab.querySelector('.tab-close').addEventListener('click', e => {
          e.stopPropagation();
          this.close(path);
        });

        this.tabBar.appendChild(tab);
      });
    }

    _display(path) {
      const fs = window.Nap.fs;
      if (!fs) return;
      const content = fs.readFile(path);
      if (content === null) return;

      const lang = fs.getLanguage(path);
      const code = this.editorContent.querySelector('code') || this.editorContent;

      code.textContent = content;
      code.className = lang ? 'language-' + lang : '';

      if (window.hljs && lang && lang !== 'plaintext') {
        try { window.hljs.highlightElement(code); } catch (_) {}
      }

      // Line numbers
      const lines = content.split('\n');
      this.lineNumbers.innerHTML = lines.map((_, i) => '<div>' + (i + 1) + '</div>').join('');
    }

    // ── Simulated execution ──
    _simulateRun() {
      if (!this.activeTab) return;
      const fs = window.Nap.fs;
      const content = fs.readFile(this.activeTab);
      if (!content) return;

      const ext = utils.getExtension(this.activeTab);
      const overlay = document.getElementById('execution-output');
      const pre     = document.getElementById('exec-content');
      const closeEl = document.getElementById('close-exec');

      overlay.classList.remove('hidden');
      pre.textContent = this._exec(ext, content);
      closeEl.onclick = () => overlay.classList.add('hidden');
    }

    _exec(ext, src) {
      if (ext === 'js') {
        const logs = [];
        const customConsole = {
          log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          error: (...args) => logs.push('ERROR: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          warn: (...args) => logs.push('WARN: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          info: (...args) => logs.push('INFO: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        };
        try {
          const fn = new Function('console', src);
          fn(customConsole);
          return '$ node ' + utils.getFilename(this.activeTab) + '\n'
            + (logs.length ? logs.join('\n') : '(no console output)')
            + '\n\n✓ exited 0';
        } catch (err) {
          return '$ node ' + utils.getFilename(this.activeTab) + '\n'
            + (logs.length ? logs.join('\n') + '\n' : '')
            + 'TypeError / Runtime Exception: ' + err.message
            + '\n\n✗ exited with errors';
        }
      }
      if (['jsx', 'ts', 'tsx'].includes(ext)) {
        const logs = [];
        const rx = /console\.log\(\s*(['"`])(.*?)\1/g;
        let m; while ((m = rx.exec(src))) logs.push(m[2]);
        return '$ node ' + utils.getFilename(this.activeTab) + '\n'
          + (logs.length ? logs.join('\n') : '(no console output)')
          + '\n\n✓ exited 0';
      }
      if (ext === 'py') {
        const logs = [];
        const rx = /print\(\s*(['"`])(.*?)\1/g;
        let m; while ((m = rx.exec(src))) logs.push(m[2]);
        return '$ python ' + utils.getFilename(this.activeTab) + '\n'
          + (logs.length ? logs.join('\n') : '(no output)')
          + '\n\n✓ finished';
      }
      if (ext === 'html') {
        if (window.Nap.preview) window.Nap.preview.show();
        return '🌐 Opened in Live Preview panel\n✓ Document loaded';
      }
      return '⚠ No runner for .' + ext + ' files';
    }

    getOpenTabs() { return [...this.tabs]; }
    getActiveTab() { return this.activeTab; }
  }

  // ── Bootstrap ──
  const tm = new TabManager();
  window.Nap.editor = tm;
  document.addEventListener('DOMContentLoaded', () => tm.init());
})();
