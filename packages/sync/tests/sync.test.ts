import { describe, it, expect, vi } from 'vitest';
import { SyncEngine } from '../src';
import { NextGenClient } from '@notion-nextgen/orm';

vi.mock('@notion-nextgen/orm', () => {
  return {
    NextGenClient: class MockClient {
      notion = { databases: { query: vi.fn() }, pages: { create: vi.fn() } };
      async *paginate() {
        yield [
          {
            id: 'mock-1',
            properties: {
              URL: { type: 'url', url: 'https://github.com/existing/repo' }
            }
          }
        ];
      }
    }
  };
});
describe('SyncEngine', () => {
  const yamlConfig = `
source:
  type: rest_api
  url: https://api.github.com/users/test/starred
mapping:
  "Name": "$.full_name"
  "URL": "$.html_url"
destination:
  type: notion_database
  database_id: "db-123"
  deduplicate_by: "URL"
  `;

  const mockClient = new NextGenClient({ auth: 'mock' });
  const engine = new SyncEngine(mockClient);

  it('should parse YAML configuration correctly', () => {
    const config = engine.parseConfig(yamlConfig);
    expect(config.source.type).toBe('rest_api');
    expect(config.mapping['Name']).toBe('$.full_name');
    expect(config.destination.deduplicate_by).toBe('URL');
  });

  it('should evaluate mapping and deduplicate', async () => {
    const config = engine.parseConfig(yamlConfig);
    
    const mockData = [
      { full_name: 'Existing Repo', html_url: 'https://github.com/existing/repo' }, // should be skipped (deduplicated)
      { full_name: 'New Repo', html_url: 'https://github.com/new/repo' } // should be added
    ];

    const result = await engine.executeSync(config, mockData);

    expect(result.success).toBe(true);
    expect(result.totalProcessed).toBe(2);
    expect(result.skippedCount).toBe(1);
    expect(result.createdCount).toBe(1);
    expect(result.errors).toHaveLength(0);
  });
});
