import axios from 'axios';
import { DexScreenerResult, DexScreenerPair } from './types';

const API = 'https://api.dexscreener.com/latest/dex/tokens';

export class DexScreener {
  async check(address: string): Promise<DexScreenerResult> {
    try {
      const res = await axios.get(`${API}/${address}`, {
        timeout: 10000,
        headers: { 'Accept': 'application/json' },
      });

      const pairs: DexScreenerPair[] = res.data?.pairs;
      if (!pairs || pairs.length === 0) {
        return {
          liquidityUsd: null, fdv: null, pairCreatedAt: null,
          priceUsd: null, priceChange24h: null, volume24h: null,
          buys24h: null, sells24h: null,
          riskLevel: 'high', riskScore: 70,
          details: ['No liquidity pairs found on DEX Screener'],
        };
      }

      const best = pairs.reduce((a, b) =>
        (a.liquidity?.usd || 0) > (b.liquidity?.usd || 0) ? a : b
      );

      const liq = best.liquidity?.usd || 0;
      const fdv = best.fdv || 0;
      const age = best.pairCreatedAt ? Date.now() - best.pairCreatedAt : null;
      const details: string[] = [];
      let score = 0;

      // Liquidity check
      if (liq < 1000) { score += 30; details.push(`Very low liquidity: $${liq}`); }
      else if (liq < 10000) { score += 15; details.push(`Low liquidity: $${liq}`); }
      else { details.push(`Liquidity: $${liq.toLocaleString()}`); }

      // Pool age check — very new pools are risky
      if (age !== null && age < 86400000) { score += 20; details.push('Pool created <24h ago'); }
      else if (age !== null && age < 604800000) { score += 10; details.push('Pool created <7d ago'); }

      // Price volatility
      const change = best.priceChange?.h24 || 0;
      if (Math.abs(change) > 100) { score += 10; details.push(`Extreme 24h price change: ${change.toFixed(1)}%`); }

      // Buy/sell ratio anomaly
      const buys = best.txns?.h24?.buys || 0;
      const sells = best.txns?.h24?.sells || 0;
      if (buys + sells > 100) {
        const ratio = buys / (buys + sells);
        if (ratio < 0.1) { score += 15; details.push('Suspicious sell pressure (>90% sells)'); }
        else if (ratio > 0.95) { score += 10; details.push('Unnatural buy ratio (>95% buys) — possible wash trading'); }
      }

      // Liquidity vs FDV ratio
      if (fdv > 0 && liq > 0) {
        const ratio = liq / fdv;
        if (ratio < 0.05) { score += 10; details.push('Very low liquidity relative to FDV'); }
      }

      const riskLevel = score >= 50 ? 'critical' : score >= 30 ? 'high' : score >= 15 ? 'medium' : score >= 5 ? 'low' : 'safe';
      if (details.length === 0) details.push('No major DEX risk flags');

      return {
        liquidityUsd: liq,
        fdv,
        pairCreatedAt: best.pairCreatedAt,
        priceUsd: best.priceUsd,
        priceChange24h: change,
        volume24h: best.volume?.h24,
        buys24h: buys,
        sells24h: sells,
        riskLevel,
        riskScore: score,
        details,
      };
    } catch (err: any) {
      return {
        liquidityUsd: null, fdv: null, pairCreatedAt: null,
        priceUsd: null, priceChange24h: null, volume24h: null,
        buys24h: null, sells24h: null,
        riskLevel: 'medium', riskScore: 50,
        details: [`DEX Screener error: ${err.message}`],
      };
    }
  }
}
