import axios from 'axios';
import { EtherscanLabelResult } from './types';

const OFAC_URL = 'https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-addresses/main/sanctioned_addresses.json';
const METAMASK_PHISHING_URL = 'https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/main/src/config.json';
const PHISHFORT_URL = 'https://raw.githubusercontent.com/phishfort/phishfort-lists/master/blacklists/ethereum.csv';
const CHAINABUSE_REPORTS_URL = 'https://api.chainabuse.com/v1/reports'; // Requires API key

interface PhishingConfig {
  blacklist?: string[];
  whitelist?: string[];
  fuzzylist?: string[];
}

export class LabelChecker {
  private cachedAddresses: Set<string> | null = null;
  private phishingDomains: Set<string> | null = null;
  private addressLabels: Map<string, { label: string; source: string }> | null = null;

  async check(address: string): Promise<EtherscanLabelResult> {
    const normalized = address.toLowerCase();
    const responses = await Promise.all([
      this.checkSanctioned(normalized),
      this.checkPhishingAddress(normalized),
      this.checkAddressLabels(normalized),
    ]);

    for (const r of responses) {
      if (r.flagged) return r;
    }

    return {
      address,
      flagged: false,
      label: null,
      riskScore: 0,
      riskLevel: 'safe',
      details: ['Address not found in threat databases'],
    };
  }

  async checkDomain(domain: string): Promise<boolean> {
    const list = await this.loadPhishingDomains();
    if (list.has(domain.toLowerCase())) return true;
    for (const d of list) {
      if (domain.toLowerCase().endsWith('.' + d) || d.endsWith('.' + domain.toLowerCase())) return true;
    }
    return false;
  }

  // ─────── Sources ───────

  private async checkSanctioned(address: string): Promise<EtherscanLabelResult> {
    try {
      const res = await axios.get<{ addresses: string[] }>(OFAC_URL, { timeout: 10000 });
      const list = res.data?.addresses?.map(a => a.toLowerCase()) || [];
      if (list.includes(address)) {
        return {
          address,
          flagged: true,
          label: 'OFAC SDN',
          riskScore: 100,
          riskLevel: 'critical',
          details: ['Address appears in OFAC sanctioned list'],
        };
      }
    } catch { /* ignore */ }
    return this.safe(address);
  }

  private async checkPhishingAddress(address: string): Promise<EtherscanLabelResult> {
    if (this.cachedAddresses === null) {
      this.cachedAddresses = await this.loadDatabases();
    }
    if (this.cachedAddresses.has(address)) {
      return {
        address,
        flagged: true,
        label: 'community_scam',
        riskScore: 90,
        riskLevel: 'critical',
        details: ['Address flagged in community phishing/scam databases'],
      };
    }
    return this.safe(address);
  }

  private async checkAddressLabels(address: string): Promise<EtherscanLabelResult> {
    if (this.addressLabels === null) {
      this.addressLabels = await this.loadAddressLabels();
    }
    const entry = this.addressLabels.get(address);
    if (entry) {
      const risky = /phish|fake|scam|hack|exploit|malicious|drainer|sanction/i.test(entry.label);
      return {
        address,
        flagged: risky,
        label: entry.label,
        riskScore: risky ? 80 : 0,
        riskLevel: risky ? 'critical' : 'safe',
        details: risky ? [`Address labeled: ${entry.label} (${entry.source})`] : [`Known label: ${entry.label}`],
      };
    }
    return this.safe(address);
  }

  private safe(address: string): EtherscanLabelResult {
    return {
      address,
      flagged: false,
      label: null,
      riskScore: 0,
      riskLevel: 'safe',
      details: [],
    };
  }

  // ─────── Data Loading ───────

  private async loadDatabases(): Promise<Set<string>> {
    const set = new Set<string>();

    const sources = [
      'https://raw.githubusercontent.com/DefiLlama/defillama-server/master/defi/src/adaptors/data/addressLabels.json',
      'https://raw.githubusercontent.com/butterflylabs/ethereum-address-labels/master/labels.json',
    ];

    for (const url of sources) {
      try {
        const res = await axios.get<any>(url, { timeout: 10000 });
        const data = res.data;
        if (Array.isArray(data)) {
          for (const e of data) {
            const addr = (e.address || e.ADDRESS || '').toLowerCase();
            const label = (e.label || e.LABEL || '').toLowerCase();
            if (addr && /phish|fake|scam|hack|exploit|drainer|malicious|blacklist/i.test(label)) {
              set.add(addr);
            }
          }
        } else if (typeof data === 'object' && data !== null) {
          for (const [addr, label] of Object.entries(data)) {
            if (typeof label === 'string' && /phish|fake|scam|hack|exploit|drainer|malicious|blacklist/i.test(label.toLowerCase())) {
              set.add(addr.toLowerCase());
            }
          }
        }
      } catch { continue; }
    }

    // PhishFort CSV
    try {
      const csv = await axios.get(PHISHFORT_URL, { timeout: 10000 });
      const lines = (csv.data || '').split(/\r?\n/);
      for (const line of lines) {
        const addr = line.trim().toLowerCase();
        if (/^0x[a-f0-9]{40}$/.test(addr)) set.add(addr);
      }
    } catch { /* ignore */ }

    return set;
  }

  private async loadAddressLabels(): Promise<Map<string, { label: string; source: string }>> {
    const map = new Map<string, { label: string; source: string }>();

    try {
      const res = await axios.get<Record<string, string>>(
        'https://raw.githubusercontent.com/DefiLlama/defillama-server/master/defi/src/adaptors/data/addressLabels.json',
        { timeout: 10000 }
      );
      for (const [addr, label] of Object.entries(res.data || {})) {
        map.set(addr.toLowerCase(), { label, source: 'DefiLlama' });
      }
    } catch { /* ignore */ }

    return map;
  }

  private async loadPhishingDomains(): Promise<Set<string>> {
    if (this.phishingDomains) return this.phishingDomains;

    try {
      const res = await axios.get<PhishingConfig>(METAMASK_PHISHING_URL, { timeout: 10000 });
      this.phishingDomains = new Set([
        ...(res.data?.blacklist || []),
        ...(res.data?.fuzzylist || []),
      ].map(d => d.toLowerCase()));
    } catch {
      this.phishingDomains = new Set();
    }

    return this.phishingDomains;
  }
}
