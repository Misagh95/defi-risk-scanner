import axios from 'axios';

const EXPLORER_API: Record<string, { url: string; apikey: string }> = {
  ethereum: { url: 'https://api.etherscan.io/api', apikey: '' },
  bsc: { url: 'https://api.bscscan.com/api', apikey: '' },
  polygon: { url: 'https://api.polygonscan.com/api', apikey: '' },
  arbitrum: { url: 'https://api.arbiscan.io/api', apikey: '' },
  optimism: { url: 'https://api-optimistic.etherscan.io/api', apikey: '' },
  base: { url: 'https://api.basescan.org/api', apikey: '' },
};

// Known safe contracts to skip (routers, bridges, wrappers)
const KNOWN_SAFE: Set<string> = new Set([
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2 Router
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45', // Uniswap V3 Router
  '0xe592427a0aece92de3edee1f18e0157c05861564', // Uniswap V3 SwapRouter
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // Uniswap V3 Factory
  '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Uniswap Universal Router
  '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f', // Uniswap V2 Factory
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', // WBNB
  '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', // WMATIC
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', // WETH Arbitrum
  '0x4200000000000000000000000000000000000006', // WETH Optimism
  '0x4200000000000000000000000000000000000010', // WETH Base
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
  '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', // AAVE
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
  '0x5283d291dbcf85356a21ba090e6db59121208b44', // Blur
  '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', // BAYC
  '0x5cc5b05a8a13e3fbdb0bb9fccd98d8e9f6d1da1b', // Seaport 1.1
  '0x00000000006c3852cbef3e08e8df289169ede581', // Seaport 1.5
  '0x00000000000000adc04c56bf30ac9d3c0aaf14dc', // Seaport
  '0x3732429c4f33b89a9ae220a370cdb0d41a5cc9d8', // Blast
  '0x0000000000000ae4d9af7e2117a55f54d388a263', // Blast Bridge
  '0x0000000000005940571c098c93c4b72465a2e9fc', // Blast Points
  '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789', // ERC-2771
  '0x00000000000001ad428e4906ae43d8f9852d0dd6', // LayerZero
  '0x66a71dcef29a0ffbdbe3c6a460a3b5bc225cd675', // BSC Stablecoin
  '0x55d398326f99059ff775485246999027b3197955', // BSC USDT
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // BSC USDC
  '0x2170ed0880ac9a755fd29b2688956bd959f933f8', // BSC ETH
  '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', // BSC BTCB
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // Polygon USDC
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // Polygon USDT
  '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', // Polygon WETH
  '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6', // Polygon WBTC
]);

export interface ContractInteraction {
  address: string;
  chain: string;
  name: string | null;
  symbol: string | null;
  txCount: number;
  firstSeen: number;
  lastSeen: number;
  isToken: boolean;
}

export interface TxFetchResult {
  interactions: ContractInteraction[];
  totalTxs: number;
  chains: string[];
}

export class TxFetcher {
  async fetchWalletInteractions(address: string, maxChains: string[] = ['ethereum', 'bsc', 'polygon', 'arbitrum']): Promise<TxFetchResult> {
    const allInteractions = new Map<string, ContractInteraction>();
    let totalTxs = 0;
    const chainsUsed: string[] = [];

    for (const chain of maxChains) {
      const explorer = EXPLORER_API[chain];
      if (!explorer) continue;

      try {
        const interactions = await this.fetchChainTxs(address, chain, explorer);
        if (interactions.length > 0) chainsUsed.push(chain);
        totalTxs += interactions.reduce((s, i) => s + i.txCount, 0);

        for (const interaction of interactions) {
          const key = `${chain}:${interaction.address.toLowerCase()}`;
          const existing = allInteractions.get(key);
          if (existing) {
            existing.txCount += interaction.txCount;
            existing.lastSeen = Math.max(existing.lastSeen, interaction.lastSeen);
          } else {
            allInteractions.set(key, interaction);
          }
        }
      } catch { continue; }
    }

    return {
      interactions: Array.from(allInteractions.values()),
      totalTxs,
      chains: chainsUsed,
    };
  }

  private async fetchChainTxs(address: string, chain: string, explorer: { url: string; apikey: string }): Promise<ContractInteraction[]> {
    const addr = address.toLowerCase();
    const contractMap = new Map<string, ContractInteraction>();
    const seenTxs = new Set<string>();

    // Fetch normal transactions
    const [txRes, tokenRes, internalRes] = await Promise.allSettled([
      this.getExplorerData(explorer.url, explorer.apikey, {
        module: 'account', action: 'txlist',
        address, sort: 'desc', offset: '100',
      }),
      this.getExplorerData(explorer.url, explorer.apikey, {
        module: 'account', action: 'tokentx',
        address, sort: 'desc', offset: '100',
      }),
      this.getExplorerData(explorer.url, explorer.apikey, {
        module: 'account', action: 'txlistinternal',
        address, sort: 'desc', offset: '100',
      }),
    ]);

    // Process normal txs
    if (txRes.status === 'fulfilled' && Array.isArray(txRes.value)) {
      for (const tx of txRes.value) {
        const to = (tx.to || '').toLowerCase();
        const from = (tx.from || '').toLowerCase();
        const hash = tx.hash || '';
        if (seenTxs.has(hash)) continue;
        seenTxs.add(hash);

        if (to && to !== addr && !KNOWN_SAFE.has(to)) {
          this.addToMap(contractMap, to, chain, tx.timeStamp, null, null, false);
        }
      }
    }

    // Process token txs
    if (tokenRes.status === 'fulfilled' && Array.isArray(tokenRes.value)) {
      for (const tx of tokenRes.value) {
        const contract = (tx.contractAddress || '').toLowerCase();
        const hash = tx.hash || '';
        if (seenTxs.has(hash)) continue;
        seenTxs.add(hash);

        if (contract && !KNOWN_SAFE.has(contract)) {
          this.addToMap(contractMap, contract, chain, tx.timeStamp, tx.tokenName || null, tx.tokenSymbol || null, true);
        }
      }
    }

    // Process internal txs
    if (internalRes.status === 'fulfilled' && Array.isArray(internalRes.value)) {
      for (const tx of internalRes.value) {
        const to = (tx.to || '').toLowerCase();
        if (to && to !== addr && !KNOWN_SAFE.has(to)) {
          this.addToMap(contractMap, to, chain, tx.timeStamp, null, null, false);
        }
      }
    }

    return Array.from(contractMap.values());
  }

  private addToMap(
    map: Map<string, ContractInteraction>,
    address: string,
    chain: string,
    timestamp: string,
    name: string | null,
    symbol: string | null,
    isToken: boolean,
  ): void {
    const key = `${chain}:${address}`;
    const ts = parseInt(timestamp) * 1000 || Date.now();
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
        isToken,
      });
    }
  }

  private async getExplorerData(baseUrl: string, apikey: string, params: Record<string, string>): Promise<any[]> {
    try {
      const res = await axios.get(baseUrl, {
        params: { ...params, apikey: apikey || undefined },
        timeout: 15000,
      });
      if (res.data?.status === '1' && Array.isArray(res.data?.result)) {
        return res.data.result;
      }
      return [];
    } catch {
      return [];
    }
  }
}
