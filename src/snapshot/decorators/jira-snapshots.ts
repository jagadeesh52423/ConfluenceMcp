import { JiraService } from '../../services/jira.js';
import { SnapshotManager } from '../snapshot-manager.js';
import { createSnapshotProxy } from '../snapshot-decorator.js';
import { SnapshotMethodConfig } from '../snapshot-types.js';

export function applyJiraSnapshots(
  service: JiraService,
  manager: SnapshotManager
): JiraService {
  const methodConfigs: Record<string, SnapshotMethodConfig> = {
    // ── Issues ──────────────────────────────────────────────
    createIssue: {
      operationType: 'create',
      entityType: 'issue',
      extractEntityId: () => 'new',
    },
    updateIssue: {
      operationType: 'update',
      entityType: 'issue',
      extractEntityId: (key: string) => key,
      fetchBeforeState: (key: string) => service.getIssue(key),
    },
    deleteIssue: {
      operationType: 'delete',
      entityType: 'issue',
      extractEntityId: (key: string) => key,
      fetchBeforeState: (key: string) => service.getIssue(key),
    },
    assignIssue: {
      operationType: 'update',
      entityType: 'issue',
      extractEntityId: (key: string) => key,
      fetchBeforeState: (key: string) => service.getIssue(key),
    },
    batchCreateIssues: {
      operationType: 'create',
      entityType: 'issues',
      extractEntityId: () => 'batch',
    },

    // ── Transitions ─────────────────────────────────────────
    transitionIssue: {
      operationType: 'update',
      entityType: 'issue',
      extractEntityId: (key: string) => key,
      fetchBeforeState: (key: string) => service.getIssue(key),
    },
    transitionIssueInteractive: {
      operationType: 'update',
      entityType: 'issue',
      extractEntityId: (key: string) => key,
      fetchBeforeState: (key: string) => service.getIssue(key),
    },

    // ── Comments ────────────────────────────────────────────
    addComment: {
      operationType: 'create',
      entityType: 'comment',
      extractEntityId: (key: string) => key,
    },
    updateComment: {
      operationType: 'update',
      entityType: 'comment',
      extractEntityId: (_key: string, commentId: string) => commentId,
      fetchBeforeState: (key: string) => service.getComments(key),
    },
    deleteComment: {
      operationType: 'delete',
      entityType: 'comment',
      extractEntityId: (_key: string, commentId: string) => commentId,
      fetchBeforeState: (key: string) => service.getComments(key),
    },

    // ── Attachments ─────────────────────────────────────────
    addAttachment: {
      operationType: 'create',
      entityType: 'attachment',
      extractEntityId: (key: string) => key,
    },
    deleteAttachment: {
      operationType: 'delete',
      entityType: 'attachment',
      extractEntityId: (attachmentId: string) => attachmentId,
    },

    // ── Links ───────────────────────────────────────────────
    createIssueLink: {
      operationType: 'create',
      entityType: 'link',
      extractEntityId: () => 'new',
    },
    deleteIssueLink: {
      operationType: 'delete',
      entityType: 'link',
      extractEntityId: (linkId: string) => linkId,
    },
    linkToEpic: {
      operationType: 'update',
      entityType: 'epic-link',
      extractEntityId: (key: string) => key,
      fetchBeforeState: (key: string) => service.getIssue(key),
    },

    // ── Worklogs ────────────────────────────────────────────
    addWorkLog: {
      operationType: 'create',
      entityType: 'worklog',
      extractEntityId: (key: string) => key,
    },
    updateWorkLog: {
      operationType: 'update',
      entityType: 'worklog',
      extractEntityId: (_key: string, worklogId: string) => worklogId,
      fetchBeforeState: (key: string) => service.getWorkLogs(key),
    },
    deleteWorkLog: {
      operationType: 'delete',
      entityType: 'worklog',
      extractEntityId: (_key: string, worklogId: string) => worklogId,
      fetchBeforeState: (key: string) => service.getWorkLogs(key),
    },

    // ── Watchers ────────────────────────────────────────────
    addWatcher: {
      operationType: 'create',
      entityType: 'watcher',
      extractEntityId: (key: string) => key,
    },
    removeWatcher: {
      operationType: 'delete',
      entityType: 'watcher',
      extractEntityId: (key: string) => key,
      fetchBeforeState: (key: string) => service.getWatchers(key),
    },

    // ── Labels ──────────────────────────────────────────────
    addLabels: {
      operationType: 'update',
      entityType: 'labels',
      extractEntityId: (key: string) => key,
      fetchBeforeState: (key: string) => service.getIssue(key),
    },
    removeLabels: {
      operationType: 'update',
      entityType: 'labels',
      extractEntityId: (key: string) => key,
      fetchBeforeState: (key: string) => service.getIssue(key),
    },

    // ── Subtasks ────────────────────────────────────────────
    createSubTask: {
      operationType: 'create',
      entityType: 'subtask',
      extractEntityId: () => 'new',
    },

    // ── Agile ───────────────────────────────────────────────
    moveIssuesToSprint: {
      operationType: 'update',
      entityType: 'sprint-issues',
      extractEntityId: (sprintId: number) => String(sprintId),
    },
    createSprint: {
      operationType: 'create',
      entityType: 'sprint',
      extractEntityId: () => 'new',
    },
    updateSprint: {
      operationType: 'update',
      entityType: 'sprint',
      extractEntityId: (sprintId: number) => String(sprintId),
    },

    // ── Versions ────────────────────────────────────────────
    createVersion: {
      operationType: 'create',
      entityType: 'version',
      extractEntityId: () => 'new',
    },
    updateVersion: {
      operationType: 'update',
      entityType: 'version',
      extractEntityId: (versionId: string) => versionId,
    },
  };

  return createSnapshotProxy(service, manager, 'jira', methodConfigs);
}
