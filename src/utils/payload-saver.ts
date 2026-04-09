import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { ToolResponse } from '../error-handler.js';

/**
 * Wraps a mutating API call with payload persistence.
 *
 * Before the call the full request payload is written to a temp file.
 * - On success the temp file is removed.
 * - On failure the temp file is kept and its path is appended to the error
 *   response so the caller can retry without rebuilding the payload.
 */
export async function withPayloadPersistence(
  operationTag: string,
  payload: unknown,
  execute: () => Promise<ToolResponse>
): Promise<ToolResponse> {
  const tmpFile = path.join(
    os.tmpdir(),
    `mcp-payload-${operationTag}-${Date.now()}.json`
  );

  await fs.writeFile(tmpFile, JSON.stringify(payload, null, 2), 'utf-8');

  const response = await execute();

  if (response.isError) {
    const payloadInfo =
      `\n\n**Payload preserved at:** \`${tmpFile}\`\n` +
      `Re-submit by loading this file — the full request is already serialized there.`;
    return {
      ...response,
      content: [{ type: 'text', text: response.content[0].text + payloadInfo }],
    };
  }

  // Success — clean up quietly
  await fs.unlink(tmpFile).catch(() => undefined);
  return response;
}
