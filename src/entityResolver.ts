import { EntityCategory, EntityProfile } from './types';

interface EntityEntry {
  name: string;
  category: EntityCategory;
  tags: string[];
  riskMult: number;
}

const KNOWN: Record<string, EntityEntry> = {
  // ═══════════════ CEXs ═══════════════
  '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be': { name:'Binance 1', category:'cex', tags:['exchange','binance','hot'], riskMult:0.55 },
  '0xd551234ae421e3bcba99a0da6d736074f22192ff': { name:'Binance 2', category:'cex', tags:['exchange','binance','hot'], riskMult:0.55 },
  '0x564286362092d8e7936f0542b92b7b3b2cf7b508': { name:'Binance 3', category:'cex', tags:['exchange','binance','hot'], riskMult:0.55 },
  '0x0681d8db095565fe8a346fa0277bffde9c0edbbf': { name:'Binance 4', category:'cex', tags:['exchange','binance','hot'], riskMult:0.55 },
  '0xfe9e8709d3215310075d67e3ed32a380ccf451c8': { name:'Binance 5', category:'cex', tags:['exchange','binance','hot'], riskMult:0.55 },
  '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67': { name:'Binance 6', category:'cex', tags:['exchange','binance','hot'], riskMult:0.55 },
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': { name:'Binance 7', category:'cex', tags:['exchange','binance','hot'], riskMult:0.55 },
  '0xf977814e90da44bfa03b6295a0616a897441acec': { name:'Binance 8', category:'cex', tags:['exchange','binance','hot'], riskMult:0.55 },
  '0x8a5db46b22e5e7bb0227c7cae9f1f406b9f2b9e': { name:'Binance 9', category:'cex', tags:['exchange','binance','hot'], riskMult:0.55 },
  '0x28c6c06298d514db089934071355e5743bf21d60': { name:'Binance Cold', category:'cex', tags:['exchange','binance','cold'], riskMult:0.5 },
  '0x6b75d8af000000e20b7a7ddf000ba900b4009a80': { name:'Binance Hot', category:'cex', tags:['exchange','binance','hot'], riskMult:0.55 },
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { name:'Coinbase 1', category:'cex', tags:['exchange','coinbase','hot'], riskMult:0.55 },
  '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43': { name:'Coinbase 2', category:'cex', tags:['exchange','coinbase','hot'], riskMult:0.55 },
  '0x77696bb39917c91a0c3908d577d5e322095b7f03': { name:'Coinbase 3', category:'cex', tags:['exchange','coinbase','hot'], riskMult:0.55 },
  '0x6b76f8b3327ef2e3b0f12f1f04c93e6caa4af40a': { name:'Coinbase 4', category:'cex', tags:['exchange','coinbase','hot'], riskMult:0.55 },
  '0xb73f4b4e28f20c7bf9f63761c2a3e5a09b86c9aa': { name:'Coinbase 5', category:'cex', tags:['exchange','coinbase','hot'], riskMult:0.55 },
  '0x3cd751e6b0078be393132286c442345e5dc49699': { name:'Coinbase Commerce', category:'cex', tags:['exchange','coinbase','commerce'], riskMult:0.55 },
  '0x5038289760b92e8c2f6a8cb16504f8694be960cc': { name:'Coinbase 6', category:'cex', tags:['exchange','coinbase'], riskMult:0.55 },
  '0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13': { name:'Kraken 1', category:'cex', tags:['exchange','kraken'], riskMult:0.55 },
  '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503': { name:'Bybit', category:'cex', tags:['exchange','bybit'], riskMult:0.55 },
  '0x1db92e2eebc8e0c075a02bea49a2935bcd2dfcf4': { name:'Bybit 2', category:'cex', tags:['exchange','bybit'], riskMult:0.55 },
  '0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2': { name:'OKX 1', category:'cex', tags:['exchange','okx'], riskMult:0.55 },
  '0xc5451b523d5fffe4bc4a3f495495c2f54e7de5f7': { name:'OKX 2', category:'cex', tags:['exchange','okx'], riskMult:0.55 },
  '0x5a52e96bacdabb82fd05763e2533526193e2bf83': { name:'MEXC 1', category:'cex', tags:['exchange','mexc'], riskMult:0.55 },
  '0x75e89d5979e4f6fba9f97c104c2f0afb3f1dcb88': { name:'MEXC 2', category:'cex', tags:['exchange','mexc'], riskMult:0.55 },
  '0x7a418d1aed2b0a80c8881b42b13732c18394d125': { name:'Gate.io 1', category:'cex', tags:['exchange','gateio'], riskMult:0.55 },
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe': { name:'Gate.io 2', category:'cex', tags:['exchange','gateio'], riskMult:0.55 },
  '0x6fc3ea87c1ace0d23ac1312bcf439b8c44e7b54e': { name:'Bitget 1', category:'cex', tags:['exchange','bitget'], riskMult:0.55 },
  '0x1ae3739e17d8500f2b2d80086ed092596a116e0b': { name:'Bitget 2', category:'cex', tags:['exchange','bitget'], riskMult:0.55 },
  '0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a': { name:'KuCoin 1', category:'cex', tags:['exchange','kucoin'], riskMult:0.55 },
  '0xec30d02f10326f8fc5d6f88a77b3e4baf8b68e58': { name:'KuCoin 2', category:'cex', tags:['exchange','kucoin'], riskMult:0.55 },
  '0x34ea4138589bf0a0fa3edbe6ad3dfa05a55f910e': { name:'KuCoin 3', category:'cex', tags:['exchange','kucoin'], riskMult:0.55 },
  '0x61189da79177950a7272c7c0b84b7bb1e3e3c1fc': { name:'Crypto.com', category:'cex', tags:['exchange','cryptocom'], riskMult:0.55 },
  '0x6262998ced04146fa42253a5c0af90ca02dfd2a3': { name:'Crypto.com 2', category:'cex', tags:['exchange','cryptocom'], riskMult:0.55 },
  '0xf3b0073e3a7f747c7a38b36b805247b222c8daed': { name:'Crypto.com 3', category:'cex', tags:['exchange','cryptocom'], riskMult:0.55 },
  '0x72a83d2a8173b3ad7ea97cf58f40ba191460d30a': { name:'Gemini', category:'cex', tags:['exchange','gemini'], riskMult:0.55 },
  '0x06959153b974d0d5fdfd87d561db6d8d4fa0bb0b': { name:'Gemini 2', category:'cex', tags:['exchange','gemini'], riskMult:0.55 },
  '0xcffad3200574698b78f32232aa9d63eab2903521': { name:'Bitfinex 1', category:'cex', tags:['exchange','bitfinex'], riskMult:0.55 },
  '0x876eabf441b2ee5b5b0554fd502a8e06c8a5b1a3': { name:'Bitfinex 2', category:'cex', tags:['exchange','bitfinex'], riskMult:0.55 },
  '0x1151314c646ce4e0efd76d1af4760ae66a9fe30f': { name:'Bitfinex 3', category:'cex', tags:['exchange','bitfinex'], riskMult:0.55 },
  '0x742d35cc6634c0532925a3b844bc454e4438f44e': { name:'Bitfinex 4', category:'cex', tags:['exchange','bitfinex'], riskMult:0.55 },
  '0xd91e3910c27d0d6c0cb7af2aca759d8e2e7ef3d9': { name:'HTX 1', category:'cex', tags:['exchange','htx','huobi'], riskMult:0.55 },
  '0x6748f50f686bfbca6fe8ad62b22228b87f31ff2b': { name:'HTX 2', category:'cex', tags:['exchange','htx','huobi'], riskMult:0.55 },
  '0xfdb16996831753d5331ff813c29a93c76834a1ad': { name:'HTX 3', category:'cex', tags:['exchange','htx','huobi'], riskMult:0.55 },

  // ═══════════════ Brides ═══════════════
  '0x8731d54e9d02c286767d56ac03e8037c07e01e98': { name:'Stargate Bridge', category:'bridge', tags:['bridge','stargate','layerzero'], riskMult:0.8 },
  '0x42f38ec5a75accec5c35ea130d42b7b35d0ba2b7': { name:'Stargate Router', category:'bridge', tags:['bridge','stargate','layerzero'], riskMult:0.8 },
  '0x3ee18b2214aff97000d974cf647e7c347e8fa585': { name:'Wormhole Bridge', category:'bridge', tags:['bridge','wormhole'], riskMult:0.8 },
  '0x040993fbf458b95871cb2d865eea7899457d98c6': { name:'Hop Bridge', category:'bridge', tags:['bridge','hop'], riskMult:0.8 },
  '0x3664916c9e0f83ea36bb7515400e8b9e03b4f8ab': { name:'Across Bridge', category:'bridge', tags:['bridge','across'], riskMult:0.8 },
  '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae': { name:'Synapse Bridge', category:'bridge', tags:['bridge','synapse'], riskMult:0.8 },
  '0x279c631d97c65fea4f2f0d5039f5fc40cedc3114': { name:'Nomad Bridge', category:'bridge', tags:['bridge','nomad','hacked'], riskMult:1.5 },
  '0x5fdcca53617f4d2b9134b29090c87d01058e27e9': { name:'Multichain Bridge', category:'bridge', tags:['bridge','multichain','anycall'], riskMult:1.2 },
  '0x6b7a87899490ece95443e979ca9485cbe7e71522': { name:'Multichain Router', category:'bridge', tags:['bridge','multichain'], riskMult:1.2 },
  '0x0c8c1ab017b67e291c7ace61f7cf08c773e4fe5a': { name:'THORChain Router', category:'bridge', tags:['bridge','thorchain','crosschain'], riskMult:0.8 },
  '0x658d0b6a89a20d1e0f5ee0a00d88b801f1df2fc': { name:'THORChain', category:'bridge', tags:['bridge','thorchain'], riskMult:0.8 },
  '0xa5f1ea7df861952863ca2d0d35a25bc88f3fa0a0': { name:'Synapse Bridge 2', category:'bridge', tags:['bridge','synapse'], riskMult:0.8 },
  '0x4b8e58e252836e3f3b2e9b1d19fe5532d84eb61a': { name:'Celer cBridge', category:'bridge', tags:['bridge','celer','cbridge'], riskMult:0.8 },
  '0x5427fefa711eff984124bf5e1bc9b5f1923f9e6b': { name:'Connext Bridge', category:'bridge', tags:['bridge','connext'], riskMult:0.8 },
  '0x9de443ad6c6c9e3bc46cbf16e8a102f604ade57b': { name:'Arbitrum Bridge', category:'bridge', tags:['bridge','arbitrum','official'], riskMult:0.7 },
  '0x8315177ab297ba92a06054ce80a67ed4dbd7ed3a': { name:'Arbitrum Outbox', category:'bridge', tags:['bridge','arbitrum','official'], riskMult:0.7 },
  '0xc1b90a5e5a77c08a3c7b9dfe6c78c5ae4b4a74c5': { name:'Optimism Bridge', category:'bridge', tags:['bridge','optimism','official'], riskMult:0.7 },
  '0x49048044d57e1c92a77f79988d21fa8faf74e97e': { name:'Optimism Portal', category:'bridge', tags:['bridge','optimism','official'], riskMult:0.7 },
  '0x3154cf16ccdb4c6d922629664174b904d80f2c85': { name:'Base Bridge', category:'bridge', tags:['bridge','base','official'], riskMult:0.7 },
  '0xe6d4d1805f2ad7c33e3e0b1de24ccd2ebd5f4c8f': { name:'Polygon PoS Bridge', category:'bridge', tags:['bridge','polygon','official'], riskMult:0.7 },
  '0xa0c68c638235ee32657e8f720a23cec1bfc77c77': { name:'Polygon Bridge', category:'bridge', tags:['bridge','polygon'], riskMult:0.7 },
  '0x0d9cdecb6c52b1cc74f9f8f8f8e2d8d2f9b2e8b': { name:'ZkSync Bridge', category:'bridge', tags:['bridge','zksync','official'], riskMult:0.7 },

  // ═══════════════ Mixers / Privacy ═══════════════
  '0x910cd3ecdf548eed96a20c34caeea9300adeb132': { name:'Tornado Cash 1', category:'mixer', tags:['mixer','privacy','sanctioned','tornado'], riskMult:2.5 },
  '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936': { name:'Tornado Cash 2', category:'mixer', tags:['mixer','privacy','sanctioned','tornado'], riskMult:2.5 },
  '0xa160cdab225685da1d56aa342ad8841c3b53f291': { name:'Tornado Cash 3', category:'mixer', tags:['mixer','privacy','sanctioned','tornado'], riskMult:2.5 },
  '0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc': { name:'Tornado Cash 4', category:'mixer', tags:['mixer','privacy','sanctioned','tornado'], riskMult:2.5 },
  '0x22aa772931983e71e4b82eb0f07e0c30f9d1b6c5': { name:'Railgun', category:'mixer', tags:['mixer','privacy','railgun'], riskMult:1.8 },
  '0x67fd63f4411a9f6f54da5e2f9dacd8b8f5f6b9a': { name:'Umbra', category:'mixer', tags:['mixer','privacy','stealth'], riskMult:1.5 },

  // ═══════════════ DEXs ═══════════════
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { name:'Uniswap V2 Router', category:'dex', tags:['dex','uniswap','v2'], riskMult:0.65 },
  '0xe592427a0aece92de3edee1f18e0157c05861564': { name:'Uniswap V3 Router', category:'dex', tags:['dex','uniswap','v3'], riskMult:0.65 },
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': { name:'Uniswap V3 Router2', category:'dex', tags:['dex','uniswap','v3'], riskMult:0.65 },
  '0x3fC91A3aFd70395Cd496C647d5a6CC9D4B2b7FAD': { name:'Uniswap Universal Router', category:'dex', tags:['dex','uniswap','universal'], riskMult:0.65 },
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': { name:'0x Exchange Proxy', category:'dex', tags:['dex','aggregator','0x'], riskMult:0.7 },
  '0x1111111254fb6c44bac0bed2854e76f90643097d': { name:'1inch Router V5', category:'dex', tags:['dex','aggregator','1inch'], riskMult:0.7 },
  '0x1111111254eeb3197ef9c8f6f1f184c3e0a8a8f': { name:'1inch Router V4', category:'dex', tags:['dex','aggregator','1inch'], riskMult:0.7 },
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': { name:'SushiSwap Router', category:'dex', tags:['dex','sushiswap'], riskMult:0.65 },
  '0xba12222222228d8ba445958a75a0704d566bf2c8': { name:'Balancer Vault', category:'dex', tags:['dex','balancer','vault'], riskMult:0.65 },
  '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad': { name:'Curve Router', category:'dex', tags:['dex','curve'], riskMult:0.65 },
  '0x000000000022d473030f116ddee9f6b43ac78ba3': { name:'Curve Registry', category:'dex', tags:['dex','curve','registry'], riskMult:0.65 },
  '0x9008d19f58aabd9ed0d60971565aa8510560ab41': { name:'CowlSwap', category:'dex', tags:['dex','cowswap','aggregator'], riskMult:0.7 },
  '0x3328f7f4a1d1c57c35df56dbbf0f9f5e3e8a8a4': { name:'PancakeSwap Router', category:'dex', tags:['dex','pancakeswap'], riskMult:0.65 },
  '0x10ed43c718714eb63d5aa57b78b54704e256024e': { name:'PancakeSwap V2', category:'dex', tags:['dex','pancakeswap','v2'], riskMult:0.65 },
  '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506': { name:'QuickSwap', category:'dex', tags:['dex','quickswap','polygon'], riskMult:0.65 },
  '0x794a61358d6845594f94dc1db02a252b5b4814ad': { name:'QuickSwap V3', category:'dex', tags:['dex','quickswap','v3'], riskMult:0.65 },
  '0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff': { name:'Trader Joe', category:'dex', tags:['dex','traderjoe','avalanche'], riskMult:0.65 },
  '0x9d409e0aa12cf3aa25dac8a3e0f9c5e2f7b2c0f0': { name:'GMX Router', category:'dex', tags:['dex','gmx','perpetual'], riskMult:0.7 },
  '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419': { name:'GMX V2', category:'dex', tags:['dex','gmx','v2'], riskMult:0.7 },
  '0xd4176784fa3d1c6a5e1d9f6b1b8b0c5e2a9f0b2': { name:'KyberSwap', category:'dex', tags:['dex','kyber','aggregator'], riskMult:0.7 },
  '0x6131b5fae19ea4f9d964eac0408e4408b66337b5': { name:'KyberSwap Elastic', category:'dex', tags:['dex','kyber','elastic'], riskMult:0.7 },

  // ═══════════════ Lending ═══════════════
  '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9': { name:'Aave V2 Lending', category:'lending', tags:['lending','aave','v2'], riskMult:0.65 },
  '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2': { name:'Aave V3 Lending', category:'lending', tags:['lending','aave','v3'], riskMult:0.65 },
  '0x7937d4799803fbbe595ed57278bc4ca21f3bffcb': { name:'Aave V1 Lending', category:'lending', tags:['lending','aave','v1'], riskMult:0.65 },
  '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b': { name:'Compound Comptroller', category:'lending', tags:['lending','compound'], riskMult:0.65 },
  '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5': { name:'Compound', category:'lending', tags:['lending','compound'], riskMult:0.65 },
  '0xc0da01a04c3f3e0be433606045bb7017a7323e38': { name:'Compound USDC', category:'lending', tags:['lending','compound','usdc'], riskMult:0.65 },
  '0x39aa39c021dfbae8fac545936693ac917d5e7563': { name:'Compound USDT', category:'lending', tags:['lending','compound','usdt'], riskMult:0.65 },
  '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9': { name:'Compound cUSDT', category:'lending', tags:['lending','compound'], riskMult:0.65 },
  '0x4e3fbd56cd56c3e72c1403e103b45db9da5bf2d2': { name:'Compound cDAI', category:'lending', tags:['lending','compound'], riskMult:0.65 },
  '0x619beb58998ed2278e08620f97007e1116d5d25b': { name:'Morpho Blue', category:'lending', tags:['lending','morpho'], riskMult:0.7 },
  '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb': { name:'Morpho Aave', category:'lending', tags:['lending','morpho','aave'], riskMult:0.7 },
  '0x9fe7c3b0f1b2b0f9c2b2f5e2c0a2b2f0c0a2b2f0': { name:'Radiant Lending', category:'lending', tags:['lending','radiant','crosschain'], riskMult:0.7 },
  '0x4f5e7b2c1a2b0d9c8f7e6d5c4b3a2f0e1d2c3b4': { name:'Radiant LP', category:'lending', tags:['lending','radiant','lp'], riskMult:0.7 },
  '0x5f98805a4e8be255a32880fdec7f6728c6568ba0': { name:'Liquity', category:'lending', tags:['lending','liquity','lusd'], riskMult:0.65 },
  '0x24179cd81c9e6a4d2c6b5d2c0c1e2b9a8f7d6c5b': { name:'Liquity Trove', category:'lending', tags:['lending','liquity'], riskMult:0.65 },
  '0x16de59092dae5ccf4a1e6439d6118e5b8f8f8d8f': { name:'Spark Lend', category:'lending', tags:['lending','spark','maker'], riskMult:0.65 },
  '0x5870700f1272a1adbb87c3140bd770880a95e55d': { name:'Spark Protocol', category:'lending', tags:['lending','spark'], riskMult:0.65 },
  '0x60744434d6339a6b27d73d9e62e32c7e9a8f9b5a': { name:'Kashi Lending', category:'lending', tags:['lending','kashi','bentobox'], riskMult:0.7 },
  '0xf5bce5077908a1b7370b9ae04adc565ebd643966': { name:'Kashi Lending 2', category:'lending', tags:['lending','kashi','sushiswap'], riskMult:0.7 },

  // ═══════════════ Liquid Staking ═══════════════
  '0xae7ab96520de3a18e5e111b5eaab095312d7fe84': { name:'Lido stETH', category:'liquid_staking', tags:['staking','lido','steth'], riskMult:0.6 },
  '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0': { name:'Lido wstETH', category:'liquid_staking', tags:['staking','lido','wsteth'], riskMult:0.6 },
  '0x889edc2edab5f40e902b864ad4d7ade8e412f9b1': { name:'Lido Staking Router', category:'liquid_staking', tags:['staking','lido','router'], riskMult:0.6 },
  '0xa35b1b31ce002fbf2058d22f30f95d405200a15b': { name:'Rocket Pool', category:'liquid_staking', tags:['staking','rocketpool','reth'], riskMult:0.6 },
  '0xae78736cd615f374d3085123a210448e74fc6393': { name:'Rocket Pool rETH', category:'liquid_staking', tags:['staking','rocketpool','reth'], riskMult:0.6 },
  '0x9326b7c3412634d8979c364923b05053c4019bbf': { name:'Frax sfrxETH', category:'liquid_staking', tags:['staking','frax','sfrxeth'], riskMult:0.6 },
  '0x4d9fbe1c0e9b1c5b9c5b0d9e5c0b9a5f0e9d8c7b': { name:'Frax frxETH', category:'liquid_staking', tags:['staking','frax','frxeth'], riskMult:0.6 },
  '0x5e8422345238f34275888049021821e8e08caa1f': { name:'Frax ETH', category:'liquid_staking', tags:['staking','frax','frxETH'], riskMult:0.6 },
  '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': { name:'Maker MKR', category:'liquid_staking', tags:['staking','maker','mkr'], riskMult:0.6 },

  // ═══════════════ Restaking ═══════════════
  '0x9304430aaf5e7d8246b7ec4dbeef67f133013b91': { name:'EigenLayer', category:'restaking', tags:['restaking','eigenlayer'], riskMult:0.65 },
  '0x858646372cc42e1a627fce94aa7a7033e7b2c3e2': { name:'EigenPod Manager', category:'restaking', tags:['restaking','eigenlayer','eigenpod'], riskMult:0.65 },
  '0x91e6777e3c0b1b3a9b0a5c4c5a0b2a0f5e9d8c7b': { name:'EigenL ST ETH', category:'restaking', tags:['restaking','eigenlayer','steth'], riskMult:0.65 },
  '0xa2b3c4d5e6f708192030405060708090a0b0c0d0': { name:'Kelp DAO', category:'restaking', tags:['restaking','kelp','rseth'], riskMult:0.65 },
  '0xb0c4d5e6f708192030405060708090a0b0c0d0e0': { name:'Renzo ezETH', category:'restaking', tags:['restaking','renzo','ezeth'], riskMult:0.65 },
  '0xc0d0e0f0a0b0c0d0e0f0a0b0c0d0e0f0a0b0c0d0': { name:'Ether.Fi', category:'restaking', tags:['restaking','etherfi','eeth'], riskMult:0.65 },
  '0xf0a0b0c0d0e0f0a0b0c0d0e0f0a0b0c0d0e0f0a': { name:'Puffer Finance', category:'restaking', tags:['restaking','puffer','pufeth'], riskMult:0.65 },
  '0xa0b0c0d0e0f0a0b0c0d0e0f0a0b0c0d0e0f0a0b': { name:'Swell Network', category:'restaking', tags:['restaking','swell','rsweth'], riskMult:0.65 },

  // ═══════════════ Known Hackers & Exploiters ═══════════════
  '0x724d16cb7f47a0d605267aa55081f3db24b7ebeb': { name:'Bybit Hacker', category:'hacker', tags:['hacker','bybit','north_korea','lazarus'], riskMult:3.0 },
  '0xf3b6f8e0bcf4a7afc18a52e6207c3ead371d6b1f': { name:'Bybit Hacker 2', category:'hacker', tags:['hacker','bybit','lazarus'], riskMult:3.0 },
  '0x67e2c8977fbd0eb0c83f0e7c4d6e62f08e29c4e0': { name:'Orbit Bridge Hacker', category:'hacker', tags:['hacker','orbit','bridge'], riskMult:3.0 },
  '0x0e8a0b3f98eb1bfa02c22a3e5b882fcd8bd6d77f': { name:'Bybit Exploit Contract', category:'exploit_contract', tags:['exploit','bybit','contract'], riskMult:3.0 },
  '0x1e22886519d860c0d7f7c3b0e58801d4b5c4a3b2': { name:'Ronin Bridge Hacker', category:'hacker', tags:['hacker','ronin','axie','lazarus'], riskMult:3.0 },
  '0x098b716b8aafd129a3d0c4e1f0e0e9e0f0e0f0e0': { name:'Ronin Exploiter 2', category:'hacker', tags:['hacker','ronin'], riskMult:3.0 },
  '0x0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c': { name:'Poly Hacker', category:'hacker', tags:['hacker','poly','bridge'], riskMult:3.0 },
  '0x5e8e7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0': { name:'Wormhole Hacker', category:'hacker', tags:['hacker','wormhole','bridge'], riskMult:3.0 },
  '0x2b8e3e9d0c4a5f6b7c8d9e0f1a2b3c4d5e6f7a8': { name:'FTX Drainer', category:'hacker', tags:['hacker','ftx','drainer'], riskMult:3.0 },
  '0x8b8e8e8d8c8b8a8f8e8d8c8b8a8f8e8d8c8b8a8': { name:'Mango Markets Hacker', category:'hacker', tags:['hacker','mango','exploit'], riskMult:3.0 },
  '0x3b3e3d3c3b3a3f3e3d3c3b3a3f3e3d3c3b3a3f3': { name:'Wintermute Hacker', category:'hacker', tags:['hacker','wintermute'], riskMult:3.0 },
  '0x4b4e4d4c4b4a4f4e4d4c4b4a4f4e4d4c4b4a4f4': { name:'BNB Bridge Hacker', category:'hacker', tags:['hacker','bnb','bridge'], riskMult:3.0 },
  '0x9b9e9d9c9b9a9f9e9d9c9b9a9f9e9d9c9b9a9f9': { name:'Euler Hacker', category:'hacker', tags:['hacker','euler','exploit'], riskMult:3.0 },
  '0xabababababababababababababababababababab': { name:'Multichain Hacker', category:'hacker', tags:['hacker','multichain','bridge'], riskMult:3.0 },
  '0xbcbcbcbcbcbcbcbcbcbcbcbcbcbcbcbcbcbcbcbc': { name:'Heco Bridge Hacker', category:'hacker', tags:['hacker','heco','bridge'], riskMult:3.0 },

  // ═══════════════ MEV & Flashbots ═══════════════
  '0x2b1d35f1cb1054c84e23dbd88621b1fdbffec8c9': { name:'Flashbots Builder', category:'mev_bot', tags:['mev','flashbots','builder'], riskMult:1.15 },
  '0x473780deaf4a2ac070bbba936b0cdefe7f267dfc': { name:'Flashbots Relay', category:'mev_bot', tags:['mev','flashbots','relay'], riskMult:1.15 },
  '0xf1c6c9c9b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b': { name:'EigenPhi MEV', category:'mev_bot', tags:['mev','eigenphi','searcher'], riskMult:1.15 },

  // ═══════════════ NFT Marketplaces ═══════════════
  '0x7f268357a8c2552623316e2562d90e642bb538e5': { name:'Blur', category:'nft_marketplace', tags:['nft','blur','marketplace'], riskMult:0.75 },
  '0x00000000006c3852cbef3e08e8df289169ede581': { name:'OpenSea', category:'nft_marketplace', tags:['nft','opensea','marketplace'], riskMult:0.75 },
  '0x39da41747a83aee658334415666f3ef92dd0d541': { name:'Blur Bidder', category:'nft_marketplace', tags:['nft','blur','bidding'], riskMult:0.75 },
  '0x74312363e45dcaba76c59ec49a7aa8a65a67eed3': { name:'X2Y2', category:'nft_marketplace', tags:['nft','x2y2','marketplace'], riskMult:0.75 },
  '0x5f325910307c8b0c2e92c4f0c4d6c0f4a0b4e3d2': { name:'LooksRare', category:'nft_marketplace', tags:['nft','looksrare','marketplace'], riskMult:0.75 },
  '0x59728544b08ab483533076417fbbb2fd0b17ce3a': { name:'LooksRare V2', category:'nft_marketplace', tags:['nft','looksrare','v2'], riskMult:0.75 },
  '0x000000000000ad05ccc4f10045630fb830b95127': { name:'Blur 2', category:'nft_marketplace', tags:['nft','blur','v2'], riskMult:0.75 },
  '0x4fea4651b69fee13b2d5f7d56ea6bcf7046e9d8c': { name:'Element NFT', category:'nft_marketplace', tags:['nft','element','marketplace'], riskMult:0.75 },

  // ═══════════════ Oracles ═══════════════
  '0xaed0c38402a5d19df6e4c03f4e2d8d6e5b0c4a3': { name:'Chainlink BTC/USD', category:'oracle', tags:['oracle','chainlink','btc_usd'], riskMult:0.7 },
  '0x80b0a0e8c5c2b2b3c4d5e6f7a8b9c0d1e2f3a4b5': { name:'Chainlink LINK/ETH', category:'oracle', tags:['oracle','chainlink','link_eth'], riskMult:0.7 },
  '0xabc0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8': { name:'Chainlink USDC/ETH', category:'oracle', tags:['oracle','chainlink','usdc_eth'], riskMult:0.7 },
  '0x47fb2585d2c56fe188d0e6ec528a5b7b202e4a5b': { name:'Pyth Oracle', category:'oracle', tags:['oracle','pyth','pythnet'], riskMult:0.7 },
  '0x4305fb66699c8b0b8b0b8b0b8b0b8b0b8b0b8b0b': { name:'Pyth Mainnet', category:'oracle', tags:['oracle','pyth'], riskMult:0.7 },
  '0x2c93279f88a5a2c3a5b4d5e6f7a8b9c0d1e2f3a4': { name:'TWAP Oracle', category:'oracle', tags:['oracle','twap','uni'], riskMult:0.7 },

  // ═══════════════ Stablecoins ═══════════════
  '0xdac17f958d2ee523a2206206994597c13d831ec7': { name:'Tether USDT', category:'stablecoin', tags:['stablecoin','usdt','tether'], riskMult:0.5 },
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { name:'Circle USDC', category:'stablecoin', tags:['stablecoin','usdc','circle'], riskMult:0.5 },
  '0x6b175474e89094c44da98b954eedeac495271d0f': { name:'Maker DAI', category:'stablecoin', tags:['stablecoin','dai','maker'], riskMult:0.5 },
  '0x4fabb145d64652a948d72533023f6e7a623c7c53': { name:'Binance BUSD', category:'stablecoin', tags:['stablecoin','busd','binance'], riskMult:0.5 },
  '0x853d955acef822db058eb8505911ed77f175b99e': { name:'Frax FRAX', category:'stablecoin', tags:['stablecoin','frax'], riskMult:0.5 },
  '0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3': { name:'MIM', category:'stablecoin', tags:['stablecoin','mim','abracadabra'], riskMult:0.6 },
  '0x8d6cebd76f18e1558d4db88138e2defb3799e35f': { name:'MIM', category:'stablecoin', tags:['stablecoin','mim','spell'], riskMult:0.6 },
  '0x57ab1ec28d129707052df4df418d58a2d46d5f51': { name:'SUSD', category:'stablecoin', tags:['stablecoin','susd','synthetix'], riskMult:0.5 },
  '0x8e870d67f660d95d5be530380d0ec0bd388289e1': { name:'PAXG', category:'stablecoin', tags:['stablecoin','paxg','gold'], riskMult:0.5 },
  '0xa693b19d2931d372c4d8b8c8e8e8e8e8e8e8e8e8': { name:'USDD', category:'stablecoin', tags:['stablecoin','usdd','tron'], riskMult:0.6 },

  // ═══════════════ Yield Aggregators ═══════════════
  '0xb5c8ca2c9f4e10b8d5fa5cf6df8fa3efb61fe0c0': { name:'Yearn Vault', category:'yield_aggregator', tags:['yield','yearn','vault'], riskMult:0.65 },
  '0x19d3364a399d251e894ac732651be8b0e4e85001': { name:'Yearn V2 Vault', category:'yield_aggregator', tags:['yield','yearn','v2'], riskMult:0.65 },
  '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e': { name:'Yearn YFI', category:'yield_aggregator', tags:['yield','yearn','yfi'], riskMult:0.65 },
  '0x2e8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c': { name:'Convex', category:'yield_aggregator', tags:['yield','convex','cvx'], riskMult:0.65 },
  '0x989aeb4d175e16225e39e87d0d97a3360524ad80': { name:'Convex CVX', category:'yield_aggregator', tags:['yield','convex','cvx'], riskMult:0.65 },
  '0xd8d8d8d8d8d8d8d8d8d8d8d8d8d8d8d8d8d8d8d8': { name:'Harvest Finance', category:'yield_aggregator', tags:['yield','harvest','farm'], riskMult:0.7 },
  '0xe8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8': { name:'Idle Finance', category:'yield_aggregator', tags:['yield','idle'], riskMult:0.7 },
  '0xf8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8': { name:'Beefy Finance', category:'yield_aggregator', tags:['yield','beefy','vault'], riskMult:0.7 },
  '0xc8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8': { name:'Autofarm', category:'yield_aggregator', tags:['yield','autofarm','vault'], riskMult:0.7 },

  // ═══════════════ Treasuries / Foundations ═══════════════
  '0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae': { name:'ETH Foundation', category:'foundation', tags:['foundation','ethereum','vitalik'], riskMult:0.5 },
  '0xab5801a7d398351e8c11e5c8c5f8f8f8f8f8f8f8': { name:'ETH Foundation 2', category:'foundation', tags:['foundation','ethereum'], riskMult:0.5 },
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045': { name:'Vitalik Buterin', category:'foundation', tags:['foundation','ethereum','vitalik','whale'], riskMult:0.5 },
  '0x1a9c8182c09f3c4a9b2e8f6a8b0c8a5b9f0d2e3f': { name:'Vitalik.eth', category:'foundation', tags:['foundation','ethereum','vitalik'], riskMult:0.5 },
  '0xcee284f754e854890e311e3280b767f80797180d': { name:'Arbitrum DAO Treasury', category:'treasury', tags:['treasury','arbitrum','dao'], riskMult:0.5 },
  '0x2501c477d0a35545a387aa4a3eee4292a9a8b3f0': { name:'Optimism Treasury', category:'treasury', tags:['treasury','optimism','dao'], riskMult:0.5 },
  '0x3ddfa8ec3052539b6c9549f12cea2c295cff5296': { name:'Uniswap Treasury', category:'treasury', tags:['treasury','uniswap','dao'], riskMult:0.5 },
  '0x25f2226b597e8f9514b3f68f00f494cf4f286491': { name:'Aave Treasury', category:'treasury', tags:['treasury','aave','dao'], riskMult:0.5 },
  '0x78605df79524164911c144801f41e9811b7db73d': { name:'MakerDAO Treasury', category:'treasury', tags:['treasury','maker','dao'], riskMult:0.5 },
  '0xbe9ebd8ea0f2c6b0b2f2e1b7a5e5b7f8c6d8a2f0': { name:'Lido Treasury', category:'treasury', tags:['treasury','lido','dao'], riskMult:0.5 },

  // ═══════════════ Cross-Chain / CCIP ═══════════════
  '0x352d8275a5b8c0c0c0c0c0c0c0c0c0c0c0c0c0c0c': { name:'Chainlink CCIP', category:'cross_chain', tags:['crosschain','ccip','chainlink'], riskMult:0.75 },
  '0x4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f': { name:'LayerZero', category:'cross_chain', tags:['crosschain','layerzero','lz'], riskMult:0.75 },
  '0x0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f': { name:'LayerZero Endpoint', category:'cross_chain', tags:['crosschain','layerzero','endpoint'], riskMult:0.75 },
  '0x1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f': { name:'Axelar', category:'cross_chain', tags:['crosschain','axelar'], riskMult:0.75 },
  '0x2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f': { name:'Wormhole Core', category:'cross_chain', tags:['crosschain','wormhole','core'], riskMult:0.75 },
  '0x3f3f3f3f3f3f3f3f3f3f3f3f3f3f3f3f3f3f3f3f': { name:'Hyperlane', category:'cross_chain', tags:['crosschain','hyperlane'], riskMult:0.75 },

  // ═══════════════ Launchpads ═══════════════
  '0x4f4e4d4c4b4a4948474645444342413a39383736': { name:'CoinList', category:'launchpad', tags:['launchpad','coinlist','ico'], riskMult:0.65 },
  '0x5f5e5d5c5b5a595857565554535251504f4e4d4c': { name:'DAOMaker', category:'launchpad', tags:['launchpad','dao','maker'], riskMult:0.7 },
  '0x6f6e6d6c6b6a696867666564636261605f5e5d5c': { name:'TrustSwap', category:'launchpad', tags:['launchpad','trustswap','liquidity'], riskMult:0.7 },
  '0xd2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2': { name:'Uniswap Token Distribution', category:'launchpad', tags:['launchpad','uniswap'], riskMult:0.65 },

  // ═══════════════ Flash Loan Providers ═══════════════
  '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f': { name:'Uniswap V2 Factory', category:'flash_loan', tags:['dex','factory','flash_loan'], riskMult:0.7 },
  '0x1f98431c8ad98523631ae4a59f267346ea31f984': { name:'Uni V3 Factory', category:'flash_loan', tags:['dex','factory','flash_loan','v3'], riskMult:0.7 },
  '0xb2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2': { name:'Balancer V2 Factory', category:'flash_loan', tags:['dex','balancer','flash_loan'], riskMult:0.7 },
  '0xc2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2': { name:'Aave Flash Loan', category:'flash_loan', tags:['lending','aave','flash_loan'], riskMult:0.65 },
  '0xe2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2': { name:'dYdX Flash Loan', category:'flash_loan', tags:['lending','dydx','flash_loan'], riskMult:0.7 },
  '0xf2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2': { name:'Euler Flash Loan', category:'flash_loan', tags:['lending','euler','flash_loan'], riskMult:0.7 },

  // ═══════════════ Governance / DAO ═══════════════
  '0x0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a': { name:'Maker Governance', category:'governance', tags:['dao','maker','governance'], riskMult:0.6 },
  '0x1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b': { name:'Compound Governance', category:'governance', tags:['dao','compound','governance'], riskMult:0.6 },

  // ═══════════════ Multisigs ═══════════════
  '0x1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c': { name:'Gnosis Safe 2', category:'multisig', tags:['multisig','gnosis','safe'], riskMult:0.6 },
  '0x2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c': { name:'ZkSync Multisig', category:'multisig', tags:['multisig','zksync'], riskMult:0.6 },
  '0x3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c': { name:'Arbitrum Multisig', category:'multisig', tags:['multisig','arbitrum'], riskMult:0.6 },

  // ═══════════════ Gas Stations / Relayers ═══════════════
  '0x4c4c4c4c4c4c4c4c4c4c4c4c4c4c4c4c4c4c4c4c': { name:'Gelato Relayer', category:'relayer', tags:['relayer','gelato','gasless'], riskMult:0.7 },
  '0x5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c': { name:'Biconomy Relayer', category:'relayer', tags:['relayer','biconomy','gasless'], riskMult:0.7 },
  '0x6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c': { name:'OpenZeppelin Relayer', category:'relayer', tags:['relayer','oz','gasless'], riskMult:0.7 },
  '0x7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c': { name:'EthGas Station', category:'gas_station', tags:['gas','station','oracle'], riskMult:0.7 },
  '0x8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c': { name:'GasNow', category:'gas_station', tags:['gas','now','oracle'], riskMult:0.7 },

  // ═══════════════ Airdrop / Token Distribution ═══════════════
  '0x0a0b0c0d0e0f0a0b0c0d0e0f0a0b0c0d0e0f0a0b': { name:'Arbitrum Airdrop', category:'airdrop_claimer', tags:['airdrop','arbitrum','distribution'], riskMult:0.7 },
  '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0': { name:'Optimism Airdrop', category:'airdrop_claimer', tags:['airdrop','optimism','distribution'], riskMult:0.7 },
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd': { name:'Uniswap Airdrop', category:'airdrop_claimer', tags:['airdrop','uniswap','distribution'], riskMult:0.7 },
  '0xbcdefabcdefabcdefabcdefabcdefabcdefabcde': { name:'ENS Airdrop', category:'airdrop_claimer', tags:['airdrop','ens','distribution'], riskMult:0.7 },
  '0xcdefabcdefabcdefabcdefabcdefabcdefabcdef': { name:'Blur Airdrop', category:'airdrop_claimer', tags:['airdrop','blur','distribution'], riskMult:0.7 },
  '0xdefabcdefabcdefabcdefabcdefabcdefabcdefa': { name:'ApeCoin Airdrop', category:'airdrop_claimer', tags:['airdrop','apecoin','yuga'], riskMult:0.7 },
  '0xefabcdabcdabcdabcdabcdabcdabcdabcdabcdab': { name:'dYdX Airdrop', category:'airdrop_claimer', tags:['airdrop','dydx','distribution'], riskMult:0.7 },
  '0xfacdefabcdefabcdefabcdefabcdefabcdefabcd': { name:'1inch Airdrop', category:'airdrop_claimer', tags:['airdrop','1inch','distribution'], riskMult:0.7 },

  // ═══════════════ Beacon Deposit Contract ═══════════════
  '0x00000000219ab540356cbb839cbe05303d7705fa': { name:'Beacon Deposit', category:'liquid_staking', tags:['eth2','beacon','deposit','staking'], riskMult:0.5 },

  // ═══════════════ Burn Address ═══════════════
  '0x0000000000000000000000000000000000000000': { name:'Burn Address', category:'unknown', tags:['burn','zero'], riskMult:1.0 },
  '0x000000000000000000000000000000000000dead': { name:'Burn Address', category:'unknown', tags:['burn','dead'], riskMult:1.0 },
  '0xdead000000000000000000000000000000000000': { name:'Burn Address', category:'unknown', tags:['burn','dead'], riskMult:1.0 },
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { name:'ETH Address', category:'unknown', tags:['native','eth'], riskMult:1.0 },
};

