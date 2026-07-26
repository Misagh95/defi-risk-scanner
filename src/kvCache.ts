import { Redis } from 'ioredis';

export class ScanCache {
  private client: Redis | null = null;

  constructor() {
    const url = process.env.REDIS_URL || process.env.KV_REST_API_URL;
    if (url) {
      try {
        this.client = new Redis(url, { maxRetriesPerRequest: 1, retryStrategy: () => null });
      } catch {
        this.client = null;
      }
    }
  }

  enabled(): boolean { return !!this.client; }

  key(address: string): string { return `scan:${address.toLowerCase()}`; }

  async get(address: string): Promise<any | null> {
    if (!this.client) return null;
    try {
      const data = await this.client.get(this.key(address));
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  }

  async set(address: string, data: any, ttlSeconds = 3600): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.setex(this.key(address), ttlSeconds, JSON.stringify(data));
    } catch { /* ignore */ }
  }
}
