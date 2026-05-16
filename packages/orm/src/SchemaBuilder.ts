import { NextGenClient } from './Client';
import { CacheProvider, MemoryCacheProvider } from './Cache';

export abstract class Field<T> {
  constructor(public readonly name: string) {}
  abstract parse(rawProperty: any): T;
  abstract serialize(value: T): any;
}

export class StringField extends Field<string> {
  parse(rawProperty: any): string {
    if (rawProperty.type === 'title') {
      return rawProperty.title.map((t: any) => t.plain_text).join('');
    }
    if (rawProperty.type === 'rich_text') {
      return rawProperty.rich_text.map((t: any) => t.plain_text).join('');
    }
    return '';
  }

  serialize(value: string): any {
    return {
      rich_text: [
        {
          text: {
            content: value
          }
        }
      ]
    };
  }
}

export class DateField extends Field<Date | null> {
  parse(rawProperty: any): Date | null {
    if (rawProperty.type === 'date' && rawProperty.date?.start) {
      return new Date(rawProperty.date.start);
    }
    return null;
  }

  serialize(value: Date | null): any {
    if (!value) return null;
    return {
      date: {
        start: value.toISOString()
      }
    };
  }
}

export interface ModelOptions<TFields extends Record<string, Field<any>>> {
  databaseId: string;
  client: NextGenClient;
  fields: TFields;
  cacheTtl?: number; // Time to live in milliseconds
  cacheProvider?: CacheProvider; // Custom cache provider implementation
}

export type InferModelType<TFields extends Record<string, Field<any>>> = {
  [K in keyof TFields]: ReturnType<TFields[K]['parse']>;
} & { id: string };

export class NotionModel<TFields extends Record<string, Field<any>>> {
  public readonly databaseId: string;
  private client: NextGenClient;
  private fields: TFields;
  private cacheTtl: number;
  private cacheProvider: CacheProvider;

  constructor(options: ModelOptions<TFields>) {
    this.databaseId = options.databaseId;
    this.client = options.client;
    this.fields = options.fields;
    this.cacheTtl = options.cacheTtl || 0;
    this.cacheProvider = options.cacheProvider || new MemoryCacheProvider();
  }

  /**
   * Queries the database and returns properly typed models.
   */
  public async findMany(queryArgs: any = {}): Promise<InferModelType<TFields>[]> {
    const cacheKey = JSON.stringify(queryArgs);
    
    if (this.cacheTtl > 0) {
      const cached = await this.cacheProvider.get<InferModelType<TFields>[]>(cacheKey);
      if (cached && (Date.now() - cached.timestamp < this.cacheTtl)) {
        return cached.data;
      }
    }

    const results: InferModelType<TFields>[] = [];
    const paginator = this.client.paginate(this.client.notion.databases.query, {
      database_id: this.databaseId,
      ...queryArgs
    });

    for await (const page of paginator) {
      for (const rawPage of page) {
        results.push(this.mapFromRaw(rawPage));
      }
    }

    if (this.cacheTtl > 0) {
      await this.cacheProvider.set(cacheKey, { timestamp: Date.now(), data: results }, this.cacheTtl);
    }

    return results;
  }

  public async clearCache(): Promise<void> {
    await this.cacheProvider.clear();
  }

  /**
   * Maps a raw Notion API page to the inferred model type.
   */
  private mapFromRaw(rawPage: any): InferModelType<TFields> {
    const properties = rawPage.properties || {};
    const result: any = { id: rawPage.id };

    for (const [key, field] of Object.entries(this.fields)) {
      const rawProperty = properties[field.name];
      if (rawProperty) {
        result[key] = field.parse(rawProperty);
      } else {
        // Fallback for missing properties
        result[key] = field instanceof StringField ? '' : null;
      }
    }

    return result as InferModelType<TFields>;
  }
}
