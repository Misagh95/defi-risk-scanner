import { GoPlusChecker } from './goPlus';
import { ContractVerifier } from './contractVerifier';
import { SanctionChecker } from './sanctionChecker';
import { DexScreener } from './dexScreener';
import { CoinGeckoListCheck } from './coinGeckoList';
import { LabelChecker } from './labelChecker';
import { TxFetcher } from './txFetcher';
import { RiskScorer } from './riskScorer';
import { TokenRisk, ContractVerification, DexScreenerResult, CgListResult, EtherscanLabelResult } from './types';

const goPlus = new GoPlusChecker();
const verifier = new ContractVerifier();
const sanction = new SanctionChecker();
const dex = new DexScreener();
const cgList = new CoinGeckoListCheck();
const labels = new LabelChecker();
const txFetcher = new TxFetcher();
const scorer = new RiskScorer();

function printHeader(): void {
  console.log(`\n${'='.repeat(56)}`);
  console.log('   DeFi Risk Scanner');
  console.log(`${'='.repeat(56)}\n`);
}

async function scanWallet(address: string): Promise<void> {
  printHeader();
  console.log(`  🔍 Wallet: ${address}\n`);

  // Phase 1: Wallet-level checks
  console.log('  ── Phase 1: Wallet Screening ──');
  const [sanctionResult, labelResult] = await Promise.all([
    sanction.check(address),
    labels.check(address),
  ]);
  console.log(`     Sanctions  : ${sanctionResult.sanctioned ? '🚨 FLAGGED' : '✅ Clean'}`);
  console.log(`     Reputation : ${labelResult.flagged ? '🚨 FLAGGED' : '✅ Clean'}`);

  // Phase 2: Fetch on-chain interactions
  console.log(`\n  ── Phase 2: On-Chain History ──`);
  console.log('     Fetching transactions across Ethereum, BSC, Polygon, Arbitrum...');
  const txData = await txFetcher.fetchWalletInteractions(address);
  console.log(`     Found ${txData.totalTxs} transactions on ${txData.chains.join(', ') || 'no chains'}`);
  console.log(`     ${txData.interactions.length} unique contract interactions detected`);

  if (txData.interactions.length === 0) {
    console.log('\n  ✅ No contract interactions found. Wallet is clean.\n');
    return;
  }

  // Show summary of what was found
  const tokenContracts = txData.interactions.filter(i => i.isToken);
  const otherContracts = txData.interactions.filter(i => !i.isToken);
  console.log(`     ${tokenContracts.length} token contracts · ${otherContracts.length} other contracts`);

  // Phase 3: Scan all contracts
  console.log(`\n  ── Phase 3: Contract Risk Scan ──`);

  // Token contracts get full scan (GoPlus + DEX + CG + verification)
  // Other contracts get verification + label check only
  const tokens: TokenRisk[] = [];
  const verifications: ContractVerification[] = [];
  const dexResults: DexScreenerResult[] = [];
  const cgResults: CgListResult[] = [];

  const scanPromises: Promise<void>[] = [];

  for (const interaction of txData.interactions) {
    const addr = interaction.address;
    const chain = interaction.chain;
    const label = interaction.name || interaction.symbol || addr.slice(0, 10);

    scanPromises.push((async () => {
      process.stdout.write(`\r     Scanning ${label}...`);

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
        details: [verification.verified ? 'Non-token contract, verified' : 'Non-token contract, unverified'],
      });
      verifications.push(verification);
      dexResults.push(dexData || {
        liquidityUsd: null, fdv: null, pairCreatedAt: null,
        priceUsd: null, priceChange24h: null, volume24h: null,
        buys24h: null, sells24h: null,
        riskLevel: 'safe', riskScore: 0, details: ['N/A (non-token)'],
      });
      cgResults.push(cgData || {
        listed: false, name: null, symbol: null, marketCapRank: null,
        riskLevel: 'safe', riskScore: 0, details: ['N/A (non-token)'],
      });
    })());
  }

  const MAX_CONCURRENT = 5;
  for (let i = 0; i < scanPromises.length; i += MAX_CONCURRENT) {
    await Promise.all(scanPromises.slice(i, i + MAX_CONCURRENT));
  }
  process.stdout.write('\r'.repeat(50) + '\r');

  // Phase 4: Aggregate & score
  console.log(`  ── Phase 4: Risk Aggregation ──`);
  console.log(`     Scoring ${tokens.length} contracts across 6 security layers...`);
  const analysis = scorer.analyzeWallet(address, sanctionResult, tokens, verifications, dexResults, cgResults, [labelResult]);

  // Results
  console.log(`\n${'='.repeat(56)}`);
  console.log('   Risk Assessment');
  console.log(`${'='.repeat(56)}`);

  const levelEmoji: Record<string, string> = {
    safe: '🟢', low: '🟢', medium: '🟡', high: '🟠', critical: '🔴',
  };

  console.log(`\n  ${levelEmoji[analysis.totalRiskLevel]} Overall Risk: ${analysis.totalRiskLevel.toUpperCase()} (${analysis.totalRiskScore}/100)`);

  for (const s of analysis.summary) {
    console.log(`  ${s.startsWith('WALLET') ? '🚨' : s.startsWith('No') ? '✅' : '⚠️'} ${s}`);
  }

  // Risky contracts
  const riskyContracts = tokens.filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical');
  const riskyDex = dexResults.filter(d => d.riskLevel === 'high' || d.riskLevel === 'critical');
  const unverified = verifications.filter(v => !v.verified);

  if (riskyContracts.length > 0) {
    console.log(`\n  ── High Risk Contracts ──`);
    for (const t of riskyContracts) {
      const interaction = txData.interactions.find(i => i.address.toLowerCase() === t.address.toLowerCase());
      const label = interaction?.name || interaction?.symbol || t.address.slice(0, 10);
      console.log(`  🔴 ${label} (${t.chain})`);
      for (const d of t.details) console.log(`     • ${d}`);
    }
  }

  if (riskyDex.length > 0) {
    console.log(`\n  ── DEX Risk Flags ──`);
    for (let i = 0; i < dexResults.length; i++) {
      if (dexResults[i].riskLevel === 'high' || dexResults[i].riskLevel === 'critical') {
        const t = tokens[i];
        const interaction = txData.interactions.find(ix => ix.address.toLowerCase() === t.address.toLowerCase());
        const label = interaction?.name || interaction?.symbol || t.address.slice(0, 10);
        console.log(`  🟠 ${label}: ${dexResults[i].details.join('; ')}`);
      }
    }
  }

  if (unverified.length > 0) {
    const unverifiedNames = unverified.slice(0, 10).map(v => {
      const interaction = txData.interactions.find(i => i.address.toLowerCase() === v.address.toLowerCase());
      return interaction?.name || interaction?.symbol || v.address.slice(0, 10);
    });
    console.log(`\n  ⚠️ ${unverified.length} unverified contracts (${unverifiedNames.join(', ')}${unverified.length > 10 ? '...' : ''})`);
  }

  // Summary table
  console.log(`\n  ── All Scanned Contracts ──`);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const interaction = txData.interactions[i];
    const label = interaction?.name || interaction?.symbol || t.address.slice(0, 10);
    const emoji = t.riskLevel === 'critical' ? '🔴' : t.riskLevel === 'high' ? '🟠' : t.riskLevel === 'medium' ? '🟡' : '🟢';
    const dexIcon = dexResults[i].riskLevel === 'high' || dexResults[i].riskLevel === 'critical' ? '🟠' : '🟢';
    const cgIcon = cgResults[i].listed ? '✅' : '❌';
    const verifiedIcon = verifications[i].verified ? '✅' : '❌';
    console.log(`  ${emoji} ${label}`);
    const summary = [];
    if (interaction?.isToken) summary.push(`Risk: ${t.riskLevel}(${t.riskScore})`);
    if (interaction?.isToken) summary.push(`DEX: ${dexResults[i].riskLevel}(${dexResults[i].riskScore})`);
    if (interaction?.isToken) summary.push(`CG: ${cgIcon}`);
    summary.push(`Ver: ${verifiedIcon}`);
    summary.push(`${interaction?.txCount || 0} txs`);
    console.log(`     ${summary.join(' · ')}`);
  }

  console.log(`\n${'='.repeat(56)}`);
  console.log('   Security Layers');
  console.log(`${'='.repeat(56)}`);
  console.log('  ✅ GoPlus Security     — token risk, honeypot, tax, blacklist');
  console.log('  ✅ DEX Screener        — liquidity, pool age, volume, trading patterns');
  console.log('  ✅ CoinGecko           — public listing verification');
  console.log('  ✅ Block Explorers     — contract verification');
  console.log('  ✅ OFAC SDN            — sanctioned address list');
  console.log('  ✅ Community Labels    — scam/phishing address database');
  console.log('  ✅ Tx History          — on-chain interaction analysis');
  console.log(`${'='.repeat(56)}\n`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('\n  Usage:');
    console.log('    npm run scan -- <wallet_address>');
    console.log('    npm run scan -- 0xAb58...e9C9');
    console.log('');
    return;
  }

  await scanWallet(args[0]);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
