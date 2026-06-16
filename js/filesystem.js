// ================================================================
// NAP Filesystem — VirtualFS + Tree Renderer
// ================================================================
(function () {
  'use strict';

  const { events, utils } = window.Nap;

  // ─── VirtualFS ──────────────────────────────────────────────────
  class VirtualFS {
    constructor() { this._files = new Map(); }

    createFile(path, content, language) {
      if (!content) content = '';
      if (!language) language = utils.languageFromExt(utils.getExtension(path));
      this._files.set(path, { content, language });
      events.emit('file:created', { path, content, language });
    }

    readFile(path) {
      const f = this._files.get(path);
      return f ? f.content : null;
    }

    getLanguage(path) {
      const f = this._files.get(path);
      return f ? f.language : utils.languageFromExt(utils.getExtension(path));
    }

    updateFile(path, content) {
      const f = this._files.get(path);
      if (!f) return false;
      f.content = content;
      events.emit('file:updated', { path, content });
      return true;
    }

    deleteFile(path) {
      if (!this._files.has(path)) return false;
      this._files.delete(path);
      events.emit('file:deleted', { path });
      return true;
    }

    listFiles() { return Array.from(this._files.keys()).sort(); }

    getTree() {
      const tree = {};
      this.listFiles().forEach(path => {
        const parts = path.split('/');
        let cur = tree;
        parts.forEach((part, i) => {
          if (i === parts.length - 1) {
            cur[part] = { _isFile: true, _path: path };
          } else {
            if (!cur[part]) cur[part] = {};
            cur = cur[part];
          }
        });
      });
      return tree;
    }

    clear() {
      this._files.clear();
      events.emit('project:reset');
    }

    getFileCount() { return this._files.size; }
  }

  // ─── Tree Renderer ──────────────────────────────────────────────
  class TreeRenderer {
    constructor(container) {
      this.el = container;
      this.activeFile = null;

      events.on('file:created', () => this.render());
      events.on('file:deleted', () => this.render());
      events.on('project:reset', () => this.render());
      events.on('tab:switched', d => {
        this.activeFile = d.path;
        this._markActive();
      });
    }

    render() {
      const fs = window.Nap.fs;
      if (!fs || fs.getFileCount() === 0) {
        this.el.innerHTML = '<div class="tree-empty">No files yet.<br>Describe a project or pick a template.</div>';
        return;
      }
      this.el.innerHTML = '';
      this._buildNode(fs.getTree(), this.el);
    }

    // Recursive builder — folders first, alphabetical
    _buildNode(node, parent) {
      const entries = Object.entries(node).sort(([aK, aV], [bK, bV]) => {
        if (aV._isFile && !bV._isFile) return 1;
        if (!aV._isFile && bV._isFile) return -1;
        return aK.localeCompare(bK);
      });

      entries.forEach(([name, val]) => {
        val._isFile ? this._file(name, val._path, parent) : this._folder(name, val, parent);
      });
    }

    _folder(name, children, parent) {
      const wrap = document.createElement('div');
      wrap.className = 'tree-folder';

      const row = document.createElement('div');
      row.className = 'tree-item';
      row.innerHTML =
        '<span class="tree-icon tree-chevron">▾</span>' +
        '<span class="tree-icon">📁</span>' +
        '<span class="tree-name">' + name + '</span>';
      row.addEventListener('click', () => wrap.classList.toggle('collapsed'));

      const kids = document.createElement('div');
      kids.className = 'tree-children';

      wrap.appendChild(row);
      wrap.appendChild(kids);
      parent.appendChild(wrap);
      this._buildNode(children, kids);
    }

    _file(name, path, parent) {
      const row = document.createElement('div');
      row.className = 'tree-item' + (path === this.activeFile ? ' active' : '');
      row.dataset.path = path;

      const ext = utils.getExtension(path);
      row.innerHTML =
        '<span class="tree-icon">' + this._icon(ext) + '</span>' +
        '<span class="tree-name">' + name + '</span>';

      row.addEventListener('click', () => events.emit('file:opened', { path }));
      parent.appendChild(row);
    }

    _icon(ext) {
      const m = {
        js:'🟡', jsx:'⚛️', ts:'🔷', tsx:'⚛️',
        py:'🐍', rb:'💎', go:'🔵', rs:'🦀', java:'☕',
        html:'🌐', css:'🎨', scss:'🎨',
        json:'📋', md:'📝', yml:'⚙️', yaml:'⚙️',
        env:'🔒', sql:'🗃️', sh:'⚡', txt:'📄',
      };
      return m[ext] || '📄';
    }

    _markActive() {
      this.el.querySelectorAll('.tree-item[data-path]').forEach(el => {
        el.classList.toggle('active', el.dataset.path === this.activeFile);
      });
    }
  }

  // ─── Bootstrap ──────────────────────────────────────────────────
  const fs = new VirtualFS();
  window.Nap.fs = fs;

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('file-tree');
    window.Nap.treeRenderer = new TreeRenderer(el);
    window.Nap.treeRenderer.render();
  });
})();
