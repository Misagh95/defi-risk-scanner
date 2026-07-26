import { AlchemyClient, AlchemyTransfer } from './alchemy';
import { EntityResolver } from './entityResolver';
import { FlowAnalysis, EntityCategory } from './types';

const CEX_ADDRESSES_ETH: Record<string, string> = {
  '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be': 'Binance',
  '0xd551234ae421e3bcba99a0da6d736074f22192ff': 'Binance',
  '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance',
  '0x6b75d8af000000e20b7a7ddf000ba900b4009a80': 'Binance',
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': 'Coinbase',
  '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43': 'Coinbase',
  '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67': 'Kraken',
  '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503': 'Bybit',
  '0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2': 'OKX',
  '0xc5451b523d5fffe4bc4a3f495495c2f54e7de5f7': 'OKX',
  '0x5a52e96bacdabb82fd05763e2533526193e2bf83': 'MEXC',
  '0x7a418d1aed2b0a80c8881b42b13732c18394d125': 'Gate.io',
  '0x6fc3ea87c1ace0d23ac1312bcf439b8c44e7b54e': 'Bitget',
  '0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a': 'KuCoin',
  '0x61189da79177950a7272c7c0b84b7bb1e3e3c1fc': 'Crypto.com',
  '0xcffad3200574698b78f32232aa9d63eab2903521': 'Bitfinex',
  '0xd91e3910c27d0d6c0cb7af2aca759d8e2e7ef3d9': 'HTX',
};

const CEX_CATEGORY: EntityCategory = 'cex';

interface Connection {
  address: string;
  name: string | null;
  entity: EntityCategory;
  totalUsd: number;
  count: number;
  firstSeen: number;
  lastSeen: number;
  isCEX: boolean;
  cexName: string | null;
}

export class FlowAnalyzer {
  private alchemy: AlchemyClient;
  private resolver: EntityResolver;

  constructor(alchemy?: AlchemyClient, resolver?: EntityResolver) {
    this.alchemy = alchemy || new AlchemyClient();
    this.resolver = resolver || new EntityResolver();
  }

