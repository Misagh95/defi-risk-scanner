import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoPlusChecker } from '../src/goPlus';
import { ContractVerifier } from '../src/contractVerifier';
import { SanctionChecker } from '../src/sanctionChecker';
import { DexScreener } from '../src/dexScreener';
import { CoinGeckoListCheck } from '../src/coinGeckoList';
import { LabelChecker } from '../src/labelChecker';
import { ExploitDb } from '../src/exploitDb';
import { TxFetcher } from '../src/txFetcher';
import { WalletBehaviorAnalyzer } from '../src/walletAnalyzer';
import { ApprovalAnalyzer } from '../src/approvalAnalyzer';
import { TenderlySimulator } from '../src/tenderly';
import { RiskScorer } from '../src/riskScorer';
import { ScanCache } from '../src/kvCache';
import { ContractInteraction } from '../src/types';

const goPlus = new GoPlusChecker();
const verifier = new ContractVerifier();
const sanction = new SanctionChecker();
const dex = new DexScreener();
const cgList = new CoinGeckoListCheck();
const labels = new LabelChecker();
const exploitDb = new ExploitDb();
const txFetcher = new TxFetcher();
const behaviorAnalyzer = new WalletBehaviorAnalyzer();
const approvalAnalyzer = new ApprovalAnalyzer();
const tenderly = new TenderlySimulator();
const scorer = new RiskScorer();
const cache = new ScanCache();

const MAX_CONTRACTS = parseInt(process.env.MAX_CONTRACTS || '20');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const address = req.query.address as string || req.body?.address;

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  // Try cache
  try {
    const cached = await cache.get(address);
    if (cached) return res.json({ ...cached, cached: true });
  } catch { /* ignore */ }

  try {
    const [sanctionResult, labelResult, exploitResult] = await Promise.all([
      sanction.check(address),
      labels.check(address),
      exploitDb.check(address),
    ]);

    const txData = await txFetcher.fetchWalletInteractions(address);

    if (txData.interactions.length === 0) {
      const behavior = await behaviorAnalyzer.analyze(address, txData.transfers);
      const analysis = scorer.analyze(address, sanctionResult, labelResult, exploitResult, behavior, [], [], [], [], []);
      const result = {
        address,
        sanctioned: sanctionResult.sanctioned,
        flagged: labelResult.flagged,
        exploit: exploitResult.flagged,
        totalTransactions: txData.totalTxs,
        chains: txData.chains,
        totalInteractions: txData.interactions.length,
        scannedCount: 0,
        overallRisk: analysis.totalRiskLevel,
        overallRiskScore: analysis.totalRiskScore,
        summary: analysis.summary,
        behavior,
        approvals: [],
        contracts: [],
      };
      await cache.set(address, result);
      return res.json(result);
    }

    const limitedInteractions = txData.interactions.slice(0, MAX_CONTRACTS);
    const tokens: any[] = [];
    const verifications: any[] = [];
    const dexResults: any[] = [];
    const cgResults: any[] = [];

    const CHUNK = 4;
    for (let i = 0; i < limitedInteractions.length; i += CHUNK) {
      const chunk = limitedInteractions.slice(i, i + CHUNK);
      await Promise.all(chunk.map(async (interaction) => {
        const addr = interaction.address;
        const chain = interaction.chain;

        const [goplus, verification, dexData, cgData] = await Promise.all([
          interaction.isToken ? goPlus.checkToken(addr, chain) : Promise.resolve(null),
          verifier.check(addr, chain),
          interaction.isToken ? dex.check(addr) : Promise.resolve(null),
          interaction.isToken ? cgList.check(addr, chain) : Promise.resolve(null),
        ]);

        tokens.push(goplus || {
          address: addr, chain, isHoneypot: null, buyTax: null, sellTax: null,
          isOpenSource: null, hasBlacklist: null, hasAntiWhale: null,
          canOwnerMint: null, ownerBalance: null, isProxy: null,
          riskLevel: verification.verified ? 'safe' : 'medium',
          riskScore: verification.verified ? 0 : 40,
          details: [verification.verified ? 'Verified non-token contract' : 'Unverified non-token contract'],
        });
        verifications.push(verification);
        dexResults.push(dexData || { riskLevel: 'safe', riskScore: 0, details: [] });
        cgResults.push(cgData || { listed: false, riskLevel: 'safe', riskScore: 0, details: [] });
      }));
    }

    const [approvals, behavior] = await Promise.all([
      approvalAnalyzer.checkApprovals(address, txData.chains),
      behaviorAnalyzer.analyze(address, txData.transfers),
    ]);

    const analysis = scorer.analyze(address, sanctionResult, labelResult, exploitResult, behavior, approvals, tokens, verifications, dexResults, cgResults);

    const contracts = limitedInteractions.map((interaction, i) => ({
      address: interaction.address,
      chain: interaction.chain,
      name: interaction.name,
      symbol: interaction.symbol,
      txCount: interaction.txCount,
      type: interaction.type,
      risk: {
        goPlus: tokens[i].riskLevel,
        goPlusScore: tokens[i].riskScore,
        dex: dexResults[i].riskLevel,
        dexScore: dexResults[i].riskScore,
        verified: verifications[i].verified,
        listedOnCoinGecko: cgResults[i].listed,
      },
      warnings: [
        ...tokens[i].details.filter((d: string) => !d.startsWith('No') && !d.startsWith('N/A')),
        ...dexResults[i].details.filter((d: string) => d.includes('Low') || d.includes('Suspicious') || d.includes('Extreme') || d.includes('wash')),
      ],
    }));

    const result = {
      address,
      sanctioned: sanctionResult.sanctioned,
      flagged: labelResult.flagged,
      label: labelResult.label,
      totalTransactions: txData.totalTxs,
      chains: txData.chains,
      totalInteractions: txData.interactions.length,
      scannedCount: contracts.length,
      overallRisk: analysis.totalRiskLevel,
      overallRiskScore: analysis.totalRiskScore,
      summary: analysis.summary,
      behavior,
      approvals,
      contracts,
    };

    await cache.set(address, result);
    return res.json(result);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
