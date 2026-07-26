import { AlchemyClient, PUBLIC_RPC } from './alchemy';
import { PortfolioAsset, PortfolioSummary } from './types';
import axios from 'axios';

const STABLECOINS = new Set(['usdt', 'usdc', 'dai', 'busd', 'tusd', 'frax', 'lusd', 'alusd', 'gusd', 'musd', 'susd', 'usdp', 'usdd', 'mim', 'fei', 'wbtc', 'wsteth']);
const NATIVE_TOKENS: Record<string, string> = {
  ethereum: '0x0000000000000000000000000000000000000000',
  bsc: '0x0000000000000000000000000000000000000000',
  polygon: '0x0000000000000000000000000000000000001010',
  arbitrum: '0x0000000000000000000000000000000000000000',
  optimism: '0x0000000000000000000000000000000000000000',
  base: '0x0000000000000000000000000000000000000000',
  avalanche: '0x0000000000000000000000000000000000000000',
  fantom: '0x0000000000000000000000000000000000000000',
  gnosis: '0x0000000000000000000000000000000000000000',
  zksync: '0x0000000000000000000000000000000000000000',
  linea: '0x0000000000000000000000000000000000000000',
  scroll: '0x0000000000000000000000000000000000000000',
  blast: '0x0000000000000000000000000000000000000000',
  mantle: '0x0000000000000000000000000000000000000000',
  'polygon-zkevm': '0x0000000000000000000000000000000000000000',
  moonbeam: '0x0000000000000000000000000000000000000000',
  moonriver: '0x0000000000000000000000000000000000000000',
  celo: '0x0000000000000000000000000000000000000000',
  cronos: '0x0000000000000000000000000000000000000000',
  metis: '0x0000000000000000000000000000000000000000',
  opbnb: '0x0000000000000000000000000000000000000000',
  kava: '0x0000000000000000000000000000000000000000',
  fuse: '0x0000000000000000000000000000000000000000',
  evmos: '0x0000000000000000000000000000000000000000',
  bitgert: '0x0000000000000000000000000000000000000000',
  core: '0x0000000000000000000000000000000000000000',
  klaytn: '0x0000000000000000000000000000000000000000',
  conflux: '0x0000000000000000000000000000000000000000',
  aurora: '0x0000000000000000000000000000000000000000',
  harmony: '0x0000000000000000000000000000000000000000',
};
const NATIVE_SYMBOLS: Record<string, string> = {
  ethereum: 'ETH', bsc: 'BNB', polygon: 'MATIC', arbitrum: 'ETH',
  optimism: 'ETH', base: 'ETH', avalanche: 'AVAX', fantom: 'FTM',
  gnosis: 'xDAI', zksync: 'ETH', linea: 'ETH', scroll: 'ETH',
  blast: 'ETH', mantle: 'MNT', 'polygon-zkevm': 'ETH',
  moonbeam: 'GLMR', moonriver: 'MOVR', celo: 'CELO',
  cronos: 'CRO', metis: 'METIS', opbnb: 'BNB',
  kava: 'KAVA', fuse: 'FUSE', evmos: 'EVMOS',
  bitgert: 'BRISE', core: 'CORE', klaytn: 'KLAY',
  conflux: 'CFX', aurora: 'ETH', harmony: 'ONE',
};
const KNOWN_TOKEN_SYMBOLS: Record<string, string> = {
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
  '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'WBTC',
  '0x514910771af9ca656af840dff83e8264ecf986ca': 'LINK',
  '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0': 'wstETH',
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH',
  '0x2170ed0880ac9a755fd29b2688956bd959f933f8': 'ETH',
  '0x55d398326f99059ff775485246999027b3197955': 'USDT',
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': 'USDC',
  '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3': 'DAI',
  '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': 'WMATIC',
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 'USDC',
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 'USDT',
};

const priceCache = new Map<string, { price: number | null; ts: number }>();
function cached(key: string): number | null | undefined {
  const entry = priceCache.get(key);
  if (entry && Date.now() - entry.ts < 300_000) return entry.price;
  priceCache.delete(key);
  return undefined;
}
function setCache(key: string, price: number | null) {
  priceCache.set(key, { price, ts: Date.now() });
}

async function dexScreenerPrice(chain: string, contract: string): Promise<number | null> {
  const chainMap: Record<string, string> = { ethereum: 'ethereum', bsc: 'bsc', polygon: 'polygon', arbitrum: 'arbitrum', optimism: 'optimistic', base: 'base', avalanche: 'avalanche', fantom: 'fantom' };
  const c = chainMap[chain];
  if (!c) return null;
  try {
    const res = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${contract}`, { timeout: 5000 });
    const pairs: any[] = res.data?.pairs || [];
    const match = pairs.find((p: any) => p.chainId === c);
    return match ? parseFloat(match.priceUsd) || null : null;
  } catch { return null; }
}

async function cachedPrice(chain: string, contract: string, symbol?: string): Promise<number | null> {
  const key = `${chain}:${contract}`;
  const cached = priceCache.get(key);
  if (cached && Date.now() - cached.ts < 300_000) return cached.price;

  let price: number | null = null;
  if (symbol && ['USDT', 'USDC', 'DAI', 'BUSD', 'FRAX'].includes(symbol)) {
    price = 1;
  } else {
    price = await dexScreenerPrice(chain, contract);
    if (price === null && chain === 'ethereum') {
      try {
        const res = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${contract}&vs_currencies=usd`, { timeout: 5000 });
        price = res.data?.[contract.toLowerCase()]?.usd ?? null;
      } catch {}
    }
  }
  priceCache.set(key, { price, ts: Date.now() });
  return price;
}

