# Atlassian MCP Server

[![npm version](https://badge.fury.io/js/@jagadeesh52423%2Fatlassian-mcp-server.svg)](https://www.npmjs.com/package/@jagadeesh52423/atlassian-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive Model Context Protocol (MCP) server that provides AI assistants with access to Atlassian APIs including Jira, Confluence, and Bitbucket. **84 tools** across 3 services — the most complete Atlassian MCP server available.

## Feature Comparison

How we stack up against the official Atlassian MCP server and the popular sooperset/mcp-atlassian:

### Confluence

| Feature | Ours | Official Atlassian | sooperset |
|---|:---:|:---:|:---:|
| Search / Get / Create / Update page | YES | YES | YES |
| Delete page | YES | NO | YES |
| Get spaces / pages by space | YES | YES | NO |
| Get child pages | YES | YES | YES |
| Get/Add comments | YES | YES | YES |
| **Update/Delete comment** | **YES** | NO | NO |
| Get/Add/Delete attachments | YES | NO | YES |
| **Embed image (with positioning)** | **YES** | NO | NO |
| **Create page with inline images** | **YES** | NO | NO |
| Get/Add/Remove labels | YES | NO | Partial |
| **Page version history** | YES | NO | YES |

### Jira

| Feature | Ours | Official Atlassian | sooperset |
|---|:---:|:---:|:---:|
| Search/Get/Create/Update issue | YES | YES | YES |
| Delete issue | YES | NO | YES |
| Comments (full CRUD) | YES | Partial | Partial |
| **Smart transition (AI auto-fill)** | **YES** | NO | NO |
| Attachments (get/add/delete) | YES | NO | NO |
| Issue links (full CRUD) | YES | NO | Partial |
| Worklogs (full CRUD) | YES | Partial | Partial |
| **Watchers (get/add/remove)** | **YES** | NO | NO |
| **Subtasks (get/create)** | **YES** | NO | NO |
| **Labels (get/add/remove)** | **YES** | NO | NO |
| Agile boards & board issues | YES | NO | YES |
| Sprints (list/create/update) | YES | NO | YES |
| Sprint issues | YES | NO | YES |
| Batch create issues | YES | NO | YES |
| Dev status (PRs/branches/commits) | YES | NO | YES |
| Issue history | YES | NO | YES |
| Fields discovery | YES | NO | YES |
| User lookup by name/email | YES | YES | YES |
| Issue type metadata | YES | YES | NO |
| Version/release management | YES | NO | YES |
| Epic linking | YES | NO | YES |

### Bitbucket

| Feature | Ours | Official Atlassian | sooperset |
|---|:---:|:---:|:---:|
| **Full Bitbucket support (16 tools)** | **YES** | NO | NO |

### Key Differentiators

- **Only MCP server covering all 3 Atlassian products** — Confluence + Jira + Bitbucket
- **Deepest CRUD coverage** — update/delete on comments, worklogs, labels where competitors only do create/read
- **Smart Field Handling** — AI-driven field suggestions during Jira transitions, unique to this server
- **Image embedding** — Confluence image embedding with positioning control, unique to this server
- **84 total tools** vs ~45 (Official) and ~58 (sooperset)

## Features

### Confluence Integration (20 tools)
- Search pages by text query
- Get, create, update, and delete pages
- List spaces and pages within spaces
- **Child Pages**: Get child pages of a parent page
- **Page History**: View version history of a page
- **Attachments**: Add, list, and delete attachments
- **Comments**: Full CRUD operations on page comments
- **Labels**: Get, add, and remove labels on pages
- **Images**: Embed images in page content with positioning control
- Full support for Confluence storage format

### Jira Integration (48 tools)
- Search issues by text, filters, or JQL query
- Get, create, update, and delete issues
- **Comments**: Full CRUD operations on issue comments
- **Transitions**: Move issues between statuses with **Smart Field Handling**
- **Attachments**: Add, list, and delete attachments
- **Issue Links**: Create and manage links between issues
- **Worklogs**: Full CRUD for time tracking entries
- **Watchers**: Manage issue watchers
- **Subtasks**: Create and list subtasks
- **History**: View issue change history
- **Labels**: Get, add, and remove labels on issues
- **Fields**: Discover available standard and custom fields
- **Agile**: List boards, get board issues, manage sprints
- **Sprints**: Create, update, list sprint issues
- **Versions**: Get, create, and update project versions/releases
- **Batch Operations**: Bulk create up to 50 issues at once
- **Dev Status**: View linked PRs, branches, and commits
- **User Lookup**: Search users by name or email
- **Issue Types**: Get available issue types per project
- **Epic Linking**: Link issues to epics (next-gen + classic)
- List projects

#### Smart Field Handling
Advanced transition management with intelligent field suggestions:
- **Contextual Analysis**: Analyzes issue content to provide smart field suggestions
- **Pattern Recognition**: Recognizes common field patterns (DB scripts, test cases, etc.)
- **Auto-Suggestions**: Provides context-aware suggestions with reasoning
- **Enhanced Error Handling**: Returns detailed field information instead of cryptic errors

### Bitbucket Integration (16 tools)
- List and search repositories
- Get repository details and create new repositories
- Manage branches and commits
- **Pull Requests**: Create, list, and get PR details with diffs
- **PR Comments**: Full CRUD with resolve/unresolve support
- Issue tracking within repositories

## Installation

### Option 1: Install from npm (Recommended)

```bash
npm install -g @jagadeesh52423/atlassian-mcp-server
```

Or use with npx without installing:
```bash
npx @jagadeesh52423/atlassian-mcp-server
```

### Option 2: Install from source

1. Clone this repository:
```bash
git clone https://github.com/jagadeeshpulamarasetti/atlassian-mcp-server.git
cd atlassian-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Fill in your Atlassian credentials in `.env`:

```env
# Confluence Configuration
CONFLUENCE_DOMAIN=your-domain.atlassian.net
CONFLUENCE_EMAIL=your-email@example.com
CONFLUENCE_API_TOKEN=your-confluence-api-token

# Jira Configuration
JIRA_DOMAIN=your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# Optional: OAuth Configuration (for advanced auth)
JIRA_CLIENT_ID=your-client-id
JIRA_CLIENT_SECRET=your-client-secret

# Bitbucket Configuration
BITBUCKET_WORKSPACE=your-workspace
BITBUCKET_USERNAME=your-username
BITBUCKET_API_TOKEN=your-bitbucket-api-token

# Legacy: Atlassian Configuration (backward compatibility)
ATLASSIAN_DOMAIN=your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token
```

### Getting API Tokens

#### Atlassian API Token
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a label and create
4. Copy the token to your `.env` file

#### Bitbucket API Token
1. Go to your Bitbucket settings > Personal access tokens
2. Create a new API token with required scopes:
   - Repositories: Read, Write
   - Issues: Read, Write
   - Pull requests: Read, Write
   - Pipelines: Read (if needed)
3. Copy the token to your `.env` file

**Note**: App passwords are deprecated as of September 9, 2025. Use API tokens instead.

## Usage

### Running the Server

If installed globally:
```bash
atlassian-mcp-server
```

If running from source:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### Integration with Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

#### If installed globally via npm:
```json
{
  "mcpServers": {
    "atlassian": {
      "command": "atlassian-mcp-server",
      "env": {
        "CONFLUENCE_DOMAIN": "your-domain.atlassian.net",
        "CONFLUENCE_EMAIL": "your-email@example.com",
        "CONFLUENCE_API_TOKEN": "your-confluence-api-token",
        "JIRA_DOMAIN": "your-domain.atlassian.net",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-jira-api-token",
        "BITBUCKET_WORKSPACE": "your-workspace",
        "BITBUCKET_USERNAME": "your-username",
        "BITBUCKET_API_TOKEN": "your-bitbucket-api-token"
      }
    }
  }
}
```

#### If using npx:
```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["-y", "@jagadeesh52423/atlassian-mcp-server"],
      "env": {
        "CONFLUENCE_DOMAIN": "your-domain.atlassian.net",
        "CONFLUENCE_EMAIL": "your-email@example.com",
        "CONFLUENCE_API_TOKEN": "your-confluence-api-token",
        "JIRA_DOMAIN": "your-domain.atlassian.net",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-jira-api-token",
        "BITBUCKET_WORKSPACE": "your-workspace",
        "BITBUCKET_USERNAME": "your-username",
        "BITBUCKET_API_TOKEN": "your-bitbucket-api-token"
      }
    }
  }
}
```

#### If installed from source:
```json
{
  "mcpServers": {
    "atlassian": {
      "command": "node",
      "args": ["/path/to/your/atlassian-mcp-server/dist/index.js"]
    }
  }
}
```

## Available Tools

### Confluence Tools (20 tools)

| Tool | Description |
|------|-------------|
| `confluence_search_pages` | Search pages by text query |
| `confluence_get_page` | Get specific page by ID |
| `confluence_create_page` | Create new page with content and optional inline images |
| `confluence_update_page` | Update existing page |
| `confluence_delete_page` | Delete a page |
| `confluence_get_spaces` | List all spaces |
| `confluence_get_pages_by_space` | Get pages from specific space |
| `confluence_get_page_children` | Get child pages of a parent page |
| `confluence_get_page_history` | Get page version history |
| `confluence_get_attachments` | List attachments on a page |
| `confluence_add_attachment` | Add attachment to a page |
| `confluence_delete_attachment` | Delete attachment from a page |
| `confluence_embed_image` | Embed image in page content with positioning |
| `confluence_get_comments` | Get comments on a page |
| `confluence_add_comment` | Add comment to a page |
| `confluence_update_comment` | Update existing comment |
| `confluence_delete_comment` | Delete comment from a page |
| `confluence_get_labels` | Get labels on a page |
| `confluence_add_labels` | Add labels to a page |
| `confluence_remove_label` | Remove a label from a page |

### Jira Tools (48 tools)

| Tool | Description |
|------|-------------|
| **Core** | |
| `jira_search_issues` | Search issues by text, filters, or JQL |
| `jira_get_issue` | Get specific issue by key |
| `jira_create_issue` | Create new issue with custom fields |
| `jira_update_issue` | Update existing issue |
| `jira_delete_issue` | Delete issue with optional subtask deletion |
| `jira_get_projects` | List all projects |
| `jira_get_issue_types` | Get available issue types for a project |
| `jira_get_fields` | Discover available standard and custom fields |
| `jira_lookup_user` | Look up users by name or email |
| **Comments** | |
| `jira_add_comment` | Add comment to issue |
| `jira_get_comments` | Get comments on an issue |
| `jira_update_comment` | Update existing comment |
| `jira_delete_comment` | Delete comment from issue |
| **Transitions** | |
| `jira_get_issue_transitions` | Get available transitions |
| `jira_transition_issue` | Change issue status |
| `jira_transition_issue_interactive` | Change status with smart field handling |
| **Attachments** | |
| `jira_get_attachments` | List attachments on an issue |
| `jira_add_attachment` | Add attachment to issue |
| `jira_delete_attachment` | Delete attachment from issue |
| **Issue Links** | |
| `jira_get_issue_links` | Get linked issues |
| `jira_create_issue_link` | Create link between issues |
| `jira_delete_issue_link` | Delete issue link |
| `jira_get_link_types` | Get available link types |
| **Worklogs** | |
| `jira_get_worklogs` | Get work logs on an issue |
| `jira_add_worklog` | Add work log entry |
| `jira_update_worklog` | Update work log entry |
| `jira_delete_worklog` | Delete work log entry |
| **Watchers** | |
| `jira_get_watchers` | Get issue watchers |
| `jira_add_watcher` | Add watcher to issue |
| `jira_remove_watcher` | Remove watcher from issue |
| **Subtasks** | |
| `jira_get_subtasks` | Get subtasks of an issue |
| `jira_create_subtask` | Create subtask for an issue |
| **Labels** | |
| `jira_get_labels` | Get available labels |
| `jira_add_labels` | Add labels to an issue |
| `jira_remove_labels` | Remove labels from an issue |
| **History** | |
| `jira_get_issue_history` | Get issue change history |
| **Agile / Sprints** | |
| `jira_get_agile_boards` | List agile boards with optional filters |
| `jira_get_board_issues` | Get issues on a board |
| `jira_get_sprints` | Get sprints for a board |
| `jira_get_sprint_issues` | Get issues in a sprint |
| `jira_create_sprint` | Create a new sprint |
| `jira_update_sprint` | Update sprint (name, state, dates, goal) |
| **Versions / Releases** | |
| `jira_get_project_versions` | Get all versions for a project |
| `jira_create_version` | Create a new version/release |
| `jira_update_version` | Update version (release, archive, dates) |
| **Batch & Dev** | |
| `jira_batch_create_issues` | Bulk create up to 50 issues |
| `jira_get_dev_status` | Get linked PRs, branches, commits |
| **Epic** | |
| `jira_link_to_epic` | Link an issue to an epic |

### Bitbucket Tools (16 tools)

| Tool | Description |
|------|-------------|
| `bitbucket_get_repositories` | List repositories in workspace |
| `bitbucket_get_repository` | Get specific repository details |
| `bitbucket_create_repository` | Create new repository |
| `bitbucket_get_pull_requests` | List pull requests |
| `bitbucket_get_pull_request` | Get specific PR with diff |
| `bitbucket_create_pull_request` | Create new pull request |
| `bitbucket_get_branches` | List branches |
| `bitbucket_get_commits` | List commits |
| `bitbucket_get_issues` | List repository issues |
| `bitbucket_create_issue` | Create new issue |
| `bitbucket_get_pr_comments` | Get PR comments |
| `bitbucket_add_pr_comment` | Add comment to a PR |
| `bitbucket_update_pr_comment` | Update PR comment |
| `bitbucket_delete_pr_comment` | Delete PR comment |
| `bitbucket_resolve_pr_comment` | Resolve a PR comment |
| `bitbucket_unresolve_pr_comment` | Unresolve a PR comment |

## Example Usage with AI Assistant

```
User: "Search for pages about API documentation in Confluence"
AI: Uses confluence_search_pages with query "API documentation"

