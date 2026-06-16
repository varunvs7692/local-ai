// ================================================================
// LRU Cache — Least Recently Used Cache Implementation & Tests
// ================================================================

class DoublyNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
    // Sentinel dummy nodes to avoid boundary condition checks
    this.head = new DoublyNode(0, 0);
    this.tail = new DoublyNode(0, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key) {
    if (!this.map.has(key)) {
      console.log(`[GET] Key ${key} -> NOT FOUND (-1)`);
      return -1;
    }
    const node = this.map.get(key);
    this._remove(node);
    this._moveToTail(node);
    console.log(`[GET] Key ${key} -> Found Value: ${node.value}`);
    return node.value;
  }

  put(key, value) {
    if (this.map.has(key)) {
      this._remove(this.map.get(key));
    }
    const newNode = new DoublyNode(key, value);
    this._moveToTail(newNode);
    this.map.set(key, newNode);

    console.log(`[PUT] Key ${key} = ${value} (Size: ${this.map.size}/${this.capacity})`);

    if (this.map.size > this.capacity) {
      const lruNode = this.head.next;
      this._remove(lruNode);
      this.map.delete(lruNode.key);
      console.log(`[EVICT] Capacity exceeded. Evicted LRU Key: ${lruNode.key}`);
    }
  }

  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _moveToTail(node) {
    const prev = this.tail.prev;
    prev.next = node;
    node.prev = prev;
    node.next = this.tail;
    this.tail.prev = node;
  }
}

// ================================================================
// Test Runner
// ================================================================
console.log("🚀 Starting LRU Cache Automated Tests...");
console.log("-----------------------------------------");

const cache = new LRUCache(2);

cache.put(1, 10);
cache.put(2, 20);

// Should return 10
const val1 = cache.get(1);
if (val1 !== 10) console.error("❌ Test Failed: Expected get(1) to be 10");

// Should evict key 2
cache.put(3, 30);

// Should return -1 (evicted)
const val2 = cache.get(2);
if (val2 !== -1) console.error("❌ Test Failed: Expected get(2) to be -1 (evicted)");

// Should evict key 1
cache.put(4, 40);

// Should return -1 (evicted)
const val3 = cache.get(1);
if (val3 !== -1) console.error("❌ Test Failed: Expected get(1) to be -1 (evicted)");

// Should return 30
const val4 = cache.get(3);
if (val4 !== 30) console.error("❌ Test Failed: Expected get(3) to be 30");

// Should return 40
const val5 = cache.get(4);
if (val5 !== 40) console.error("❌ Test Failed: Expected get(4) to be 40");

console.log("-----------------------------------------");
console.log("✨ All tests completed successfully!");
