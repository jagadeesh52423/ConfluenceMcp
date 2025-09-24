// Simple test script to verify Bitbucket configuration
import { BitbucketService } from './dist/services/bitbucket.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing Bitbucket Configuration...');
console.log('Workspace:', process.env.BITBUCKET_WORKSPACE || 'creditvidya');
console.log('Username:', process.env.BITBUCKET_USERNAME || 'Not set');
console.log('API Token:', process.env.BITBUCKET_API_TOKEN ? 'Set' : 'Not set');

async function testBitbucketConnection() {
  try {
    const bitbucket = new BitbucketService();
    console.log('\nTesting repository list...');
    const repos = await bitbucket.getRepositories({ limit: 5 });
    console.log(`Found ${repos.length} repositories`);
    repos.forEach(repo => {
      console.log(`- ${repo.name} (${repo.language})`);
    });

    // Test specific repository
    if (repos.some(r => r.name === 'eventengine')) {
      console.log('\nTesting eventengine repository...');
      const repo = await bitbucket.getRepository('eventengine');
      console.log(`Repository: ${repo.name}`);
      console.log(`Description: ${repo.description}`);
      console.log(`Language: ${repo.language}`);
      console.log(`Private: ${repo.private}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

if (process.env.BITBUCKET_API_TOKEN || process.env.ATLASSIAN_API_TOKEN) {
  testBitbucketConnection();
} else {
  console.log('\nSkipping test - no API token configured');
  console.log('Please set BITBUCKET_API_TOKEN or ATLASSIAN_API_TOKEN in .env file');
}