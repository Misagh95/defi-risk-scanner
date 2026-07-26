import * as readline from 'readline';
import { GoPlusChecker } from './goPlus';
import { ContractVerifier } from './contractVerifier';
import { SanctionChecker } from './sanctionChecker';
import { DexScreener } from './dexScreener';
import { CoinGeckoListCheck } from './coinGeckoList';
import { LabelChecker } from './labelChecker';
import { RiskScorer } from './riskScorer';
import { TokenRisk, ContractVerification, DexScreenerResult, CgListResult, EtherscanLabelResult } from './types';

const goPlus = new GoPlusChecker();
const verifier = new ContractVerifier();
const sanction = new SanctionChecker();
const dex = new DexScreener();
const cgList = new CoinGeckoListCheck();
const labels = new LabelChecker();
const scorer = new RiskScorer();

function printHeader(): void {
  console.log(`\n${'='.repeat(48)}`);
  console.log('   DeFi Risk Scanner');
  console.log(`${'='.repeat(48)}\n`);
}

async function scanWallet(address: string): Promise<void> {
  printHeader();
  console.log(`  🔍 Scanning: ${address}\n`);

  console.log('  📋 Checking sanctions & labels...');
  const [sanctionResult, labelResult] = await Promise.all([
    sanction.check(address),
    labels.check(address),
  ]);
  console.log(`     Sanctions: ${sanctionResult.sanctioned ? '🚨 SANCTIONED' : '✅ Clean'}`);
  console.log(`     Labels: ${labelResult.flagged ? '🚨 Flagged' : '✅ Clean'}`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const tokens: TokenRisk[] = [];
  const verifications: ContractVerification[] = [];
  const dexResults: DexScreenerResult[] = [];
  const cgResults: CgListResult[] = [];

  console.log('\n  Enter token contract addresses to scan (one per line, empty line to finish):');
  console.log('  Format: <address> [chain] — chain defaults to ethereum');

  const promptContract = (): Promise<void> => {
    return new Promise((resolve) => {
      rl.question('  > ', async (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) { resolve(); return; }

        const parts = trimmed.split(/\s+/);
        const addr = parts[0];
        const chain = parts[1] || 'ethereum';

        process.stdout.write(`\r     Scanning ${addr.slice(0, 10)}... on ${chain}...`);

        const [goplus, verification, dexData, cgData] = await Promise.all([
          goPlus.checkToken(addr, chain),
          verifier.check(addr, chain),
          dex.check(addr),
          cgList.check(addr, chain),
        ]);

        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);

        tokens.push(goplus);
        verifications.push(verification);
        dexResults.push(dexData);
        cgResults.push(cgData);

        console.log(`  ${addr.slice(0, 10)}... (${chain})`);

        // Source indicators
        const sources = [
          goplus.riskLevel !== 'safe' && goplus.riskScore > 0 ? `GoPlus:${goplus.riskLevel}` : null,
          !verification.verified ? 'Unverified' : null,
          dexData.riskLevel !== 'safe' ? `DEX:${dexData.riskLevel}` : null,
          !cgData.listed ? 'NotOnCG' : null,
        ].filter(Boolean);
        const badges = sources.join(' · ');

        const emoji = goplus.riskLevel === 'critical' ? '🔴' : goplus.riskLevel === 'high' ? '🟠' : goplus.riskLevel === 'medium' ? '🟡' : goplus.riskLevel === 'low' ? '🟢' : '🟢';
        console.log(`     ${emoji} Risk: ${goplus.riskLevel} (${goplus.riskScore}) | DEX: ${dexData.riskLevel} (${dexData.riskScore}) | Listed: ${cgData.listed ? '✅' : '❌'}`);
        if (badges) console.log(`     ${badges}`);

        resolve();
      });
    });
  };

  await promptContract();
  rl.close();

  console.log(`\n  📊 Analyzing ${tokens.length} contracts across 6 security layers...`);
  const analysis = scorer.analyzeWallet(address, sanctionResult, tokens, verifications, dexResults, cgResults, [labelResult]);

  console.log(`\n${'='.repeat(48)}`);
  console.log('   Risk Assessment');
  console.log(`${'='.repeat(48)}`);

  const levelEmoji: Record<string, string> = {
    safe: '🟢', low: '🟢', medium: '🟡', high: '🟠', critical: '🔴',
  };

  console.log(`\n  ${levelEmoji[analysis.totalRiskLevel]} Overall Risk: ${analysis.totalRiskLevel.toUpperCase()} (${analysis.totalRiskScore}/100)`);

  for (const s of analysis.summary) {
    console.log(`  ${s.startsWith('WALLET') ? '🚨' : s.startsWith('Critical') ? '🔴' : s.startsWith('No') ? '✅' : '⚠️'} ${s}`);
  }

  if (tokens.length > 0) {
    console.log(`\n  ── Contract Summary ──`);
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const d = dexResults[i];
      const c = cgResults[i];
      const v = verifications[i];
      const emoji = t.riskLevel === 'critical' ? '🔴' : t.riskLevel === 'high' ? '🟠' : t.riskLevel === 'medium' ? '🟡' : '🟢';
      console.log(`  ${emoji} ${t.address.slice(0, 10)}... (${t.chain})`);
      console.log(`     GoPlus: ${t.riskLevel} (${t.riskScore}) · DEX: ${d.riskLevel} (${d.riskScore}) · CG: ${c.listed ? '✅' : '❌'} · Verified: ${v.verified ? '✅' : '❌'}`);
    }
  }

  console.log(`\n${'='.repeat(48)}`);
  console.log('   Sources used');
  console.log(`${'='.repeat(48)}`);
  console.log('  ✅ GoPlus Security — token risk, honeypot, tax, blacklist');
  console.log('  ✅ DEX Screener — liquidity, pool age, volume, trading patterns');
  console.log('  ✅ CoinGecko — public listing verification');
  console.log('  ✅ Block Explorers — contract verification');
  console.log('  ✅ OFAC SDN — sanctioned address list');
  console.log('  ✅ Community Labels — scam/phishing address database');
  console.log(`${'='.repeat(48)}\n`);
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