async function cachedNativePrice(symbol: string, chain: string): Promise<number | null> {
  const key = `native:${symbol}`;
  const cached = priceCache.get(key);
  if (cached && Date.now() - cached.ts < 300_000) return cached.price;

  let price: number | null = null;

  // Try DexScreener search first (free, no rate limits)
  const searchSymbols: Record<string, string> = {
    ETH: 'WETH', BNB: 'WBNB', MATIC: 'WMATIC', AVAX: 'WAVAX', FTM: 'WFTM',
  };
  const searchTerm = searchSymbols[symbol];
  if (searchTerm) {
    try {
      const res = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=${searchTerm}`, { timeout: 5000 });
      price = parseFloat(res.data?.pairs?.[0]?.priceUsd) || null;
    } catch {}
  }

  // Fallback to CoinGecko
  if (!price) {
    const cgIds: Record<string, string> = { ETH: 'ethereum', BNB: 'binancecoin', MATIC: 'matic-network', AVAX: 'avalanche-2', FTM: 'fantom' };
    const id = cgIds[symbol];
    if (id) {
      try {
        const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`, { timeout: 5000 });
        price = res.data?.[id]?.usd ?? null;
      } catch {}
    }
  }
  priceCache.set(key, { price, ts: Date.now() });
  return price;
}

export class PortfolioAnalyzer {
  private alchemy: AlchemyClient;

  constructor(alchemy?: AlchemyClient) {
    this.alchemy = alchemy || new AlchemyClient();
  }

