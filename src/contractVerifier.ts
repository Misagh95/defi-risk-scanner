import axios from 'axios';
import { ContractVerification } from './types';

const EXPLORERS: Record<string, { api: string; apikey: string }> = {
  ethereum: { api: 'https://api.etherscan.io/api', apikey: '' },
  bsc: { api: 'https://api.bscscan.com/api', apikey: '' },
  polygon: { api: 'https://api.polygonscan.com/api', apikey: '' },
  arbitrum: { api: 'https://api.arbiscan.io/api', apikey: '' },
  optimism: { api: 'https://api-optimistic.etherscan.io/api', apikey: '' },
  base: { api: 'https://api.basescan.org/api', apikey: '' },
};

export class ContractVerifier {
  async check(address: string, chain: string): Promise<ContractVerification> {
    const explorer = EXPLORERS[chain];
    if (!explorer) {
      return {
        address, chain,
        verified: null, compilerVersion: null, license: null,
        riskLevel: 'medium', riskScore: 50,
        details: [`Unsupported chain: ${chain}`],
      };
    }

    try {
      const res = await axios.get(explorer.api, {
        params: {
          module: 'contract',
          action: 'getsourcecode',
          address,
          apikey: explorer.apikey || undefined,
        },
        timeout: 10000,
      });

      const result = res.data?.result?.[0];
      if (!result) {
        return this.unverified(address, chain, 'No contract data found');
      }

      const verified = result.SourceCode !== '' && result.SourceCode !== undefined;
      if (!verified) {
        return this.unverified(address, chain, 'Contract not verified on explorer');
      }

      return {
        address, chain,
        verified: true,
        compilerVersion: result.CompilerVersion || null,
        license: result.LicenseType || null,
        riskLevel: 'safe',
        riskScore: 0,
        details: ['Contract verified on explorer'],
      };
    } catch (err: any) {
      return this.unverified(address, chain, `Explorer error: ${err.message}`);
    }
  }

  private unverified(address: string, chain: string, reason: string): ContractVerification {
    return {
      address, chain,
      verified: false,
      compilerVersion: null, license: null,
      riskLevel: 'high', riskScore: 70,
      details: [reason],
    };
  }
}