User: "Create a new Jira issue for the bug I found"
AI: Uses jira_create_issue with appropriate project, summary, and description

User: "Move this Jira ticket to Code Review status"
AI: Uses jira_transition_issue_interactive which automatically:
     - Analyzes the issue content for context
     - Provides smart suggestions for required fields
     - Handles transition with minimal user input

User: "What pull requests are open in my main repository?"
AI: Uses bitbucket_get_pull_requests with your repository name

User: "Create 10 issues for the sprint backlog"
AI: Uses jira_batch_create_issues to create all at once

User: "Show me the active sprint and its issues"
AI: Uses jira_get_sprints then jira_get_sprint_issues
```

### Smart Field Handling Examples

```
Scenario: Transitioning a template configuration issue
Issue: "Update notification template to use 'Prefr App'"
Smart Suggestion: DB Script = "No" (Template changes use MOFU tool)
                  Test Cases = "No" (Template changes don't require separate tests)

Scenario: Transitioning a new feature development issue
Issue: "Implement user authentication system"
Smart Suggestion: DB Script = "Yes" (New features typically need database changes)
                  Test Cases = "Yes" (New features require comprehensive testing)
```

## Development

### Project Structure
```
src/
├── index.ts                # Main MCP server & tool routing
├── types.ts                # TypeScript interfaces
├── config.ts               # Configuration management
├── constants.ts            # Application-wide constants
├── error-handler.ts        # Structured error handling
├── clients/
│   ├── base-client.ts      # Base HTTP client
│   ├── confluence-client.ts
│   ├── jira-client.ts
│   └── bitbucket-client.ts
├── services/
│   ├── confluence.ts       # Confluence API service
│   ├── jira.ts             # Jira API service (with smart field handling)
│   └── bitbucket.ts        # Bitbucket API service
├── tools/
│   ├── index.ts            # Tool aggregation
│   ├── confluence-tools.ts # Confluence tool definitions
│   ├── jira-tools.ts       # Jira tool definitions
│   └── bitbucket-tools.ts  # Bitbucket tool definitions
└── handlers/
    ├── confluence-handlers.ts
    ├── jira-handlers.ts
    └── bitbucket-handlers.ts
```

### Building and Testing

```bash
# Build
npm run build

# Development with auto-reload
npm run dev

# Clean build artifacts
npm run clean
```

## Security Considerations

- API tokens are stored in environment variables
- All API calls use HTTPS
- Tokens should have minimal required permissions
- Never commit `.env` files to version control

## Error Handling

The server includes comprehensive error handling:
- API authentication errors
- Rate limiting responses
- Network connectivity issues
- Invalid parameters
- Resource not found errors
- Actionable tips for common issues

## Rate Limiting

Respects Atlassian API rate limits:
- Jira Cloud: 10 requests per second
- Confluence Cloud: 10 requests per second
- Bitbucket Cloud: 1000 requests per hour

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **npm package**: [@jagadeesh52423/atlassian-mcp-server](https://www.npmjs.com/package/@jagadeesh52423/atlassian-mcp-server)
- **Issues & Feature Requests**: [GitHub Issues](https://github.com/jagadeeshpulamarasetti/atlassian-mcp-server/issues)
- **Source Code**: [GitHub Repository](https://github.com/jagadeeshpulamarasetti/atlassian-mcp-server)
