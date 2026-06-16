// ================================================================
// NAP Pipeline v2 CLI Test Runner
// Tests the upgraded 7-agent pipeline with PipelineContext,
// iterative Coder↔Reviewer loops, and chain-of-thought
// ================================================================

const fs = require('fs');
const vm = require('vm');
const path = require('path');

// 1. Create robust DOM mocks to capture agent output streams
const mockElement = {
  tagName: 'DIV',
  className: '',
  textContent: '',
  _val: '',
  addEventListener: () => {},
  appendChild: (child) => {
    if (child.className === 'output-agent-label') {
      process.stdout.write('\n\x1b[36m' + child.textContent + '\x1b[0m');
    } else {
      Object.defineProperty(child, 'textContent', {
        set: (val) => {
          const prevLen = child._val ? child._val.length : 0;
          const newChars = val.slice(prevLen);
          process.stdout.write(newChars);
          child._val = val;
        },
        get: () => child._val || ''
      });
    }
  },
  classList: { add: () => {}, remove: () => {}, toggle: () => {} },
  style: {},
  querySelector: () => ({ textContent: "" })
};

const context = {
  global: {},
  console: {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Date: Date,
  Promise: Promise,
  Math: Math,
  Object: Object,
  Array: Array,
  String: String,
  RegExp: RegExp,
  JSON: JSON,
  Set: Set,
  Map: Map,
  fetch: (url, options) => globalThis.fetch(url, options),
  process: process,
  document: {
    addEventListener: () => {},
    createElement: (tag) => {
      return {
        tagName: tag.toUpperCase(),
        className: '',
        textContent: '',
        _val: '',
        appendChild: () => {}
      };
    },
    getElementById: (id) => {
      if (id === 'agent-output') return mockElement;
      return {
        addEventListener: () => {},
        appendChild: () => {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        style: {},
        querySelector: () => ({ textContent: "" }),
        textContent: "",
        value: "",
        innerHTML: ""
      };
    }
  },
  window: {
    Nap: {}
  }
};

vm.createContext(context);

console.log("⚙ Evaluating NAP v2 Core modules in VM sandbox...");
try {
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'js/nap-core.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'js/filesystem.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'js/templates.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'js/agents.js'), 'utf8'), context);
  console.log("✓ Core modules evaluated successfully.\n");
} catch (err) {
  console.error("❌ Failed to compile scripts:", err);
  process.exit(1);
}

// 2. Setup testing triggers
const Nap = context.window.Nap;

console.log("🚀 Running NAP v2 Pipeline Test (with PipelineContext + Iterative Loops)...");
console.log("Prompt: 'Build a custom inquiries list feed and property screens for my real estate agent mobile app'\n");

// Hook into pipeline events
Nap.events.on('pipeline:agent:start', (d) => {
  // console.log(`\n[Agent Start]: ${d.agentId}`);
});

Nap.events.on('pipeline:agent:complete', (d) => {
  // console.log(`\n[Agent Done]: ${d.agentId}`);
});

// Run the pipeline
Nap.agents.runPipeline("Build a custom inquiries list feed and property screens for my real estate agent mobile app", "reactnative")
  .then(() => {
    console.log("\n\n🎉 Pipeline v2 completed successfully in CLI!");
    
    console.log("\n📁 Generated Virtual Filesystem Structure:");
    console.log("-----------------------------------------");
    const files = Nap.fs.listFiles();
    files.forEach(f => {
      console.log(`  ✓ ${f} (${Nap.fs.readFile(f).length} chars)`);
    });
    console.log("-----------------------------------------");
    process.exit(0);
  })
  .catch(err => {
    console.error("\n❌ Pipeline failed:", err);
    process.exit(1);
  });
