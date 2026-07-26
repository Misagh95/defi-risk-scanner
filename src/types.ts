export interface ContractInteraction {
  address: string;
  chain: string;
  name: string | null;
  symbol: string | null;
  txCount: number;
  firstSeen: number;
  lastSeen: number;
  isToken: boolean;
  type: 'token' | 'contract' | 'nft';
}

export interface TokenRisk {
  address: string;
  chain: string;
  isHoneypot: boolean | null;
  buyTax: number | null;
  sellTax: number | null;
  isOpenSource: boolean | null;
  hasBlacklist: boolean | null;
  hasAntiWhale: boolean | null;
  canOwnerMint: boolean | null;
  ownerBalance: string | null;
  isProxy: boolean | null;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  details: string[];
}

export interface ContractVerification {
  address: string;
  chain: string;
  verified: boolean | null;
  compilerVersion: string | null;
  license: string | null;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  details: string[];
}

export interface SanctionCheck {
  address: string;
  sanctioned: boolean;
  listName: string | null;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  details: string[];
}

export interface EtherscanLabelResult {
  address: string;
  flagged: boolean;
  label: string | null;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  details: string[];
}

export interface WalletBehavior {
  ageDays: number | null;
  totalTxs: number;
  failedTxs: number;
  uniqueContracts: number;
  uniqueTokens: number;
  averageTxValueUsd: number | null;
  mostActiveChain: string | null;
  firstTxDate: number | null;
  lastTxDate: number | null;
  riskScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  details: string[];
}

export interface ApprovalCheck {
  contract: string;
  tokenName: string | null;
  tokenSymbol: string | null;
  spender: string;
  chain: string;
  allowance: string;
  risky: boolean;
  riskScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  details: string;
}

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd: string;
  txns: { h24: { buys: number; sells: number } };
  volume: { h24: number };
  priceChange: { h24: number };
  liquidity: { usd: number; base: number; quote: number };
  fdv: number;
  pairCreatedAt: number;
  labels?: string[];
}

export interface DexScreenerResult {
  liquidityUsd: number | null;
  fdv: number | null;
  pairCreatedAt: number | null;
  priceUsd: string | null;
  priceChange24h: number | null;
  volume24h: number | null;
  buys24h: number | null;
  sells24h: number | null;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  details: string[];
}

export interface CgListResult {
  listed: boolean;
  name: string | null;
  symbol: string | null;
  marketCapRank: number | null;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  details: string[];
}

export interface SimulationResult {
  sellable: boolean | null;
  sellTax: number | null;
  buyTax: number | null;
  estimatedSlippage: number | null;
  error: string | null;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  details: string[];
}

export interface GoPlusResponse {
  code: number;
  message: string;
  result: Record<string, GoPlusTokenResult>;
}

export interface GoPlusTokenResult {
  token_name?: string;
  token_symbol?: string;
  holder_count?: string;
  total_supply?: string;
  owners?: string;
  creator_address?: string;
  owner_address?: string;
  is_open_source?: '1' | '0';
  is_proxy?: '1' | '0';
  is_honeypot?: '1' | '0';
  can_take_back_owner?: '1' | '0';
  cannot_buy?: '1' | '0';
  cannot_sell_all?: '1' | '0';
  sell_tax?: string;
  buy_tax?: string;
  is_blacklist?: '1' | '0';
  is_anti_whale?: '1' | '0';
  can_mint?: '1' | '0';
  owner_balance?: string;
  holder_analysis?: string;
  is_true_token?: '1' | '0';
}

// ─── Arkham-Style Entity Intelligence ───

export type EntityCategory =
  | 'cex' | 'dex' | 'bridge' | 'mixer' | 'lending' | 'liquid_staking'
  | 'restaking' | 'oracle' | 'cross_chain' | 'mev_bot' | 'arb_bot'
  | 'nft_marketplace' | 'launchpad' | 'stablecoin' | 'yield_aggregator'
  | 'hacker' | 'phishing' | 'sanctioned' | 'exploit_contract'
  | 'flash_loan' | 'governance' | 'multisig' | 'relayer' | 'gas_station'
  | 'foundation' | 'team_wallet' | 'treasury' | 'airdrop_claimer'
  | 'sybil' | 'whale' | 'unknown';

export interface EntityProfile {
  address: string;
  category: EntityCategory;
  name: string | null;
  confidence: number; // 0-1
  tags: string[];
  firstSeen: number | null;
  lastActive: number | null;
  totalValueUsd: number;
  txCount: number;
  counterpartyCount: number;
  riskMultiplier: number; // 0.5 (safe) to 3.0 (hacker)
  evidence: string[];
}

export interface PortfolioAsset {
  contract: string;
  chain: string;
  symbol: string;
  name: string;
  balance: string;
  balanceRaw: string;
  decimals: number;
  priceUsd: number | null;
  valueUsd: number;
  change24h: number | null;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
}

export interface PortfolioSummary {
  totalValueUsd: number;
  chainCount: number;
  assetCount: number;
  topAssets: PortfolioAsset[];
  diversification: { chain: string; valueUsd: number; percentage: number }[];
  stablecoinPercentage: number;
  ethPercentage: number;
  defiPercentage: number;
  riskScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
}

export interface FlowEdge {
  from: string;
  to: string;
  chain: string;
  token: string;
  valueUsd: number;
  txHash: string;
  timestamp: number;
  label: string | null;
  riskFlag: boolean;
}

export interface FlowAnalysis {
  address: string;
  incomingCount: number;
  incomingValueUsd: number;
  outgoingCount: number;
  outgoingValueUsd: number;
  topSenders: { address: string; totalUsd: number; entity: EntityCategory; count: number }[];
  topReceivers: { address: string; totalUsd: number; entity: EntityCategory; count: number }[];
  incomingChains: { chain: string; valueUsd: number }[];
  outgoingChains: { chain: string; valueUsd: number }[];
  riskScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  details: string[];
}

export interface ArkhamAnalysis {
  address: string;
  entity: EntityProfile;
  portfolio: PortfolioSummary;
  flow: FlowAnalysis;
  patterns: TxPatternResult;
  label: EtherscanLabelResult;
  sanction: SanctionCheck;
  exploit: EtherscanLabelResult;
  behavior: WalletBehavior;
  totalRiskScore: number;
  totalRiskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  summary: string[];
}

export type TxPattern =
  | 'arbitrage' | 'sandwich' | 'flash_loan' | 'liquidation'
  | 'dumping' | 'accumulation' | 'farming' | 'staking'
  | 'bridge_hop' | 'cex_deposit' | 'cex_withdrawal' | 'nft_trading'
  | 'airdrop_claim' | 'token_launch' | 'mev_extraction'
  | 'unknown';

export interface TxPatternResult {
  patterns: { type: TxPattern; confidence: number; evidence: string[] }[];
  dominantProfile: TxPattern | 'inactive' | 'mixed';
  riskScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  details: string[];
}
