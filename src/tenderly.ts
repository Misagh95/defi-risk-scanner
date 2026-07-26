import axios from 'axios';
import { SimulationResult } from './types';

export class TenderlySimulator {
  private account?: string;
  private project?: string;
  private accessKey?: string;

  constructor() {
    this.account = process.env.TENDERLY_ACCOUNT_NAME;
    this.project = process.env.TENDERLY_PROJECT_NAME;
    this.accessKey = process.env.TENDERLY_ACCESS_KEY;
  }

  enabled(): boolean {
    return !!(this.account && this.project && this.accessKey);
  }

  async simulateSell(
    tokenAddress: string,
    holderAddress: string,
    chain: string,
  ): Promise<SimulationResult> {
    if (!this.enabled()) {
      return {
        sellable: null, sellTax: null, buyTax: null, estimatedSlippage: null,
        error: 'Tenderly not configured',
        riskLevel: 'safe', riskScore: 0,
        details: ['Simulation disabled'],
      };
    }

    const networkId = this.chainToNetwork(chain);
    if (!networkId) {
      return {
        sellable: null, sellTax: null, buyTax: null, estimatedSlippage: null,
        error: `Unsupported network: ${chain}`,
        riskLevel: 'safe', riskScore: 0,
        details: ['Simulation not available for this chain'],
      };
    }

    try {
      const res = await axios.post(
        `https://api.tenderly.co/api/v1/account/${this.account}/project/${this.project}/simulate`,
        {
          network_id: String(networkId),
          from: holderAddress,
          to: tokenAddress,
          input: this.buildERC20ApproveOrTransfer(holderAddress, tokenAddress),
          gas: 8000000,
          gas_price: '0',
          value: '0',
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Access-Key': this.accessKey!,
          },
          timeout: 20000,
        }
      );

      const status = res.data?.simulation?.status;
      const error = res.data?.simulation?.error;
      const success = status === true;

      const details: string[] = [];
      let score = 0;
      let sellable: boolean | null = success;

      if (!success) {
        score += 35;
        details.push(`Simulation revert${error?.message ? ': ' + error.message : ''}`);
      } else {
        details.push('Token passes basic transfer simulation');
      }

      return {
        sellable,
        sellTax: null,
        buyTax: null,
        estimatedSlippage: null,
        error: null,
        riskLevel: score >= 30 ? 'high' : score >= 15 ? 'medium' : 'safe',
        riskScore: score,
        details,
      };
    } catch (err: any) {
      return {
        sellable: null, sellTax: null, buyTax: null, estimatedSlippage: null,
        error: err.message,
        riskLevel: 'safe',
        riskScore: 0,
        details: [`Simulation unavailable: ${err.message}`],
      };
    }
  }

  private chainToNetwork(chain: string): number | null {
    const map: Record<string, number> = {
      ethereum: 1, bsc: 56, polygon: 137, arbitrum: 42161,
      optimism: 10, base: 8453, zksync: 324, avalanche: 43114,
      scroll: 534352, linea: 59144, blast: 81457, fantom: 250,
    };
    return map[chain] || null;
  }

  private buildERC20ApproveOrTransfer(holder: string, token: string): string {
    // transfer(holder, 1) encoded
    const method = 'a9059cbb';
    const paddedHolder = holder.toLowerCase().replace('0x', '').padStart(64, '0');
    const paddedAmount = '1'.padStart(64, '0');
    return `0x${method}${paddedHolder}${paddedAmount}`;
  }
}
