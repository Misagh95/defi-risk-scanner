import { AlchemyClient, AlchemyTransfer } from './alchemy';

export interface WalletBehavior {
  ageDays: number | null;
  totalTxs: number;
  failedTxs: number;
  uniqueContracts: number;
  uniqueTokens: number;
  averageTxValueUsd: number | null;
  mostActiveChain: string | null;
  firstTxDate: number | null;
  lastTxDate: number | null;
  riskScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  details: string[];
}

export class WalletBehaviorAnalyzer {
  private alchemy: AlchemyClient;

  constructor(alchemy?: AlchemyClient) {
    this.alchemy = alchemy || new AlchemyClient();
  }

  async analyze(address: string, allTransfers: Record<string, AlchemyTransfer[]>): Promise<WalletBehavior> {
    const all: AlchemyTransfer[] = Object.values(allTransfers).flat();
    const now = Date.now();

    if (all.length === 0) {
      return {
        ageDays: null,
        totalTxs: 0,
        failedTxs: 0,
        uniqueContracts: 0,
        uniqueTokens: 0,
        averageTxValueUsd: null,
        mostActiveChain: null,
        firstTxDate: null,
        lastTxDate: null,
        riskScore: 0,
        riskLevel: 'safe',
        details: ['No transaction history'],
      };
    }

    const sorted = [...all].sort((a, b) =>
      new Date(a.metadata?.blockTimestamp || 0).getTime() - new Date(b.metadata?.blockTimestamp || 0).getTime()
    );

    const firstDate = new Date(sorted[0].metadata?.blockTimestamp || 0).getTime();
    const lastDate = new Date(sorted[sorted.length - 1].metadata?.blockTimestamp || 0).getTime();
    const ageDays = firstDate ? Math.floor((now - firstDate) / 86400000) : null;

    // Count txs per chain
    const chainCounts: Record<string, number> = {};
    for (const chain of Object.keys(allTransfers)) chainCounts[chain] = allTransfers[chain].length;
    const mostActiveChain = Object.entries(chainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Unique contracts/tokens
    const contracts = new Set<string>();
    const tokens = new Set<string>();
    for (const t of all) {
      if (t.to && t.to !== '0x0000000000000000000000000000000000000000') contracts.add(t.to.toLowerCase());
      if (t.rawContract?.address) tokens.add(t.rawContract.address.toLowerCase());
    }

    // Average native tx value
    const nativeTxs = all.filter(t => t.category === 'external' && typeof t.value === 'number' && t.value > 0);
    const totalNative = nativeTxs.reduce((s, t) => s + t.value, 0);
    const avgValue = nativeTxs.length > 0 ? totalNative / nativeTxs.length : null;

    // Failed tx estimates: transfers don't include status directly, so we approximate by zero-value external that aren't approvals
    const failedTxs = 0; // Accuracy needs tx receipts, skip for now

    const details: string[] = [];
    let score = 0;

    if (ageDays !== null && ageDays < 7) { score += 25; details.push('Wallet is very new (<7 days)'); }
    else if (ageDays !== null && ageDays < 30) { score += 10; details.push('Wallet is new (<30 days)'); }
    else if (ageDays !== null) { details.push(`Wallet age: ${ageDays} days`); }

    if (nativeTxs.length > 0 && avgValue !== null) {
      details.push(`Avg native tx value: ${avgValue.toFixed(4)} ETH`);
    }

    if (contracts.size > 50) { score += 5; details.push(`High contract interaction count (${contracts.size})`); }

    if (tokens.size > 30) { score += 5; details.push(`Many token contracts interacted (${tokens.size})`); }

    const riskLevel = score >= 50 ? 'critical' : score >= 30 ? 'high' : score >= 15 ? 'medium' : score >= 5 ? 'low' : 'safe';
    if (details.length === 0) details.push('Wallet behavior appears normal');

    return {
      ageDays,
      totalTxs: all.length,
      failedTxs,
      uniqueContracts: contracts.size,
      uniqueTokens: tokens.size,
      averageTxValueUsd: null,
      mostActiveChain,
      firstTxDate: firstDate,
      lastTxDate: lastDate,
      riskScore: score,
      riskLevel,
      details,
    };
  }
}
