import { GoPlusChecker } from './goPlus';
import { ContractVerifier } from './contractVerifier';
import { SanctionChecker } from './sanctionChecker';
import { LabelChecker } from './labelChecker';
import { ExploitDb } from './exploitDb';
import { DexScreener } from './dexScreener';
import { CoinGeckoListCheck } from './coinGeckoList';
import { AlchemyClient } from './alchemy';
import { TxFetcher } from './txFetcher';
import { WalletBehaviorAnalyzer } from './walletAnalyzer';
import { ApprovalAnalyzer } from './approvalAnalyzer';
import { TenderlySimulator } from './tenderly';
import { RiskScorer } from './riskScorer';
import { ArkhamRiskEngine } from './riskModelV2';
import { ContractInteraction } from './types';

const goPlus = new GoPlusChecker();
const verifier = new ContractVerifier();
const sanction = new SanctionChecker();
const labels = new LabelChecker();
const exploitDb = new ExploitDb();
const dex = new DexScreener();
const cgList = new CoinGeckoListCheck();
const alchemy = new AlchemyClient();
const txFetcher = new TxFetcher(alchemy);
const behaviorAnalyzer = new WalletBehaviorAnalyzer(alchemy);
const approvalAnalyzer = new ApprovalAnalyzer(alchemy, labels);
const tenderly = new TenderlySimulator();
const scorer = new RiskScorer();

function printHeader(): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log('   DeFi Risk Scanner v2');
  console.log(`${'='.repeat(60)}\n`);
}

function emoji(level: string): string {
  return { safe: '🟢', low: '🟢', medium: '🟡', high: '🟠', critical: '🔴' }[level] || '⚪';
}

