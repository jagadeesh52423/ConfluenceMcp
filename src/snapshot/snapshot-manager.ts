import * as fs from 'fs/promises';
import * as path from 'path';
import { SnapshotConfig, SnapshotEntry } from './snapshot-types.js';

export class SnapshotManager {
  private config: SnapshotConfig;

  constructor(config: SnapshotConfig) {
    this.config = config;
    this.cleanup().catch(() => {});
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  async saveSnapshot(entry: SnapshotEntry): Promise<void> {
    try {
      const date = entry.timestamp.slice(0, 10);
      const sanitizedId = entry.entityId.replace(/\//g, '_');
      const ts = entry.timestamp.replace(/[:.]/g, '-');
      const dir = path.join(this.config.dir, entry.service, date);
      await fs.mkdir(dir, { recursive: true });
      const filename = `${entry.operation}_${entry.entityType}_${sanitizedId}_${ts}.json`;
      await fs.writeFile(path.join(dir, filename), JSON.stringify(entry, null, 2));
    } catch (err) {
      console.error('[snapshot] Failed to save snapshot:', err);
    }
  }

  async cleanup(): Promise<void> {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - this.config.retentionDays);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      let services: string[];
      try {
        services = await fs.readdir(this.config.dir);
      } catch {
        return;
      }

      for (const service of services) {
        const servicePath = path.join(this.config.dir, service);
        const stat = await fs.stat(servicePath).catch(() => null);
        if (!stat?.isDirectory()) continue;

        const dateDirs = await fs.readdir(servicePath).catch(() => [] as string[]);
        for (const dateDir of dateDirs) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateDir) && dateDir < cutoffStr) {
            await fs.rm(path.join(servicePath, dateDir), { recursive: true, force: true }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('[snapshot] Failed to cleanup snapshots:', err);
    }
  }
}
