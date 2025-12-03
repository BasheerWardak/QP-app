// Super Scheduler Database Management
class SchedulerDatabase {
  constructor() {
    this.db = null;
    this.dbName = 'SuperSchedulerDB';
    this.dbVersion = 1;
  }

  async init() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        
        // Create object stores if they don't exist
        if (!this.db.objectStoreNames.contains('events')) {
          const eventsStore = this.db.createObjectStore('events', { keyPath: 'id' });
          eventsStore.createIndex('date', 'date', { unique: false });
          eventsStore.createIndex('category', 'category', { unique: false });
        }
        
        if (!this.db.objectStoreNames.contains('tasks')) {
          const tasksStore = this.db.createObjectStore('tasks', { keyPath: 'id' });
          tasksStore.createIndex('dueDate', 'dueDate', { unique: false });
          tasksStore.createIndex('category', 'category', { unique: false });
          tasksStore.createIndex('status', 'status', { unique: false });
        }
        
        if (!this.db.objectStoreNames.contains('categories')) {
          const categoriesStore = this.db.createObjectStore('categories', { keyPath: 'id' });
        }
        
        if (!this.db.objectStoreNames.contains('settings')) {
          const settingsStore = this.db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('Database initialized successfully');
        this.initDefaultData().then(resolve).catch(reject);
      };
      
      request.onerror = (event) => {
        console.error('Database initialization error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async initDefaultData() {
    // Add default categories if none exist
    const categories = await this.getAll('categories');
    if (categories.length === 0) {
      const defaultCategories = [
        { id: 'work', name: 'Work', color: 'blue' },
        { id: 'personal', name: 'Personal', color: 'green' },
        { id: 'health', name: 'Health', color: 'red' },
        { id: 'social', name: 'Social', color: 'purple' }
      ];
      
      for (const category of defaultCategories) {
        await this.add('categories', category);
      }
    }
    
    // Add default settings if none exist
    const settings = await this.getAll('settings');
    if (settings.length === 0) {
      const defaultSettings = [
        { key: 'theme', value: 'light' },
        { key: 'timeFormat', value: '12' },
        { key: 'weekStart', value: 'sunday' },
        { key: 'dateFormat', value: 'mm/dd/yyyy' },
        { key: 'defaultView', value: 'month' },
        { key: 'eventReminder', value: '15' },
        { key: 'taskReminder', value: '30' },
        { key: 'soundEnabled', value: 'false' },
        { key: 'browserNotifications', value: 'false' },
        { key: 'highContrast', value: 'false' },
        { key: 'keyboardShortcuts', value: 'true' },
        { key: 'focusIndicators', value: 'true' },
        { key: 'fontSize', value: '16' },
        { key: 'reducedMotion', value: 'false' }
      ];
      
      for (const setting of defaultSettings) {
        await this.add('settings', setting);
      }
    }
  }

  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      
      request.onsuccess = () => {
        // request.result is the key (id) for the added record.
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`Error adding to ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  async get(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`Error getting from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        console.error(`Error getting all from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        console.error(`Error getting by index from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  async update(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`Error updating ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error(`Error deleting from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  async clearAllData() {
    const stores = ['events', 'tasks'];
    const promises = stores.map(storeName => {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = resolve;
        request.onerror = reject;
      });
    });
    
    await Promise.all(promises);
  }

  // Utility: parse date-only or full ISO strings reliably into local Date at midnight when required
  _parseDateStringToLocal(dateStr) {
    if (!dateStr) return null;
    // If format is YYYY-MM-DD (length 10) treat as local midnight
    if (typeof dateStr === 'string' && dateStr.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // Local midnight
      return new Date(dateStr + 'T00:00:00');
    }
    // Otherwise rely on Date constructor (ISO or other) — fallback to Date parsing
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    return d;
  }

  async getUpcomingTasks(days = 7) {
    // Start of today (local)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // End date inclusive: set to end of the target day
    const endDate = new Date(todayStart);
    endDate.setDate(endDate.getDate() + days);
    endDate.setHours(23, 59, 59, 999);

    const tasks = await this.getAll('tasks');
    const upcoming = [];

    for (const task of tasks) {
      if (!task || !task.dueDate) continue;

      const parsed = this._parseDateStringToLocal(task.dueDate);
      if (!parsed || isNaN(parsed.getTime())) continue;

      // Normalize the task date to start of that day for inclusive comparisons
      const taskStartOfDay = new Date(parsed);
      taskStartOfDay.setHours(0, 0, 0, 0);

      // Compare inclusively
      if (taskStartOfDay >= todayStart && taskStartOfDay <= endDate && task.status !== 'completed') {
        upcoming.push(task);
      }
    }

    // Sort by dueDate ascending (attempt to parse ISO or YYYY-MM-DD)
    upcoming.sort((a, b) => {
      const pa = this._parseDateStringToLocal(a.dueDate) || new Date(0);
      const pb = this._parseDateStringToLocal(b.dueDate) || new Date(0);
      return pa - pb;
    });

    return upcoming;
  }

  async getSetting(key) {
    try {
      const setting = await this.get('settings', key);
      return setting ? setting.value : null;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return null;
    }
  }

  async setSetting(key, value) {
    try {
      const existing = await this.get('settings', key);
      if (existing) {
        existing.value = value;
        await this.update('settings', existing);
      } else {
        await this.add('settings', { key, value });
      }
      return true;
    } catch (error) {
      console.error(`Error setting ${key} to ${value}:`, error);
      return false;
    }
  }
}

// Initialize database instance
const db = new SchedulerDatabase();
window.db = db;
