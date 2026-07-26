import { TokenRisk, ContractVerification, SanctionCheck, DexScreenerResult, CgListResult, EtherscanLabelResult, WalletAnalysis } from './types';

export class RiskScorer {
  analyzeWallet(
    address: string,
    sanction: SanctionCheck,
    contracts: TokenRisk[],
    verifications: ContractVerification[],
    dexResults: DexScreenerResult[],
    cgResults: CgListResult[],
    labelResults: EtherscanLabelResult[],
  ): WalletAnalysis {
    const allDetails: string[] = [];
    let totalScore = 0;
    const maxScore = contracts.length * 100 + 100 + dexResults.length * 100 + cgResults.length * 100 + 100;

    totalScore += sanction.riskScore;

    for (const ct of contracts) {
      totalScore += ct.riskScore;
      allDetails.push(...ct.details.map(d => `[${ct.chain}:${ct.address.slice(0, 8)}] ${d}`));
    }

    for (const v of verifications) {
      if (!v.verified) {
        allDetails.push(...v.details.map(d => `[${v.chain}:${v.address.slice(0, 8)}] ${d}`));
      }
    }

    for (const d of dexResults) {
      totalScore += d.riskScore;
      allDetails.push(...d.details.map(s => `[DEX] ${s}`));
    }

    for (const c of cgResults) {
      totalScore += c.riskScore;
      allDetails.push(...c.details.map(s => `[CG] ${s}`));
    }

    for (const l of labelResults) {
      totalScore += l.riskScore;
      allDetails.push(...l.details.map(s => `[Label] ${s}`));
    }

    const normalizedScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const totalRiskLevel = normalizedScore >= 70 ? 'critical'
      : normalizedScore >= 50 ? 'high'
      : normalizedScore >= 30 ? 'medium'
      : normalizedScore >= 10 ? 'low'
      : 'safe';

    const summary: string[] = [];
    if (sanction.sanctioned) summary.push('WALLET IS SANCTIONED');
    if (contracts.some(c => c.isHoneypot)) summary.push('Honeypot contracts detected');
    if (contracts.some(c => !c.isOpenSource)) summary.push('Unverified contracts');
    if (contracts.some(c => c.canOwnerMint)) summary.push('Contracts with owner mint');
    if (contracts.some(c => c.riskLevel === 'critical')) summary.push('Critical risk contracts');
    if (dexResults.some(d => d.riskLevel === 'critical')) summary.push('Critical DEX risk (low liquidity / wash trading)');
    if (cgResults.some(c => !c.listed)) summary.push('Tokens not listed on CoinGecko');
    if (labelResults.some(l => l.flagged)) summary.push('Wallet flagged in scam database');
    if (summary.length === 0) summary.push('No major risk flags');

    return {
      address,
      sanctioned: sanction,
      topContracts: contracts,
      totalRiskScore: normalizedScore,
      totalRiskLevel,
      summary,
    };
  }
}
