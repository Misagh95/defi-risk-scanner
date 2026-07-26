import axios from 'axios';

const ALCHEMY_RPC: Record<string, string> = {
  ethereum: 'https://eth-mainnet.g.alchemy.com/v2',
  bsc: 'https://bnb-mainnet.g.alchemy.com/v2',
  polygon: 'https://polygon-mainnet.g.alchemy.com/v2',
  arbitrum: 'https://arb-mainnet.g.alchemy.com/v2',
  optimism: 'https://opt-mainnet.g.alchemy.com/v2',
  base: 'https://base-mainnet.g.alchemy.com/v2',
  zksync: 'https://zksync-mainnet.g.alchemy.com/v2',
  scroll: 'https://scroll-mainnet.g.alchemy.com/v2',
  linea: 'https://linea-mainnet.g.alchemy.com/v2',
  blast: 'https://blast-mainnet.g.alchemy.com/v2',
  avalanche: 'https://avax-mainnet.g.alchemy.com/v2',
  fantom: 'https://fantom-mainnet.g.alchemy.com/v2',
};

const PUBLIC_RPC: Record<string, string[]> = {
  ethereum: ['https://rpc.ankr.com/eth', 'https://cloudflare-eth.com'],
  bsc: ['https://rpc.ankr.com/bsc', 'https://bsc-dataseed1.binance.org'],
  polygon: ['https://rpc.ankr.com/polygon', 'https://polygon-rpc.com'],
  arbitrum: ['https://rpc.ankr.com/arbitrum', 'https://arb1.arbitrum.io/rpc'],
  optimism: ['https://rpc.ankr.com/optimism', 'https://mainnet.optimism.io'],
  base: ['https://rpc.ankr.com/base', 'https://mainnet.base.org'],
  avalanche: ['https://rpc.ankr.com/avalanche', 'https://api.avax.network/ext/bc/C/rpc'],
  fantom: ['https://rpc.ankr.com/fantom', 'https://rpc.fantom.network'],
  gnosis: ['https://rpc.ankr.com/gnosis', 'https://rpc.gnosischain.com'],
  zksync: ['https://rpc.ankr.com/zksync', 'https://mainnet.era.zksync.io'],
  linea: ['https://rpc.ankr.com/linea', 'https://rpc.linea.build'],
  scroll: ['https://rpc.ankr.com/scroll', 'https://rpc.scroll.io'],
  blast: ['https://rpc.ankr.com/blast', 'https://rpc.blast.io'],
  mantle: ['https://rpc.ankr.com/mantle', 'https://rpc.mantle.xyz'],
  'polygon-zkevm': ['https://rpc.ankr.com/polygon_zkevm', 'https://zkevm-rpc.com'],
  moonbeam: ['https://rpc.ankr.com/moonbeam', 'https://rpc.api.moonbeam.network'],
  moonriver: ['https://rpc.ankr.com/moonriver', 'https://rpc.api.moonriver.moonbeam.network'],
  celo: ['https://rpc.ankr.com/celo', 'https://forno.celo.org'],
  cronos: ['https://rpc.ankr.com/cronos', 'https://evm.cronos.org'],
  metis: ['https://rpc.ankr.com/metis', 'https://andromeda.metis.io/?owner=1088'],
  opbnb: ['https://rpc.ankr.com/opbnb', 'https://opbnb-mainnet-rpc.bnbchain.org'],
  kava: ['https://rpc.ankr.com/kava', 'https://evm.kava.io'],
  fuse: ['https://rpc.ankr.com/fuse', 'https://rpc.fuse.io'],
  evmos: ['https://rpc.ankr.com/evmos', 'https://evmos.lava.build'],
  bitgert: ['https://rpc.ankr.com/bitgert', 'https://rpc.bitgert.chain.com'],
  core: ['https://rpc.ankr.com/core', 'https://rpc.coredao.org'],
  klaytn: ['https://rpc.ankr.com/klaytn', 'https://public-en-cypress.klaytn.net'],
  conflux: ['https://rpc.ankr.com/conflux', 'https://evm.confluxrpc.com'],
  aurora: ['https://rpc.ankr.com/aurora', 'https://mainnet.aurora.dev'],
  harmony: ['https://rpc.ankr.com/harmony', 'https://rpc.ankr.com/harmony'],
};

