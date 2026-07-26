import { EntityResolver } from './entityResolver';
import { PortfolioAnalyzer } from './portfolioAnalyzer';
import { FlowAnalyzer } from './flowAnalyzer';
import { PatternAnalyzer } from './patternAnalyzer';
import { SanctionChecker } from './sanctionChecker';
import { LabelChecker } from './labelChecker';
import { ExploitDb } from './exploitDb';
import { WalletBehaviorAnalyzer } from './walletAnalyzer';
import { TxFetcher } from './txFetcher';
import { ArkhamAnalysis, EtherscanLabelResult, SanctionCheck } from './types';

const RISK_EMOJI: Record<string, string> = {
  safe: '🟢', low: '🟡', medium: '🟠', high: '🔴', critical: '⚫',
};

export class ArkhamRiskEngine {
  private resolver: EntityResolver;
  private portfolio: PortfolioAnalyzer;
  private flow: FlowAnalyzer;
  private patterns: PatternAnalyzer;
  private sanction: SanctionChecker;
  private labels: LabelChecker;
  private exploitDb: ExploitDb;
  private behavior: WalletBehaviorAnalyzer;
  private txFetcher: TxFetcher;

  constructor() {
    this.resolver = new EntityResolver();
    this.portfolio = new PortfolioAnalyzer();
    this.flow = new FlowAnalyzer();
    this.patterns = new PatternAnalyzer();
    this.sanction = new SanctionChecker();
    this.labels = new LabelChecker();
    this.exploitDb = new ExploitDb();
    this.behavior = new WalletBehaviorAnalyzer();
    this.txFetcher = new TxFetcher();
  }

  async analyze(address: string): Promise<ArkhamAnalysis> {
    const addr = address.toLowerCase();

    const [sanctionR, labelR, exploitR, txData] = await Promise.all([
      this.sanction.check(addr),
      this.labels.check(addr),
      this.exploitDb.check(addr),
      this.txFetcher.fetchWalletInteractions(addr),
    ]);

    const chains = txData.chains.length > 0 ? txData.chains : ['ethereum'];

    const [entity, portfolio, flow, behaviorR, patternR] = await Promise.all([
      this.resolver.resolve(addr, labelR.label),
      this.portfolio.analyze(addr, chains),
      this.flow.analyze(addr, chains, txData.transfers),
      this.behavior.analyze(addr, txData.transfers),
      this.patterns.analyze(addr, chains, Object.values(txData.transfers).flat()),
    ]);

    const summary = this.buildSummary(entity, sanctionR, labelR, exploitR, flow, portfolio, behaviorR, patternR);

    const totalScore = this.calculateTotalScore(entity, sanctionR, labelR, exploitR, flow, portfolio, behaviorR, patternR);
    const totalLevel = totalScore >= 70 ? 'critical' : totalScore >= 50 ? 'high' : totalScore >= 30 ? 'medium' : totalScore >= 10 ? 'low' : 'safe';

    return {
      address: addr,
      entity,
      portfolio,
      flow,
      patterns: patternR,
      label: labelR,
      sanction: sanctionR,
      exploit: exploitR,
      behavior: behaviorR,
      totalRiskScore: totalScore,
      totalRiskLevel: totalLevel,
      summary,
    };
  }

  private calculateTotalScore(
    entity: any,
    sanction: SanctionCheck,
    label: EtherscanLabelResult,
    exploit: EtherscanLabelResult,
    flow: any,
    portfolio: any,
    behavior: any,
    patterns?: any,
  ): number {
    let score = 0;

    // Entity risk (0-30)
    if (entity.category === 'hacker' || entity.category === 'phishing') score += 30;
    else if (entity.category === 'mixer' || entity.category === 'sanctioned') score += 25;
    else if (entity.category === 'sybil') score += 20;
    else if (entity.category === 'mev_bot' || entity.category === 'arb_bot') score += 10;
    else if (entity.category === 'bridge') score += 5;
    else if (entity.category === 'cex' || entity.category === 'foundation' || entity.category === 'treasury') score += 2;

    // Sanction risk (0-30)
    score += sanction.riskScore * 0.3;
    if (sanction.sanctioned) score += 20;

    // Label risk (0-20)
    score += label.riskScore * 0.2;
    if (label.flagged) score += 10;

    // Exploit DB (0-25)
    score += exploit.riskScore * 0.25;
    if (exploit.flagged) score += 15;

    // Flow risk (0-30)
    score += flow.riskScore * 0.3;

    // Portfolio risk (0-20)
    score += portfolio.riskScore * 0.2;

    // Behavior risk (0-15)
    score += behavior.riskScore * 0.15;

    // Pattern risk (0-25)
    if (patterns) {
      score += patterns.riskScore * 0.25;
    }
    score += behavior.riskScore * 0.15;

    // Entity multiplier
    score *= entity.riskMultiplier;

    return Math.min(100, Math.round(score));
  }

