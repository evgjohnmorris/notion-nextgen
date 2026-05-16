import * as yaml from 'yaml';
import { NextGenClient } from '@notion-nextgen/orm';

export interface SyncConfig {
  source: {
    type: 'rest_api';
    url: string;
  };
  mapping: Record<string, string>; // e.g., "Name": "$.full_name"
  destination: {
    type: 'notion_database';
    database_id: string;
    deduplicate_by?: string;
  };
}

export interface SyncResult {
  success: boolean;
  totalProcessed: number;
  createdCount: number;
  skippedCount: number;
  errors: Array<{ item: any, error: string }>;
}

export class SyncEngine {
  private client: NextGenClient;

  constructor(client: NextGenClient) {
    this.client = client;
  }

  /**
   * Parses the YAML sync configuration
   */
  public parseConfig(yamlString: string): SyncConfig {
    return yaml.parse(yamlString);
  }

  /**
   * Evaluates a simple JSONPath-like expression (e.g. "$.full_name") against an object
   */
  private evaluateMapping(mappingPath: string, data: any): any {
    if (!mappingPath.startsWith('$.')) return mappingPath;
    
    const path = mappingPath.slice(2).split('.');
    let current = data;
    for (const key of path) {
      if (current === undefined || current === null) return null;
      current = current[key];
    }
    return current;
  }

  /**
   * Executes the sync workflow based on the provided configuration
   * MOCK IMPLEMENTATION FOR TESTING
   */
  public async executeSync(config: SyncConfig, mockSourceData?: any[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      totalProcessed: 0,
      createdCount: 0,
      skippedCount: 0,
      errors: []
    };

    try {
      // 1. Fetch Source Data
      const data = mockSourceData || await this.fetchSource(config.source.url);
      result.totalProcessed = data.length;

      // 2. Fetch Existing Notion Database for Deduplication
      const existingRecords = await this.fetchExistingNotionRecords(config.destination.database_id);
      
      const dedupField = config.destination.deduplicate_by;
      const existingKeys = new Set(existingRecords.map(r => {
        if (!dedupField) return r.id;
        const prop = r.properties[dedupField];
        if (!prop) return null;
        if (prop.type === 'title') return prop.title[0]?.plain_text;
        if (prop.type === 'rich_text') return prop.rich_text[0]?.plain_text;
        if (prop.type === 'url') return prop.url;
        return null;
      }).filter(Boolean));

      // 3. Process and Map
      for (const item of data) {
        try {
          const mappedRecord: Record<string, any> = {};
          let dedupValue: string | null = null;
          
          for (const [notionKey, sourcePath] of Object.entries(config.mapping)) {
            const val = this.evaluateMapping(sourcePath, item);
            if (notionKey === dedupField) dedupValue = val;
            
            // Simple type inference for demonstration (real world needs schema fetch)
            if (notionKey.toLowerCase().includes('title') || notionKey === 'Name') {
              mappedRecord[notionKey] = { title: [{ text: { content: String(val) } }] };
            } else if (notionKey.toLowerCase().includes('url')) {
              mappedRecord[notionKey] = { url: String(val) };
            } else {
              mappedRecord[notionKey] = { rich_text: [{ text: { content: String(val) } }] };
            }
          }

          // 4. Deduplicate
          if (dedupField && dedupValue && existingKeys.has(dedupValue)) {
            result.skippedCount++;
            continue; // Skip existing
          }

          // 5. Sync to Notion
          // If we don't have a real mockSourceData, we create real pages (unless it fails auth)
          if (mockSourceData) {
            // Mocking for tests
            result.createdCount++;
          } else {
            await this.createNotionPage(config.destination.database_id, mappedRecord);
            result.createdCount++;
          }
          
          if (dedupField && dedupValue) existingKeys.add(dedupValue);

        } catch (itemError: any) {
          result.errors.push({ item, error: itemError.message });
        }
      }
    } catch (globalError: any) {
      result.success = false;
      result.errors.push({ item: 'Global', error: globalError.message });
    }

    return result;
  }

  private async fetchSource(url: string): Promise<any[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch source: ${res.statusText}`);
    return res.json();
  }

  private async fetchExistingNotionRecords(databaseId: string): Promise<any[]> {
    const records = [];
    try {
      const paginator = this.client.paginate(this.client.notion.databases.query as any, {
        database_id: databaseId
      });

      for await (const page of paginator) {
        records.push(...page);
      }
    } catch (e) {
      console.warn('Could not fetch existing notion records (possibly unauthorized)', e);
    }
    return records;
  }

  private async createNotionPage(databaseId: string, properties: Record<string, any>) {
    return await this.client.notion.pages.create({
      parent: { database_id: databaseId },
      properties
    });
  }
}
