import axios from 'axios';
import { SanctionCheck } from './types';

const OFAC_URL = 'https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-addresses/main/sanctioned_addresses.json';

export class SanctionChecker {
  private cachedAddresses: Set<string> | null = null;

  async check(address: string): Promise<SanctionCheck> {
    const list = await this.loadSanctionedList();
    const normalized = address.toLowerCase();

    if (list.has(normalized)) {
      return {
        address,
        sanctioned: true,
        listName: 'OFAC SDN',
        riskLevel: 'critical',
        riskScore: 100,
        details: ['Address found in OFAC sanctioned list'],
      };
    }

    return {
      address,
      sanctioned: false,
      listName: null,
      riskLevel: 'safe',
      riskScore: 0,
      details: ['Address not in sanctioned list'],
    };
  }

  private async loadSanctionedList(): Promise<Set<string>> {
    if (this.cachedAddresses) return this.cachedAddresses;

    try {
      const res = await axios.get<{ addresses: string[] }>(OFAC_URL, {
        timeout: 15000,
        headers: { 'Accept': 'application/json' },
      });

      const addresses = res.data?.addresses || [];
      this.cachedAddresses = new Set(addresses.map(a => a.toLowerCase()));
      return this.cachedAddresses;
    } catch {
      this.cachedAddresses = new Set();
      return this.cachedAddresses;
    }
  }
}
