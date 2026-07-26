# DeFi Risk Scanner — Arkham Intelligence

Multi-chain wallet risk analysis engine. Enter any EVM wallet address and get:

- **Portfolio** — native + token balances across 30+ chains (stablecoins, major tokens)
- **Fund Flow** — top senders/receivers with entity labels (CEX, DEX, bridge, etc.)
- **Transaction Patterns** — arbitrage, sandwich, flash loan, bridge hop, MEV, etc.
- **Sanction & Exploit DB Checks** — OFAC, SlowMist, Chainabuse, Rekt, PhishFort
- **Entity Resolution** — 450+ known addresses (Binance, Coinbase, Kraken, major protocols)
- **Aggregated Risk Score** — 0–100 with breakdown by category
- **Persian (Farsi) Language** — full bilingual support via `?lang=fa`

Live at **https://defi-risk-scanner.vercel.app**

## Features

### 30+ Supported Chains
Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Avalanche, Fantom, Gnosis, zkSync, Linea, Scroll, Blast, Mantle, Polygon zkEVM, Moonbeam, Moonriver, Celo, Cronos, Metis, opBNB, Kava, Fuse, Evmos, Bitgert, Core, Klaytn, Conflux, Aurora, Harmony

### Token Scanning
- Native balance via public RPC (no API key required)
- Token balances via `eth_call` balanceOf for USDT, USDC, DAI, WBTC, WETH, wstETH and more on every active chain
- Pricing through DexScreener + CoinGecko (5 min cache)

### Transaction History
- Multi-chain via Ankr `ankr_getTransactionsByAddress` (free tier)
- Counterparty entity labeling (CEX, DEX, bridge, protocol, exploiter)
- Flow analysis categorized by entity type

### Risk Detection
- **Sanctions**: OFAC SDN list + chain-specific sanctions
- **Exploit DBs**: SlowMist, Chainabuse, Rekt, PhishFort blacklists
- **Labels**: Etherscan, BSCScan community labels
- **Patterns**: 15+ transaction behavior profiles
- **Entity risk multiplier** based on counterparty type

### Bilingual UI
- English (default) and Persian (Farsi) — toggle EN/FA in dashboard
- All API responses translate risk levels, labels, and summaries

## Quick Start

```bash
# Clone
git clone https://github.com/Misagh95/defi-risk-scanner.git
cd defi-risk-scanner

# Install
npm install

# Build
npm run build

# Run CLI scan
npm run scan -- 0xWalletAddressHere
```

### Environment Variables

Copy `.env.example` to `.env`:

| Variable | Required | Description |
|---|---|---|
| `ALCHEMY_API_KEY` | No | Full token/transaction data on all chains |
| `ANKR_API_KEY` | No | Higher rate limits for Ankr RPC |
| `ETHERSCAN_API_KEY` | No | Contract verification checks |
| `BSCSCAN_API_KEY` | No | Contract verification checks |
| `TENDERLY_*` | No | Transaction simulation |

Without Alchemy, the scanner falls back to:
- Native balance via public RPCs
- Token balance via `eth_call` (stablecoins + major tokens)
- Transaction history via Ankr multichain endpoint
- Entity resolution, sanctions, exploit DBs all work

## API

```
GET /api/arkham?address=0x...&lang=en
```

Response includes: `entity`, `portfolio`, `flow`, `patterns`, `flags`, `summary`, `totalRiskScore`, `totalRiskLevel`.

Add `&lang=fa` for Persian output.

## Tech Stack

- TypeScript, Node.js
- Vercel serverless functions
- ethers.js (contract calls)
- Ankr multichain API (transactions)
- DexScreener / CoinGecko (pricing)
- GitHub raw exploit lists (SlowMist, Chainabuse, Rekt, PhishFort)

## Deployment

```bash
npx vercel --prod
```

Set environment variables in Vercel dashboard.

## License

MIT
