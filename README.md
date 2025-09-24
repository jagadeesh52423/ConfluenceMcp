# Atlassian MCP Server

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
- Transition issues between statuses
- List projects and issue types
- Assign issues to users

### Bitbucket Integration
- List and search repositories
- Get repository details
- Create new repositories
- Manage branches and commits
- Handle pull requests (create, list, review)
- Issue tracking within repositories
- File content operations

## Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
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
# Required: Atlassian Configuration
ATLASSIAN_DOMAIN=your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token

# Optional: OAuth Configuration (for advanced auth)
ATLASSIAN_CLIENT_ID=your-client-id
ATLASSIAN_CLIENT_SECRET=your-client-secret

# Optional: Bitbucket Configuration (if different from main Atlassian)
BITBUCKET_WORKSPACE=your-workspace
BITBUCKET_USERNAME=your-username
BITBUCKET_APP_PASSWORD=your-app-password
```

### Getting API Tokens

#### Atlassian API Token
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a label and create
4. Copy the token to your `.env` file

#### Bitbucket App Password
1. Go to your Bitbucket settings → App passwords
2. Create a new app password with required permissions:
   - Repositories: Read, Write, Admin
   - Issues: Read, Write
   - Pull requests: Read, Write
3. Copy the password to your `.env` file

## Usage

### Running the Server

Start the MCP server:
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
- `jira_transition_issue`: Change issue status

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

User: "What pull requests are open in my main repository?"
AI: Uses bitbucket_get_pull_requests with your repository name
```

## Development

### Project Structure
```
src/
├── index.ts              # Main MCP server
├── types.ts              # TypeScript interfaces
├── config.ts             # Configuration management
├── atlassian-client.ts   # Base API client
└── services/
    ├── confluence.ts     # Confluence API service
    ├── jira.ts          # Jira API service
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

For issues and feature requests, please use the GitHub issue tracker.