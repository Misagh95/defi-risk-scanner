import axios from 'axios';
import { EtherscanLabelResult } from './types';

const LABELS_URL = 'https://raw.githubusercontent.com/DefiLlama/defillama-server/main/defi/src/adaptors/data/addressLabels.json';

export class LabelChecker {
  private addressLabels: Map<string, string> | null = null;
  private scamAddresses: Set<string> | null = null;

  async check(address: string): Promise<EtherscanLabelResult> {
    const normalized = address.toLowerCase();
    const labels = await this.loadAddressLabels();
    const scams = await this.loadScamAddresses();

    const label = labels?.get(normalized) || null;

    if (scams?.has(normalized)) {
      return {
        flagged: true,
        label: label || 'flagged_scam',
        riskLevel: 'critical',
        riskScore: 100,
        details: ['Address flagged in scam/phishing database'],
      };
    }

    if (label?.toLowerCase().includes('phish') || label?.toLowerCase().includes('fake') || label?.toLowerCase().includes('hack')) {
      return {
        flagged: true,
        label,
        riskLevel: 'critical',
        riskScore: 90,
        details: [`Address labeled: ${label}`],
      };
    }

    return {
      flagged: false,
      label,
      riskLevel: 'safe',
      riskScore: 0,
      details: [label ? `Known label: ${label}` : 'No negative labels found'],
    };
  }

  private async loadAddressLabels(): Promise<Map<string, string> | null> {
    if (this.addressLabels) return this.addressLabels;

    try {
      const res = await axios.get<Record<string, string>>(LABELS_URL, {
        timeout: 15000,
        headers: { 'Accept': 'application/json' },
      });

      this.addressLabels = new Map();
      for (const [addr, label] of Object.entries(res.data)) {
        this.addressLabels.set(addr.toLowerCase(), label);
      }
      return this.addressLabels;
    } catch {
      return null;
    }
  }

  private async loadScamAddresses(): Promise<Set<string> | null> {
    if (this.scamAddresses) return this.scamAddresses;

    try {
      // Use multiple sources for scam addresses
      const sources = [
        'https://raw.githubusercontent.com/butterflylabs/ethereum-address-labels/master/labels.json',
        'https://raw.githubusercontent.com/nichelab/Ethereum-Address-Labels/main/labels.json',
      ];

      this.scamAddresses = new Set();

      for (const url of sources) {
        try {
          const res = await axios.get(url, { timeout: 10000 });
          const data = res.data;
          if (Array.isArray(data)) {
            for (const entry of data) {
              const addr = entry.address || entry.ADDRESS;
              const label = (entry.label || entry.LABEL || '').toLowerCase();
              if (addr && (label.includes('phish') || label.includes('fake') || label.includes('scam') || label.includes('hack') || label.includes('malicious'))) {
                this.scamAddresses.add(addr.toLowerCase());
              }
            }
          }
        } catch { continue; }
      }

      return this.scamAddresses;
    } catch {
      return null;
    }
  }
}