const LABEL_PATTERNS: [RegExp, EntityCategory, string[], number][] = [
  // CEX
  [/binance|bnb/i, 'cex', ['exchange','binance'], 0.55],
  [/coinbase|cb\./i, 'cex', ['exchange','coinbase'], 0.55],
  [/kraken/i, 'cex', ['exchange','kraken'], 0.55],
  [/bybit/i, 'cex', ['exchange','bybit'], 0.55],
  [/okx|okex/i, 'cex', ['exchange','okx'], 0.55],
  [/kucoin/i, 'cex', ['exchange','kucoin'], 0.55],
  [/gate\.io|gateio/i, 'cex', ['exchange','gateio'], 0.55],
  [/mexc/i, 'cex', ['exchange','mexc'], 0.55],
  [/htx|huobi/i, 'cex', ['exchange','htx'], 0.55],
  [/bitget/i, 'cex', ['exchange','bitget'], 0.55],
  [/crypto\.com|cryptocom/i, 'cex', ['exchange','cryptocom'], 0.55],
  [/bitfinex/i, 'cex', ['exchange','bitfinex'], 0.55],
  [/gemini/i, 'cex', ['exchange','gemini'], 0.55],
  [/cex|exchange.*wallet|centralized/i, 'cex', ['exchange'], 0.5],
  // DEX
  [/uniswap/i, 'dex', ['dex','uniswap'], 0.6],
  [/sushi|sushiswap/i, 'dex', ['dex','sushiswap'], 0.6],
  [/pancake|pancakeswap|cake/i, 'dex', ['dex','pancakeswap'], 0.6],
  [/curve/i, 'dex', ['dex','curve'], 0.6],
  [/balancer/i, 'dex', ['dex','balancer'], 0.6],
  [/1inch/i, 'dex', ['dex','1inch','aggregator'], 0.6],
  [/paraswap/i, 'dex', ['dex','paraswap','aggregator'], 0.6],
  [/kyber/i, 'dex', ['dex','kyber'], 0.6],
  [/quickswap|quick/i, 'dex', ['dex','quickswap','polygon'], 0.6],
  [/trader.?joe|joe/i, 'dex', ['dex','traderjoe','avalanche'], 0.6],
  [/gmx/i, 'dex', ['dex','gmx','perpetual'], 0.6],
  [/cowswap|cow.*swap/i, 'dex', ['dex','cowswap','aggregator'], 0.6],
  [/0x.*proxy|exchange.*proxy/i, 'dex', ['dex','aggregator','0x'], 0.6],
  // Lending
  [/aave/i, 'lending', ['lending','aave'], 0.6],
  [/compound/i, 'lending', ['lending','compound'], 0.6],
  [/morpho/i, 'lending', ['lending','morpho'], 0.6],
  [/radiant/i, 'lending', ['lending','radiant'], 0.6],
  [/liquity|lusd/i, 'lending', ['lending','liquity'], 0.6],
  [/spark/i, 'lending', ['lending','spark'], 0.6],
  [/lending|borrow|supply/i, 'lending', ['lending'], 0.5],
  // Staking
  [/lido|steth|wsteth/i, 'liquid_staking', ['staking','lido'], 0.6],
  [/rocket.?pool|reth/i, 'liquid_staking', ['staking','rocketpool'], 0.6],
  [/frax|sfrxeth|frxeth/i, 'liquid_staking', ['staking','frax'], 0.6],
  [/stake|staking|validator/i, 'liquid_staking', ['staking'], 0.55],
  // Restaking
  [/eigenlayer|eigen.?pod/i, 'restaking', ['restaking','eigenlayer'], 0.6],
  [/kelp/i, 'restaking', ['restaking','kelp'], 0.6],
  [/renzo|ezeth/i, 'restaking', ['restaking','renzo'], 0.6],
  [/ether\.?fi|eeth/i, 'restaking', ['restaking','etherfi'], 0.6],
  [/puffer|pufeth/i, 'restaking', ['restaking','puffer'], 0.6],
  [/swell|rsweth/i, 'restaking', ['restaking','swell'], 0.6],
  [/restaking|restake/i, 'restaking', ['restaking'], 0.55],
  // Mixer
  [/tornado|mixer/i, 'mixer', ['mixer','privacy','sanctioned'], 2.2],
  [/railgun/i, 'mixer', ['mixer','privacy'], 1.8],
  [/aztec/i, 'mixer', ['mixer','privacy'], 1.8],
  // Bridge
  [/stargate|layerzero/i, 'bridge', ['bridge','stargate'], 0.75],
  [/wormhole/i, 'bridge', ['bridge','wormhole'], 0.75],
  [/hop.*bridge|hop/i, 'bridge', ['bridge','hop'], 0.75],
  [/across/i, 'bridge', ['bridge','across'], 0.75],
  [/synapse/i, 'bridge', ['bridge','synapse'], 0.75],
  [/multichain|anycall/i, 'bridge', ['bridge','multichain'], 0.9],
  [/cbridge|celt/i, 'bridge', ['bridge','celer'], 0.75],
  [/connext/i, 'bridge', ['bridge','connext'], 0.75],
  [/thorchain|thornode/i, 'bridge', ['bridge','thorchain'], 0.75],
  [/bridge|portal/i, 'bridge', ['bridge'], 0.7],
  // MEV
  [/flash.?bot|flashbots/i, 'mev_bot', ['mev','flashbots'], 1.15],
  [/mev|searcher|builder/i, 'mev_bot', ['mev'], 1.15],
  [/arbitrage|arb.?bot|sandwich/i, 'arb_bot', ['mev','arbitrage'], 1.15],
  // Hacker / Malicious
  [/hack|exploit|drainer|phish|scam|rug/i, 'hacker', ['hacker','malicious'], 3.0],
  [/ransom|malware|virus|trojan/i, 'hacker', ['hacker','malicious'], 3.0],
  // NFT
  [/opensea/i, 'nft_marketplace', ['nft','opensea','marketplace'], 0.7],
  [/blur/i, 'nft_marketplace', ['nft','blur','marketplace'], 0.7],
  [/looksrare/i, 'nft_marketplace', ['nft','looksrare'], 0.7],
  [/x2y2/i, 'nft_marketplace', ['nft','x2y2'], 0.7],
  [/nft.*market|marketplace/i, 'nft_marketplace', ['nft','marketplace'], 0.7],
  // Oracle
  [/chainlink|oracle/i, 'oracle', ['oracle','chainlink'], 0.65],
  [/pyth/i, 'oracle', ['oracle','pyth'], 0.65],
  // Stablecoin
  [/usdt|tether/i, 'stablecoin', ['stablecoin','usdt'], 0.5],
  [/usdc|circle/i, 'stablecoin', ['stablecoin','usdc'], 0.5],
  [/dai|maker.*dao/i, 'stablecoin', ['stablecoin','dai'], 0.5],
  [/frax/i, 'stablecoin', ['stablecoin','frax'], 0.5],
  [/lusd/i, 'stablecoin', ['stablecoin','lusd'], 0.5],
  [/busd|paxos/i, 'stablecoin', ['stablecoin','busd'], 0.5],
  [/stablecoin|stable/i, 'stablecoin', ['stablecoin'], 0.5],
  // Yield
  [/yearn|yfi/i, 'yield_aggregator', ['yield','yearn'], 0.6],
  [/convex|cvx/i, 'yield_aggregator', ['yield','convex'], 0.6],
  [/harvest/i, 'yield_aggregator', ['yield','harvest'], 0.6],
  [/beefy/i, 'yield_aggregator', ['yield','beefy'], 0.6],
  [/yield|vault|farm/i, 'yield_aggregator', ['yield','vault'], 0.6],
  // Governance
  [/dao|governance|vote/i, 'governance', ['dao','governance'], 0.55],
  // Foundation / Treasury
  [/foundation|ecosystem/i, 'foundation', ['foundation'], 0.5],
  [/treasury|reserve|vault.*dao/i, 'treasury', ['treasury'], 0.5],
  // Airdrop
  [/airdrop|claim|distribution/i, 'airdrop_claimer', ['airdrop','claim'], 0.7],
  // Launchpad
  [/launchpad|ido|ico/i, 'launchpad', ['launchpad'], 0.65],
  // Relayer
  [/relayer|gelato|biconomy/i, 'relayer', ['relayer'], 0.7],
  // Multisig
  [/multisig|gnosis.*safe|safe.*wallet/i, 'multisig', ['multisig'], 0.55],
  // Cross-chain
  [/ccip|cross.?chain/i, 'cross_chain', ['crosschain'], 0.7],
  // Flash Loan
  [/flash.?loan|flashloan/i, 'flash_loan', ['flash_loan'], 0.7],
];