export interface AlchemyTransfer {
  blockNum: string;
  hash: string;
  from: string;
  to: string | null;
  value: number;
  tokenId: string | null;
  asset: string;
  category: 'external' | 'internal' | 'erc20' | 'erc721' | 'erc1155' | 'token';
  rawContract: {
    address: string | null;
    decimal: string | null;
    value: string | null;
  };
  metadata?: {
    blockTimestamp: string;
    name?: string;
    symbol?: string;
  };
}

export interface AlchemyTx {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  gasPrice: string;
  gasUsed: string;
  receiptStatus: string;
  timestamp: string;
  blockNum: string;
  asset: string | null;
  category: string;
}

export class AlchemyClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ALCHEMY_API_KEY || '';
  }

  private ankrKey(): string {
    return process.env.ANKR_API_KEY || '';
  }

  rpc(chain: string): string | null {
    const base = ALCHEMY_RPC[chain];
    if (base && this.apiKey) return `${base}/${this.apiKey}`;
    const publicRpcs = PUBLIC_RPC[chain];
    if (!publicRpcs?.length) return null;
    const ankrKey = this.ankrKey();
    if (ankrKey && publicRpcs[0].includes('ankr.com')) {
      return `${publicRpcs[0]}/${ankrKey}`;
    }
    return publicRpcs[0];
  }

  allRpcs(chain: string): string[] {
    const base = ALCHEMY_RPC[chain];
    if (base && this.apiKey) return [`${base}/${this.apiKey}`];
    const publicRpcs = PUBLIC_RPC[chain] || [];
    const ankrKey = this.ankrKey();
    if (ankrKey && publicRpcs.length > 0 && publicRpcs[0].includes('ankr.com')) {
      return [`${publicRpcs[0]}/${ankrKey}`, ...publicRpcs.slice(1)];
    }
    return publicRpcs;
  }

  hasAlchemy(): boolean {
    return !!this.apiKey;
  }

  hasAnkr(): boolean {
    return !!this.ankrKey();
  }

  canFetchTransactions(): boolean {
    return this.hasAlchemy() || this.hasAnkr();
  }

  supportedChains(): string[] {
    return [...new Set([...Object.keys(ALCHEMY_RPC), ...Object.keys(PUBLIC_RPC)])];
  }

  async getAssetTransfers(chain: string, address: string, pageKey?: string): Promise<{ transfers: AlchemyTransfer[]; pageKey?: string }> {
    const rpc = this.rpc(chain);
    if (!rpc) return { transfers: [] };

    try {
      const res = await axios.post(
        rpc,
        {
          id: 1,
          jsonrpc: '2.0',
          method: 'alchemy_getAssetTransfers',
          params: [
            {
              fromBlock: '0x0',
              toBlock: 'latest',
              fromAddress: address,
              category: ['external', 'internal', 'erc20', 'erc721', 'erc1155'],
              withMetadata: true,
              excludeZeroValue: false,
              maxCount: '0x64',
              pageKey,
            },
          ],
        },
        { timeout: 15000 }
      );

      return {
        transfers: res.data?.result?.transfers || [],
        pageKey: res.data?.result?.pageKey,
      };
    } catch {
      return { transfers: [] };
    }
  }

  async getAllAssetTransfers(chain: string, address: string): Promise<AlchemyTransfer[]> {
    if (this.apiKey) {
      const [outgoing, incoming] = await Promise.all([
        this.fetchDirection(chain, address, 'from'),
        this.fetchDirection(chain, address, 'to'),
      ]);

      const seen = new Set<string>();
      const all: AlchemyTransfer[] = [];
      for (const t of [...outgoing, ...incoming]) {
        const key = `${t.hash}:${t.from}:${t.to}:${t.rawContract?.address || 'native'}:${t.category}`;
        if (seen.has(key)) continue;
        seen.add(key);
        all.push(t);
      }
      return all;
    }
    return this.ankrTransactions(chain, address);
  }

  private chainId(chain: string): string {
    const m: Record<string, string> = {
      ethereum: 'eth', bsc: 'bsc', polygon: 'polygon',
      arbitrum: 'arbitrum', optimism: 'optimism', base: 'base',
      avalanche: 'avalanche', fantom: 'fantom', gnosis: 'gnosis',
      zksync: 'zksync', linea: 'linea', scroll: 'scroll',
      blast: 'blast', mantle: 'mantle', 'polygon-zkevm': 'polygon_zkevm',
      moonbeam: 'moonbeam', moonriver: 'moonriver', celo: 'celo',
      cronos: 'cronos', metis: 'metis', opbnb: 'opbnb',
      kava: 'kava', fuse: 'fuse', evmos: 'evmos',
      bitgert: 'bitgert', core: 'core', klaytn: 'klaytn',
      conflux: 'conflux', aurora: 'aurora', harmony: 'harmony',
    };
    return m[chain] || 'eth';
  }

  private static _ankrUrl: string | null = null;

  private static getAnkrUrl(): string | null {
    if (this._ankrUrl) return this._ankrUrl;
    const key = process.env.ANKR_API_KEY || '';
    if (!key) return null;
    this._ankrUrl = `https://rpc.ankr.com/multichain/${key}`;
    return this._ankrUrl;
  }

  private async ankrTransactions(chain: string, address: string, pageToken?: string): Promise<AlchemyTransfer[]> {
    const url = AlchemyClient.getAnkrUrl();
    if (!url) return [];
    const params: any = {
      address, pageSize: 50, blockchain: [this.chainId(chain)],
    };
    if (pageToken) params.pageToken = pageToken;

    try {
      const res = await axios.post(
        url,
        { id: 1, jsonrpc: '2.0', method: 'ankr_getTransactionsByAddress', params: [params] },
        { timeout: 20000 }
      );

      const data = res.data;
      if (data?.error) {
        return [];
      }

      const txs: any[] = data?.result?.transactions || [];
      const nextToken = data?.result?.nextPageToken;

      const mapped: AlchemyTransfer[] = txs.map((tx: any) => {
        const rawVal = tx.value || '0x0';
        const val = parseInt(rawVal, 16) / 1e18;
        return {
          blockNum: tx.blockNumber || '0x0',
          hash: tx.hash || '',
          from: (tx.from || '').toLowerCase(),
          to: (tx.to || '').toLowerCase(),
          value: val,
          tokenId: null,
          asset: '',
          category: 'external',
          rawContract: {
            address: null,
            decimal: '18',
            value: rawVal,
          },
          metadata: { blockTimestamp: tx.timestamp ? new Date(parseInt(tx.timestamp, 16) * 1000).toISOString() : '' },
        };
      });
      if (nextToken && mapped.length > 0) {
        const more = await this.ankrTransactions(chain, address, nextToken);
        return [...mapped, ...more];
      }
      return mapped;
    } catch {
      return [];
    }
  }

  private async fetchDirection(chain: string, address: string, direction: 'from' | 'to', pageKey?: string, depth?: number): Promise<AlchemyTransfer[]> {
    const rpc = this.rpc(chain);
    if (!rpc) return [];

    const currentDepth = depth || 0;
    if (currentDepth >= 15) return [];

    const params: any = {
      fromBlock: '0x0',
      toBlock: 'latest',
      category: ['external', 'internal', 'erc20', 'erc721', 'erc1155'],
      withMetadata: true,
      excludeZeroValue: false,
      maxCount: '0x64',
      pageKey,
    };
    params[direction === 'from' ? 'fromAddress' : 'toAddress'] = address;

    try {
      const res = await axios.post(
        rpc,
        { id: 1, jsonrpc: '2.0', method: 'alchemy_getAssetTransfers', params: [params] },
        { timeout: 20000 }
      );

      const transfers: AlchemyTransfer[] = res.data?.result?.transfers || [];
      const nextKey = res.data?.result?.pageKey;

      if (nextKey) {
        const more = await this.fetchDirection(chain, address, direction, nextKey, currentDepth + 1);
        return [...transfers, ...more];
      }
      return transfers;
    } catch {
      return [];
    }
  }

  async getTokenAllowances(chain: string, address: string): Promise<{ contract: string; tokenName: string | null; tokenSymbol: string | null; spender: string; allowance: string }[]> {
    const rpc = this.rpc(chain);
    if (!rpc) return [];

    try {
      const res = await axios.post(
        rpc,
        {
          id: 1,
          jsonrpc: '2.0',
          method: 'alchemy_getTokenAllowances',
          params: [{ owner: address }],
        },
        { timeout: 15000 }
      );

      return (res.data?.result || []).map((a: any) => ({
        contract: a.contractAddress?.toLowerCase() || '',
        tokenName: a.tokenName || null,
        tokenSymbol: a.tokenSymbol || null,
        spender: a.spender?.toLowerCase() || '',
        allowance: a.allowance || '0',
      }));
    } catch {
      return [];
    }
  }

  async getTokenBalances(chain: string, address: string): Promise<{ contract: string; tokenBalance: string; error: string | null }[]> {
    const rpc = this.rpc(chain);
    if (!rpc) return [];

    try {
      const res = await axios.post(
        rpc,
        { id: 1, jsonrpc: '2.0', method: 'alchemy_getTokenBalances', params: [address] },
        { timeout: 15000 }
      );
      return (res.data?.result?.balances || []).map((b: any) => ({
        contract: b.contractAddress?.toLowerCase() || '',
        tokenBalance: b.tokenBalance || '0',
        error: b.error || null,
      }));
    } catch {
      // fallback to Ankr getAccountBalance
      const key = this.ankrKey();
      if (!key) return [];
      try {
        const url = `https://rpc.ankr.com/multichain/${key}`;
        const res = await axios.post(
          url,
          { id: 1, jsonrpc: '2.0', method: 'ankr_getAccountBalance', params: [{ blockchain: [this.chainId(chain)], address }] },
          { timeout: 15000 }
        );
        const balances: any[] = res.data?.result?.balances || [];
        return balances.filter((b: any) => b.contractAddress).map((b: any) => ({
          contract: (b.contractAddress || '').toLowerCase(),
          tokenBalance: BigInt(Math.floor(parseFloat(b.balance) * Math.pow(10, b.tokenDecimals || 18))).toString(),
          error: null,
        }));
      } catch {
        return [];
      }
    }
  }

  async getTokenMetadata(chain: string, contract: string): Promise<{ name: string | null; symbol: string | null; decimals: number | null } | null> {
    const rpc = this.rpc(chain);
    if (!rpc) return null;

    try {
      const res = await axios.post(
        rpc,
        {
          id: 1,
          jsonrpc: '2.0',
          method: 'alchemy_getTokenMetadata',
          params: [contract],
        },
        { timeout: 10000 }
      );

      return {
        name: res.data?.result?.name || null,
        symbol: res.data?.result?.symbol || null,
        decimals: res.data?.result?.decimals ?? null,
      };
    } catch {
      return null;
    }
  }
  async getAllChainBalances(address: string): Promise<{ chain: string; contract: string; symbol: string; name: string; balance: string; decimals: number }[]> {
    const url = AlchemyClient.getAnkrUrl();
    if (!url) return [];
    const blockchains = Object.keys(PUBLIC_RPC).map(c => this.chainId(c)).filter((v, i, a) => a.indexOf(v) === i);
    try {
      const res = await axios.post(
        url,
        { id: 1, jsonrpc: '2.0', method: 'ankr_getAccountBalance', params: [{ blockchain: blockchains, address }] },
        { timeout: 30000 }
      );
      const balances: any[] = res.data?.result?.balances || [];
      const chainMap = new Map<string, string>();
      for (const [key] of Object.entries(PUBLIC_RPC)) {
        chainMap.set(this.chainId(key), key);
      }
      const nativeMap: Record<string, string> = { eth: '0x0000000000000000000000000000000000000000', bsc: '0x0000000000000000000000000000000000000000', polygon: '0x0000000000000000000000000000000000001010' };
      const symMap: Record<string, string> = { eth: 'ETH', bsc: 'BNB', polygon: 'MATIC', arbitrum: 'ETH', optimism: 'ETH', base: 'ETH', avalanche: 'AVAX', fantom: 'FTM', gnosis: 'xDAI', zksync: 'ETH', linea: 'ETH', scroll: 'ETH', blast: 'ETH', mantle: 'MNT', polygon_zkevm: 'ETH', moonbeam: 'GLMR', moonriver: 'MOVR', celo: 'CELO', cronos: 'CRO', metis: 'METIS', opbnb: 'BNB', kava: 'KAVA', fuse: 'FUSE', evmos: 'EVMOS', bitgert: 'BRISE', core: 'CORE', klaytn: 'KLAY', conflux: 'CFX', aurora: 'ETH', harmony: 'ONE' };
      return balances.map((b: any) => {
        const bc = b.blockchain || 'eth';
        const c = chainMap.get(bc) || 'ethereum';
        return {
          chain: c,
          contract: (b.contractAddress || nativeMap[bc] || '0x0000000000000000000000000000000000000000').toLowerCase(),
          symbol: b.tokenSymbol || symMap[bc] || '?',
          name: b.tokenName || b.tokenSymbol || 'Unknown',
          balance: b.balance || '0',
          decimals: b.tokenDecimals || 18,
        };
      });
    } catch {
      return [];
    }
  }
}

export { ALCHEMY_RPC, PUBLIC_RPC };
