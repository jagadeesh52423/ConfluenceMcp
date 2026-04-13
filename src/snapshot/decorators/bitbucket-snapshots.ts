import { BitbucketService } from '../../services/bitbucket.js';
import { SnapshotManager } from '../snapshot-manager.js';
import { createSnapshotProxy } from '../snapshot-decorator.js';
import { SnapshotMethodConfig } from '../snapshot-types.js';

export function applyBitbucketSnapshots(
  service: BitbucketService,
  manager: SnapshotManager
): BitbucketService {
  const methodConfigs: Record<string, SnapshotMethodConfig> = {
    createRepository: {
      operationType: 'create',
      entityType: 'repository',
      extractEntityId: () => 'new',
    },

    deleteRepository: {
      operationType: 'delete',
      entityType: 'repository',
      extractEntityId: (repoName: string) => repoName,
      fetchBeforeState: (repoName: string) => service.getRepository(repoName),
    },

    createBranch: {
      operationType: 'create',
      entityType: 'branch',
      extractEntityId: (repoName: string, branchName: string) => `${repoName}/${branchName}`,
    },

    createPullRequest: {
      operationType: 'create',
      entityType: 'pullrequest',
      extractEntityId: () => 'new',
    },

    createFile: {
      operationType: 'create',
      entityType: 'file',
      extractEntityId: (repoName: string) => repoName,
    },

    createIssue: {
      operationType: 'create',
      entityType: 'issue',
      extractEntityId: () => 'new',
    },

    addPRComment: {
      operationType: 'create',
      entityType: 'pr-comment',
      extractEntityId: () => 'new',
    },

    updatePRComment: {
      operationType: 'update',
      entityType: 'pr-comment',
      extractEntityId: (repoName: string, prId: number, commentId: number) => String(commentId),
      fetchBeforeState: (repoName: string, prId: number) => service.getPRComments(repoName, prId),
    },

    deletePRComment: {
      operationType: 'delete',
      entityType: 'pr-comment',
      extractEntityId: (repoName: string, prId: number, commentId: number) => String(commentId),
      fetchBeforeState: (repoName: string, prId: number) => service.getPRComments(repoName, prId),
    },

    resolvePRComment: {
      operationType: 'update',
      entityType: 'pr-comment-resolve',
      extractEntityId: (repoName: string, prId: number, commentId: number) => String(commentId),
    },

    unresolvePRComment: {
      operationType: 'update',
      entityType: 'pr-comment-resolve',
      extractEntityId: (repoName: string, prId: number, commentId: number) => String(commentId),
    },
  };

  return createSnapshotProxy(service, manager, 'bitbucket', methodConfigs);
}
