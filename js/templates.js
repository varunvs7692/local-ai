// ================================================================
// NAP Templates — 6 Project Scaffolds with Real Code
// ================================================================
(function () {
  'use strict';

  var TEMPLATES = {
    /* ──────────────────────────────────────────────────────────────
       REACT APP
       ────────────────────────────────────────────────────────────── */
    react: {
      id: 'react', name: 'React App', description: 'Modern React with hooks + Vite',
      files: [
        { path: 'package.json', language: 'json', content:
'{\n  "name": "react-app",\n  "private": true,\n  "version": "1.0.0",\n' +
'  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "preview": "vite preview"\n  },\n' +
'  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  },\n' +
'  "devDependencies": {\n    "@vitejs/plugin-react": "^4.0.0",\n    "vite": "^5.0.0"\n  }\n}' },
        { path: 'index.html', language: 'html', content:
'<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n' +
'  <title>React App</title>\n</head>\n<body>\n  <div id="root"></div>\n' +
'  <script type="module" src="/src/main.jsx"></script>\n</body>\n</html>' },
        { path: 'vite.config.js', language: 'javascript', content:
"import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\n" +
"export default defineConfig({\n  plugins: [react()],\n  server: { port: 3000 }\n});" },
        { path: 'src/main.jsx', language: 'javascript', content:
"import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\n" +
"ReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);" },
        { path: 'src/App.jsx', language: 'javascript', content:
"import { useState } from 'react';\nimport './App.css';\n\n" +
"export default function App() {\n  const [count, setCount] = useState(0);\n\n" +
"  return (\n    <div className=\"app\">\n      <header>\n        <h1>React App</h1>\n" +
"        <p>Edit <code>src/App.jsx</code> and save to reload.</p>\n      </header>\n" +
"      <main>\n        <button onClick={() => setCount(c => c + 1)}>\n" +
"          Count: {count}\n        </button>\n      </main>\n    </div>\n  );\n}" },
        { path: 'src/App.css', language: 'css', content:
".app { max-width: 960px; margin: 0 auto; padding: 2rem; text-align: center; }\n" +
"h1 { font-size: 2.5rem; margin-bottom: .5rem; }\n" +
"button {\n  padding: .6em 1.2em; font-size: 1rem; font-weight: 500;\n" +
"  border: none; border-radius: 8px; background: #1a1a1a;\n" +
"  color: #fff; cursor: pointer; transition: background .2s;\n}\nbutton:hover { background: #333; }" },
        { path: 'src/index.css', language: 'css', content:
":root { font-family: Inter, system-ui, sans-serif; line-height: 1.5; color: #213547; }\n* { margin:0; padding:0; box-sizing:border-box; }\nbody { min-height:100vh; display:flex; place-items:center; }" },
      ]
    },

    /* ──────────────────────────────────────────────────────────────
       EXPRESS API
       ────────────────────────────────────────────────────────────── */
    express: {
      id: 'express', name: 'Express API', description: 'RESTful API with Express.js',
      files: [
        { path: 'package.json', language: 'json', content:
'{\n  "name": "express-api",\n  "version": "1.0.0",\n' +
'  "scripts": {\n    "start": "node src/server.js",\n    "dev": "nodemon src/server.js",\n    "test": "jest"\n  },\n' +
'  "dependencies": {\n    "express": "^4.18.2",\n    "cors": "^2.8.5",\n    "dotenv": "^16.3.1",\n    "helmet": "^7.1.0",\n    "morgan": "^1.10.0"\n  },\n' +
'  "devDependencies": {\n    "nodemon": "^3.0.2",\n    "jest": "^29.7.0",\n    "supertest": "^6.3.3"\n  }\n}' },
        { path: 'src/server.js', language: 'javascript', content:
"require('dotenv').config();\nconst express = require('express');\nconst cors = require('cors');\n" +
"const helmet = require('helmet');\nconst morgan = require('morgan');\nconst routes = require('./routes');\n\n" +
"const app = express();\nconst PORT = process.env.PORT || 3000;\n\n" +
"app.use(helmet());\napp.use(cors());\napp.use(morgan('dev'));\napp.use(express.json());\n\n" +
"app.use('/api', routes);\n\n" +
"app.get('/api/health', (req, res) => {\n  res.json({ status: 'ok', timestamp: new Date().toISOString() });\n});\n\n" +
"app.use((err, req, res, next) => {\n  console.error(err.stack);\n  res.status(500).json({ error: 'Internal server error' });\n});\n\n" +
"app.listen(PORT, () => console.log('Server on port ' + PORT));\n\nmodule.exports = app;" },
        { path: 'src/routes/index.js', language: 'javascript', content:
"const express = require('express');\nconst router = express.Router();\n\n" +
"let items = [\n  { id: 1, name: 'Item 1', status: 'active' },\n  { id: 2, name: 'Item 2', status: 'active' }\n];\n\n" +
"router.get('/items', (req, res) => res.json(items));\n\n" +
"router.get('/items/:id', (req, res) => {\n  const item = items.find(i => i.id === +req.params.id);\n" +
"  item ? res.json(item) : res.status(404).json({ error: 'Not found' });\n});\n\n" +
"router.post('/items', (req, res) => {\n  const { name } = req.body;\n" +
"  if (!name) return res.status(400).json({ error: 'Name required' });\n" +
"  const item = { id: items.length + 1, name, status: 'active' };\n  items.push(item);\n  res.status(201).json(item);\n});\n\n" +
"router.delete('/items/:id', (req, res) => {\n  const idx = items.findIndex(i => i.id === +req.params.id);\n" +
"  if (idx === -1) return res.status(404).json({ error: 'Not found' });\n  items.splice(idx, 1);\n  res.status(204).send();\n});\n\n" +
"module.exports = router;" },
        { path: '.env', language: 'plaintext', content: 'PORT=3000\nNODE_ENV=development' },
      ]
    },

    /* ──────────────────────────────────────────────────────────────
       PYTHON FLASK
       ────────────────────────────────────────────────────────────── */
    flask: {
      id: 'flask', name: 'Python Flask', description: 'Flask web application',
      files: [
        { path: 'app.py', language: 'python', content:
"from flask import Flask, jsonify, request, render_template\n\ndef create_app(config=None):\n" +
"    app = Flask(__name__)\n    app.config['SECRET_KEY'] = 'dev-secret-key'\n    if config:\n        app.config.update(config)\n\n" +
"    @app.route('/')\n    def index():\n        return render_template('index.html')\n\n" +
"    @app.route('/health')\n    def health():\n        return jsonify({'status': 'ok'})\n\n" +
"    @app.route('/api/items', methods=['GET'])\n    def get_items():\n        return jsonify(items)\n\n" +
"    @app.route('/api/items', methods=['POST'])\n    def create_item():\n        data = request.get_json()\n" +
"        if not data or 'name' not in data:\n            return jsonify({'error': 'Name required'}), 400\n" +
"        item = {'id': len(items)+1, 'name': data['name'], 'done': False}\n        items.append(item)\n" +
"        return jsonify(item), 201\n\n    return app\n\n" +
"items = [\n    {'id': 1, 'name': 'First item', 'done': False},\n    {'id': 2, 'name': 'Second item', 'done': True}\n]\n\n" +
"if __name__ == '__main__':\n    create_app().run(debug=True)" },
        { path: 'requirements.txt', language: 'plaintext', content: 'Flask==3.0.0\npython-dotenv==1.0.0\ngunicorn==21.2.0\npytest==7.4.3' },
        { path: 'templates/index.html', language: 'html', content:
'<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Flask App</title>\n' +
'  <link rel="stylesheet" href="{{ url_for(\'static\', filename=\'style.css\') }}">\n</head>\n<body>\n' +
'  <div class="container"><h1>Flask App</h1><p>Welcome.</p></div>\n</body>\n</html>' },
        { path: 'static/style.css', language: 'css', content:
"* { margin:0; padding:0; box-sizing:border-box; }\nbody { font-family:system-ui,sans-serif; line-height:1.6; color:#333; background:#f5f5f5; }\n" +
".container { max-width:800px; margin:2rem auto; padding:2rem; background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,.1); }\nh1 { margin-bottom:1rem; }" },
      ]
    },

    /* ──────────────────────────────────────────────────────────────
       NEXT.JS FULL-STACK
       ────────────────────────────────────────────────────────────── */
    nextjs: {
      id: 'nextjs', name: 'Next.js Full-Stack', description: 'Next.js App Router',
      files: [
        { path: 'package.json', language: 'json', content:
'{\n  "name": "nextjs-app",\n  "version": "1.0.0",\n' +
'  "scripts": { "dev": "next dev", "build": "next build", "start": "next start" },\n' +
'  "dependencies": { "next": "^14.0.0", "react": "^18.2.0", "react-dom": "^18.2.0" }\n}' },
        { path: 'app/layout.tsx', language: 'typescript', content:
"import type { Metadata } from 'next';\nimport './globals.css';\n\n" +
"export const metadata: Metadata = {\n  title: 'Next.js App',\n  description: 'Built with App Router',\n};\n\n" +
"export default function RootLayout({ children }: { children: React.ReactNode }) {\n" +
"  return <html lang=\"en\"><body>{children}</body></html>;\n}" },
        { path: 'app/page.tsx', language: 'typescript', content:
"export default function Home() {\n  return (\n    <main className=\"container\">\n" +
"      <h1>Welcome to Next.js</h1>\n      <p>Edit <code>app/page.tsx</code> to get started.</p>\n" +
"      <div className=\"grid\">\n        <a href=\"/api/hello\" className=\"card\">\n" +
"          <h2>API Routes →</h2>\n          <p>Build your API.</p>\n        </a>\n      </div>\n    </main>\n  );\n}" },
        { path: 'app/globals.css', language: 'css', content:
":root { --fg:#171717; --bg:#fff; }\n* { margin:0; padding:0; box-sizing:border-box; }\n" +
"body { font-family:system-ui,sans-serif; color:var(--fg); background:var(--bg); }\n" +
".container { max-width:960px; margin:0 auto; padding:4rem 2rem; }\nh1 { font-size:2.5rem; margin-bottom:1rem; }\n" +
".grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:1rem; margin-top:2rem; }\n" +
".card { padding:1.5rem; border:1px solid #eaeaea; border-radius:8px; text-decoration:none; color:inherit; transition:border .2s; }\n" +
".card:hover { border-color:#0070f3; }\n.card h2 { margin-bottom:.5rem; }" },
        { path: 'app/api/hello/route.ts', language: 'typescript', content:
"import { NextResponse } from 'next/server';\n\nexport async function GET() {\n" +
"  return NextResponse.json({ message: 'Hello from the API' });\n}" },
      ]
    },

    /* ──────────────────────────────────────────────────────────────
       CLI TOOL
       ────────────────────────────────────────────────────────────── */
    cli: {
      id: 'cli', name: 'CLI Tool', description: 'Node.js command-line app',
      files: [
        { path: 'package.json', language: 'json', content:
'{\n  "name": "my-cli",\n  "version": "1.0.0",\n  "bin": { "my-cli": "./bin/cli.js" },\n' +
'  "scripts": { "start": "node bin/cli.js", "test": "jest" },\n' +
'  "dependencies": { "commander": "^11.1.0", "chalk": "^4.1.2" }\n}' },
        { path: 'bin/cli.js', language: 'javascript', content:
"#!/usr/bin/env node\nconst { program } = require('commander');\nconst { greet, list } = require('../src/commands');\n\n" +
"program.name('my-cli').description('A CLI tool').version('1.0.0');\n\n" +
"program.command('greet <name>')\n  .description('Greet someone')\n  .option('-u, --uppercase', 'UPPERCASE')\n  .action(greet);\n\n" +
"program.command('list')\n  .description('List items')\n  .option('-f, --format <type>', 'Output format', 'table')\n  .action(list);\n\n" +
"program.parse();" },
        { path: 'src/commands/index.js', language: 'javascript', content:
"const chalk = require('chalk');\n\n" +
"function greet(name, opts) {\n  let msg = 'Hello, ' + name + '!';\n  if (opts.uppercase) msg = msg.toUpperCase();\n  console.log(chalk.green(msg));\n}\n\n" +
"function list(opts) {\n  const items = ['Alpha', 'Beta', 'Gamma'];\n  if (opts.format === 'json') { console.log(JSON.stringify(items, null, 2)); return; }\n" +
"  console.log(chalk.bold('\\nItems:\\n'));\n  items.forEach((it, i) => console.log(chalk.cyan('  ' + (i+1) + '. ' + it)));\n}\n\n" +
"module.exports = { greet, list };" },
      ]
    },

    /* ──────────────────────────────────────────────────────────────
       STATIC SITE
       ────────────────────────────────────────────────────────────── */
    static: {
      id: 'static', name: 'Static Site', description: 'HTML + CSS + JS website',
      files: [
        { path: 'index.html', language: 'html', content:
'<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Site</title>\n' +
'  <link rel="stylesheet" href="css/style.css">\n</head>\n<body>\n' +
'  <header><nav class="nav"><a href="#" class="logo">MySite</a></nav></header>\n' +
'  <main>\n    <section class="hero"><h1>Build something great</h1>\n' +
'      <p>A modern static site template.</p>\n      <a href="#work" class="btn">View Work</a></section>\n' +
'    <section id="work" class="section"><h2>Work</h2>\n' +
'      <div class="grid"><div class="card">Project 1</div><div class="card">Project 2</div><div class="card">Project 3</div></div></section>\n' +
'  </main>\n  <footer><p>&copy; 2024 MySite</p></footer>\n  <script src="js/main.js"></script>\n</body>\n</html>' },
        { path: 'css/style.css', language: 'css', content:
"* { margin:0; padding:0; box-sizing:border-box; }\n:root { --primary:#2563eb; --text:#1e293b; --muted:#64748b; }\n" +
"body { font-family:system-ui,sans-serif; color:var(--text); line-height:1.6; }\n" +
".nav { display:flex; justify-content:space-between; max-width:1200px; margin:0 auto; padding:1rem 2rem; }\n" +
".logo { font-weight:700; font-size:1.25rem; text-decoration:none; color:var(--text); }\n" +
".hero { text-align:center; padding:6rem 2rem; background:#f8fafc; }\n.hero h1 { font-size:3rem; margin-bottom:1rem; }\n" +
".hero p { font-size:1.25rem; color:var(--muted); margin-bottom:2rem; }\n" +
".btn { display:inline-block; padding:.75rem 2rem; background:var(--primary); color:#fff; text-decoration:none; border-radius:6px; }\n" +
".section { max-width:1200px; margin:0 auto; padding:4rem 2rem; }\n.section h2 { font-size:2rem; margin-bottom:1.5rem; }\n" +
".grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:1.5rem; }\n" +
".card { padding:2rem; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; }" },
        { path: 'js/main.js', language: 'javascript', content:
"// Smooth scroll\ndocument.querySelectorAll('a[href^=\"#\"]').forEach(a => {\n" +
"  a.addEventListener('click', e => {\n    e.preventDefault();\n    document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior:'smooth' });\n  });\n});\n\n" +
"// Fade-in on scroll\nconst obs = new IntersectionObserver(entries => {\n  entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; } });\n}, { threshold:.1 });\n\n" +
"document.querySelectorAll('.section').forEach(s => {\n  Object.assign(s.style, { opacity:'0', transform:'translateY(20px)', transition:'opacity .6s, transform .6s' });\n  obs.observe(s);\n});\n\nconsole.log('Site loaded');" },
      ]
    },

    /* ──────────────────────────────────────────────────────────────
       AST INTERPRETER VM
       ────────────────────────────────────────────────────────────── */
    interpreter: {
      id: 'interpreter', name: 'AST Interpreter VM', description: 'Visual Parser & Interpreter VM',
      files: [
        { path: 'package.json', language: 'json', content:
'{\n  "name": "ast-interpreter-vm",\n  "version": "1.0.0",\n' +
'  "scripts": {\n    "start": "node src/main.js"\n  },\n' +
'  "dependencies": {}\n}' },
        { path: 'index.html', language: 'html', content:
'<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n' +
'  <title>Visual AST Interpreter & Debugger VM</title>\n' +
'  <link rel="stylesheet" href="src/index.css">\n' +
'  <link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">\n' +
'</head>\n<body>\n' +
'  <div class="app-container">\n' +
'    <header class="app-header">\n' +
'      <div class="logo">◆ Interpreter VM</div>\n' +
'      <div class="controls">\n' +
'        <button id="btn-parse" class="btn secondary">🔍 Parse & Compile</button>\n' +
'        <div class="divider"></div>\n' +
'        <button id="btn-run" class="btn primary" disabled>▶ Run</button>\n' +
'        <button id="btn-step" class="btn secondary" disabled>👣 Step Over</button>\n' +
'        <button id="btn-reset" class="btn danger" disabled>🔄 Reset</button>\n' +
'        <select id="speed-select" class="speed-dropdown">\n' +
'          <option value="500">Normal (500ms)</option>\n' +
'          <option value="200">Fast (200ms)</option>\n' +
'          <option value="1000">Slow (1s)</option>\n' +
'        </select>\n' +
'      </div>\n' +
'    </header>\n\n' +
'    <div class="main-layout">\n' +
'      <aside class="panel editor-panel">\n' +
'        <div class="panel-header">📝 Source Code</div>\n' +
'        <textarea id="code-editor" spellcheck="false" autocomplete="off"></textarea>\n' +
'      </aside>\n\n' +
'      <section class="panel visualizer-panel">\n' +
'        <div class="panel-header">📐 AST Visualizer (Active Node Highlighted)</div>\n' +
'        <div class="canvas-wrapper">\n' +
'          <canvas id="ast-canvas" width="600" height="500"></canvas>\n' +
'        </div>\n' +
'      </section>\n\n' +
'      <aside class="panel state-panel">\n' +
'        <div class="panel-header">⚙️ VM Stack & Scope State</div>\n' +
'        <div class="state-container">\n' +
'          <table class="scope-table">\n' +
'            <thead>\n' +
'              <tr><th>Variable</th><th>Value</th></tr>\n' +
'            </thead>\n' +
'            <tbody id="variables-body">\n' +
'              <tr><td colspan="2" class="empty-vars">No active variables</td></tr>\n' +
'            </tbody>\n' +
'          </table>\n' +
'        </div>\n' +
'        <div class="panel-header border-top">💻 Terminal Output</div>\n' +
'        <div id="terminal" class="terminal-box">\n' +
'          <div id="terminal-content"></div>\n' +
'        </div>\n' +
'      </aside>\n' +
'    </div>\n' +
'  </div>\n\n' +
'  <script src="src/parser.js"></script>\n' +
'  <script src="src/interpreter.js"></script>\n' +
'  <script src="src/visualizer.js"></script>\n' +
'  <script src="src/main.js"></script>\n' +
'</body>\n' +
'</html>' },
        { path: 'src/index.css', language: 'css', content:
':root {\n  --bg-dark: #0f172a;\n  --bg-panel: rgba(30, 41, 59, 0.7);\n' +
'  --border: rgba(255, 255, 255, 0.08);\n  --text-primary: #f8fafc;\n' +
'  --text-secondary: #94a3b8;\n  --primary: #8b5cf6;\n' +
'  --primary-hover: #7c3aed;\n  --danger: #ef4444;\n' +
'  --success: #10b981;\n  --font-mono: \'JetBrains Mono\', monospace;\n}\n\n' +
'* { box-sizing: border-box; margin: 0; padding: 0; }\n\n' +
'body { background: var(--bg-dark); color: var(--text-primary); font-family: \'Inter\', sans-serif; height: 100vh; overflow: hidden; }\n\n' +
'.app-container { display: flex; flex-direction: column; height: 100vh; }\n\n' +
'.app-header { height: 60px; background: rgba(15, 23, 42, 0.9); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }\n\n' +
'.logo { font-family: \'Space Grotesk\', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--primary); }\n\n' +
'.controls { display: flex; align-items: center; gap: 10px; }\n\n' +
'.divider { width: 1px; height: 24px; background: var(--border); margin: 0 5px; }\n\n' +
'.btn { padding: 8px 16px; border-radius: 6px; border: none; font-weight: 500; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }\n\n' +
'.btn.primary { background: var(--primary); color: white; }\n.btn.primary:hover:not(:disabled) { background: var(--primary-hover); }\n' +
'.btn.secondary { background: #334155; color: var(--text-primary); }\n.btn.secondary:hover:not(:disabled) { background: #475569; }\n' +
'.btn.danger { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }\n.btn.danger:hover:not(:disabled) { background: rgba(239, 68, 68, 0.3); }\n' +
'.btn:disabled { opacity: 0.4; cursor: not-allowed; }\n\n' +
'.speed-dropdown { background: #1e293b; border: 1px solid var(--border); color: var(--text-primary); padding: 8px 12px; border-radius: 6px; outline: none; cursor: pointer; }\n\n' +
'.main-layout { flex: 1; display: grid; grid-template-columns: 320px 1fr 320px; gap: 1px; background: var(--border); }\n\n' +
'.panel { background: var(--bg-panel); display: flex; flex-direction: column; height: 100%; }\n\n' +
'.panel-header { padding: 12px 16px; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); border-bottom: 1px solid var(--border); }\n\n' +
'.panel-header.border-top { border-top: 1px solid var(--border); }\n\n' +
'.editor-panel textarea { flex: 1; background: rgba(15, 23, 42, 0.4); border: none; resize: none; color: #e2e8f0; font-family: var(--font-mono); font-size: 13px; line-height: 1.6; padding: 16px; outline: none; }\n\n' +
'.visualizer-panel { position: relative; }\n\n' +
'.canvas-wrapper { flex: 1; display: flex; justify-content: center; align-items: center; overflow: auto; background: rgba(15, 23, 42, 0.2); }\n\n' +
'#ast-canvas { background: transparent; }\n\n' +
'.state-panel { display: flex; flex-direction: column; }\n\n' +
'.state-container { flex: 1; overflow-y: auto; padding: 12px; }\n\n' +
'.scope-table { width: 100%; border-collapse: collapse; font-size: 13px; }\n.scope-table th { text-align: left; color: var(--text-secondary); padding: 8px; border-bottom: 1px solid var(--border); }\n' +
'.scope-table td { padding: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.03); }\n\n' +
'.empty-vars { text-align: center; color: var(--text-secondary); font-style: italic; padding: 20px 0; }\n\n' +
'.terminal-box { height: 200px; background: #090d16; padding: 12px; font-family: var(--font-mono); font-size: 12px; overflow-y: auto; line-height: 1.5; }\n\n' +
'#terminal-content div { margin-bottom: 6px; }\n' +
'.log-info { color: var(--text-secondary); }\n.log-success { color: var(--success); }\n.log-error { color: var(--danger); }\n.log-output { color: #38bdf8; font-weight: bold; }' },
        { path: 'src/parser.js', language: 'javascript', content:
'class Lexer {\n' +
'  constructor(src) {\n' +
'    this.src = src;\n' +
'    this.ptr = 0;\n' +
'    this.tokens = [];\n' +
'  }\n' +
'  tokenize() {\n' +
'    const isDigit = c => c >= \'0\' && c <= \'9\';\n' +
'    const isAlpha = c => (c >= \'a\' && c <= \'z\') || (c >= \'A\' && c <= \'Z\') || c === \'_\';\n' +
'    while (this.ptr < this.src.length) {\n' +
'      const c = this.src[this.ptr];\n' +
'      if (/\\s/.test(c)) { this.ptr++; continue; }\n' +
'      if (isDigit(c)) {\n' +
'        let val = \'\';\n' +
'        while (this.ptr < this.src.length && isDigit(this.src[this.ptr])) {\n' +
'          val += this.src[this.ptr++];\n' +
'        }\n' +
'        this.tokens.push({ type: \'NUMBER\', value: Number(val) });\n' +
'        continue;\n' +
'      }\n' +
'      if (isAlpha(c)) {\n' +
'        let val = \'\';\n' +
'        while (this.ptr < this.src.length && (isAlpha(this.src[this.ptr]) || isDigit(this.src[this.ptr]))) {\n' +
'          val += this.src[this.ptr++];\n' +
'        }\n' +
'        if (val === \'while\') this.tokens.push({ type: \'WHILE\', value: \'while\' });\n' +
'        else if (val === \'if\') this.tokens.push({ type: \'IF\', value: \'if\' });\n' +
'        else if (val === \'else\') this.tokens.push({ type: \'ELSE\', value: \'else\' });\n' +
'        else if (val === \'print\') this.tokens.push({ type: \'PRINT\', value: \'print\' });\n' +
'        else this.tokens.push({ type: \'IDENTIFIER\', value: val });\n' +
'        continue;\n' +
'      }\n' +
'      if (c === \'=\' && this.src[this.ptr + 1] === \'=\') {\n' +
'        this.tokens.push({ type: \'OPERATOR\', value: \'==\' });\n' +
'        this.ptr += 2;\n' +
'        continue;\n' +
'      }\n' +
'      if (\'+-*/><=\'.includes(c)) {\n' +
'        this.tokens.push({ type: \'OPERATOR\', value: c });\n' +
'        this.ptr++;\n' +
'        continue;\n' +
'      }\n' +
'      if (\'(){};\'.includes(c)) {\n' +
'        this.tokens.push({ type: c, value: c });\n' +
'        this.ptr++;\n' +
'        continue;\n' +
'      }\n' +
'      throw new Error(`Unexpected character: ${c} at pos ${this.ptr}`);\n' +
'    }\n' +
'    this.tokens.push({ type: \'EOF\', value: \'\' });\n' +
'    return this.tokens;\n' +
'  }\n' +
'}\n\n' +
'class Parser {\n' +
'  constructor(tokens) {\n' +
'    this.tokens = tokens;\n' +
'    this.ptr = 0;\n' +
'    this.nodeIdCounter = 1;\n' +
'  }\n' +
'  peek() { return this.tokens[this.ptr]; }\n' +
'  next() { return this.tokens[this.ptr++]; }\n' +
'  consume(type) {\n' +
'    const t = this.next();\n' +
'    if (t.type !== type) throw new Error(`Expected ${type}, got ${t.type} (${t.value})`);\n' +
'    return t;\n' +
'  }\n' +
'  parse() {\n' +
'    const statements = [];\n' +
'    while (this.peek().type !== \'EOF\') {\n' +
'      statements.push(this.statement());\n' +
'    }\n' +
'    return { id: this.uid(\'Program\'), type: \'Program\', body: statements };\n' +
'  }\n' +
'  uid(prefix) { return `${prefix}_${this.nodeIdCounter++}`; }\n' +
'  statement() {\n' +
'    const t = this.peek();\n' +
'    if (t.type === \'IDENTIFIER\') {\n' +
'      const name = this.next().value;\n' +
'      this.consume(\'OPERATOR\');\n' +
'      const val = this.expression();\n' +
'      this.consume(\';\');\n' +
'      return { id: this.uid(\'Assign\'), type: \'Assign\', name, value: val };\n' +
'    }\n' +
'    if (t.type === \'PRINT\') {\n' +
'      this.next();\n' +
'      this.consume(\'(\');\n' +
'      const val = this.expression();\n' +
'      this.consume(\')\');\n' +
'      this.consume(\';\');\n' +
'      return { id: this.uid(\'Print\'), type: \'Print\', value: val };\n' +
'    }\n' +
'    if (t.type === \'IF\') {\n' +
'      this.next();\n' +
'      this.consume(\'(\');\n' +
'      const test = this.expression();\n' +
'      this.consume(\')\');\n' +
'      const consequent = this.statement();\n' +
'      let alternate = null;\n' +
'      if (this.peek().type === \'ELSE\') {\n' +
'        this.next();\n' +
'        alternate = this.statement();\n' +
'      }\n' +
'      return { id: this.uid(\'If\'), type: \'If\', test, consequent, alternate };\n' +
'    }\n' +
'    if (t.type === \'WHILE\') {\n' +
'      this.next();\n' +
'      this.consume(\'(\');\n' +
'      const test = this.expression();\n' +
'      this.consume(\')\');\n' +
'      const body = this.statement();\n' +
'      return { id: this.uid(\'While\'), type: \'While\', test, body };\n' +
'    }\n' +
'    if (t.type === \'{\') {\n' +
'      this.next();\n' +
'      const body = [];\n' +
'      while (this.peek().type !== \'}\') {\n' +
'        body.push(this.statement());\n' +
'      }\n' +
'      this.consume(\'}\');\n' +
'      return { id: this.uid(\'Block\'), type: \'Block\', body };\n' +
'    }\n' +
'    throw new Error(`Unexpected token at statement: ${t.type} (${t.value})`);\n' +
'  }\n' +
'  expression() { return this.binaryExpr(); }\n' +
'  binaryExpr() {\n' +
'    let left = this.primary();\n' +
'    while (this.peek().type === \'OPERATOR\') {\n' +
'      const op = this.next().value;\n' +
'      const right = this.primary();\n' +
'      left = { id: this.uid(\'Binary\'), type: \'Binary\', operator: op, left, right };\n' +
'    }\n' +
'    return left;\n' +
'  }\n' +
'  primary() {\n' +
'    const t = this.next();\n' +
'    if (t.type === \'NUMBER\') return { id: this.uid(\'Literal\'), type: \'Literal\', value: t.value };\n' +
'    if (t.type === \'IDENTIFIER\') return { id: this.uid(\'Identifier\'), type: \'Identifier\', name: t.value };\n' +
'    if (t.type === \'(\') {\n' +
'      const expr = this.expression();\n' +
'      this.consume(\')\');\n' +
'      return expr;\n' +
'    }\n' +
'    throw new Error(`Unexpected primary: ${t.type}`);\n' +
'  }\n' +
'}\n\n' +
'if (typeof module !== \'undefined\') {\n' +
'  module.exports = { Lexer, Parser };\n' +
'} else {\n' +
'  window.Lexer = Lexer;\n' +
'  window.Parser = Parser;\n' +
'}' },
        { path: 'src/interpreter.js', language: 'javascript', content:
'class Interpreter {\n' +
'  constructor(ast) {\n' +
'    this.ast = ast;\n' +
'    this.variables = {};\n' +
'    this.output = [];\n' +
'    this.currentNode = null;\n' +
'  }\n' +
'  *execute() {\n' +
'    yield* this.evalNode(this.ast);\n' +
'  }\n' +
'  *evalNode(node) {\n' +
'    if (!node) return;\n' +
'    this.currentNode = node;\n' +
'    yield node;\n' +
'    if (node.type === \'Program\') {\n' +
'      for (const stmt of node.body) {\n' +
'        yield* this.evalNode(stmt);\n' +
'      }\n' +
'    } else if (node.type === \'Assign\') {\n' +
'      const val = yield* this.evalExpr(node.value);\n' +
'      this.variables[node.name] = val;\n' +
'    } else if (node.type === \'Print\') {\n' +
'      const val = yield* this.evalExpr(node.value);\n' +
'      this.output.push(String(val));\n' +
'    } else if (node.type === \'If\') {\n' +
'      const cond = yield* this.evalExpr(node.test);\n' +
'      if (cond) {\n' +
'        yield* this.evalNode(node.consequent);\n' +
'      } else if (node.alternate) {\n' +
'        yield* this.evalNode(node.alternate);\n' +
'      }\n' +
'    } else if (node.type === \'While\') {\n' +
'      while (true) {\n' +
'        this.currentNode = node.test;\n' +
'        yield node.test;\n' +
'        const cond = yield* this.evalExpr(node.test);\n' +
'        if (!cond) break;\n' +
'        yield* this.evalNode(node.body);\n' +
'      }\n' +
'    } else if (node.type === \'Block\') {\n' +
'      for (const stmt of node.body) {\n' +
'        yield* this.evalNode(stmt);\n' +
'      }\n' +
'    }\n' +
'  }\n' +
'  *evalExpr(node) {\n' +
'    this.currentNode = node;\n' +
'    yield node;\n' +
'    if (node.type === \'Literal\') return node.value;\n' +
'    if (node.type === \'Identifier\') {\n' +
'      if (!(node.name in this.variables)) throw new Error(`Undefined: ${node.name}`);\n' +
'      return this.variables[node.name];\n' +
'    }\n' +
'    if (node.type === \'Binary\') {\n' +
'      const leftVal = yield* this.evalExpr(node.left);\n' +
'      const rightVal = yield* this.evalExpr(node.right);\n' +
'      switch (node.operator) {\n' +
'        case \'+\': return leftVal + rightVal;\n' +
'        case \'-\': return leftVal - rightVal;\n' +
'        case \'*\': return leftVal * rightVal;\n' +
'        case \'/\': return leftVal / rightVal;\n' +
'        case \'>\': return leftVal > rightVal;\n' +
'        case \'<\': return leftVal < rightVal;\n' +
'        case \'==\': return leftVal == rightVal;\n' +
'        default: throw new Error(`Unknown operator: ${node.operator}`);\n' +
'      }\n' +
'    }\n' +
'  }\n' +
'}\n\n' +
'if (typeof module !== \'undefined\') {\n' +
'  module.exports = { Interpreter };\n' +
'} else {\n' +
'  window.Interpreter = Interpreter;\n' +
'}' },
        { path: 'src/visualizer.js', language: 'javascript', content:
'class ASTVisualizer {\n' +
'  constructor(canvas) {\n' +
'    this.canvas = canvas;\n' +
'    this.ctx = canvas.getContext(\'2d\');\n' +
'    this.positions = {};\n' +
'  }\n' +
'  layoutTree(node) {\n' +
'    this.positions = {};\n' +
'    let leavesCount = 0;\n' +
'    const calcLeafWidth = (n) => {\n' +
'      if (!n) return 0;\n' +
'      const children = this.getChildren(n);\n' +
'      if (children.length === 0) {\n' +
'        leavesCount++;\n' +
'        return 1;\n' +
'      }\n' +
'      let sum = 0;\n' +
'      for (const child of children) {\n' +
'        sum += calcLeafWidth(child);\n' +
'      }\n' +
'      return sum;\n' +
'    };\n' +
'    calcLeafWidth(node);\n' +
'    let leafIndex = 0;\n' +
'    const assignPos = (n, depth) => {\n' +
'      if (!n) return;\n' +
'      const y = 60 + depth * 80;\n' +
'      const children = this.getChildren(n);\n' +
'      if (children.length === 0) {\n' +
'        const x = 60 + leafIndex * 130;\n' +
'        leafIndex++;\n' +
'        this.positions[n.id] = { x, y, label: this.getNodeLabel(n) };\n' +
'      } else {\n' +
'        children.forEach(c => assignPos(c, depth + 1));\n' +
'        let sumX = 0, count = 0;\n' +
'        children.forEach(c => {\n' +
'          if (this.positions[c.id]) { sumX += this.positions[c.id].x; count++; }\n' +
'        });\n' +
'        const x = count > 0 ? sumX / count : 100;\n' +
'        this.positions[n.id] = { x, y, label: this.getNodeLabel(n) };\n' +
'      }\n' +
'    };\n' +
'    assignPos(node, 0);\n' +
'  }\n' +
'  getChildren(node) {\n' +
'    if (!node) return [];\n' +
'    if (node.type === \'Program\') return node.body;\n' +
'    if (node.type === \'Assign\') return [node.value];\n' +
'    if (node.type === \'Print\') return [node.value];\n' +
'    if (node.type === \'If\') {\n' +
'      const arr = [node.test, node.consequent];\n' +
'      if (node.alternate) arr.push(node.alternate);\n' +
'      return arr;\n' +
'    }\n' +
'    if (node.type === \'While\') return [node.test, node.body];\n' +
'    if (node.type === \'Block\') return node.body;\n' +
'    if (node.type === \'Binary\') return [node.left, node.right];\n' +
'    return [];\n' +
'  }\n' +
'  getNodeLabel(node) {\n' +
'    if (node.type === \'Literal\') return `Lit: ${node.value}`;\n' +
'    if (node.type === \'Identifier\') return `Var: ${node.name}`;\n' +
'    if (node.type === \'Assign\') return `Assign: ${node.name}`;\n' +
'    if (node.type === \'Binary\') return `Op: ${node.operator}`;\n' +
'    return node.type;\n' +
'  }\n' +
'  drawTree(node, activeNodeId) {\n' +
'    const ctx = this.ctx;\n' +
'    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);\n' +
'    ctx.strokeStyle = \'#475569\';\n' +
'    ctx.lineWidth = 2;\n' +
'    const drawConnections = (n) => {\n' +
'      if (!n) return;\n' +
'      const pos = this.positions[n.id];\n' +
'      if (!pos) return;\n' +
'      const children = this.getChildren(n);\n' +
'      for (const child of children) {\n' +
'        const cPos = this.positions[child.id];\n' +
'        if (cPos) {\n' +
'          ctx.beginPath();\n' +
'          ctx.moveTo(pos.x, pos.y);\n' +
'          ctx.lineTo(cPos.x, cPos.y);\n' +
'          ctx.stroke();\n' +
'          drawConnections(child);\n' +
'        }\n' +
'      }\n' +
'    };\n' +
'    drawConnections(node);\n' +
'    for (const [id, pos] of Object.entries(this.positions)) {\n' +
'      const isActive = id === activeNodeId;\n' +
'      ctx.beginPath();\n' +
'      ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);\n' +
'      ctx.fillStyle = isActive ? \'#8b5cf6\' : \'#1e293b\';\n' +
'      ctx.fill();\n' +
'      ctx.strokeStyle = isActive ? \'#c084fc\' : \'#64748b\';\n' +
'      ctx.lineWidth = isActive ? 3 : 1.5;\n' +
'      ctx.stroke();\n' +
'      ctx.fillStyle = \'#f8fafc\';\n' +
'      ctx.font = \'bold 9px Inter, system-ui, sans-serif\';\n' +
'      ctx.textAlign = \'center\';\n' +
'      ctx.textBaseline = \'middle\';\n' +
'      ctx.fillText(pos.label, pos.x, pos.y);\n' +
'    }\n' +
'  }\n' +
'}\n' +
'window.ASTVisualizer = ASTVisualizer;' },
        { path: 'src/main.js', language: 'javascript', content:
'document.addEventListener(\'DOMContentLoaded\', () => {\n' +
'  const codeEditor = document.getElementById(\'code-editor\');\n' +
'  const canvas = document.getElementById(\'ast-canvas\');\n' +
'  const variablesBody = document.getElementById(\'variables-body\');\n' +
'  const runBtn = document.getElementById(\'btn-run\');\n' +
'  const stepBtn = document.getElementById(\'btn-step\');\n' +
'  const resetBtn = document.getElementById(\'btn-reset\');\n' +
'  const parseBtn = document.getElementById(\'btn-parse\');\n' +
'  const terminal = document.getElementById(\'terminal-content\');\n' +
'  const speedSelect = document.getElementById(\'speed-select\');\n\n' +
'  let activeInterpreter = null;\n' +
'  let activeGenerator = null;\n' +
'  let activeAST = null;\n' +
'  let visualizer = new ASTVisualizer(canvas);\n' +
'  let isRunning = false;\n' +
'  let runInterval = null;\n\n' +
'  const defaultCode = `x = 5;\\ny = 0;\\nwhile (x > 0) {\\n  print(x);\\n  y = y + x;\\n  x = x - 1;\\n}`;\n' +
'  codeEditor.value = defaultCode;\n\n' +
'  function printToTerminal(text, type=\'info\') {\n' +
'    const div = document.createElement(\'div\');\n' +
'    div.className = `log-${type}`;\n' +
'    div.textContent = text;\n' +
'    terminal.appendChild(div);\n' +
'    terminal.scrollTop = terminal.scrollHeight;\n' +
'  }\n\n' +
'  function updateVariables(vars) {\n' +
'    variablesBody.innerHTML = \'\';\n' +
'    const keys = Object.keys(vars).sort();\n' +
'    if (keys.length === 0) {\n' +
'      variablesBody.innerHTML = \'<tr><td colspan="2" class="empty-vars">No active variables</td></tr>\';\n' +
'      return;\n' +
'    }\n' +
'    keys.forEach(k => {\n' +
'      const tr = document.createElement(\'tr\');\n' +
'      tr.innerHTML = `<td>${k}</td><td>${vars[k]}</td>`;\n' +
'      variablesBody.appendChild(tr);\n' +
'    });\n' +
'  }\n\n' +
'  function handleParse() {\n' +
'    terminal.innerHTML = \'\';\n' +
'    printToTerminal(\'🔍 Tokenizing & parsing source script...\', \'info\');\n' +
'    try {\n' +
'      const src = codeEditor.value;\n' +
'      const lexer = new Lexer(src);\n' +
'      const tokens = lexer.tokenize();\n' +
'      const parser = new Parser(tokens);\n' +
'      activeAST = parser.parse();\n' +
'      printToTerminal(\'✓ Abstract Syntax Tree (AST) generated successfully!\', \'success\');\n' +
'      visualizer.layoutTree(activeAST);\n' +
'      visualizer.drawTree(activeAST, null);\n' +
'      \n' +
'      activeInterpreter = new Interpreter(activeAST);\n' +
'      activeGenerator = activeInterpreter.execute();\n' +
'      updateVariables({});\n' +
'      enableControls(true);\n' +
'    } catch(err) {\n' +
'      printToTerminal(`❌ Parse Error: ${err.message}`, \'error\');\n' +
'      activeAST = null;\n' +
'      activeInterpreter = null;\n' +
'      activeGenerator = null;\n' +
'      enableControls(false);\n' +
'    }\n' +
'  }\n\n' +
'  function enableControls(parsed) {\n' +
'    runBtn.disabled = !parsed;\n' +
'    stepBtn.disabled = !parsed;\n' +
'    resetBtn.disabled = !parsed;\n' +
'  }\n\n' +
'  function handleStep() {\n' +
'    if (!activeGenerator) return;\n' +
'    try {\n' +
'      const res = activeGenerator.next();\n' +
'      if (!res.done) {\n' +
'        const node = res.value;\n' +
'        visualizer.drawTree(activeAST, node.id);\n' +
'        if (activeInterpreter.output.length > terminal.children.length - 2) {\n' +
'          const latestPrint = activeInterpreter.output[activeInterpreter.output.length - 1];\n' +
'          printToTerminal(`[OUTPUT] ${latestPrint}`, \'output\');\n' +
'        }\n' +
'        updateVariables(activeInterpreter.variables);\n' +
'      } else {\n' +
'        clearInterval(runInterval);\n' +
'        isRunning = false;\n' +
'        runBtn.innerHTML = \'▶ Run\';\n' +
'        printToTerminal(\'🎉 Program execution finished successfully!\', \'success\');\n' +
'        visualizer.drawTree(activeAST, null);\n' +
'        activeGenerator = null;\n' +
'      }\n' +
'    } catch(err) {\n' +
'      clearInterval(runInterval);\n' +
'      isRunning = false;\n' +
'      runBtn.innerHTML = \'▶ Run\';\n' +
'      printToTerminal(`❌ Execution Error: ${err.message}`, \'error\');\n' +
'      activeGenerator = null;\n' +
'    }\n' +
'  }\n\n' +
'  function toggleRun() {\n' +
'    if (isRunning) {\n' +
'      clearInterval(runInterval);\n' +
'      isRunning = false;\n' +
'      runBtn.innerHTML = \'▶ Run\';\n' +
'    } else {\n' +
'      isRunning = true;\n' +
'      runBtn.innerHTML = \'⏸ Pause\';\n' +
'      const speed = parseInt(speedSelect.value);\n' +
'      runInterval = setInterval(handleStep, speed);\n' +
'    }\n' +
'  }\n\n' +
'  function handleReset() {\n' +
'    clearInterval(runInterval);\n' +
'    isRunning = false;\n' +
'    runBtn.innerHTML = \'▶ Run\';\n' +
'    handleParse();\n' +
'  }\n\n' +
'  parseBtn.addEventListener(\'click\', handleParse);\n' +
'  stepBtn.addEventListener(\'click\', handleStep);\n' +
'  runBtn.addEventListener(\'click\', toggleRun);\n' +
'  resetBtn.addEventListener(\'click\', handleReset);\n' +
'  handleParse();\n' +
'});' },
      ]
    },

    /* ──────────────────────────────────────────────────────────────
       REACT NATIVE MOBILE APP
       ────────────────────────────────────────────────────────────── */
    reactnative: {
      id: 'reactnative', name: 'React Native App', description: 'Simulated React Native Expo App',
      files: [
        { path: 'package.json', language: 'json', content:
'{\n  "name": "inquiries-feed-app",\n  "version": "1.0.0",\n' +
'  "dependencies": {\n    "react-native": "*",\n    "expo": "*"\n  }\n}' },
        { path: 'App.tsx', language: 'typescript', content:
`import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import PropertyFeedScreen from './src/screens/PropertyFeedScreen';
import InquiriesScreen from './src/screens/InquiriesScreen';
import BuyerProfileScreen from './src/screens/BuyerProfileScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('inquiries');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ScrollView className="flex-1 p-4 bg-slate-900">
            <View className="mb-6 bg-slate-800 p-6 rounded-xl border border-slate-750">
              <Text className="text-xl font-bold text-sky-400 mb-2">Welcome to Appu Mobile</Text>
              <Text className="text-sm text-slate-300">Your real estate agent terminal on the go. Monitor inquiries, feeds, and client lists instantly.</Text>
            </View>
            <View className="flex flex-row justify-between mb-4 gap-3">
              <TouchableOpacity onPress={() => setActiveTab('inquiries')} className="flex-1 bg-violet-600/20 border border-violet-500/30 p-4 rounded-xl items-center">
                <Text className="text-2xl mb-1">💬</Text>
                <Text className="text-sm font-bold text-violet-300">Inquiries</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('properties')} className="flex-1 bg-emerald-600/20 border border-emerald-500/30 p-4 rounded-xl items-center">
                <Text className="text-2xl mb-1">🏡</Text>
                <Text className="text-sm font-bold text-emerald-300">Properties</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
      case 'properties':
        return <PropertyFeedScreen />;
      case 'inquiries':
        return <InquiriesScreen />;
      case 'profile':
        return <BuyerProfileScreen />;
      default:
        return <Text>Not Found</Text>;
    }
  };

  return (
    <View className="flex-1 flex flex-col h-full bg-slate-950">
      <View className="h-14 bg-slate-900 border-b border-slate-800 flex flex-row items-center justify-between px-4">
        <Text className="text-lg font-bold text-slate-100">Appu Mobile</Text>
        <Text className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Synced</Text>
      </View>

      <View className="flex-1 overflow-hidden">
        {renderContent()}
      </View>

      <View className="h-16 bg-slate-900 border-t border-slate-800 flex flex-row justify-around items-center pb-2">
        <TouchableOpacity onPress={() => setActiveTab('home')} className="items-center">
          <Text className={\`text-lg \${activeTab === 'home' ? 'text-sky-400' : 'text-slate-500'}\`}>🏠</Text>
          <Text className={\`text-[10px] font-medium \${activeTab === 'home' ? 'text-sky-400 font-bold' : 'text-slate-500'}\`}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('properties')} className="items-center">
          <Text className={\`text-lg \${activeTab === 'properties' ? 'text-sky-400' : 'text-slate-500'}\`}>🏡</Text>
          <Text className={\`text-[10px] font-medium \${activeTab === 'properties' ? 'text-sky-400 font-bold' : 'text-slate-500'}\`}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('inquiries')} className="items-center">
          <Text className={\`text-lg \${activeTab === 'inquiries' ? 'text-sky-400' : 'text-slate-500'}\`}>💬</Text>
          <Text className={\`text-[10px] font-medium \${activeTab === 'inquiries' ? 'text-sky-400 font-bold' : 'text-slate-500'}\`}>Inquiries</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('profile')} className="items-center">
          <Text className={\`text-lg \${activeTab === 'profile' ? 'text-sky-400' : 'text-slate-500'}\`}>👤</Text>
          <Text className={\`text-[10px] font-medium \${activeTab === 'profile' ? 'text-sky-400 font-bold' : 'text-slate-500'}\`}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}` },
        { path: 'src/screens/InquiriesScreen.tsx', language: 'typescript', content:
`import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { fetchInquiries } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';

export default function InquiriesScreen() {
  const [inquiries, setInquiries] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries().then(data => {
      setInquiries(data);
      setLoading(false);
    });
  }, []);

  const filtered = inquiries.filter(i => 
    i.clientName.toLowerCase().includes(search.toLowerCase()) ||
    i.propertyTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="flex-1 flex flex-col bg-slate-950 p-4 h-full">
      <View className="mb-4">
        <Text className="text-xl font-bold text-slate-100 mb-1">Inquiries</Text>
        <Text className="text-xs text-slate-500">Monitor and manage client inquiries</Text>
      </View>

      <TextInput
        placeholder="Search inquiries..."
        value={search}
        onChangeText={setSearch}
        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm px-4 py-2 rounded-xl mb-4 focus:border-sky-500 focus:outline-none"
      />

      {loading ? (
        <Text className="text-center text-slate-500 my-8">Loading inquiries...</Text>
      ) : (
        <ScrollView className="flex-1">
          {filtered.length === 0 ? (
            <Text className="text-center text-slate-600 my-8">No inquiries found</Text>
          ) : (
            filtered.map(item => (
              <View key={item.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-3 flex flex-col gap-2">
                <View className="flex flex-row justify-between items-center">
                  <Text className="text-sm font-bold text-slate-200">{item.clientName}</Text>
                  <Text className={\`text-[10px] px-2 py-0.5 rounded-full font-bold \${
                    item.status === 'new' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                    item.status === 'active' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }\`}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
                <Text className="text-xs text-slate-400 font-normal">🏡 Interested in: <Text className="text-slate-300 font-semibold">{item.propertyTitle}</Text></Text>
                <View className="flex flex-row justify-between items-center mt-2 border-t border-slate-800/60 pt-2">
                  <Text className="text-xs text-slate-500">{formatDate(item.createdAt)}</Text>
                  <Text className="text-xs font-bold text-emerald-400">{formatCurrency(item.budget)}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}` },
        { path: 'src/screens/PropertyFeedScreen.tsx', language: 'typescript', content:
`import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { fetchProperties } from '../services/api';
import { formatCurrency } from '../utils/format';

export default function PropertyFeedScreen() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchProperties().then(data => {
      setProperties(data);
      setLoading(false);
    });
  }, []);

  return (
    <View className="flex-1 bg-slate-950 p-4 h-full relative">
      <View className="mb-4">
        <Text className="text-xl font-bold text-slate-100 mb-1">Property Feed</Text>
        <Text className="text-xs text-slate-500">Available listings in your region</Text>
      </View>

      {loading ? (
        <Text className="text-center text-slate-500 my-8">Loading feed...</Text>
      ) : (
        <ScrollView className="flex-1">
          {properties.map(p => (
            <TouchableOpacity key={p.id} onPress={() => setSelected(p)} className="bg-slate-900 border border-slate-800 rounded-xl mb-4 overflow-hidden flex flex-col">
              <Image source={{ uri: p.imageUrl }} className="w-full h-32 bg-slate-800 object-cover" />
              <View className="p-4 flex flex-col gap-1">
                <Text className="text-sm font-bold text-slate-200">{p.title}</Text>
                <Text className="text-xs text-slate-500">📍 {p.location}</Text>
                <Text className="text-sm font-bold text-sky-400 mt-1">{formatCurrency(p.price)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selected && (
        <View className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <View className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl overflow-hidden p-4 flex flex-col gap-4">
            <Image source={{ uri: selected.imageUrl }} className="w-full h-40 bg-slate-800 rounded-xl object-cover" />
            <View className="flex flex-col gap-1">
              <Text className="text-lg font-bold text-slate-200">{selected.title}</Text>
              <Text className="text-xs text-slate-400">📍 {selected.location}</Text>
              <Text className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(selected.price)}</Text>
              <Text className="text-xs text-slate-400 mt-2 leading-relaxed">
                Premium modern architecture with high-quality interior finishes, ample natural lighting, smart-home automation, and close proximity to public parks and amenities.
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelected(null)} className="w-full bg-slate-850 border border-slate-700 py-2 rounded-xl items-center mt-2">
              <Text className="text-sm font-bold text-slate-300">Close Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}` },
        { path: 'src/screens/BuyerProfileScreen.tsx', language: 'typescript', content:
`import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export default function BuyerProfileScreen() {
  const [profile, setProfile] = useState({
    name: 'Amit Patel',
    role: 'Senior Broker Partner',
    agency: 'Appu Realty Advisors',
    transactions: 24,
    email: 'amit@appurealty.com'
  });

  return (
    <ScrollView className="flex-1 bg-slate-950 p-4 h-full">
      <View className="items-center my-6 flex flex-col gap-2">
        <View className="w-16 h-16 bg-gradient-to-tr from-sky-500 to-indigo-500 rounded-full items-center justify-center border-2 border-slate-800 shadow-xl">
          <Text className="text-2xl text-white font-bold">AP</Text>
        </View>
        <Text className="text-base font-bold text-slate-200 mt-1">{profile.name}</Text>
        <Text className="text-xs text-sky-400 font-medium">{profile.role}</Text>
      </View>

      <View className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4 flex flex-col gap-3">
        <View className="flex flex-row justify-between border-b border-slate-850 pb-2">
          <Text className="text-xs text-slate-500">Agency</Text>
          <Text className="text-xs font-semibold text-slate-300">{profile.agency}</Text>
        </View>
        <View className="flex flex-row justify-between border-b border-slate-850 pb-2">
          <Text className="text-xs text-slate-500">Email</Text>
          <Text className="text-xs font-semibold text-slate-300">{profile.email}</Text>
        </View>
        <View className="flex flex-row justify-between">
          <Text className="text-xs text-slate-500">Transactions</Text>
          <Text className="text-xs font-semibold text-emerald-400">{profile.transactions} deals</Text>
        </View>
      </View>

      <TouchableOpacity className="w-full bg-violet-600/20 border border-violet-500/30 py-2.5 rounded-xl items-center mb-4">
        <Text className="text-sm font-bold text-violet-300">Edit Profile Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}` },
        { path: 'src/services/api.ts', language: 'typescript', content:
`export async function fetchInquiries() {
  await new Promise(r => setTimeout(r, 600));
  return [
    { id: 1, clientName: 'Amit Sharma', propertyTitle: '3 BHK Luxury Apartment', budget: 15000000, status: 'new', createdAt: '2026-06-11T12:00:00Z' },
    { id: 2, clientName: 'Priya Patel', propertyTitle: 'Penthouse Suite - Sector 54', budget: 45000000, status: 'active', createdAt: '2026-06-10T15:30:00Z' },
    { id: 3, clientName: 'Raj Malhotra', propertyTitle: 'Cozy Villa in Goa', budget: 25000000, status: 'closed', createdAt: '2026-06-08T09:00:00Z' }
  ];
}

export async function fetchProperties() {
  await new Promise(r => setTimeout(r, 600));
  return [
    { id: 1, title: '3 BHK Luxury Apartment', location: 'Gurugram', price: 15000000, imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400' },
    { id: 2, title: 'Penthouse Suite - Sector 54', location: 'Noida', price: 45000000, imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400' },
    { id: 3, title: 'Cozy Villa in Goa', location: 'Goa', price: 25000000, imageUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400' }
  ];
}` },
        { path: 'src/utils/format.ts', language: 'typescript', content:
`export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number') return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}` }
      ]
    },
  };

  /* ─── Public API ─────────────────────────────────────────────── */
  window.Nap.templates = {
    getTemplate(id) { return TEMPLATES[id] || null; },

    getAll() {
      return Object.values(TEMPLATES).map(t => ({
        id: t.id, name: t.name, description: t.description, fileCount: t.files.length,
      }));
    },

    apply(id) {
      var t = TEMPLATES[id];
      if (!t) return false;
      var fs = window.Nap.fs;
      if (!fs) return false;

      fs.clear();
      t.files.forEach(function (f) { fs.createFile(f.path, f.content, f.language); });

      window.Nap.state.project.name = t.name.toLowerCase().replace(/\s+/g, '-');
      var el = document.getElementById('project-name');
      if (el) el.textContent = t.name;
      return true;
    },
  };
})();
