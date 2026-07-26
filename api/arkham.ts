import { VercelRequest, VercelResponse } from '@vercel/node';
import { ArkhamRiskEngine } from '../src/riskModelV2';

const engine = new ArkhamRiskEngine();

const FA: Record<string, string> = {
  'safe': 'امن',
  'low': 'کم‌خطر',
  'medium': 'متوسط',
  'high': 'پرخطر',
  'critical': 'بحرانی',
  'entity': 'نهاد',
  'portfolio': 'پرتفوی',
  'flow': 'جریان وجوه',
  'patterns': 'الگوها',
  'riskScore': 'امتیاز ریسک',
  'transactions': 'تراکنش',
  'chains': 'شبکه',
  'inflow': 'ورودی',
  'outflow': 'خروجی',
  'addresses': 'آدرس',
  'noHistory': 'تاریخچه تراکنش یافت نشد',
  'vitalikButerin': 'ویتیالیک بوترین',
  'foundation': 'بنیاد',
};

function translate(d: any, lang: string): any {
  if (lang !== 'fa') return d;
  const t = (en: string, key: string) => FA[key] || en;
  return {
    ...d,
    totalRiskLevel: t(d.totalRiskLevel, d.totalRiskLevel),
    entity: { ...d.entity, name: FA[d.entity?.name] || d.entity?.name, category: t(d.entity?.category, d.entity?.category) },
    portfolio: {
      ...d.portfolio,
      riskLevel: t(d.portfolio?.riskLevel, d.portfolio?.riskLevel),
    },
    flow: {
      ...d.flow,
      riskLevel: t(d.flow?.riskLevel, d.flow?.riskLevel),
      details: (d.flow?.details || []).map((s: string) =>
        s.replace('transactions', 'تراکنش').replace('chains', 'شبکه').replace('Inflow', 'ورودی').replace('Outflow', 'خروجی').replace('addresses', 'آدرس').replace('No transaction history found', 'تاریخچه تراکنش یافت نشد')
      ),
    },
    patterns: {
      ...d.patterns,
      riskLevel: t(d.patterns?.riskLevel, d.patterns?.riskLevel),
      details: (d.patterns?.details || []).map((s: string) => s.replace('bridge hop', 'پل بین‌زنجیره‌ای').replace('No on-chain activity', 'فعالیت زنجیره‌ای یافت نشد')),
    },
    summary: (d.summary || []).map((s: string) =>
      s.replace(/Entity:?\s*/i, 'نهاد: ').replace(/Whale:?\s*/i, 'نهنگ: ').replace(/Risk:?\s*/i, 'ریسک: ')
        .replace(/transactions?/g, 'تراکنش').replace(/wallet/g, 'کیف پول').replace(/stablecoins?/g, 'استیبل کوین')
    ),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { address, lang } = req.query;

  if (!address || typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const analysis = await engine.analyze(address);
    const base = {
      address: analysis.address,
      totalRiskScore: analysis.totalRiskScore,
      totalRiskLevel: analysis.totalRiskLevel,
      entity: {
        name: analysis.entity.name,
        category: analysis.entity.category,
        confidence: analysis.entity.confidence,
        tags: analysis.entity.tags,
        riskMultiplier: analysis.entity.riskMultiplier,
        evidence: analysis.entity.evidence,
      },
      portfolio: {
        totalValueUsd: Math.round(analysis.portfolio.totalValueUsd),
        chainCount: analysis.portfolio.chainCount,
        assetCount: analysis.portfolio.assetCount,
        topAssets: analysis.portfolio.topAssets.slice(0, 15).map(a => ({
          symbol: a.symbol,
          balance: a.balance,
          valueUsd: Math.round(a.valueUsd),
          chain: a.chain,
          priceUsd: a.priceUsd,
        })),
        diversification: analysis.portfolio.diversification.map(d => ({
          chain: d.chain,
          percentage: Math.round(d.percentage * 10) / 10,
        })),
        stablecoinPercentage: Math.round(analysis.portfolio.stablecoinPercentage * 10) / 10,
        riskScore: analysis.portfolio.riskScore,
        riskLevel: analysis.portfolio.riskLevel,
      },
      flow: {
        incomingValueUsd: Math.round(analysis.flow.incomingValueUsd),
        outgoingValueUsd: Math.round(analysis.flow.outgoingValueUsd),
        senders: analysis.flow.topSenders.slice(0, 10).map(s => ({
          address: s.address,
          entity: s.entity,
          totalUsd: Math.round(s.totalUsd),
          txCount: s.count,
        })),
        receivers: analysis.flow.topReceivers.slice(0, 10).map(r => ({
          address: r.address,
          entity: r.entity,
          totalUsd: Math.round(r.totalUsd),
          txCount: r.count,
        })),
        riskScore: analysis.flow.riskScore,
        riskLevel: analysis.flow.riskLevel,
        details: analysis.flow.details,
      },
      flags: {
        sanctioned: analysis.sanction.sanctioned,
        flagged: analysis.label.flagged,
        exploitDb: analysis.exploit.flagged,
        label: analysis.label.label,
        sanctionList: analysis.sanction.listName,
      },
      patterns: {
        dominantProfile: analysis.patterns.dominantProfile,
        patterns: analysis.patterns.patterns.map(p => ({
          type: p.type,
          confidence: Math.round(p.confidence * 100),
        })),
        riskScore: analysis.patterns.riskScore,
        riskLevel: analysis.patterns.riskLevel,
        details: analysis.patterns.details,
      },
      summary: analysis.summary,
    };

    const result = typeof lang === 'string' && lang === 'fa' ? translate(base, 'fa') : base;
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
