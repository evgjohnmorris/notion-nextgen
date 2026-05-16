import * as fs from 'fs';
import * as path from 'path';

export interface CacheEntry<T = any> {
  timestamp: number;
  data: T;
}

export interface CacheProvider {
  get<T>(key: string): Promise<CacheEntry<T> | null> | CacheEntry<T> | null;
  set<T>(key: string, value: CacheEntry<T>, ttl: number): Promise<void> | void;
  clear(): Promise<void> | void;
}

export class MemoryCacheProvider implements CacheProvider {
  private cache: Map<string, CacheEntry> = new Map();

  get<T>(key: string): CacheEntry<T> | null {
    return (this.cache.get(key) as CacheEntry<T>) || null;
  }

  set<T>(key: string, value: CacheEntry<T>, ttl: number): void {
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

export class FileCacheProvider implements CacheProvider {
  private cacheDir: string;

  constructor(cacheDir: string = '.notion-cache') {
    this.cacheDir = path.resolve(process.cwd(), cacheDir);
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    // Simple hash for the key to make a safe filename
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash |= 0; 
    }
    return path.join(this.cacheDir, `${Math.abs(hash)}.json`);
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const filePath = this.getFilePath(key);
    if (fs.existsSync(filePath)) {
      try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(content) as CacheEntry<T>;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  async set<T>(key: string, value: CacheEntry<T>, ttl: number): Promise<void> {
    const filePath = this.getFilePath(key);
    try {
      await fs.promises.writeFile(filePath, JSON.stringify(value), 'utf-8');
    } catch (e) {
      console.warn(`Failed to write cache to ${filePath}`, e);
    }
  }

  async clear(): Promise<void> {
    if (fs.existsSync(this.cacheDir)) {
      const files = await fs.promises.readdir(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.promises.unlink(path.join(this.cacheDir, file));
        }
      }
    }
  }
}
