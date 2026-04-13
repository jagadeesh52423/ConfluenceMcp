export type OperationType = 'create' | 'update' | 'delete';

export interface SnapshotEntry {
  timestamp: string;
  service: string;
  operation: OperationType;
  entityType: string;
  entityId: string;
  beforeState?: any;
  afterState?: any;
  metadata?: {
    operationArgs?: Record<string, any>;
    [key: string]: any;
  };
}

export interface SnapshotConfig {
  enabled: boolean;
  dir: string;
  retentionDays: number;
}

export interface SnapshotMethodConfig {
  operationType: OperationType;
  entityType: string;
  extractEntityId: (...args: any[]) => string;
  fetchBeforeState?: (...args: any[]) => Promise<any>;
}
