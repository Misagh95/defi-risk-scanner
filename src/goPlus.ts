import axios from 'axios';
import { TokenRisk, GoPlusResponse } from './types';

const CHAIN_API: Record<string, string> = {
  ethereum: '1',
  bsc: '56',
  polygon: '137',
  arbitrum: '42161',
  optimism: '10',
  base: '8453',
  avalanche: '43114',
};

export class GoPlusChecker {
  async checkToken(address: string, chain: string): Promise<TokenRisk> {
    const chainId = CHAIN_API[chain];
    if (!chainId) {
      return {
        address, chain,
        isHoneypot: null, buyTax: null, sellTax: null,
        isOpenSource: null, hasBlacklist: null, hasAntiWhale: null,
        canOwnerMint: null, ownerBalance: null, isProxy: null,
        riskLevel: 'medium', riskScore: 50,
        details: [`Unsupported chain: ${chain}`],
      };
    }

    try {
      const res = await axios.get<GoPlusResponse>(
        `https://api.gopluslabs.io/api/v1/token_security/${chainId}`,
        { params: { contract_addresses: address }, timeout: 15000 }
      );

      const raw = res.data?.result?.[address.toLowerCase()];
      if (!raw) {
        return this.defaultRisk(address, chain, 'No data returned from GoPlus');
      }

      const flags: string[] = [];
      let score = 0;

      // Honeypot
      const honeypot = raw.is_honeypot === '1';
      if (honeypot) { score += 30; flags.push('Honeypot detected'); }

      // Buy/Sell tax
      const buyTax = raw.buy_tax ? parseFloat(raw.buy_tax) : 0;
      const sellTax = raw.sell_tax ? parseFloat(raw.sell_tax) : 0;
      if (buyTax > 10) { score += 10; flags.push(`High buy tax: ${buyTax}%`); }
      if (sellTax > 10) { score += 10; flags.push(`High sell tax: ${sellTax}%`); }

      // Not open source
      const openSource = raw.is_open_source === '1';
      if (!openSource) { score += 15; flags.push('Contract not open source'); }

      // Blacklist
      const hasBlacklist = raw.is_blacklist === '1';
      if (hasBlacklist) { score += 15; flags.push('Has blacklist function'); }

      // Anti-whale
      const antiWhale = raw.is_anti_whale === '1';
      if (antiWhale) { score += 5; flags.push('Has anti-whale mechanism'); }

      // Owner can mint
      const canMint = raw.can_mint === '1';
      if (canMint) { score += 15; flags.push('Owner can mint tokens'); }

      // Cannot sell all
      if (raw.cannot_sell_all === '1') { score += 20; flags.push('Cannot sell all tokens'); }

      // Cannot buy
      if (raw.cannot_buy === '1') { score += 20; flags.push('Cannot buy token'); }

      // Owner balance concentration
      const ownerBal = raw.owner_balance ? parseFloat(raw.owner_balance) : 0;
      const totalSupply = raw.total_supply ? parseFloat(raw.total_supply) : 0;
      if (totalSupply > 0 && ownerBal / totalSupply > 0.5) {
        score += 15; flags.push('Owner holds >50% of supply');
      }

      // Proxy
      const isProxy = raw.is_proxy === '1';
      if (isProxy) { score += 5; flags.push('Proxy contract (unverified logic)'); }

      const riskLevel = score >= 70 ? 'critical' : score >= 50 ? 'high' : score >= 30 ? 'medium' : score >= 10 ? 'low' : 'safe';
      if (flags.length === 0) flags.push('No major risk flags');

      return {
        address, chain,
        isHoneypot: honeypot,
        buyTax, sellTax,
        isOpenSource: openSource,
        hasBlacklist,
        hasAntiWhale: antiWhale,
        canOwnerMint: canMint,
        ownerBalance: raw.owner_balance || null,
        isProxy,
        riskLevel, riskScore: score,
        details: flags,
      };
    } catch (err: any) {
      return this.defaultRisk(address, chain, `API error: ${err.message}`);
    }
  }

  private defaultRisk(address: string, chain: string, reason: string): TokenRisk {
    return {
      address, chain,
      isHoneypot: null, buyTax: null, sellTax: null,
      isOpenSource: null, hasBlacklist: null, hasAntiWhale: null,
      canOwnerMint: null, ownerBalance: null, isProxy: null,
      riskLevel: 'medium', riskScore: 50,
      details: [reason],
    };
  }
}
