import { AlchemyClient } from './alchemy';
import { LabelChecker } from './labelChecker';
import { ApprovalCheck } from './types';

export class ApprovalAnalyzer {
  private alchemy: AlchemyClient;
  private labels: LabelChecker;

  constructor(alchemy?: AlchemyClient, labels?: LabelChecker) {
    this.alchemy = alchemy || new AlchemyClient();
    this.labels = labels || new LabelChecker();
  }

  async checkApprovals(address: string, maxChains?: string[]): Promise<ApprovalCheck[]> {
    const chains = maxChains && maxChains.length > 0
      ? maxChains.filter(c => this.alchemy.supportedChains().includes(c))
      : this.alchemy.supportedChains().slice(0, 4);

    const allChecks: ApprovalCheck[] = [];

    await Promise.all(chains.map(async (chain) => {
      try {
        const allowances = await this.alchemy.getTokenAllowances(chain, address);
        if (!allowances.length) return;

        const spenderChecks = await Promise.all(
          allowances.map(a => this.labels.check(a.spender))
        );

        for (let i = 0; i < allowances.length; i++) {
          const a = allowances[i];
          const label = spenderChecks[i];

          if (!a.allowance || a.allowance === '0') continue;
          const isUnlimited = a.allowance.length > 30 || a.allowance.includes('ffffffffffffffffffffffff');

          if (!isUnlimited && !label.flagged) continue;

          let details = isUnlimited ? 'Unlimited allowance to ' : 'Allowance to ';
          details += label.flagged ? `flagged spender (${label.label || 'unknown'})` : `spender ${a.spender.slice(0, 10)}`;

          const score = label.flagged ? 50 : 25;
          const level = score >= 50 ? 'critical' as const : score >= 25 ? 'high' as const : 'medium' as const;

          allChecks.push({
            contract: a.contract,
            tokenName: a.tokenName,
            tokenSymbol: a.tokenSymbol,
            spender: a.spender,
            chain,
            allowance: a.allowance,
            risky: true,
            riskScore: score,
            riskLevel: level,
            details,
          });
        }
      } catch { /* skip failing chain */ }
    }));

    return allChecks.sort((a, b) => b.riskScore - a.riskScore);
  }
}
