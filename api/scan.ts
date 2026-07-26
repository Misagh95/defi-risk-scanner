import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoPlusChecker } from '../src/goPlus';
import { ContractVerifier } from '../src/contractVerifier';
import { SanctionChecker } from '../src/sanctionChecker';
import { DexScreener } from '../src/dexScreener';
import { CoinGeckoListCheck } from '../src/coinGeckoList';
import { LabelChecker } from '../src/labelChecker';
import { TxFetcher } from '../src/txFetcher';
import { RiskScorer } from '../src/riskScorer';

const goPlus = new GoPlusChecker();
const verifier = new ContractVerifier();
const sanction = new SanctionChecker();
const dex = new DexScreener();
const cgList = new CoinGeckoListCheck();
const labels = new LabelChecker();
const txFetcher = new TxFetcher();
const scorer = new RiskScorer();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const address = req.query.address as string || req.body?.address;

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Phase 1: Wallet screening
    const [sanctionResult, labelResult] = await Promise.all([
      sanction.check(address),
      labels.check(address),
    ]);

    // Phase 2: Fetch on-chain history
    const txData = await txFetcher.fetchWalletInteractions(address);
    if (txData.interactions.length === 0) {
      return res.json({
        address,
        sanctioned: sanctionResult.sanctioned,
        flagged: labelResult.flagged,
        totalTransactions: txData.totalTxs,
        chains: txData.chains,
        interactions: [],
        scannedCount: 0,
        overallRisk: sanctionResult.sanctioned ? 'critical' : 'safe',
        overallRiskScore: sanctionResult.riskScore + labelResult.riskScore,
        summary: ['No contract interactions found'],
        contracts: [],
      });
    }

    // Phase 3: Scan contracts (limit to first 20 for performance)
    const limitedInteractions = txData.interactions.slice(0, 20);
    const tokens: any[] = [];
    const verifications: any[] = [];
    const dexResults: any[] = [];
    const cgResults: any[] = [];

    await Promise.all(limitedInteractions.map(async (interaction) => {
      const addr = interaction.address;
      const chain = interaction.chain;

      const [goplus, verification, dexData, cgData] = await Promise.all([
        interaction.isToken ? goPlus.checkToken(addr, chain) : Promise.resolve(null),
        verifier.check(addr, chain),
        interaction.isToken ? dex.check(addr) : Promise.resolve(null),
        interaction.isToken ? cgList.check(addr, chain) : Promise.resolve(null),
      ]);

      tokens.push(goplus || {
        address: addr, chain,
        isHoneypot: null, buyTax: null, sellTax: null,
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

    // Phase 4: Score
    const analysis = scorer.analyzeWallet(address, sanctionResult, tokens, verifications, dexResults, cgResults, [labelResult]);

    // Format response
    const contracts = limitedInteractions.map((interaction, i) => ({
      address: interaction.address,
      chain: interaction.chain,
      name: interaction.name,
      symbol: interaction.symbol,
      txCount: interaction.txCount,
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
        ...dexResults[i].details.filter((d: string) => d.includes('risk') || d.includes('Low') || d.includes('Suspicious')),
      ],
    }));

    return res.json({
      address,
      sanctioned: sanctionResult.sanctioned,
      flagged: labelResult.flagged,
      totalTransactions: txData.totalTxs,
      chains: txData.chains,
      totalInteractions: txData.interactions.length,
      scannedCount: contracts.length,
      overallRisk: analysis.totalRiskLevel,
      overallRiskScore: analysis.totalRiskScore,
      summary: analysis.summary,
      contracts,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
