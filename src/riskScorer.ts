import { TokenRisk, ContractVerification, SanctionCheck, DexScreenerResult, CgListResult, EtherscanLabelResult, WalletBehavior, ApprovalCheck } from './types';

export interface RiskWeights {
  sanction: number;
  label: number;
  tokenCritical: number;
  tokenHigh: number;
  tokenMedium: number;
  tokenLow: number;
  unverifiedContract: number;
  dexCritical: number;
  dexHigh: number;
  dexMedium: number;
  notListed: number;
  approvalFlagged: number;
  approvalUnlimited: number;
  behaviorHigh: number;
  behaviorMedium: number;
}

export const DEFAULT_WEIGHTS: RiskWeights = {
  sanction: 100,
  label: 70,
  tokenCritical: 40,
  tokenHigh: 25,
  tokenMedium: 12,
  tokenLow: 4,
  unverifiedContract: 15,
  dexCritical: 25,
  dexHigh: 15,
  dexMedium: 8,
  notListed: 10,
  approvalFlagged: 30,
  approvalUnlimited: 12,
  behaviorHigh: 15,
  behaviorMedium: 7,
};

export interface FullAnalysis {
  address: string;
  sanctioned: SanctionCheck;
  label: EtherscanLabelResult;
  exploit: EtherscanLabelResult;
  behavior: WalletBehavior;
  approvals: ApprovalCheck[];
  contracts: TokenRisk[];
  totalRiskScore: number;
  totalRiskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  summary: string[];
}

export class RiskScorer {
  private weights: RiskWeights;

  constructor(weights?: Partial<RiskWeights>) {
    this.weights = { ...DEFAULT_WEIGHTS, ...(weights || {}) };
  }

  analyze(
    address: string,
    sanction: SanctionCheck,
    label: EtherscanLabelResult,
    exploit: EtherscanLabelResult,
    behavior: WalletBehavior,
    approvals: ApprovalCheck[],
    contracts: TokenRisk[],
    verifications: ContractVerification[],
    dexResults: DexScreenerResult[],
    cgResults: CgListResult[],
  ): FullAnalysis {
    let score = 0;
    const summary: string[] = [];

    score += sanction.riskScore;
    if (sanction.sanctioned) summary.push('WALLET IS SANCTIONED');

    score += label.riskScore;
    if (label.flagged) summary.push(`Wallet flagged: ${label.label}`);

    score += exploit.riskScore;
    if (exploit.flagged) summary.push(`Wallet in exploit DB: ${exploit.label}`);

    score += behavior.riskScore;
    if (behavior.riskLevel === 'high' || behavior.riskLevel === 'critical') {
      summary.push('Suspicious wallet behavior');
    }

    score += approvals.reduce((s, a) => s + a.riskScore, 0);
    const flaggedApprovals = approvals.filter(a => /flagged/i.test(a.details));
    if (flaggedApprovals.length) summary.push('Risky token approvals detected');

    for (const c of contracts) {
      if (c.riskLevel === 'critical') score += this.weights.tokenCritical;
      else if (c.riskLevel === 'high') score += this.weights.tokenHigh;
      else if (c.riskLevel === 'medium') score += this.weights.tokenMedium;
      else if (c.riskLevel === 'low') score += this.weights.tokenLow;

      if (c.isHoneypot) score += 25;
      if (c.canOwnerMint) score += 12;
      if (c.hasBlacklist) score += 10;
      if (!c.isOpenSource) score += 8;
      if (c.riskLevel === 'critical') summary.push(`Critical risk token: ${c.address.slice(0, 10)}`);
    }

    for (const v of verifications) {
      if (v.verified === false && v.riskScore > 0) score += this.weights.unverifiedContract;
    }

    for (const d of dexResults) {
      if (d.riskLevel === 'critical') score += this.weights.dexCritical;
      else if (d.riskLevel === 'high') score += this.weights.dexHigh;
      else if (d.riskLevel === 'medium') score += this.weights.dexMedium;
    }

    for (const c of cgResults) {
      if (!c.listed) score += this.weights.notListed;
    }

    score = Math.min(100, score);

    const totalRiskLevel = score >= 70 ? 'critical'
      : score >= 50 ? 'high'
      : score >= 30 ? 'medium'
      : score >= 10 ? 'low'
      : 'safe';

    if (summary.length === 0) summary.push('No major risk flags');

    return {
      address,
      sanctioned: sanction,
      label,
      exploit,
      behavior,
      approvals,
      contracts,
      totalRiskScore: score,
      totalRiskLevel,
      summary,
    };
  }
}
