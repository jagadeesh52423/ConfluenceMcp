import { SnapshotManager } from './snapshot-manager.js';
import { SnapshotMethodConfig } from './snapshot-types.js';

export function createSnapshotProxy<T extends object>(
  target: T,
  snapshotManager: SnapshotManager,
  serviceName: string,
  methodConfigs: Record<string, SnapshotMethodConfig>
): T {
  if (!snapshotManager.isEnabled()) {
    return target;
  }

  return new Proxy(target, {
    get(obj, prop, receiver) {
      const value = Reflect.get(obj, prop, receiver);
      if (typeof prop !== 'string' || typeof value !== 'function' || !methodConfigs[prop]) {
        return value;
      }

      const config = methodConfigs[prop];
      return async function (this: any, ...args: any[]) {
        const timestamp = new Date().toISOString();
        const entityId = config.extractEntityId(...args);

        if (config.operationType === 'create') {
          const result = await value.apply(obj, args);
          try {
            await snapshotManager.saveSnapshot({
              timestamp,
              service: serviceName,
              operation: config.operationType,
              entityType: config.entityType,
              entityId,
              afterState: result,
              metadata: { operationArgs: sanitizeArgs(args) },
            });
          } catch {
            // never fail the main operation
          }
          return result;
        }

        let beforeState: any;
        if (config.fetchBeforeState) {
          try {
            beforeState = await config.fetchBeforeState(...args);
          } catch {
            // proceed without before state
          }
        }

        try {
          await snapshotManager.saveSnapshot({
            timestamp,
            service: serviceName,
            operation: config.operationType,
            entityType: config.entityType,
            entityId,
            beforeState,
            metadata: { operationArgs: sanitizeArgs(args) },
          });
        } catch {
          // never fail the main operation
        }

        return value.apply(obj, args);
      };
    },
  });
}

function sanitizeArgs(args: any[]): Record<string, any> {
  const result: Record<string, any> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
      result[`arg${i}`] = arg;
    } else if (arg && typeof arg === 'object') {
      result[`arg${i}`] = Object.keys(arg);
    }
  }
  return result;
}
