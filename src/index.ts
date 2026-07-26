import { GoPlusChecker } from './goPlus';
import { ContractVerifier } from './contractVerifier';
import { SanctionChecker } from './sanctionChecker';
import { RiskScorer } from './riskScorer';
import { TokenRisk, ContractVerification } from './types';

const goPlus = new GoPlusChecker();
const verifier = new ContractVerifier();
const sanction = new SanctionChecker();
const scorer = new RiskScorer();

function printHeader(): void {
  console.log(`\n${'='.repeat(48)}`);
  console.log('   DeFi Risk Scanner');
  console.log(`${'='.repeat(48)}\n`);
}

async function scanWallet(address: string): Promise<void> {
  printHeader();
  console.log(`  🔍 Scanning: ${address}\n`);

  // Check sanctions
  console.log('  📋 Checking sanctions...');
  const sanctionResult = await sanction.check(address);
  console.log(`     ${sanctionResult.sanctioned ? '🚨 SANCTIONED' : '✅ Clean'}`);
  if (sanctionResult.sanctioned) console.log(`     ${sanctionResult.details[0]}`);

  // Interactive mode — let user enter contract addresses
  console.log('\n  Enter token contract addresses to check (one per line, empty line to finish):');
  const tokens: TokenRisk[] = [];
  const verifications: ContractVerification[] = [];

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const promptContract = () => {
    return new Promise<void>((resolve) => {
      readline.question('  > ', async (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) { resolve(); return; }

        const parts = trimmed.split(/\s+/);
        const addr = parts[0];
        const chain = parts[1] || 'ethereum';

        console.log(`     Checking ${addr} on ${chain}...`);

        const [risk, verification] = await Promise.all([
          goPlus.checkToken(addr, chain),
          verifier.check(addr, chain),
        ]);

        tokens.push(risk);
        verifications.push(verification);

        console.log(`     🎯 Risk: ${risk.riskLevel} (${risk.riskScore}/100)`);
        for (const d of risk.details) console.log(`        • ${d}`);
        console.log(`     ${verification.verified ? '✅ Verified' : '⚠️ Not verified'}`);

        resolve();
      });
    });
  };

  await promptContract();
  readline.close();

  // Score
  console.log(`\n  📊 Analyzing ${tokens.length} contracts...`);
  const analysis = scorer.analyzeWallet(address, sanctionResult, tokens, verifications);

  // Results
  console.log(`\n${'='.repeat(48)}`);
  console.log('   Risk Assessment');
  console.log(`${'='.repeat(48)}`);

  const levelEmoji: Record<string, string> = {
    safe: '🟢', low: '🟢', medium: '🟡', high: '🟠', critical: '🔴',
  };

  console.log(`\n  ${levelEmoji[analysis.totalRiskLevel]} Overall Risk: ${analysis.totalRiskLevel} (${analysis.totalRiskScore}/100)`);
  console.log(`  🛡 Sanctioned: ${analysis.sanctioned.sanctioned ? '🚨 YES' : '✅ No'}`);

  for (const s of analysis.summary) {
    console.log(`  ${s.startsWith('WALLET') ? '🚨' : '⚠️'} ${s}`);
  }

  if (tokens.length > 0) {
    console.log(`\n  ── Contracts ──`);
    for (const t of tokens) {
      console.log(`  ${levelEmoji[t.riskLevel]} ${t.address.slice(0, 10)}... (${t.chain}) — ${t.riskLevel} (${t.riskScore}/100)`);
    }
  }

  console.log(`\n${'='.repeat(48)}\n`);
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

  const address = args[0];
  await scanWallet(address);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
