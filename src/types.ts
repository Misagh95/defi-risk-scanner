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

export interface WalletAnalysis {
  address: string;
  sanctioned: SanctionCheck;
  topContracts: TokenRisk[];
  totalRiskScore: number;
  totalRiskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  summary: string[];
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