async function scanWallet(address: string): Promise<void> {
  printHeader();
  console.log(`  🔍 Wallet: ${address}\n`);
  console.log(`  Chains supported: ${txFetcher.supportedChains().join(', ')}\n`);

  if (!alchemy.rpc('ethereum')) {
    console.log('  ⚠️  ALCHEMY_API_KEY not set. Set it in .env or environment variables.\n');
  }

  console.log('  ── Phase 1: Wallet Reputation ──');
  const [sanctionResult, labelResult] = await Promise.all([
    sanction.check(address),
    labels.check(address),
  ]);
  console.log(`     Sanctions  : ${sanctionResult.sanctioned ? '🚨 FLAGGED' : '✅ Clean'}`);
  console.log(`     Labels     : ${labelResult.flagged ? '🚨 FLAGGED' : '✅ Clean'}`);
  if (labelResult.label) console.log(`     Label      : ${labelResult.label}`);

  console.log(`\n  ── Phase 2: On-Chain History ──`);
  console.log('     Fetching via Alchemy...');
  const txData = await txFetcher.fetchWalletInteractions(address);
  console.log(`     ${txData.totalTxs} transfers across ${txData.chains.join(', ') || 'no chains'}`);
  console.log(`     ${txData.interactions.length} unique contracts/tokens`);

  console.log(`\n  ── Phase 2.5: Exploit DB Check ──`);
  const exploitResult = await exploitDb.check(address);
  console.log(`     ${exploitResult.flagged ? '🚨 FLAGGED' : '✅ Clean'}`);
  if (exploitResult.label) console.log(`     Source: ${exploitResult.label}`);

  if (txData.interactions.length === 0) {
    const behavior = await behaviorAnalyzer.analyze(address, txData.transfers);
    const analysis = scorer.analyze(
      address,
      sanctionResult,
      labelResult,
      exploitResult,
      behavior,
      [],
      [],
      [],
      [],
      [],
    );

    console.log(`\n  ${emoji(analysis.totalRiskLevel)} Overall Risk: ${analysis.totalRiskLevel.toUpperCase()} (${analysis.totalRiskScore}/100)`);
    console.log(`     ${behavior.details.join('\n     ')}`);
    console.log('\n');
    return;
  }

  console.log(`\n  ── Phase 3: Contract Risk Scan ──`);
  const maxContracts = txData.interactions.slice(0, 25);
  const results = await scanContracts(address, maxContracts);

  console.log(`\n  ── Phase 4: Token Approvals ──`);
  const approvals = await approvalAnalyzer.checkApprovals(address, txData.chains);
  console.log(`     ${approvals.length} risky approvals found`);
  for (const a of approvals.slice(0, 5)) {
    console.log(`     ${emoji(a.riskLevel === 'critical' ? 'critical' : a.riskScore >= 25 ? 'medium' : 'safe')} ${a.tokenSymbol || a.contract.slice(0, 10)} → ${a.spender.slice(0, 10)} (${a.chain})`);
    console.log(`        ${a.details}`);
  }

  console.log(`\n  ── Phase 5: Wallet Behavior ──`);
  const behavior = await behaviorAnalyzer.analyze(address, txData.transfers);
  console.log(`     Age: ${behavior.ageDays ?? '?'} days · Txs: ${behavior.totalTxs}`);
  console.log(`     Contracts: ${behavior.uniqueContracts} · Tokens: ${behavior.uniqueTokens} · Most active: ${behavior.mostActiveChain || '?'}`);

  console.log(`\n  ── Phase 6: Risk Aggregation ──`);
  const analysis = scorer.analyze(
    address,
    sanctionResult,
    labelResult,
    exploitResult,
    behavior,
    approvals,
    results.tokens,
    results.verifications,
    results.dexResults,
    results.cgResults,
  );

  console.log(`\n${'='.repeat(60)}`);
  console.log('   Risk Assessment');
  console.log(`${'='.repeat(60)}`);
  console.log(`\n  ${emoji(analysis.totalRiskLevel)} Overall Risk: ${analysis.totalRiskLevel.toUpperCase()} (${analysis.totalRiskScore}/100)`);

  for (const s of analysis.summary) {
    console.log(`  ${s.startsWith('WALLET') ? '🚨' : s.startsWith('No') ? '✅' : '⚠️'} ${s}`);
  }

  const riskyContracts = results.tokens.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical');
  if (riskyContracts.length > 0) {
    console.log(`\n  ── High-Risk Contracts ──`);
    for (const t of riskyContracts.slice(0, 10)) {
      const interaction = maxContracts.find((i: ContractInteraction) => i.address.toLowerCase() === t.address.toLowerCase());
      console.log(`  ${emoji(t.riskLevel)} ${interaction?.name || interaction?.symbol || t.address.slice(0, 10)} (${t.chain})`);
      for (const d of t.details) console.log(`     • ${d}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('   Security Layers');
  console.log(`${'='.repeat(60)}`);
  console.log('  ✅ Alchemy — on-chain history (12 chains)');
  console.log('  ✅ GoPlus Security — token risk');
  console.log('  ✅ DEX Screener — liquidity & volume');
  console.log('  ✅ CoinGecko — public listing verification');
  console.log('  ✅ Block Explorers — contract verification');
  console.log('  ✅ OFAC SDN — sanctions');
  console.log('  ✅ MetaMask/PhishFort/Community — labels');
  console.log('  ✅ Token Allowance Checker — risky approvals');
  if (tenderly.enabled()) console.log('  ✅ Tenderly — transaction simulation');
  console.log(`${'='.repeat(60)}\n`);
}

async function scanContracts(address: string, interactions: ContractInteraction[]) {
  const tokens: any[] = [];
  const verifications: any[] = [];
  const dexResults: any[] = [];
  const cgResults: any[] = [];

  const CHUNK = 4;
  for (let i = 0; i < interactions.length; i += CHUNK) {
    const chunk = interactions.slice(i, i + CHUNK);
    await Promise.all(chunk.map(async (interaction) => {
      process.stdout.write(`\r     Scanning ${i + chunk.indexOf(interaction) + 1}/${interactions.length} contracts...`);

      const [goplus, verification, dexData, cgData] = await Promise.all([
        interaction.isToken ? goPlus.checkToken(interaction.address, interaction.chain) : Promise.resolve(null),
        verifier.check(interaction.address, interaction.chain),
        interaction.isToken ? dex.check(interaction.address) : Promise.resolve(null),
        interaction.isToken ? cgList.check(interaction.address, interaction.chain) : Promise.resolve(null),
      ]);

      tokens.push(goplus || {
        address: interaction.address,
        chain: interaction.chain,
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
  }
  process.stdout.write(`\r     Scanned ${interactions.length} contracts                  \n`);

  return { tokens, verifications, dexResults, cgResults };
}

async function arkhamWallet(address: string): Promise<void> {
  printHeader();
  console.log(`  🕵️  ARKHAM-STYLE INTELLIGENCE`);
  console.log(`  ${'─'.repeat(48)}`);
  console.log(`  Target: ${address}\n`);

  const engine = new ArkhamRiskEngine();
  const analysis = await engine.analyze(address);

  console.log(engine.formatArkhamReport(analysis));
}

async function main() {
  const args = process.argv.slice(2);
  const isArkham = args.includes('--arkham') || args.includes('-a');
  const address = args.find(a => a.startsWith('0x')) || args[0];

  if (!address || (!address.startsWith('0x') && !isArkham)) {
    console.log('\n  Usage: npm run scan -- <wallet_address>');
    console.log('         npm run scan -- <wallet_address> --arkham');
    console.log('');
    return;
  }

  if (isArkham) {
    await arkhamWallet(address);
  } else {
    await scanWallet(address);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
