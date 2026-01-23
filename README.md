# Atlassian MCP Server

[![npm version](https://badge.fury.io/js/@jagadeesh52423%2Fatlassian-mcp-server.svg)](https://www.npmjs.com/package/@jagadeesh52423/atlassian-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive Model Context Protocol (MCP) server that provides AI assistants with access to Atlassian APIs including Jira, Confluence, and Bitbucket.

## Features

### Confluence Integration
- Search pages by text query
- Get specific pages by ID
- Create new pages with content
- Update existing pages
- List spaces and pages within spaces
- Full support for Confluence storage format

### Jira Integration
- Search issues by text query
- Get specific issues by key
- Create new issues with customizable fields
- Update existing issues
- Add comments to issues
- Transition issues between statuses with **Smart Field Handling**
- List projects and issue types
- Assign issues to users

#### Smart Field Handling
Advanced transition management with intelligent field suggestions:
- **Contextual Analysis**: Analyzes issue content to provide smart field suggestions
- **Pattern Recognition**: Recognizes common field patterns (DB scripts, test cases, etc.)
- **Auto-Suggestions**: Provides context-aware suggestions with reasoning
- **Enhanced Error Handling**: Returns detailed field information instead of cryptic errors

### Bitbucket Integration
- List and search repositories
- Get repository details
- Create new repositories
- Manage branches and commits
- Handle pull requests (create, list, review)
- Issue tracking within repositories
- File content operations

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
1. Go to your Bitbucket settings → Personal access tokens
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

### Confluence Tools

- `confluence_search_pages`: Search pages by text
- `confluence_get_page`: Get specific page by ID
- `confluence_create_page`: Create new page
- `confluence_update_page`: Update existing page
- `confluence_get_spaces`: List all spaces
- `confluence_get_pages_by_space`: Get pages from specific space

### Jira Tools

- `jira_search_issues`: Search issues by text
- `jira_get_issue`: Get specific issue by key
- `jira_create_issue`: Create new issue
- `jira_update_issue`: Update existing issue
- `jira_add_comment`: Add comment to issue
- `jira_get_projects`: List all projects
- `jira_get_issue_transitions`: Get available transitions for an issue
- `jira_transition_issue`: Change issue status (basic)
- `jira_transition_issue_interactive`: Change issue status with smart field handling

### Bitbucket Tools

- `bitbucket_get_repositories`: List repositories
- `bitbucket_get_repository`: Get specific repository
- `bitbucket_create_repository`: Create new repository
- `bitbucket_get_pull_requests`: List pull requests
- `bitbucket_create_pull_request`: Create new pull request
- `bitbucket_get_branches`: List branches
- `bitbucket_get_commits`: List commits
- `bitbucket_get_issues`: List repository issues
- `bitbucket_create_issue`: Create new issue

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
├── index.ts              # Main MCP server
├── types.ts              # TypeScript interfaces
├── config.ts             # Configuration management
├── confluence-client.ts  # Confluence API client
├── jira-client.ts        # Jira API client
├── bitbucket-client.ts   # Bitbucket API client
└── services/
    ├── confluence.ts     # Confluence API service
    ├── jira.ts          # Jira API service (with smart field handling)
    └── bitbucket.ts     # Bitbucket API service
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