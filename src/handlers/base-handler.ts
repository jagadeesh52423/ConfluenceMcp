import { withErrorHandling } from '../error-handler.js';
import type { ErrorContext, ToolResponse } from '../error-handler.js';

export abstract class BaseHandler {
  protected handle<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    format: (result: T) => ToolResponse
  ): Promise<ToolResponse> {
    return withErrorHandling(operation, context, format);
  }
}
