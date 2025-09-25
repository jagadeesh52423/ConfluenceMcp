// Test script to verify separated Confluence and Jira services
import { ConfluenceService } from './dist/services/confluence.js';
import { JiraService } from './dist/services/jira.js';
import { BitbucketService } from './dist/services/bitbucket.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing Separated Services Configuration...\n');

console.log('Environment Variables:');
console.log('CONFLUENCE_DOMAIN:', process.env.CONFLUENCE_DOMAIN || 'Not set');
console.log('CONFLUENCE_EMAIL:', process.env.CONFLUENCE_EMAIL || 'Not set');
console.log('CONFLUENCE_API_TOKEN:', process.env.CONFLUENCE_API_TOKEN ? 'Set' : 'Not set');

console.log('JIRA_DOMAIN:', process.env.JIRA_DOMAIN || 'Not set');
console.log('JIRA_EMAIL:', process.env.JIRA_EMAIL || 'Not set');
console.log('JIRA_API_TOKEN:', process.env.JIRA_API_TOKEN ? 'Set' : 'Not set');

console.log('BITBUCKET_WORKSPACE:', process.env.BITBUCKET_WORKSPACE || 'Not set');
console.log('BITBUCKET_USERNAME:', process.env.BITBUCKET_USERNAME || 'Not set');
console.log('BITBUCKET_API_TOKEN:', process.env.BITBUCKET_API_TOKEN ? 'Set' : 'Not set');

async function testServices() {
  console.log('\n--- Testing Confluence Service ---');
  try {
    const confluence = new ConfluenceService();
    const spaces = await confluence.getSpaces(3);
    console.log(`✅ Confluence: Found ${spaces.length} spaces`);
    spaces.forEach(space => console.log(`   - ${space.name} (${space.key})`));
  } catch (error) {
    console.error('❌ Confluence Error:', error.message);
  }

  console.log('\n--- Testing Jira Service ---');
  try {
    const jira = new JiraService();
    const projects = await jira.getProjects();
    console.log(`✅ Jira: Found ${projects.length} projects`);
    projects.slice(0, 3).forEach(project => console.log(`   - ${project.name} (${project.key})`));
  } catch (error) {
    console.error('❌ Jira Error:', error.message);
  }

  console.log('\n--- Testing Bitbucket Service ---');
  try {
    const bitbucket = new BitbucketService();
    const repos = await bitbucket.getRepositories({ limit: 3 });
    console.log(`✅ Bitbucket: Found ${repos.length} repositories`);
    repos.forEach(repo => console.log(`   - ${repo.name} (${repo.language})`));
  } catch (error) {
    console.error('❌ Bitbucket Error:', error.message);
  }
}

if (process.env.CONFLUENCE_API_TOKEN || process.env.JIRA_API_TOKEN || process.env.BITBUCKET_API_TOKEN) {
  testServices();
} else {
  console.log('\n⚠️  No API tokens configured - skipping service tests');
  console.log('Please set CONFLUENCE_API_TOKEN, JIRA_API_TOKEN, or BITBUCKET_API_TOKEN in .env file');
}