  async analyze(address: string, chains: string[], preFetchedTransfers?: Record<string, AlchemyTransfer[]>): Promise<FlowAnalysis> {
    const addr = address.toLowerCase();
    const usedChains = chains.length > 0 ? chains : ['ethereum', 'arbitrum', 'base', 'optimism', 'polygon'];

    const incoming = new Map<string, Connection>();
    const outgoing = new Map<string, Connection>();
    const incomingByChain = new Map<string, number>();
    const outgoingByChain = new Map<string, number>();
    const monthlyActivity = new Map<string, number>();
    const chainActivity = new Map<string, number>();
    const txHashes = new Set<string>();

    let totalTxs = 0;

    const processChainTransfers = (chain: string, transfers: AlchemyTransfer[]) => {
      for (const t of transfers) {
        txHashes.add(t.hash);
        const value = t.value || 0;
        const valueUsd = value * (chain === 'ethereum' ? 1800 : chain === 'bsc' ? 600 : 1);
        const ts = t.metadata?.blockTimestamp || '';

        if (ts) {
          const month = ts.slice(0, 7);
          monthlyActivity.set(month, (monthlyActivity.get(month) || 0) + 1);
        }
        chainActivity.set(chain, (chainActivity.get(chain) || 0) + 1);

        if (t.to?.toLowerCase() === addr && t.from) {
          totalTxs++;
          incomingByChain.set(chain, (incomingByChain.get(chain) || 0) + valueUsd);
          this.trackConnection(incoming, t.from, valueUsd, ts, chain);
        }

        if (t.from?.toLowerCase() === addr && t.to) {
          totalTxs++;
          outgoingByChain.set(chain, (outgoingByChain.get(chain) || 0) + valueUsd);
          this.trackConnection(outgoing, t.to, valueUsd, ts, chain);
        }
      }
    };

    if (preFetchedTransfers && Object.keys(preFetchedTransfers).length > 0) {
      for (const [chain, transfers] of Object.entries(preFetchedTransfers)) {
        if (!usedChains.includes(chain)) continue;
        processChainTransfers(chain, transfers);
      }
    } else {
      await Promise.all(usedChains.map(async (chain) => {
        try {
          const transfers = await this.alchemy.getAllAssetTransfers(chain, addr);
          processChainTransfers(chain, transfers);
        } catch { /* skip */ }
      }));
    }

    const allAddresses = [...new Set([
      ...incoming.keys(),
      ...outgoing.keys(),
    ])];

    const entityMap = await this.resolver.resolveBatch(allAddresses);
    for (const [addr, conn] of incoming) {
      const profile = entityMap.get(addr);
      if (profile) {
        conn.name = profile.name;
        conn.entity = profile.category;
        conn.isCEX = profile.category === 'cex';
        conn.cexName = profile.name;
      }
    }
    for (const [addr, conn] of outgoing) {
      const profile = entityMap.get(addr);
      if (profile) {
        conn.name = profile.name;
        conn.entity = profile.category;
        conn.isCEX = profile.category === 'cex';
        conn.cexName = profile.name;
      }
    }

    const topSenders = [...incoming.entries()]
      .sort((a, b) => b[1].totalUsd - a[1].totalUsd)
      .slice(0, 20)
      .map(([addr, data]) => ({
        address: addr,
        totalUsd: data.totalUsd,
        entity: data.entity,
        count: data.count,
        name: data.name,
        isCEX: data.isCEX,
        cexName: data.cexName,
      }));

    const topReceivers = [...outgoing.entries()]
      .sort((a, b) => b[1].totalUsd - a[1].totalUsd)
      .slice(0, 20)
      .map(([addr, data]) => ({
        address: addr,
        totalUsd: data.totalUsd,
        entity: data.entity,
        count: data.count,
        name: data.name,
        isCEX: data.isCEX,
        cexName: data.cexName,
      }));

    const exchangeIn = topSenders.filter(s => s.isCEX);
    const exchangeOut = topReceivers.filter(r => r.isCEX);
    const totalIncoming = [...incomingByChain.values()].reduce((s, v) => s + v, 0);
    const totalOutgoing = [...outgoingByChain.values()].reduce((s, v) => s + v, 0);

    const months = [...monthlyActivity.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const recentMonths = months.slice(-6);
    const recentAvg = recentMonths.length > 0
      ? recentMonths.reduce((s, m) => s + m[1], 0) / recentMonths.length
      : 0;

    const details: string[] = [];
    let riskScore = 0;

    if (totalTxs === 0) {
      details.push('No transaction history found');
    } else {
      details.push(`${txHashes.size} transactions across ${chainActivity.size} chains`);
      details.push(`Inflow: $${Math.round(totalIncoming).toLocaleString()} from ${incoming.size} addresses`);
      details.push(`Outflow: $${Math.round(totalOutgoing).toLocaleString()} to ${outgoing.size} addresses`);

      if (exchangeIn.length > 0) {
        const exNames = [...new Set(exchangeIn.map(e => e.cexName).filter(Boolean))];
        details.push(`Received from ${exNames.join(', ')} (${exchangeIn.length} deposits)`);
      }
      if (exchangeOut.length > 0) {
        const exNames = [...new Set(exchangeOut.map(e => e.cexName).filter(Boolean))];
        details.push(`Sent to ${exNames.join(', ')} (${exchangeOut.length} withdrawals)`);
      }

      if (months.length > 0) {
        const peak = months.reduce((max, m) => m[1] > max[1] ? m : max, months[0]);
        details.push(`Peak activity: ${peak[0]} (${peak[1]} txs)`);
        if (recentAvg > 0) {
          details.push(`Recent avg: ${Math.round(recentAvg)} txs/month (last ${recentMonths.length} months)`);
        }
      }

      const activeChains = [...chainActivity.entries()].sort((a, b) => b[1] - a[1]);
      if (activeChains.length > 1) {
        details.push(`Multi-chain: ${activeChains.map(([c, n]) => `${c}(${n})`).join(', ')}`);
      }

      const riskyConnections = [...incoming.values(), ...outgoing.values()]
        .filter(c => c.entity === 'hacker' || c.entity === 'mixer' || c.entity === 'phishing' || c.entity === 'sanctioned');

      if (riskyConnections.length > 0) {
        riskScore += Math.min(40, riskyConnections.length * 15);
        details.push(`Found ${riskyConnections.length} high-risk counterparties`);
      }

      if (months.length > 0) {
        const lastActive = months[months.length - 1];
        const now = new Date();
        const lastDate = new Date(lastActive[0] + '-01');
        const monthsDiff = (now.getFullYear() - lastDate.getFullYear()) * 12 + now.getMonth() - lastDate.getMonth();
        if (monthsDiff > 6) {
          riskScore += 10;
          details.push(`Dormant for ${monthsDiff} months (last active: ${lastActive[0]})`);
        }
      }

      if (totalTxs > 500) {
        riskScore += 10;
        details.push('High transaction volume');
      }
    }

    const riskLevel = riskScore >= 50 ? 'critical' : riskScore >= 30 ? 'high' : riskScore >= 15 ? 'medium' : riskScore >= 5 ? 'low' : 'safe';

    return {
      address: addr,
      incomingCount: incoming.size,
      incomingValueUsd: totalIncoming,
      outgoingCount: outgoing.size,
      outgoingValueUsd: totalOutgoing,
      topSenders,
      topReceivers,
      incomingChains: [...incomingByChain.entries()].map(([c, v]) => ({ chain: c, valueUsd: v })),
      outgoingChains: [...outgoingByChain.entries()].map(([c, v]) => ({ chain: c, valueUsd: v })),
      riskScore,
      riskLevel,
      details,
    };
  }

  private trackConnection(map: Map<string, Connection>, counterparty: string, valueUsd: number, timestamp: string, chain: string) {
    const existing = map.get(counterparty) || {
      address: counterparty,
      name: null,
      entity: 'unknown' as EntityCategory,
      totalUsd: 0,
      count: 0,
      firstSeen: timestamp ? new Date(timestamp).getTime() : 0,
      lastSeen: timestamp ? new Date(timestamp).getTime() : 0,
      isCEX: false,
      cexName: null,
    };

    existing.totalUsd += valueUsd;
    existing.count++;
    if (timestamp) {
      const ts = new Date(timestamp).getTime();
      if (ts < existing.firstSeen) existing.firstSeen = ts;
      if (ts > existing.lastSeen) existing.lastSeen = ts;
    }

    map.set(counterparty, existing);
  }
}
