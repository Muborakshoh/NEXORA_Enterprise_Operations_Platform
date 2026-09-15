/**
 * Backup and Disaster Recovery Utilities
 * 
 * Utilities for data backup, restoration, and disaster recovery.
 */

/**
 * Backup configuration
 */
export interface BackupConfig {
  includeLocalStorage: boolean;
  includeSessionStorage: boolean;
  includeIndexedDB: boolean;
  includeCookies: boolean;
  excludeKeys?: string[];
  encryptionKey?: string;
}

/**
 * Backup data structure
 */
export interface BackupData {
  version: string;
  timestamp: string;
  organizationId?: string;
  userId?: string;
  data: {
    localStorage?: Record<string, any>;
    sessionStorage?: Record<string, any>;
    indexedDB?: Record<string, any>;
    cookies?: Record<string, string>;
  };
  metadata: {
    size: number;
    checksum: string;
    compressed: boolean;
  };
}

/**
 * Backup manager
 */
export class BackupManager {
  private static instance: BackupManager;
  private config: BackupConfig;

  private constructor(config: BackupConfig = {
    includeLocalStorage: true,
    includeSessionStorage: true,
    includeIndexedDB: false,
    includeCookies: false,
  }) {
    this.config = config;
  }

  static getInstance(config?: BackupConfig): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager(config);
    }
    return BackupManager.instance;
  }

  /**
   * Create backup
   */
  async createBackup(): Promise<BackupData> {
    const data: BackupData['data'] = {};

    // Backup localStorage
    if (this.config.includeLocalStorage) {
      data.localStorage = this.backupStorage(localStorage);
    }

    // Backup sessionStorage
    if (this.config.includeSessionStorage) {
      data.sessionStorage = this.backupStorage(sessionStorage);
    }

    // Backup IndexedDB
    if (this.config.includeIndexedDB) {
      data.indexedDB = await this.backupIndexedDB();
    }

    // Backup cookies
    if (this.config.includeCookies) {
      data.cookies = this.backupCookies();
    }

    // Filter excluded keys
    if (this.config.excludeKeys) {
      Object.keys(data).forEach(storageType => {
        const storage = data[storageType as keyof typeof data];
        if (storage) {
          this.config.excludeKeys!.forEach(key => {
            delete storage[key];
          });
        }
      });
    }

    // Calculate metadata
    const jsonString = JSON.stringify(data);
    const checksum = await this.calculateChecksum(jsonString);

    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        size: jsonString.length,
        checksum,
        compressed: false,
      },
    };
  }

  /**
   * Backup storage
   */
  private backupStorage(storage: Storage): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key) {
        const value = storage.getItem(key);
        if (value) {
          try {
            result[key] = JSON.parse(value);
          } catch {
            result[key] = value;
          }
        }
      }
    }

    return result;
  }

  /**
   * Backup IndexedDB
   */
  private async backupIndexedDB(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    
    // Get all database names
    const databases = await indexedDB.databases();
    
    for (const dbInfo of databases) {
      if (dbInfo.name) {
        try {
          const dbData = await this.exportDatabase(dbInfo.name);
          result[dbInfo.name] = dbData;
        } catch (error) {
          console.error(`Failed to backup database ${dbInfo.name}:`, error);
        }
      }
    }

    return result;
  }

  /**
   * Export IndexedDB database
   */
  private async exportDatabase(dbName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const data: Record<string, any[]> = {};
        
        const transaction = db.transaction(Array.from(db.objectStoreNames), 'readonly');
        
        for (const storeName of Array.from(db.objectStoreNames)) {
          const store = transaction.objectStore(storeName);
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => {
            data[storeName] = getAllRequest.result;
          };
        }
        
        transaction.oncomplete = () => {
          db.close();
          resolve(data);
        };
        
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  /**
   * Backup cookies
   */
  private backupCookies(): Record<string, string> {
    const result: Record<string, string> = {};
    const cookies = document.cookie.split(';');
    
    cookies.forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        result[name] = decodeURIComponent(value);
      }
    });

    return result;
  }

  /**
   * Calculate checksum
   */
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backup: BackupData): Promise<void> {
    // Verify checksum
    const dataString = JSON.stringify(backup.data);
    const checksum = await this.calculateChecksum(dataString);
    
    if (checksum !== backup.metadata.checksum) {
      throw new Error('Backup checksum verification failed');
    }

    // Restore localStorage
    if (backup.data.localStorage) {
      this.restoreStorage(localStorage, backup.data.localStorage);
    }

    // Restore sessionStorage
    if (backup.data.sessionStorage) {
      this.restoreStorage(sessionStorage, backup.data.sessionStorage);
    }

    // Restore IndexedDB
    if (backup.data.indexedDB) {
      await this.restoreIndexedDB(backup.data.indexedDB);
    }

    // Restore cookies
    if (backup.data.cookies) {
      this.restoreCookies(backup.data.cookies);
    }
  }

  /**
   * Restore storage
   */
  private restoreStorage(storage: Storage, data: Record<string, any>): void {
    Object.entries(data).forEach(([key, value]) => {
      try {
        storage.setItem(key, JSON.stringify(value));
      } catch {
        storage.setItem(key, String(value));
      }
    });
  }

  /**
   * Restore IndexedDB
   */
  private async restoreIndexedDB(data: Record<string, any>): Promise<void> {
    for (const [dbName, dbData] of Object.entries(data)) {
      try {
        await this.importDatabase(dbName, dbData);
      } catch (error) {
        console.error(`Failed to restore database ${dbName}:`, error);
      }
    }
  }

  /**
   * Import IndexedDB database
   */
  private async importDatabase(dbName: string, data: Record<string, any[]>): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(Array.from(db.objectStoreNames), 'readwrite');
        
        for (const [storeName, records] of Object.entries(data)) {
          const store = transaction.objectStore(storeName);
          
          // Clear existing data
          store.clear();
          
          // Import new data
          records.forEach(record => {
            store.add(record);
          });
        }
        
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onupgradeneeded = () => {
        reject(new Error(`Database ${dbName} does not exist`));
      };
    });
  }

  /**
   * Restore cookies
   */
  private restoreCookies(data: Record<string, string>): void {
    Object.entries(data).forEach(([name, value]) => {
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/`;
    });
  }

  /**
   * Export backup to file
   */
  async exportToFile(filename: string = 'backup.json'): Promise<void> {
    const backup = await this.createBackup();
    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import backup from file
   */
  async importFromFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string) as BackupData;
          resolve(backup);
        } catch (error) {
          reject(new Error('Failed to parse backup file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Schedule automatic backups
   */
  scheduleAutoBackup(intervalMs: number = 24 * 60 * 60 * 1000): void {
    setInterval(async () => {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await this.exportToFile(`auto-backup-${timestamp}.json`);
        console.log('[Backup] Auto backup completed');
      } catch (error) {
        console.error('[Backup] Auto backup failed:', error);
      }
    }, intervalMs);
  }
}

/**
 * Disaster recovery manager
 */
export class DisasterRecoveryManager {
  private static instance: DisasterRecoveryManager;
  private recoveryPoints: Map<string, {
    timestamp: number;
    backup: BackupData;
    label?: string;
  }> = new Map();
  private maxRecoveryPoints = 10;

  private constructor() {}

  static getInstance(): DisasterRecoveryManager {
    if (!DisasterRecoveryManager.instance) {
      DisasterRecoveryManager.instance = new DisasterRecoveryManager();
    }
    return DisasterRecoveryManager.instance;
  }

  /**
   * Create recovery point
   */
  async createRecoveryPoint(label?: string): Promise<string> {
    const backup = await BackupManager.getInstance().createBackup();
    const id = `recovery-${Date.now()}`;
    
    this.recoveryPoints.set(id, {
      timestamp: Date.now(),
      backup,
      label,
    });

    // Keep only last N recovery points
    if (this.recoveryPoints.size > this.maxRecoveryPoints) {
      const oldest = Array.from(this.recoveryPoints.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      this.recoveryPoints.delete(oldest[0]);
    }

    return id;
  }

  /**
   * Restore from recovery point
   */
  async restoreFromRecoveryPoint(id: string): Promise<void> {
    const point = this.recoveryPoints.get(id);
    if (!point) {
      throw new Error('Recovery point not found');
    }

    await BackupManager.getInstance().restoreBackup(point.backup);
  }

  /**
   * Get all recovery points
   */
  getRecoveryPoints(): Array<{
    id: string;
    timestamp: number;
    label?: string;
    size: number;
  }> {
    return Array.from(this.recoveryPoints.entries()).map(([id, point]) => ({
      id,
      timestamp: point.timestamp,
      label: point.label,
      size: point.backup.metadata.size,
    }));
  }

  /**
   * Delete recovery point
   */
  deleteRecoveryPoint(id: string): void {
    this.recoveryPoints.delete(id);
  }

  /**
   * Clear all recovery points
   */
  clearRecoveryPoints(): void {
    this.recoveryPoints.clear();
  }

  /**
   * Export recovery points
   */
  async exportRecoveryPoints(): Promise<void> {
    const points = Array.from(this.recoveryPoints.entries()).map(([id, point]) => ({
      id,
      ...point,
    }));

    const jsonString = JSON.stringify(points, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery-points-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * Data migration utilities
 */
export class DataMigration {
  /**
   * Migrate data from old format to new format
   */
  static async migrate(oldVersion: string, newVersion: string): Promise<void> {
    const migrations: Record<string, () => Promise<void>> = {
      '1.0.0': async () => {
        // Migration from 1.0.0 to current
        console.log('[Migration] Migrating from 1.0.0');
      },
      '1.1.0': async () => {
        // Migration from 1.1.0 to current
        console.log('[Migration] Migrating from 1.1.0');
      },
    };

    if (migrations[oldVersion]) {
      await migrations[oldVersion]();
    }
  }

  /**
   * Check if migration is needed
   */
  static needsMigration(currentVersion: string, targetVersion: string): boolean {
    return currentVersion !== targetVersion;
  }

  /**
   * Get current data version
   */
  static getCurrentVersion(): string {
    return localStorage.getItem('data_version') || '1.0.0';
  }

  /**
   * Set data version
   */
  static setVersion(version: string): void {
    localStorage.setItem('data_version', version);
  }
}

/**
 * Data integrity checker
 */
export class DataIntegrityChecker {
  /**
   * Check data integrity
   */
  static async check(): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check localStorage
    try {
      const requiredKeys = ['auth_token', 'user_data'];
      requiredKeys.forEach(key => {
        if (!localStorage.getItem(key)) {
          warnings.push(`Missing key: ${key}`);
        }
      });
    } catch (error) {
      errors.push(`localStorage check failed: ${error}`);
    }

    // Check IndexedDB
    try {
      const databases = await indexedDB.databases();
      if (databases.length === 0) {
        warnings.push('No IndexedDB databases found');
      }
    } catch (error) {
      errors.push(`IndexedDB check failed: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Repair data
   */
  static async repair(): Promise<{
    repaired: string[];
    failed: string[];
  }> {
    const repaired: string[] = [];
    const failed: string[] = [];

    // Repair localStorage
    try {
      // Add missing required keys with default values
      if (!localStorage.getItem('auth_token')) {
        localStorage.setItem('auth_token', '');
        repaired.push('auth_token');
      }
    } catch (error) {
      failed.push(`localStorage repair failed: ${error}`);
    }

    return { repaired, failed };
  }
}

// Export singleton instances
export const backupManager = BackupManager.getInstance();
export const disasterRecoveryManager = DisasterRecoveryManager.getInstance();