  private buildSummary(
    entity: any,
    sanction: SanctionCheck,
    label: EtherscanLabelResult,
    exploit: EtherscanLabelResult,
    flow: any,
    portfolio: any,
    behavior: any,
    patterns?: any,
  ): string[] {
    const lines: string[] = [];

    lines.push(`${RISK_EMOJI[entity.category === 'unknown' ? 'safe' : 'medium']} Entity: ${entity.name || entity.category} (conf: ${(entity.confidence * 100).toFixed(0)}%)`);

    if (entity.riskMultiplier >= 2.0) {
      lines.push(`⚫ Risk multiplier: ${entity.riskMultiplier.toFixed(1)}x — HIGH RISK CATEGORY`);
    }

    if (sanction.sanctioned) {
      lines.push(`⚫ SANCTIONED: ${sanction.listName || 'OFAC list'}`);
    }

    if (label.flagged) {
      lines.push(`🔴 Label flagged: ${label.label}`);
    }

    if (exploit.flagged) {
      lines.push(`⚫ Found in exploit DB: ${exploit.label}`);
    }

    if (flow.riskScore >= 30) {
      const riskyEdges = flow.topSenders.filter((s: any) => s.entity === 'hacker' || s.entity === 'mixer' || s.entity === 'phishing' || s.entity === 'sanctioned').length;
      if (riskyEdges > 0) lines.push(`🔴 ${riskyEdges} high-risk fund flow connections`);
    }

    if (portfolio.totalValueUsd > 1_000_000) {
      lines.push(`💰 Whale: $${(portfolio.totalValueUsd / 1_000_000).toFixed(1)}M portfolio across ${portfolio.chainCount} chains`);
    }

    if (portfolio.riskScore >= 15) {
      if (portfolio.stablecoinPercentage < 10 && portfolio.totalValueUsd > 10000) {
        lines.push(`🟠 High volatility exposure (${portfolio.stablecoinPercentage.toFixed(0)}% stablecoins)`);
      }
    }

    if (patterns && patterns.patterns.length > 0) {
      for (const p of patterns.patterns.slice(0, 3)) {
        lines.push(`📊 Pattern: ${p.type.replace(/_/g, ' ')} (${(p.confidence*100).toFixed(0)}%)`);
      }
    }

    if (behavior.totalTxs === 0) {
      lines.push('🟢 No on-chain activity found');
    } else {
      lines.push(`${behavior.totalTxs} txs · ${behavior.ageDays ? behavior.ageDays + ' days old' : 'new wallet'} · ${flow.topSenders.length + flow.topReceivers.length} counterparties`);
    }

    if (lines.length === 0) {
      lines.push('🟢 No major risk indicators detected');
    }

    return lines;
  }

  formatArkhamReport(analysis: ArkhamAnalysis): string {
    const header = `${'═'.repeat(60)}
  ARKHAM-STYLE RISK INTELLIGENCE REPORT
${'═'.repeat(60)}`;
    const riskBar = this.riskBar(analysis.totalRiskScore);

    return `${header}

  ${riskBar} OVERALL: ${analysis.totalRiskLevel.toUpperCase()} (${analysis.totalRiskScore}/100)

  ── Entity Profile ──
  ${analysis.entity.name || analysis.entity.category.toUpperCase()}
  Category: ${analysis.entity.category}
  Confidence: ${(analysis.entity.confidence * 100).toFixed(0)}%
  Tags: ${analysis.entity.tags.join(', ') || 'none'}
  Risk multiplier: ${analysis.entity.riskMultiplier.toFixed(1)}x

  ── Portfolio ──
  Total value: $${analysis.portfolio.totalValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
  Assets: ${analysis.portfolio.assetCount} · Chains: ${analysis.portfolio.chainCount}
  Stablecoins: ${analysis.portfolio.stablecoinPercentage.toFixed(1)}%
  ${analysis.portfolio.topAssets.slice(0, 5).map(a =>
    `  ${a.symbol}: ${a.balance} ($${a.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })})`
  ).join('\n')}

  ── Fund Flow Analysis ──
  Inflow: $${analysis.flow.incomingValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} from ${analysis.flow.incomingCount} senders
  Outflow: $${analysis.flow.outgoingValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} to ${analysis.flow.outgoingCount} receivers
  ${analysis.flow.topSenders.slice(0, 3).map(s =>
    `  From: ${s.address.slice(0, 10)}… (${s.entity}) $${s.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  ).join('\n')}
  ${analysis.flow.topReceivers.slice(0, 3).map(r =>
    `  To:   ${r.address.slice(0, 10)}… (${r.entity}) $${r.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  ).join('\n')}

  ── Risk Intelligence ──
  ${analysis.summary.join('\n  ')}

  ── Risk Breakdown ──
  Entity:     ${this.riskDot(analysis.entity.riskMultiplier >= 2 ? 'critical' : analysis.entity.riskMultiplier >= 1.2 ? 'medium' : 'safe')}
  Sanctions:  ${this.riskDot(analysis.sanction.riskLevel)}
  Labels:     ${this.riskDot(analysis.label.riskLevel)}
  Exploit DB: ${this.riskDot(analysis.exploit.riskLevel)}
  Flow:       ${this.riskDot(analysis.flow.riskLevel)}
  Portfolio:  ${this.riskDot(analysis.portfolio.riskLevel)}
  Behavior:   ${this.riskDot(analysis.behavior.riskLevel)}
  Patterns:   ${this.riskDot(analysis.patterns?.riskLevel || 'safe')}
${'═'.repeat(60)}`;
  }

  private riskBar(score: number): string {
    const filled = Math.round(score / 10);
    const empty = 10 - filled;
    const color = score >= 70 ? '⚫' : score >= 50 ? '🔴' : score >= 30 ? '🟠' : score >= 10 ? '🟡' : '🟢';
    return `${color} ${'▓'.repeat(filled)}${'░'.repeat(empty)}`;
  }

  private riskDot(level: string): string {
    const map: Record<string, string> = {
      safe: '🟢 Safe', low: '🟡 Low', medium: '🟠 Medium', high: '🔴 High', critical: '⚫ Critical',
    };
    return map[level] || '⚪ Unknown';
  }
}
