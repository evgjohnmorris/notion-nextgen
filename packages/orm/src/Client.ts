import { Client as NotionClient } from '@notionhq/client';
import type { ClientOptions } from '@notionhq/client/build/src/Client';

export interface NextGenClientOptions extends ClientOptions {
  maxRetries?: number;
}

export class NextGenClient {
  public notion: NotionClient;
  private maxRetries: number;

  constructor(options: NextGenClientOptions) {
    this.notion = new NotionClient(options);
    this.maxRetries = options.maxRetries ?? 3;
  }

  /**
   * Automatically handles pagination for queries.
   */
  public async *paginate<T>(
    endpoint: (args: any) => Promise<{ results: T[]; next_cursor: string | null; has_more: boolean }>,
    args: any
  ): AsyncGenerator<T[], void, unknown> {
    let cursor: string | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await this.withRetry(() => endpoint({ ...args, start_cursor: cursor }));
      yield response.results;
      
      cursor = response.next_cursor || undefined;
      hasMore = response.has_more;
    }
  }

  /**
   * Internal method to handle rate limit (429) backoff.
   */
  private async withRetry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429 && attempt <= this.maxRetries) {
        const retryAfter = error.headers?.get('retry-after');
        // Notion might send retry-after in seconds
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.withRetry(fn, attempt + 1);
      }
      throw error;
    }
  }
}
