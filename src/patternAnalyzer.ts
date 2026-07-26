import { TxPatternResult, TxPattern } from './types';
import { AlchemyClient, AlchemyTransfer } from './alchemy';

const CEX_ADDRESSES_SET = new Set([
  '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be','0xd551234ae421e3bcba99a0da6d736074f22192ff',
  '0x28c6c06298d514db089934071355e5743bf21d60','0x6b75d8af000000e20b7a7ddf000ba900b4009a80',
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549','0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43',
  '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67','0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503',
  '0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2','0xc5451b523d5fffe4bc4a3f495495c2f54e7de5f7',
  '0x5a52e96bacdabb82fd05763e2533526193e2bf83','0x7a418d1aed2b0a80c8881b42b13732c18394d125',
  '0x6fc3ea87c1ace0d23ac1312bcf439b8c44e7b54e','0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a',
  '0xd91e3910c27d0d6c0cb7af2aca759d8e2e7ef3d9',
]);

const DEX_ROUTERS = new Set([
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d','0xe592427a0aece92de3edee1f18e0157c05861564',
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45','0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f',
  '0x1111111254fb6c44bac0bed2854e76f90643097d','0xdef1c0ded9bec7f1a1670819833240f027b25eff',
  '0xba12222222228d8ba445958a75a0704d566bf2c8','0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
]);

const LENDING_PROTOCOLS = new Set([
  '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9','0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2',
  '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
]);

const BRIDGES = new Set([
  '0x8731d54e9d02c286767d56ac03e8037c07e01e98','0x42f38ec5a75accec5c35ea130d42b7b35d0ba2b7',
  '0x3ee18b2214aff97000d974cf647e7c347e8fa585','0x040993fbf458b95871cb2d865eea7899457d98c6',
  '0x3664916c9e0f83ea36bb7515400e8b9e03b4f8ab','0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
]);

export class PatternAnalyzer {
  private alchemy: AlchemyClient;

  constructor(alchemy?: AlchemyClient) {
    this.alchemy = alchemy || new AlchemyClient();
  }

