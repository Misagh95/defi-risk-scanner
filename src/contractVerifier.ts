import axios from 'axios';
import { ContractVerification } from './types';

const EXPLORERS: Record<string, { api: string; apikeyEnv: string }> = {
  ethereum: { api: 'https://api.etherscan.io/api', apikeyEnv: 'ETHERSCAN_API_KEY' },
  bsc: { api: 'https://api.bscscan.com/api', apikeyEnv: 'BSCSCAN_API_KEY' },
  polygon: { api: 'https://api.polygonscan.com/api', apikeyEnv: 'POLYGONSCAN_API_KEY' },
  arbitrum: { api: 'https://api.arbiscan.io/api', apikeyEnv: 'ARBISCAN_API_KEY' },
  optimism: { api: 'https://api-optimistic.etherscan.io/api', apikeyEnv: 'OPTIMISTIC_ETHERSCAN_API_KEY' },
  base: { api: 'https://api.basescan.org/api', apikeyEnv: 'BASESCAN_API_KEY' },
  zksync: { api: 'https://api-era.zksync.network/api', apikeyEnv: 'ZKSYNC_API_KEY' },
  scroll: { api: 'https://api.scrollscan.com/api', apikeyEnv: 'SCROLL_API_KEY' },
  linea: { api: 'https://api.lineascan.build/api', apikeyEnv: 'LINEA_API_KEY' },
  blast: { api: 'https://api.blastscan.io/api', apikeyEnv: 'BLAST_API_KEY' },
  avalanche: { api: 'https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan/api', apikeyEnv: '' },
  fantom: { api: 'https://api.ftmscan.com/api', apikeyEnv: 'FTMSCAN_API_KEY' },
};

export class ContractVerifier {
  async check(address: string, chain: string): Promise<ContractVerification> {
    const explorer = EXPLORERS[chain];
    if (!explorer) {
      return {
        address, chain,
        verified: null, compilerVersion: null, license: null,
        riskLevel: 'medium', riskScore: 8,
        details: [`Unsupported chain: ${chain}`],
      };
    }

    try {
      const apikey = process.env[explorer.apikeyEnv] || '';
      const res = await axios.get(explorer.api, {
        params: {
          module: 'contract',
          action: 'getsourcecode',
          address,
          apikey,
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
      riskLevel: 'high', riskScore: 40,
      details: [reason],
    };
  }
}
