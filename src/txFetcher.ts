import axios from 'axios';
import { AlchemyClient, AlchemyTransfer } from './alchemy';

export interface ContractInteraction {
  address: string;
  chain: string;
  name: string | null;
  symbol: string | null;
  txCount: number;
  firstSeen: number;
  lastSeen: number;
  isToken: boolean;
  type: 'token' | 'contract' | 'nft';
}

export interface TxFetchResult {
  interactions: ContractInteraction[];
  totalTxs: number;
  chains: string[];
  transfers: Record<string, AlchemyTransfer[]>;
}

const CHAIN_TOKEN_SYMBOLS: Record<string, string> = {
  ethereum: 'ETH', bsc: 'BNB', polygon: 'MATIC',
  arbitrum: 'ETH', optimism: 'ETH', base: 'ETH',
  zksync: 'ETH', scroll: 'ETH', linea: 'ETH',
  blast: 'ETH', avalanche: 'AVAX', fantom: 'FTM',
};

// Known safe contracts to skip
const KNOWN_SAFE: Set<string> = new Set([
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
  '0xe592427a0aece92de3edee1f18e0157c05861564',
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f',
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
  '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  '0x4200000000000000000000000000000000000006',
  '0x4200000000000000000000000000000000000010',
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  '0xdac17f958d2ee523a2206206994597c13d831ec7',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  '0x6b175474e89094c44da98b954eedeac495271d0f',
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  '0x514910771af9ca656af840dff83e8264ecf986ca',
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
  '0x5283d291dbcf85356a21ba090e6db59121208b44',
  '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
  '0x5cc5b05a8a13e3fbdb0bb9fccd98d8e9f6d1da1b',
  '0x00000000006c3852cbef3e08e8df289169ede581',
  '0x00000000000000adc04c56bf30ac9d3c0aaf14dc',
  '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789',
  '0x55d398326f99059ff775485246999027b3197955',
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
  '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
  '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
  '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
  '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
  '0x0000000000000000000000000000000000000000',
]);

export class TxFetcher {
  private alchemy: AlchemyClient;

  constructor(alchemy?: AlchemyClient) {
    this.alchemy = alchemy || new AlchemyClient();
  }

  supportedChains(): string[] {
    return this.alchemy.supportedChains();
  }

  async fetchWalletInteractions(address: string, maxChains?: string[]): Promise<TxFetchResult> {
    const chains = maxChains && maxChains.length > 0
      ? maxChains.filter(c => this.supportedChains().includes(c))
      : this.supportedChains().slice(0, 6);

    const allTransfers: Record<string, AlchemyTransfer[]> = {};
    const allInteractions = new Map<string, ContractInteraction>();
    let totalTxs = 0;
    const chainsUsed: string[] = [];

    const promises = chains.map(async (chain) => {
      const transfers = await this.alchemy.getAllAssetTransfers(chain, address);
      if (transfers.length > 0) chainsUsed.push(chain);
      allTransfers[chain] = transfers;
      totalTxs += transfers.length;

      const map = new Map<string, ContractInteraction>();
      for (const t of transfers) {
        const ts = new Date(t.metadata?.blockTimestamp || '').getTime() || Date.now();

        if (t.category === 'erc20' && t.rawContract?.address) {
          const a = t.rawContract.address.toLowerCase();
          if (KNOWN_SAFE.has(a)) continue;
          this.add(map, a, chain, ts, t.metadata?.name || null, t.metadata?.symbol || null, 'token');
        }
        else if ((t.category === 'erc721' || t.category === 'erc1155') && t.rawContract?.address) {
          const a = t.rawContract.address.toLowerCase();
          if (KNOWN_SAFE.has(a)) continue;
          this.add(map, a, chain, ts, t.metadata?.name || null, t.metadata?.symbol || t.asset || null, 'nft');
        }
        else if (t.category === 'external' || t.category === 'internal') {
          const a = (t.to || '').toLowerCase();
          if (!a || a === address.toLowerCase() || KNOWN_SAFE.has(a)) continue;
          this.add(map, a, chain, ts, null, null, 'contract');
        }
      }
      return map;
    });

    const maps = await Promise.all(promises);
    for (const map of maps) {
      for (const [key, interaction] of map) {
        const existing = allInteractions.get(key);
        if (existing) {
          existing.txCount += interaction.txCount;
          existing.lastSeen = Math.max(existing.lastSeen, interaction.lastSeen);
        } else {
          allInteractions.set(key, interaction);
        }
      }
    }

    const interactions = Array.from(allInteractions.values())
      .sort((a, b) => b.txCount - a.txCount);

    return { interactions, totalTxs, chains: chainsUsed, transfers: allTransfers };
  }

  private add(map: Map<string, ContractInteraction>, address: string, chain: string, ts: number, name: string | null, symbol: string | null, type: 'token' | 'contract' | 'nft'): void {
    const key = `${chain}:${address.toLowerCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.txCount += 1;
      existing.lastSeen = Math.max(existing.lastSeen, ts);
    } else {
      map.set(key, {
        address,
        chain,
        name,
        symbol,
        txCount: 1,
        firstSeen: ts,
        lastSeen: ts,
        isToken: type === 'token' || type === 'nft',
        type,
      });
    }
  }
}
