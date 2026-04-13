# Snapshot Safety Net for MCP Mutations

## Problem

The MCP server has 43 mutating operations (21 create, 8 update, 14 delete) across Confluence, Jira, and Bitbucket with zero backup or recovery mechanisms. A bad API call can overwrite page content, delete issues, or lose comments with no way to recover.

## Solution

A pre-operation snapshot system using the **decorator pattern** that wraps all mutating service methods. Before any write/update/delete, the current entity state is saved to a local JSON file for manual recovery.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Safety level | Pre-operation snapshots only | Lightweight, no complex rollback logic |
| Scope | All mutations (create + update + delete) | Full coverage — creates track new IDs, updates/deletes preserve before-state |
| Storage | Local directory with service/date structure | Simple, debuggable, no extra dependencies |
| Pattern | Decorator on service methods | Zero changes to existing service logic, clean separation of concerns |

## Architecture

```
Tool Request → Handler → SnapshotDecorator → Service → API
                              │
                              ├── [UPDATE/DELETE] Fetch current state → save to disk
                              ├── [CREATE] Execute → save response (new ID) to disk
                              └── Continue with original operation
```

### Components

#### 1. `SnapshotManager` (`src/snapshot/snapshot-manager.ts`)

Handles all file I/O and directory organization.

**Responsibilities:**
- Write snapshot JSON files to disk
- Organize by `~/.atlassian-mcp-snapshots/{service}/{YYYY-MM-DD}/{operation}_{entityType}_{id}_{timestamp}.json`
- Auto-cleanup of files older than retention period on startup
- Async writes — never blocks the main operation

**Snapshot file format:**
```json
{
  "timestamp": "2026-04-13T14:30:00.000Z",
  "service": "confluence",
  "operation": "updatePage",
  "entityType": "page",
  "entityId": "12345",
  "beforeState": {},
  "metadata": {
    "title": "My Page",
    "version": 5,
    "operationArgs": {}
  }
}
```

**Configuration:**
- `MCP_SNAPSHOT_DIR` — storage path (default: `~/.atlassian-mcp-snapshots`)
- `MCP_SNAPSHOT_RETENTION_DAYS` — auto-cleanup threshold (default: 30)
- `MCP_SNAPSHOTS_ENABLED` — toggle on/off (default: true)

#### 2. `SnapshotDecorator` (`src/snapshot/snapshot-decorator.ts`)

Generic decorator factory that wraps service methods with snapshot logic.

**Core function signature:**
```typescript
function withSnapshot<T>(
  snapshotManager: SnapshotManager,
  service: string,
  operationType: 'create' | 'update' | 'delete',
  entityType: string,
  fetchBeforeState: (...args: any[]) => Promise<any>,
  extractEntityId: (...args: any[]) => string
): (originalMethod: T) => T
```

**Behavior by operation type:**

| Type | Before Operation | After Operation |
|------|-----------------|-----------------|
| **update** | Fetch current state via GET, save snapshot | — |
| **delete** | Fetch current state via GET, save snapshot | — |
| **create** | — | Save response (new IDs, URLs) as snapshot |

#### 3. Service-Specific Decorators (`src/snapshot/decorators/`)

One decorator configuration file per service that maps methods to their snapshot behavior.

**`confluence-snapshots.ts`** — defines how to fetch before-state for each Confluence mutation:
- `updatePage` → GET page by ID (content, title, version)
- `deletePage` → GET page by ID (full content)
- `createPage` → save response (new page ID, URL)
- `addComment` / `updateComment` → GET comment by ID
- `deleteComment` → GET comment by ID
- `addAttachment` → metadata only (not binary)
- `deleteAttachment` → attachment metadata
- `addLabels` / `removeLabel` → GET current labels list

**`jira-snapshots.ts`** — defines how to fetch before-state for each Jira mutation:
- `createIssue` → save response (new issue key)
- `updateIssue` → GET issue by key (current fields)
- `deleteIssue` → GET issue by key (full data + subtasks list)
- `transitionIssue` / `transitionIssueInteractive` → GET current status
- `addComment` / `updateComment` / `deleteComment` → GET comment
- `addAttachment` / `deleteAttachment` → attachment metadata
- `createIssueLink` / `deleteIssueLink` → link details
- `addWorkLog` / `updateWorkLog` / `deleteWorkLog` → worklog entry
- `addWatcher` / `removeWatcher` → watcher list
- `addLabels` / `removeLabels` → current labels
- `createSubTask` → save response (new subtask key)
- `createSprint` / `updateSprint` → sprint details
- `createVersion` / `updateVersion` → version details
- `batchCreateIssues` → save response (all new issue keys)
- `linkToEpic` → current epic link status
- `assignIssue` → current assignee

