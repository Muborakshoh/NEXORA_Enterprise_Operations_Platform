/**
 * Unit Tests for Backup and Disaster Recovery Utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BackupManager,
  DisasterRecoveryManager,
  DataMigration,
  DataIntegrityChecker,
} from '../src/core/utils/backup';

describe('Backup and Disaster Recovery Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('BackupManager', () => {
    it('should create backup with localStorage', async () => {
      localStorage.setItem('test_key', JSON.stringify({ value: 'test' }));
      
      const manager = BackupManager.getInstance({
        includeLocalStorage: true,
        includeSessionStorage: false,
        includeIndexedDB: false,
        includeCookies: false,
      });

      const backup = await manager.createBackup();

      expect(backup.version).toBe('1.0.0');
      expect(backup.timestamp).toBeTruthy();
      expect(backup.data.localStorage).toBeTruthy();
      expect(backup.data.localStorage!.test_key).toEqual({ value: 'test' });
    });

    it('should create backup with sessionStorage', async () => {
      sessionStorage.setItem('session_key', 'session_value');
      
      const manager = BackupManager.getInstance({
        includeLocalStorage: false,
        includeSessionStorage: true,
        includeIndexedDB: false,
        includeCookies: false,
      });

      const backup = await manager.createBackup();

      expect(backup.data.sessionStorage).toBeTruthy();
      expect(backup.data.sessionStorage!.session_key).toBe('session_value');
    });

    it('should exclude specified keys', async () => {
      localStorage.setItem('include', 'value1');
      localStorage.setItem('exclude', 'value2');
      
      const manager = BackupManager.getInstance({
        includeLocalStorage: true,
        includeSessionStorage: false,
        includeIndexedDB: false,
        includeCookies: false,
        excludeKeys: ['exclude'],
      });

      const backup = await manager.createBackup();

      expect(backup.data.localStorage!.include).toBe('value1');
      expect(backup.data.localStorage!.exclude).toBeUndefined();
    });

    it('should calculate checksum', async () => {
      localStorage.setItem('test', 'value');
      
      const manager = BackupManager.getInstance({
        includeLocalStorage: true,
        includeSessionStorage: false,
        includeIndexedDB: false,
        includeCookies: false,
      });

      const backup = await manager.createBackup();

      expect(backup.metadata.checksum).toBeTruthy();
      expect(backup.metadata.checksum.length).toBe(64); // SHA-256
    });

    it('should restore from backup', async () => {
      const manager = BackupManager.getInstance({
        includeLocalStorage: true,
        includeSessionStorage: false,
        includeIndexedDB: false,
        includeCookies: false,
      });

      localStorage.setItem('original', 'value');
      const backup = await manager.createBackup();

      localStorage.clear();
      expect(localStorage.getItem('original')).toBeNull();

      await manager.restoreBackup(backup);

      expect(localStorage.getItem('original')).toBe('value');
    });

    it('should verify checksum on restore', async () => {
      const manager = BackupManager.getInstance({
        includeLocalStorage: true,
        includeSessionStorage: false,
        includeIndexedDB: false,
        includeCookies: false,
      });

      localStorage.setItem('test', 'value');
      const backup = await manager.createBackup();

      backup.metadata.checksum = 'invalid_checksum';

      await expect(manager.restoreBackup(backup)).rejects.toThrow(
        'Backup checksum verification failed'
      );
    });

    it('should export backup to file', async () => {
      const manager = BackupManager.getInstance({
        includeLocalStorage: true,
        includeSessionStorage: false,
        includeIndexedDB: false,
        includeCookies: false,
      });

      localStorage.setItem('test', 'value');

      // Mock download
      const mockClick = vi.fn();
      const mockCreateObjectURL = vi.fn(() => 'blob:url');
      const mockRevokeObjectURL = vi.fn();

      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

      await manager.exportToFile('test-backup.json');

      expect(mockClick).toHaveBeenCalled();
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('should import backup from file', async () => {
      const manager = BackupManager.getInstance();

      const backupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          localStorage: { test: 'value' },
        },
        metadata: {
          size: 100,
          checksum: 'abc123',
          compressed: false,
        },
      };

      const file = new File([JSON.stringify(backupData)], 'backup.json', {
        type: 'application/json',
      });

      const imported = await manager.importFromFile(file);

      expect(imported.version).toBe('1.0.0');
      expect(imported.data.localStorage).toEqual({ test: 'value' });
    });
  });

  describe('DisasterRecoveryManager', () => {
    it('should create recovery point', async () => {
      const manager = DisasterRecoveryManager.getInstance();

      localStorage.setItem('test', 'value');
      const id = await manager.createRecoveryPoint('Test point');

      expect(id).toBeTruthy();
      expect(id.startsWith('recovery-')).toBe(true);
    });

    it('should list recovery points', async () => {
      const manager = DisasterRecoveryManager.getInstance();

      await manager.createRecoveryPoint('Point 1');
      await manager.createRecoveryPoint('Point 2');

      const points = manager.getRecoveryPoints();

      expect(points.length).toBeGreaterThanOrEqual(2);
      expect(points[0].label).toBeTruthy();
      expect(points[0].timestamp).toBeTruthy();
      expect(points[0].size).toBeGreaterThan(0);
    });

    it('should keep only last 10 recovery points', async () => {
      const manager = DisasterRecoveryManager.getInstance();

      for (let i = 0; i < 15; i++) {
        await manager.createRecoveryPoint(`Point ${i}`);
      }

      const points = manager.getRecoveryPoints();
      expect(points.length).toBeLessThanOrEqual(10);
    });

    it('should restore from recovery point', async () => {
      const manager = DisasterRecoveryManager.getInstance();

      localStorage.setItem('original', 'value');
      const id = await manager.createRecoveryPoint('Test');

      localStorage.clear();
      expect(localStorage.getItem('original')).toBeNull();

      await manager.restoreFromRecoveryPoint(id);

      expect(localStorage.getItem('original')).toBe('value');
    });

    it('should throw error for non-existent recovery point', async () => {
      const manager = DisasterRecoveryManager.getInstance();

      await expect(
        manager.restoreFromRecoveryPoint('non-existent')
      ).rejects.toThrow('Recovery point not found');
    });

    it('should delete recovery point', async () => {
      const manager = DisasterRecoveryManager.getInstance();

      const id = await manager.createRecoveryPoint('Test');
      expect(manager.getRecoveryPoints().find(p => p.id === id)).toBeTruthy();

      manager.deleteRecoveryPoint(id);
      expect(manager.getRecoveryPoints().find(p => p.id === id)).toBeUndefined();
    });

    it('should clear all recovery points', async () => {
      const manager = DisasterRecoveryManager.getInstance();

      await manager.createRecoveryPoint('Point 1');
      await manager.createRecoveryPoint('Point 2');

      manager.clearRecoveryPoints();

      expect(manager.getRecoveryPoints()).toHaveLength(0);
    });
  });

  describe('DataMigration', () => {
    it('should get current version', () => {
      const version = DataMigration.getCurrentVersion();
      expect(version).toBe('1.0.0');
    });

    it('should set version', () => {
      DataMigration.setVersion('2.0.0');
      expect(DataMigration.getCurrentVersion()).toBe('2.0.0');
    });

    it('should check if migration is needed', () => {
      expect(DataMigration.needsMigration('1.0.0', '2.0.0')).toBe(true);
      expect(DataMigration.needsMigration('1.0.0', '1.0.0')).toBe(false);
    });

    it('should run migration', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      await DataMigration.migrate('1.0.0', '2.0.0');

      expect(consoleSpy).toHaveBeenCalledWith('[Migration] Migrating from 1.0.0');
    });
  });

  describe('DataIntegrityChecker', () => {
    it('should check data integrity', async () => {
      const result = await DataIntegrityChecker.check();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should warn about missing required keys', async () => {
      localStorage.clear();

      const result = await DataIntegrityChecker.check();

      expect(result.warnings.some(w => w.includes('auth_token'))).toBe(true);
    });

    it('should repair data', async () => {
      localStorage.clear();

      const result = await DataIntegrityChecker.repair();

      expect(result.repaired).toContain('auth_token');
      expect(localStorage.getItem('auth_token')).toBe('');
    });
  });
});
