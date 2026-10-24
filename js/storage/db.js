// js/storage/db.js - IndexedDB Storage Engine for "A Date in Dhaka"
// Provides indexed persistence for user choices, arcade high scores, letter archives, and audio cache metadata.

const DB_NAME = "TotoroDhakaDB";
const DB_VERSION = 1;

export class IndexedDatabase {
  constructor(name = DB_NAME, version = DB_VERSION) {
    this.name = name;
    this.version = version;
    this._db = null;
    this._initPromise = null;
  }

  async open() {
    if (this._db) return this._db;
    if (this._initPromise) return this._initPromise;

    this._initPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !("indexedDB" in window)) {
        resolve(null);
        return;
      }

      const req = window.indexedDB.open(this.name, this.version);

      req.onupgradeneeded = event => {
        const db = event.target.result;

        // 1. Preferences store (itinerary selections)
        if (!db.objectStoreNames.contains("preferences")) {
          const prefStore = db.createObjectStore("preferences", { keyPath: "key" });
          prefStore.createIndex("by_category", "category", { unique: false });
          prefStore.createIndex("by_updated", "updatedAt", { unique: false });
        }

        // 2. Game Progress & Scores
        if (!db.objectStoreNames.contains("game_progress")) {
          const gameStore = db.createObjectStore("game_progress", { keyPath: "gameId" });
          gameStore.createIndex("by_score", "score", { unique: false });
          gameStore.createIndex("by_completed", "completed", { unique: false });
          gameStore.createIndex("by_timestamp", "timestamp", { unique: false });
        }

        // 3. Postcard / Letter Archives
        if (!db.objectStoreNames.contains("postcard_drafts")) {
          const postStore = db.createObjectStore("postcard_drafts", { keyPath: "id", autoIncrement: true });
          postStore.createIndex("by_date", "timestamp", { unique: false });
          postStore.createIndex("by_status", "status", { unique: false });
        }

        // 4. Epilogue Discoveries (Celestial stars, map checkpoints)
        if (!db.objectStoreNames.contains("epilogue_discoveries")) {
          const epiStore = db.createObjectStore("epilogue_discoveries", { keyPath: "id" });
          epiStore.createIndex("by_type", "type", { unique: false });
          epiStore.createIndex("by_discovered", "discoveredAt", { unique: false });
        }

        // 5. Audio Library & Metadata
        if (!db.objectStoreNames.contains("audio_library")) {
          const audioStore = db.createObjectStore("audio_library", { keyPath: "id" });
          audioStore.createIndex("by_artist", "artist", { unique: false });
          audioStore.createIndex("by_play_count", "playCount", { unique: false });
        }
      };

      req.onsuccess = event => {
        this._db = event.target.result;
        resolve(this._db);
      };

      req.onerror = event => {
        console.warn("IndexedDB failed to open, operating in memory fallback:", event.target.error);
        resolve(null);
      };
    });

    return this._initPromise;
  }

  async get(storeName, key) {
    const db = await this.open();
    if (!db) return null;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async set(storeName, value, optionalKey) {
    const db = await this.open();
    if (!db) return null;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = optionalKey !== undefined ? store.put(value, optionalKey) : store.put(value);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async getAll(storeName) {
    const db = await this.open();
    if (!db) return [];

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async delete(storeName, key) {
    const db = await this.open();
    if (!db) return false;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async clear(storeName) {
    const db = await this.open();
    if (!db) return false;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async getByIndex(storeName, indexName, queryValue) {
    const db = await this.open();
    if (!db) return null;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const idx = store.index(indexName);
        const req = idx.get(queryValue);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async getAllByIndex(storeName, indexName, queryValue) {
    const db = await this.open();
    if (!db) return [];

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const idx = store.index(indexName);
        const req = idx.getAll(queryValue);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // --- High-Level Domain Helpers ---

  async savePreferences(choices) {
    const now = Date.now();
    const records = [
      { key: "itinerary", choices: { ...choices }, updatedAt: now, category: "all" },
      { key: "place", value: choices.place, updatedAt: now, category: "place" },
      { key: "food", value: choices.food, updatedAt: now, category: "food" },
      { key: "activity", value: choices.activity, updatedAt: now, category: "activity" }
    ];
    for (const rec of records) {
      await this.set("preferences", rec);
    }
  }

  async getPreferences() {
    const it = await this.get("preferences", "itinerary");
    return it?.choices || null;
  }

  async saveGameProgress(gameId, score, completed = false, extra = {}) {
    return this.set("game_progress", {
      gameId,
      score,
      completed,
      timestamp: Date.now(),
      ...extra
    });
  }

  async getGameProgress(gameId) {
    return this.get("game_progress", gameId);
  }

  async savePostcard(message, choices) {
    return this.set("postcard_drafts", {
      message,
      choices: { ...choices },
      timestamp: Date.now(),
      status: "delivered"
    });
  }

  async getPostcards() {
    return this.getAll("postcard_drafts");
  }

  async recordStarDiscovery(starId, starName, constellation) {
    return this.set("epilogue_discoveries", {
      id: `star_${starId}`,
      starId,
      starName,
      constellation,
      type: "star",
      discoveredAt: Date.now()
    });
  }

  async getDiscoveredStars() {
    return this.getAllByIndex("epilogue_discoveries", "by_type", "star");
  }
}

export const totoroDB = new IndexedDatabase();

if (typeof window !== "undefined") {
  window.totoroDB = totoroDB;
  window.IndexedDatabase = IndexedDatabase;
}
