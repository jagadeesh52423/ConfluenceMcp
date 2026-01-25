import { BaseApiClient } from './base-client.js';
import { confluenceConfig, getConfluenceAuth } from '../config.js';
import { SERVICE_NAMES } from '../constants.js';

/**
 * Confluence API client extending the base client
 */
export class ConfluenceClient extends BaseApiClient {
  constructor() {
    super({
      baseUrl: `https://${confluenceConfig.domain}`,
      auth: getConfluenceAuth(),
      serviceName: SERVICE_NAMES.CONFLUENCE,
    });
  }
}
