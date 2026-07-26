import { TokenRisk, ContractVerification, SanctionCheck, WalletAnalysis } from './types';

export class RiskScorer {
  analyzeWallet(
    address: string,
    sanction: SanctionCheck,
    contracts: TokenRisk[],
    verifications: ContractVerification[],
  ): WalletAnalysis {
    const allDetails: string[] = [];
    let totalScore = 0;
    let maxScore = contracts.length * 100 + 100; // contracts + sanction

    // Sanction score
    totalScore += sanction.riskScore;

    // Contract scores
    for (const ct of contracts) {
      totalScore += ct.riskScore;
      allDetails.push(...ct.details.map(d => `[${ct.chain}:${ct.address.slice(0, 8)}] ${d}`));
    }

    for (const v of verifications) {
      if (!v.verified) {
        allDetails.push(...v.details.map(d => `[${v.chain}:${v.address.slice(0, 8)}] ${d}`));
      }
    }

    // Normalize to 0-100
    const normalizedScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const totalRiskLevel = normalizedScore >= 70 ? 'critical'
      : normalizedScore >= 50 ? 'high'
      : normalizedScore >= 30 ? 'medium'
      : normalizedScore >= 10 ? 'low'
      : 'safe';

    const summary: string[] = [];

    if (sanction.sanctioned) summary.push('WALLET IS SANCTIONED');
    if (contracts.some(c => c.isHoneypot)) summary.push('Honeypot contracts detected');
    if (contracts.some(c => !c.isOpenSource)) summary.push('Unverified contracts found');
    if (contracts.some(c => c.canOwnerMint)) summary.push('Contracts with owner mint capability');
    if (contracts.some(c => c.riskLevel === 'critical')) summary.push('Critical risk contracts found');
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
