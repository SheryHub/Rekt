import { Recording, DeviceToken, VoiceSample, AppSettings } from '@shared/schema';

class LocalStorage {
  private dbName = 'VoiceRecorderDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('recordings')) {
          db.createObjectStore('recordings', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('voiceSamples')) {
          db.createObjectStore('voiceSamples', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('deviceToken')) {
          db.createObjectStore('deviceToken', { keyPath: 'id' });
        }
      };
    });
  }

  async saveRecording(recording: Recording, encryptedData: ArrayBuffer): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['recordings'], 'readwrite');
      const store = transaction.objectStore('recordings');
      
      const recordingWithData = {
        ...recording,
        data: encryptedData
      };

      const request = store.put(recordingWithData);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getRecordings(): Promise<(Recording & { data: ArrayBuffer })[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['recordings'], 'readonly');
      const store = transaction.objectStore('recordings');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteRecording(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['recordings'], 'readwrite');
      const store = transaction.objectStore('recordings');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async saveVoiceSample(sample: VoiceSample): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['voiceSamples'], 'readwrite');
      const store = transaction.objectStore('voiceSamples');
      const request = store.put(sample);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getVoiceSamples(): Promise<VoiceSample[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['voiceSamples'], 'readonly');
      const store = transaction.objectStore('voiceSamples');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveDeviceToken(token: DeviceToken): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['deviceToken'], 'readwrite');
      const store = transaction.objectStore('deviceToken');
      const request = store.put({ ...token, id: 'device_token' });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getDeviceToken(): Promise<DeviceToken | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['deviceToken'], 'readonly');
      const store = transaction.objectStore('deviceToken');
      const request = store.get('device_token');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? { token: result.token, createdAt: result.createdAt } : null);
      };
    });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key: 'app_settings', ...settings });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSettings(): Promise<AppSettings | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('app_settings');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { key, ...settings } = result;
          resolve(settings);
        } else {
          resolve(null);
        }
      };
    });
  }
}

export const localStorage = new LocalStorage();
