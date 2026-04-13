import { ConfluenceService } from '../../services/confluence.js';
import { SnapshotManager } from '../snapshot-manager.js';
import { createSnapshotProxy } from '../snapshot-decorator.js';
import { SnapshotMethodConfig } from '../snapshot-types.js';

export function applyConfluenceSnapshots(
  service: ConfluenceService,
  manager: SnapshotManager
): ConfluenceService {
  const methodConfigs: Record<string, SnapshotMethodConfig> = {
    createPage: {
      operationType: 'create',
      entityType: 'page',
      extractEntityId: () => 'new',
    },

    createPageWithImages: {
      operationType: 'create',
      entityType: 'page',
      extractEntityId: () => 'new',
    },

    updatePage: {
      operationType: 'update',
      entityType: 'page',
      extractEntityId: (pageId: string) => pageId,
      fetchBeforeState: (pageId: string) => service.getPage(pageId),
    },

    deletePage: {
      operationType: 'delete',
      entityType: 'page',
      extractEntityId: (pageId: string) => pageId,
      fetchBeforeState: (pageId: string) => service.getPage(pageId),
    },

    addComment: {
      operationType: 'create',
      entityType: 'comment',
      extractEntityId: () => 'new',
    },

    updateComment: {
      operationType: 'update',
      entityType: 'comment',
      extractEntityId: (commentId: string) => commentId,
    },

    deleteComment: {
      operationType: 'delete',
      entityType: 'comment',
      extractEntityId: (commentId: string) => commentId,
    },

    addAttachment: {
      operationType: 'create',
      entityType: 'attachment',
      extractEntityId: () => 'new',
    },

    deleteAttachment: {
      operationType: 'delete',
      entityType: 'attachment',
      extractEntityId: (attachmentId: string) => attachmentId,
    },

    addLabels: {
      operationType: 'update',
      entityType: 'labels',
      extractEntityId: (pageId: string) => pageId,
      fetchBeforeState: (pageId: string) => service.getLabels(pageId),
    },

    removeLabel: {
      operationType: 'delete',
      entityType: 'label',
      extractEntityId: (pageId: string) => pageId,
      fetchBeforeState: (pageId: string) => service.getLabels(pageId),
    },

    embedImage: {
      operationType: 'create',
      entityType: 'image',
      extractEntityId: (pageId: string) => pageId,
    },
  };

  return createSnapshotProxy(service, manager, 'confluence', methodConfigs);
}