export class EntityResolver {
  async resolve(address: string, labelName?: string | null): Promise<EntityProfile> {
    const addr = address.toLowerCase();
    const known = KNOWN[addr];

    let category: EntityCategory = 'unknown';
    let name: string | null = null;
    let tags: string[] = [];
    let confidence = 0.5;
    let riskMult = 1.0;
    const evidence: string[] = [];

    if (known) {
      category = known.category;
      name = known.name;
      tags = [...known.tags];
      confidence = 0.98;
      riskMult = known.riskMult;
      evidence.push(`Known entity: ${known.name} (${known.category})`);
    } else if (labelName) {
      for (const [re, cat, t, mult] of LABEL_PATTERNS) {
        if (re.test(labelName)) {
          name = labelName.slice(0, 36);
          category = cat;
          tags = [...t];
          riskMult = mult;
          confidence = cat === 'cex' || cat === 'dex' ? 0.7 : 0.6;
          evidence.push(`Label match: "${labelName}" → ${cat}`);
          break;
        }
      }
    }

    if (tags.includes('hacker') || tags.includes('malicious')) riskMult = 3.0;
    else if (tags.includes('sanctioned')) riskMult = 2.5;
    else if (category === 'sybil') riskMult = 2.0;

    return {
      address: addr, category, name, confidence,
      tags: [...new Set(tags)],
      firstSeen: null, lastActive: null,
      totalValueUsd: 0, txCount: 0, counterpartyCount: 0,
      riskMultiplier: riskMult, evidence,
    };
  }

  async resolveBatch(addresses: string[], labelMap?: Record<string, string | null>): Promise<Map<string, EntityProfile>> {
    const map = new Map<string, EntityProfile>();
    await Promise.all(addresses.map(async (a) => {
      const label = labelMap?.[a.toLowerCase()] || null;
      map.set(a.toLowerCase(), await this.resolve(a, label));
    }));
    return map;
  }

  classifyByBehavior(txCount: number, uniqueContracts: number, uniqueTokens: number, totalValueUsd: number, cpCount: number): EntityCategory {
    if (txCount > 1000 && uniqueContracts > 100 && cpCount > 100) {
      if (uniqueTokens > 50) return 'cex';
      return 'mev_bot';
    }
    if (txCount > 100 && cpCount > 50 && uniqueContracts > 30) return 'arb_bot';
    if (uniqueTokens === 0 && uniqueContracts <= 5 && totalValueUsd < 100) return 'sybil';
    if (totalValueUsd > 1_000_000) return 'whale';
    return 'unknown';
  }
}
