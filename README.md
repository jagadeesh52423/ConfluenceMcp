# 🔗 Atlassian MCP Server

[![npm version](https://badge.fury.io/js/@jagadeesh52423%2Fatlassian-mcp-server.svg)](https://www.npmjs.com/package/@jagadeesh52423/atlassian-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An MCP (Model Context Protocol) server that gives AI assistants full access to Jira, Confluence, and Bitbucket Cloud APIs -- 84 tools covering deep CRUD across all three products.

## What It Does

This server acts as a bridge between any MCP-compatible AI client (Claude Desktop, etc.) and your Atlassian Cloud instance. Instead of switching between browser tabs, you ask your AI assistant to search Confluence, create Jira tickets, review pull requests, and more -- all through natural language.

### Key Features

- **Confluence** (20 tools) -- Search, create, read, update, and delete pages. Manage spaces, child pages, comments (full CRUD), attachments, labels, and version history. Input accepts Markdown (auto-converted to ADF); output is native ADF JSON.
- **Jira** (48 tools) -- Full issue lifecycle: search, CRUD, comments, transitions, attachments, issue links, worklogs, watchers, subtasks, labels, history, agile boards, sprints, versions, batch creation (up to 50 issues), dev status, epic linking, and user lookup.
- **Bitbucket** (16 tools) -- Repository management, branches, commits, pull requests (create/update/list), PR comments with resolve/unresolve, and issue tracking.
- **Smart Field Handling** -- AI-driven field suggestions during Jira transitions. Analyzes issue context to auto-suggest values for required fields (e.g., DB scripts, test cases), reducing manual input.
- **Snapshot Safety Net** -- Automatic local snapshots of mutating operations (create/update/delete) with configurable retention, so you can recover from accidental changes.

## Prerequisites

- **Node.js** >= 18
- **Atlassian Cloud** account(s) with API tokens
- An MCP-compatible client (e.g., [Claude Desktop](https://claude.ai/download))

## Installation

### From npm (recommended)

```bash
npm install -g @jagadeesh52423/atlassian-mcp-server
```

Or run without installing:

```bash
npx @jagadeesh52423/atlassian-mcp-server
```

### From source

```bash
git clone https://github.com/jagadeeshpulamarasetti/atlassian-mcp-server.git
cd atlassian-mcp-server
npm install
npm run build
```

## Configuration

### 1. Set environment variables

Copy the template and fill in your credentials:

```bash
cp .env.example .env
```

```env
# Confluence
CONFLUENCE_DOMAIN=your-domain.atlassian.net
CONFLUENCE_EMAIL=your-email@example.com
CONFLUENCE_API_TOKEN=your-confluence-api-token

# Jira
JIRA_DOMAIN=your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# Bitbucket
BITBUCKET_WORKSPACE=your-workspace
BITBUCKET_USERNAME=your-username
BITBUCKET_API_TOKEN=your-bitbucket-api-token
```

You can also set legacy `ATLASSIAN_*` variables as a fallback for Confluence and Jira. Bitbucket always requires its own credentials.

<details>
<summary>Optional: Jira OAuth and Snapshot settings</summary>

```env
# Jira OAuth (advanced auth)
JIRA_CLIENT_ID=your-client-id
JIRA_CLIENT_SECRET=your-client-secret

# Snapshot safety net (defaults shown)
MCP_SNAPSHOTS_ENABLED=true
MCP_SNAPSHOT_DIR=~/.atlassian-mcp-snapshots
MCP_SNAPSHOT_RETENTION_DAYS=30
```

</details>

### 2. Get an API token

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **Create API token**, give it a name, and copy the value
3. For Bitbucket, create a token under **Personal settings > Access tokens** with repo, issue, and PR scopes

## Usage

### Running the server

```bash
# Global install
atlassian-mcp-server

# From source
npm start

# Development (auto-reload)
npm run dev
```

### Claude Desktop integration

Add one of the following to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["-y", "@jagadeesh52423/atlassian-mcp-server"],
      "env": {
        "CONFLUENCE_DOMAIN": "your-domain.atlassian.net",
        "CONFLUENCE_EMAIL": "your-email@example.com",
        "CONFLUENCE_API_TOKEN": "your-token",
        "JIRA_DOMAIN": "your-domain.atlassian.net",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-token",
        "BITBUCKET_WORKSPACE": "your-workspace",
        "BITBUCKET_USERNAME": "your-username",
        "BITBUCKET_API_TOKEN": "your-token"
      }
    }
  }
}
```

<details>
<summary>Alternative: global install or from-source config</summary>

**Global install:**
```json
{
  "mcpServers": {
    "atlassian": {
      "command": "atlassian-mcp-server",
      "env": { "..." : "same env vars as above" }
    }
  }
}
```

**From source:**
```json
{
  "mcpServers": {
    "atlassian": {
      "command": "node",
      "args": ["/path/to/atlassian-mcp-server/dist/index.js"]
    }
  }
}
```

</details>

## Available Tools

### Confluence (20 tools)

| Tool | Description |
|------|-------------|
| `confluence_search_pages` | Search pages via CQL text query |
| `confluence_get_page` | Get a page by ID (returns ADF JSON body) |
| `confluence_create_page` | Create a page (accepts Markdown) |
| `confluence_update_page` | Update a page (accepts Markdown) |
| `confluence_delete_page` | Delete a page |
| `confluence_get_spaces` | List all spaces |
| `confluence_get_pages_by_space` | Get pages in a space |
| `confluence_get_page_children` | Get child pages |
| `confluence_get_page_history` | Get page version history |
| `confluence_get_attachments` | List page attachments |
| `confluence_add_attachment` | Upload an attachment |
| `confluence_delete_attachment` | Delete an attachment |
| `confluence_get_comments` | Get footer comments (ADF JSON) |
| `confluence_add_comment` | Add a comment (Markdown) |
| `confluence_update_comment` | Update a comment (Markdown) |
| `confluence_delete_comment` | Delete a comment |
| `confluence_get_labels` | Get page labels |
| `confluence_add_labels` | Add labels to a page |
| `confluence_remove_label` | Remove a label |

### Jira (48 tools)

| Category | Tools |
|----------|-------|
| **Core** | `search_issues`, `get_issue`, `create_issue`, `update_issue`, `delete_issue`, `get_projects`, `get_issue_types`, `get_fields`, `lookup_user` |
| **Comments** | `add_comment`, `get_comments`, `update_comment`, `delete_comment` |
| **Transitions** | `get_issue_transitions`, `transition_issue`, `transition_issue_interactive` (smart field handling) |
| **Attachments** | `get_attachments`, `add_attachment`, `delete_attachment` |
| **Issue Links** | `get_issue_links`, `create_issue_link`, `delete_issue_link`, `get_link_types` |
| **Worklogs** | `get_worklogs`, `add_worklog`, `update_worklog`, `delete_worklog` |
| **Watchers** | `get_watchers`, `add_watcher`, `remove_watcher` |
| **Subtasks** | `get_subtasks`, `create_subtask` |
| **Labels** | `get_labels`, `add_labels`, `remove_labels` |
| **History** | `get_issue_history` |
| **Agile** | `get_agile_boards`, `get_board_issues`, `get_sprints`, `get_sprint_issues`, `create_sprint`, `update_sprint` |
| **Versions** | `get_project_versions`, `create_version`, `update_version` |
| **Batch/Dev** | `batch_create_issues`, `get_dev_status` |
| **Epic** | `link_to_epic` |

All Jira tools are prefixed with `jira_`.

### Bitbucket (16 tools)

| Tool | Description |
|------|-------------|
| `bitbucket_get_repositories` | List workspace repositories |
| `bitbucket_get_repository` | Get repository details |
| `bitbucket_create_repository` | Create a repository |
| `bitbucket_get_pull_requests` | List pull requests |
| `bitbucket_get_pull_request` | Get a PR with diff |
| `bitbucket_create_pull_request` | Create a pull request |
| `bitbucket_update_pull_request` | Update a pull request |
| `bitbucket_get_branches` | List branches |
| `bitbucket_get_commits` | List commits |
| `bitbucket_get_issues` | List repository issues |
| `bitbucket_create_issue` | Create an issue |
| `bitbucket_get_pr_comments` | Get PR comments |
| `bitbucket_add_pr_comment` | Add a PR comment |
| `bitbucket_update_pr_comment` | Update a PR comment |
| `bitbucket_delete_pr_comment` | Delete a PR comment |
| `bitbucket_resolve_pr_comment` | Resolve/unresolve a PR comment |

## Confluence Content Format (v1.2.0+)

Confluence pages and comments use **ADF (Atlassian Document Format)** natively:

- **Input** -- `create_page`, `update_page`, `add_comment`, `update_comment` accept **Markdown**, which the server converts to ADF using the official `@atlaskit/editor-markdown-transformer`.
- **Output** -- `get_page`, `get_comments` return ADF JSON (an object, not a string).
- **Search** -- `search_pages` uses the v1 REST API (CQL); result content is legacy storage HTML. Fetch the page by ID for the ADF body.
- **Inline images** -- Not currently supported via ADF media nodes (requires Atlassian Media API tokens). Use `confluence_add_attachment` instead.

## Project Structure

```
src/
├── index.ts              # Server entry point and tool routing
├── config.ts             # Environment variable loading and validation
├── types.ts              # TypeScript interfaces
├── constants.ts          # Shared constants
├── error-handler.ts      # Structured error responses
├── formatters/           # Markdown-to-ADF and ADF-to-text converters
├── clients/              # HTTP clients (one per Atlassian product)
├── services/             # Business logic for each product
│   └── jira/             # Jira sub-modules (agile, comments, transitions, etc.)
├── handlers/             # MCP request handlers
├── tools/                # MCP tool definitions (schemas)
├── registry/             # Tool dispatch registry
└── snapshot/             # Snapshot safety net (auto-backup before mutations)
```

## Security

- Credentials are read from environment variables only; never committed to source control.
- All API calls use HTTPS with Basic Auth (base64-encoded `email:token`).
- Grant tokens the minimum required permissions.
- Snapshots are stored locally in `~/.atlassian-mcp-snapshots` by default.

## License

[MIT](LICENSE)

## Links

- **npm:** [@jagadeesh52423/atlassian-mcp-server](https://www.npmjs.com/package/@jagadeesh52423/atlassian-mcp-server)
- **Source:** [GitHub](https://github.com/jagadeeshpulamarasetti/atlassian-mcp-server)
- **Issues:** [GitHub Issues](https://github.com/jagadeeshpulamarasetti/atlassian-mcp-server/issues)
