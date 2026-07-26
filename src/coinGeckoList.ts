import axios from 'axios';
import { CgListResult } from './types';

const CG_API = 'https://api.coingecko.com/api/v3';

export class CoinGeckoListCheck {
  private listedCache: Map<string, { name: string; symbol: string; marketCapRank: number | null }> | null = null;

  async check(address: string, chain: string): Promise<CgListResult> {
    const all = await this.loadListed();
    if (!all) {
      return {
        listed: false, name: null, symbol: null, marketCapRank: null,
        riskLevel: 'medium', riskScore: 50,
        details: ['Could not fetch CoinGecko listings'],
      };
    }

    // Search by address across all platforms
    for (const [id, meta] of all) {
      try {
        const res = await axios.get(`${CG_API}/coins/${id}`, {
          params: {
            localization: 'false',
            tickers: 'false',
            community_data: 'false',
            developer_data: 'false',
            sparkline: 'false',
          },
          timeout: 8000,
        });
        const platforms = res.data?.platforms || {};
        const matchAddress = Object.values(platforms).some(
          (v: any) => typeof v === 'string' && v.toLowerCase() === address.toLowerCase()
        );
        if (matchAddress) {
          return {
            listed: true,
            name: meta.name,
            symbol: meta.symbol,
            marketCapRank: meta.marketCapRank,
            riskLevel: 'safe',
            riskScore: 0,
            details: [`Listed on CoinGecko as ${meta.name} (${meta.symbol.toUpperCase()})`],
          };
        }
      } catch { continue; }
    }

    return {
      listed: false, name: null, symbol: null, marketCapRank: null,
      riskLevel: 'high', riskScore: 60,
      details: ['Token not found on CoinGecko — not publicly listed'],
    };
  }

  private async loadListed(): Promise<Map<string, { name: string; symbol: string; marketCapRank: number | null }> | null> {
    if (this.listedCache) return this.listedCache;

    try {
      const res = await axios.get(`${CG_API}/coins/list`, {
        params: { include_platform: 'false' },
        timeout: 15000,
        headers: { 'Accept': 'application/json' },
      });

      if (!Array.isArray(res.data)) return null;
      this.listedCache = new Map();
      for (const coin of res.data) {
        this.listedCache.set(coin.id, {
          name: coin.name,
          symbol: coin.symbol,
          marketCapRank: coin.market_cap_rank || null,
        });
      }
      return this.listedCache;
    } catch {
      return null;
    }
  }
}