  async analyze(address: string, chains: string[], transfers: AlchemyTransfer[]): Promise<TxPatternResult> {
    const allTransfers = transfers.length > 0 ? transfers : await this.fetchAllTransfers(address, chains);

    if (allTransfers.length === 0) {
      if (!this.alchemy.canFetchTransactions()) {
        return { patterns: [], dominantProfile: 'inactive', riskScore: 0, riskLevel: 'safe', details: ['Pattern analysis requires Alchemy or Ankr API key'] };
      }
      return { patterns: [], dominantProfile: 'inactive', riskScore: 0, riskLevel: 'safe', details: ['No on-chain activity'] };
    }

    const addr = address.toLowerCase();
    const patterns: { type: TxPattern; confidence: number; evidence: string[] }[] = [];
    const evidence: string[] = [];

    // Categorize every interaction
    let cexDeposits = 0, cexWithdrawals = 0;
    let dexCalls = 0, lendingCalls = 0, bridgeCalls = 0;
    let nftCount = 0, tokenTxCount = 0;
    let incomingTx = 0, outgoingTx = 0;
    const sentToDex = new Set<string>();
    const receivedFromEx = new Set<string>();
    const sentToEx = new Set<string>();
    const dexTxHashes = new Set<string>();
    const allReceivers = new Set<string>();
    const allSenders = new Set<string>();

    for (const t of allTransfers) {
      const to = (t.to || '').toLowerCase();
      const from = (t.from || '').toLowerCase();

      if (to === addr) {
        incomingTx++;
        allSenders.add(from);
        if (CEX_ADDRESSES_SET.has(from)) { cexDeposits++; receivedFromEx.add(from); }
      }
      if (from === addr) {
        outgoingTx++;
        allReceivers.add(to);
        if (CEX_ADDRESSES_SET.has(to)) { cexWithdrawals++; sentToEx.add(to); }
        if (DEX_ROUTERS.has(to)) { dexCalls++; sentToDex.add(t.hash); dexTxHashes.add(t.hash); }
        if (LENDING_PROTOCOLS.has(to)) lendingCalls++;
        if (BRIDGES.has(to)) bridgeCalls++;
      }

      if (t.category === 'erc721' || t.category === 'erc1155') nftCount++;
      if (t.category === 'erc20') tokenTxCount++;
    }

    // 1. Exchange interaction detection
    if (cexDeposits > 0) {
      patterns.push({
        type: 'cex_deposit',
        confidence: Math.min(0.95, 0.4 + cexDeposits * 0.03),
        evidence: [`${cexDeposits} deposits from ${receivedFromEx.size} exchange(s)`],
      });
    }
    if (cexWithdrawals > 0) {
      patterns.push({
        type: 'cex_withdrawal',
        confidence: Math.min(0.95, 0.4 + cexWithdrawals * 0.03),
        evidence: [`${cexWithdrawals} withdrawals to ${sentToEx.size} exchange(s)`],
      });
    }

    // 2. Arbitrage detection
    if (dexCalls > 3 && dexTxHashes.size > 2) {
      const multiDex = allTransfers.filter(t => {
        const to = (t.to || '').toLowerCase();
        return DEX_ROUTERS.has(to) && dexTxHashes.has(t.hash);
      });
      const txDexCount = new Map<string, number>();
      for (const t of multiDex) {
        txDexCount.set(t.hash, (txDexCount.get(t.hash) || 0) + 1);
      }
      const multiDexTxs = [...txDexCount.values()].filter(c => c >= 2).length;

      if (multiDexTxs > 0 || dexCalls > 10) {
        patterns.push({
          type: 'arbitrage',
          confidence: Math.min(0.95, 0.3 + multiDexTxs * 0.1 + dexCalls * 0.02),
          evidence: [`${dexCalls} DEX calls, ${multiDexTxs} multi-DEX txs`],
        });
      }
    }

    // 3. Farming
    if (lendingCalls > 2) {
      patterns.push({
        type: 'farming',
        confidence: Math.min(0.9, 0.4 + lendingCalls * 0.04),
        evidence: [`${lendingCalls} lending protocol interactions`],
      });
    }

    // 4. Bridge use
    if (bridgeCalls > 0 && chains.length > 1) {
      patterns.push({
        type: 'bridge_hop',
        confidence: Math.min(0.9, 0.3 + bridgeCalls * 0.05 + chains.length * 0.05),
        evidence: [`${bridgeCalls} bridge txs across ${chains.length} chains`],
      });
    } else if (bridgeCalls > 0) {
      patterns.push({
        type: 'bridge_hop',
        confidence: 0.5,
        evidence: [`${bridgeCalls} bridge txs`],
      });
    }

    // 5. Dumping detection
    const tokenSells = allTransfers.filter(t => {
      const to = (t.to || '').toLowerCase();
      return t.from?.toLowerCase() === addr && t.category === 'erc20' &&
        (DEX_ROUTERS.has(to) || CEX_ADDRESSES_SET.has(to));
    });
    if (tokenSells.length > 3 && tokenTxCount > 0) {
      const sellRatio = tokenSells.length / tokenTxCount;
      if (sellRatio > 0.5) {
        patterns.push({
          type: 'dumping',
          confidence: Math.min(0.85, 0.3 + tokenSells.length * 0.05),
          evidence: [`${tokenSells.length}/${tokenTxCount} token txs are sells to DEX/CEX`],
        });
      }
    }

    // 6. Accumulation detection
    const tokenBuys = allTransfers.filter(t => {
      return (t.to || '').toLowerCase() === addr && t.category === 'erc20';
    });
    if (tokenBuys.length > 5 && tokenSells.length === 0) {
      patterns.push({
        type: 'accumulation',
        confidence: Math.min(0.8, 0.3 + tokenBuys.length * 0.02),
        evidence: [`${tokenBuys.length} incoming token transfers, zero sells`],
      });
    }

    // 7. NFT trading
    if (nftCount > 2) {
      patterns.push({
        type: 'nft_trading',
        confidence: Math.min(0.85, 0.3 + nftCount * 0.05),
        evidence: [`${nftCount} NFT transfers`],
      });
    }

    // 8. MEV detection
    if (dexCalls > 20 && allTransfers.length > 100) {
      const rapidTrades = allTransfers.filter(t => t.category === 'external' && t.value > 0).length;
      if (rapidTrades > 50) {
        patterns.push({
          type: 'mev_extraction',
          confidence: Math.min(0.8, 0.3 + dexCalls * 0.01),
          evidence: [`${dexCalls} DEX calls, ${rapidTrades} ETH transfers`],
        });
      }
    }

    // 9. Flash loan detection
    const flashLoanSources = allTransfers.filter(t => {
      const to = (t.to || '').toLowerCase();
      return to.includes('0x5c69be') || to.includes('0xba1222') || to.includes('0xb2b2b2');
    });
    if (flashLoanSources.length > 0) {
      patterns.push({
        type: 'flash_loan',
        confidence: Math.min(0.8, 0.3 + flashLoanSources.length * 0.1),
        evidence: [`${flashLoanSources.length} flash loan source interactions`],
      });
    }

    // Determine dominant profile
    const typeCounts = new Map<TxPattern, number>();
    for (const p of patterns) {
      typeCounts.set(p.type, (typeCounts.get(p.type) || 0) + 1);
    }
    const sorted = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]);
    // Weight by confidence
    const weighted = patterns.reduce((acc, p) => {
      acc.set(p.type, (acc.get(p.type) || 0) + p.confidence);
      return acc;
    }, new Map<string, number>());
    const dominant = [...weighted.entries()].sort((a, b) => b[1] - a[1]);

    const dominantProfile: TxPattern | 'inactive' | 'mixed' =
      patterns.length === 0 ? 'inactive' :
      dominant.length === 1 ? dominant[0][0] as TxPattern : 'mixed';

    // Calculate risk score
    let riskScore = 0;
    for (const p of patterns) {
      if (p.type === 'dumping') riskScore += 20;
      else if (p.type === 'mev_extraction') riskScore += 15;
      else if (p.type === 'flash_loan') riskScore += 15;
      else if (p.type === 'arbitrage') riskScore += 10;
      else if (p.type === 'cex_deposit') riskScore += 5;
      else if (p.type === 'cex_withdrawal') riskScore += 5;
    }
    riskScore = Math.min(100, riskScore);
    const riskLevel = riskScore >= 50 ? 'critical' : riskScore >= 30 ? 'high' : riskScore >= 15 ? 'medium' : riskScore >= 5 ? 'low' : 'safe';

    const details = patterns.map(p => `${p.type.replace(/_/g, ' ')}: ${p.evidence[0] || ''} (${(p.confidence*100).toFixed(0)}%)`);
    if (details.length === 0) details.push('No specific trading patterns detected');

    return { patterns, dominantProfile, riskScore, riskLevel, details };
  }

  private async fetchAllTransfers(address: string, chains: string[]): Promise<AlchemyTransfer[]> {
    const all: AlchemyTransfer[] = [];
    await Promise.all(chains.map(async (chain) => {
      try {
        const t = await this.alchemy.getAllAssetTransfers(chain, address);
        all.push(...t);
      } catch { /* skip */ }
    }));
    return all;
  }
}