**`bitbucket-snapshots.ts`** — defines how to fetch before-state for each Bitbucket mutation:
- `createRepository` → save response (new repo details)
- `deleteRepository` → GET repo metadata
- `createPullRequest` → save response (new PR details)
- `addPRComment` / `updatePRComment` / `deletePRComment` → comment content
- `createIssue` → save response (new issue details)
- `createBranch` → save response (new branch details)
- `createFile` → save response (new file details)
- `resolvePRComment` / `unresolvePRComment` → resolution status

#### 4. Integration Point (`src/snapshot/apply-snapshots.ts`)

Factory functions that apply snapshot decorators to service instances.

```typescript
function applyConfluenceSnapshots(service: ConfluenceService, manager: SnapshotManager): ConfluenceService
function applyJiraSnapshots(service: JiraService, manager: SnapshotManager): JiraService
function applyBitbucketSnapshots(service: BitbucketService, manager: SnapshotManager): BitbucketService
```

Called once during initialization in `index.ts`:
```typescript
const snapshotManager = new SnapshotManager(config);
const safeConfluence = applyConfluenceSnapshots(confluenceService, snapshotManager);
const safeBitbucket = applyBitbucketSnapshots(bitbucketService, snapshotManager);
// Handlers receive decorated services
```

## Error Handling

| Failure | Behavior |
|---------|----------|
| Snapshot write fails | Log warning, proceed with main operation |
| Pre-fetch fails (can't GET current state) | Log warning, save partial snapshot, proceed |
| Main operation fails | Snapshot still exists for debugging context |
| Disk full | Log error, proceed with main operation |

The snapshot system must **never** block or fail the main operation. It is purely additive safety.

## File Structure

```
src/snapshot/
├── snapshot-manager.ts         # File I/O, directory management, cleanup
├── snapshot-decorator.ts       # Generic decorator factory
├── snapshot-types.ts           # TypeScript interfaces
├── apply-snapshots.ts          # Integration factory functions
└── decorators/
    ├── confluence-snapshots.ts # Confluence method → snapshot config mapping
    ├── jira-snapshots.ts       # Jira method → snapshot config mapping
    └── bitbucket-snapshots.ts  # Bitbucket method → snapshot config mapping
```

## Configuration

Add to `.env.example`:
```
# Snapshot Safety Net
MCP_SNAPSHOTS_ENABLED=true
MCP_SNAPSHOT_DIR=~/.atlassian-mcp-snapshots
MCP_SNAPSHOT_RETENTION_DAYS=30
```

Add to `src/config.ts`:
```typescript
snapshot: {
  enabled: process.env.MCP_SNAPSHOTS_ENABLED !== 'false',
  dir: process.env.MCP_SNAPSHOT_DIR || path.join(os.homedir(), '.atlassian-mcp-snapshots'),
  retentionDays: parseInt(process.env.MCP_SNAPSHOT_RETENTION_DAYS || '30', 10)
}
```

## Storage Example

```
~/.atlassian-mcp-snapshots/
├── confluence/
│   └── 2026-04-13/
│       ├── update_page_12345_1681388400000.json
│       ├── delete_page_67890_1681388500000.json
│       └── create_page_99999_1681388600000.json
├── jira/
│   └── 2026-04-13/
│       ├── update_issue_PROJ-123_1681388400000.json
│       └── delete_issue_PROJ-456_1681388500000.json
└── bitbucket/
    └── 2026-04-13/
        └── create_pullrequest_42_1681388400000.json
```

## Changes to Existing Code

| File | Change |
|------|--------|
| `src/index.ts` | Import and apply snapshot decorators to services during init |
| `src/config.ts` | Add snapshot configuration fields |
| `.env.example` | Add snapshot environment variables |

**No changes** to any service files, handler files, client files, or tool definitions.

## Testing Strategy

- Unit test `SnapshotManager`: file creation, directory structure, cleanup, error resilience
- Unit test decorator: verify snapshot saved before update/delete, after create
- Integration test: wrap a mock service, verify snapshot files written correctly
- Error resilience test: verify main operation succeeds when snapshot I/O fails
