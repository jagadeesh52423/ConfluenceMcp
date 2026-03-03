import type { ToolResponse } from '../error-handler.js';
import { ERROR_MESSAGES } from '../constants.js';

type HandlerFn = (args: any) => Promise<ToolResponse>;

export class ToolRegistry {
  private readonly routes = new Map<string, HandlerFn>();

  register(name: string, fn: HandlerFn): this {
    this.routes.set(name, fn);
    return this;
  }

  registerAll(entries: Record<string, HandlerFn>): this {
    for (const [name, fn] of Object.entries(entries)) {
      this.routes.set(name, fn);
    }
    return this;
  }

  dispatch(name: string, args: any): Promise<ToolResponse> {
    const fn = this.routes.get(name);
    if (!fn) throw new Error(ERROR_MESSAGES.UNKNOWN_TOOL(name));
    return fn(args ?? {});
  }

  get size(): number {
    return this.routes.size;
  }
}