  async analyze(address: string, chains?: string[]): Promise<PortfolioSummary> {
    const targetChains = chains?.length ? chains.filter(c => PUBLIC_RPC[c]) : Object.keys(PUBLIC_RPC);
    const allAssets: PortfolioAsset[] = [];

    const nativeBalances = await Promise.all(targetChains.map(async (chain) => {
      const symbol = NATIVE_SYMBOLS[chain] || 'ETH';
      const nativePrice = await cachedNativePrice(symbol, chain);
      const nativeBalance = await this.getNativeBalance(chain, address);
      return { chain, symbol, nativePrice, nativeBalance };
    }));

    for (const { chain, symbol, nativePrice, nativeBalance } of nativeBalances) {
      if (nativeBalance > 0) {
        allAssets.push({
          contract: NATIVE_TOKENS[chain] || '0x0000000000000000000000000000000000000000',
          chain,
          symbol,
          name: symbol,
          balance: (nativeBalance / 1e18).toFixed(6),
          balanceRaw: nativeBalance.toString(),
          decimals: 18,
          priceUsd: nativePrice,
          valueUsd: (nativeBalance / 1e18) * (nativePrice ?? 0),
          change24h: null,
          riskLevel: 'safe',
        });
      }
    }

    // Scan major tokens (stablecoins + top tokens) via eth_call on chains with activity
    const activeChains = targetChains.filter(c => nativeBalances.find(n => n.chain === c && n.nativeBalance > 0));
    const MAJOR_TOKENS: Record<string, [string, string][]> = {
      ethereum: [['0xdAC17F958D2ee523a2206206994597C13D831ec7','USDT'],['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48','USDC'],['0x6B175474E89094C44Da98b954EedeAC495271d0F','DAI'],['0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599','WBTC'],['0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0','wstETH'],['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2','WETH']],
      bsc: [['0x55d398326f99059fF775485246999027B3197955','USDT'],['0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d','USDC'],['0x1AF3F329e8BE154074D8769D1FFA4eE058B1DBc3','DAI'],['0x2170Ed0880ac9A755fd29B2688956BD959F933F8','WETH'],['0x7130d2A12B9BCbFae4F2634d864A1Ee1Ce3Ead9c','BTCB']],
      polygon: [['0xc2132D05D31c914A87C6611C10748AEb04B58e8f','USDT'],['0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174','USDC'],['0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063','DAI'],['0x1BFd67037B42cf73acF2047067bd4F2C47D9BfD6','WBTC'],['0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619','WETH']],
      arbitrum: [['0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9','USDT'],['0xaf88d065e77c8cC2239327C5EDb3A432268e5831','USDC'],['0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1','DAI'],['0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f','WBTC'],['0x82aF49447D8a07e3bd95BD0d56f35241523fBab1','WETH']],
      optimism: [['0x94b008aA00579c1307B0EF2c499aD98a8ce58e58','USDT'],['0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85','USDC'],['0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1','DAI'],['0x68f180fcCe6836688e9084f035309E29Bf0A2095','WBTC'],['0x4200000000000000000000000000000000000006','WETH']],
      base: [['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913','USDC'],['0x4200000000000000000000000000000000000006','WETH'],['0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb','DAI']],
      avalanche: [['0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E','USDC'],['0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7','USDT'],['0xd586E7F844cEa2F87f50152665BCbc2C279D8d70','DAI'],['0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB','WETH.e']],
      fantom: [['0x049d68029688eAbF473097a2fC38ef61633A3C7A','fUSDT'],['0x04068DA6C83AFCFA0e13ba15A6696662335D5B75','USDC'],['0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E','DAI'],['0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83','WFTM']],
    };

    const tokensToScan = MAJOR_TOKENS;
    await Promise.all(activeChains.map(async (chain) => {
      const tokens = tokensToScan[chain] || [];
      if (!tokens.length) return;
      const rpcUrl = this.alchemy.rpc(chain);
      if (!rpcUrl) return;

      await Promise.all(tokens.map(async ([contract, sym]) => {
        try {
          const data = '0x70a08231' + '000000000000000000000000' + address.slice(2).toLowerCase();
          const res = await axios.post(rpcUrl, { id: 1, jsonrpc: '2.0', method: 'eth_call', params: [{ to: contract.toLowerCase(), data }, 'latest'] }, { timeout: 5000 });
          const hex = res.data?.result;
          if (!hex || hex === '0x' || hex === '0x0') return;
          const balNum = parseInt(hex, 16) / 1e18;
          if (balNum < 0.001) return;
          const price = await cachedPrice(chain, contract.toLowerCase(), sym);
          const isStable = STABLECOINS.has(sym.toLowerCase());
          allAssets.push({
            contract: contract.toLowerCase(),
            chain, symbol: sym, name: sym,
            balance: balNum.toFixed(Math.min(18, 6)),
            balanceRaw: hex,
            decimals: 18,
            priceUsd: price ?? null,
            valueUsd: balNum * (price ?? 0),
            change24h: null,
            riskLevel: isStable ? 'safe' : price === null ? 'medium' : 'low',
          });
        } catch { /* skip */ }
      }));
    }));

    const sorted = allAssets.sort((a, b) => b.valueUsd - a.valueUsd);
    const totalValue = sorted.reduce((s, a) => s + a.valueUsd, 0);

    const chainDiv = new Map<string, number>();
    for (const a of sorted) {
      chainDiv.set(a.chain, (chainDiv.get(a.chain) || 0) + a.valueUsd);
    }

    const diversification = [...chainDiv.entries()]
      .map(([chain, value]) => ({ chain, valueUsd: value, percentage: totalValue > 0 ? (value / totalValue) * 100 : 0 }))
      .sort((a, b) => b.valueUsd - a.valueUsd);

    const stableValue = sorted.filter(a => STABLECOINS.has(a.symbol.toLowerCase())).reduce((s, a) => s + a.valueUsd, 0);
    const riskyAssets = sorted.filter(a => a.riskLevel === 'medium' || a.riskLevel === 'high' || a.riskLevel === 'critical');

    let riskScore = 0;
    if (totalValue > 1_000_000) riskScore += 10;
    if (totalValue > 10_000_000) riskScore += 10;
    if (stableValue / totalValue < 0.1 && totalValue > 10000) riskScore += 15;
    if (diversification.length <= 1) riskScore += 10;
    if (riskyAssets.length > 5) riskScore += 15;
    if (riskyAssets.length > 0 && riskyAssets.reduce((s, a) => s + a.valueUsd, 0) > totalValue * 0.5) riskScore += 15;

    const riskLevel = riskScore >= 50 ? 'critical' : riskScore >= 30 ? 'high' : riskScore >= 15 ? 'medium' : riskScore >= 5 ? 'low' : 'safe';

    return {
      totalValueUsd: totalValue,
      chainCount: diversification.length,
      assetCount: sorted.length,
      topAssets: sorted.slice(0, 10),
      diversification,
      stablecoinPercentage: totalValue > 0 ? (stableValue / totalValue) * 100 : 0,
      ethPercentage: 0,
      defiPercentage: 0,
      riskScore,
      riskLevel,
    };
  }

  private async getNativeBalance(chain: string, address: string): Promise<number> {
    const rpcs = this.alchemy.allRpcs(chain);
    if (!rpcs.length) return 0;
    for (const rpc of rpcs) {
      try {
        const res = await axios.post(
          rpc,
          { id: 1, jsonrpc: '2.0', method: 'eth_getBalance', params: [address, 'latest'] },
          { timeout: 4000 }
        );
        const bal = parseInt(res.data?.result || '0x0', 16);
        if (bal > 0 || rpc === rpcs[rpcs.length - 1]) return bal;
      } catch { continue; }
    }
    return 0;
  }
}
