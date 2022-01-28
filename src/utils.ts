import {
  BigNumberish,
  providers,
  utils,
} from 'ethers';
import Canvas from 'canvas';
import { MessageAttachment, MessageEmbed } from 'discord.js';
import makeBlockie from 'ethereum-blockies-base64';
import { abi as engineAbi } from '@primitivefi/rmm-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json';
import { getSpotPrice } from '@primitivefi/rmm-math';

import erc20Abi from './abis/erc20.json';
import aggregate from './multicall';
import tokens from './tokens.json';

export function getPrettyAmount(amount: string) {
  const split = amount.split('.');

  const decimals = split[1] === '0' ? '' : `.${split[1].substr(0, 4)}`;
  return `${split[0]}${decimals}`;
}

export async function getEngineInfo(
  provider: providers.WebSocketProvider | providers.JsonRpcProvider,
  multicallAddress: string,
  engineAddress: string,
  poolId: BigNumberish,
): Promise<{
  calibration: any,
  riskyAddress: string,
  stableAddress: string,
  reserve: any,
}> {
  try {
    const engineInterface = new utils.Interface(engineAbi);

    const decodedEngineCall = await aggregate(
      provider,
      multicallAddress,
      [
        {
          target: engineAddress,
          interface: engineInterface,
          function: 'calibrations',
          values: [poolId],
        },
        {
          target: engineAddress,
          interface: engineInterface,
          function: 'risky',
        },
        {
          target: engineAddress,
          interface: engineInterface,
          function: 'stable',
        },
        {
          target: engineAddress,
          interface: engineInterface,
          function: 'reserves',
          values: [poolId],
        },
      ],
    );

    return {
      calibration: decodedEngineCall[0],
      riskyAddress: decodedEngineCall[1][0],
      stableAddress: decodedEngineCall[2][0],
      reserve: decodedEngineCall[3],
    };
  } catch (e) {
    throw new Error(`Cannot get engine info: ${e}`);
  }
}

export async function getTokensInfo(
  provider: providers.WebSocketProvider | providers.JsonRpcProvider,
  multicallAddress: string,
  riskyAddress: string,
  stableAddress: string,
): Promise<{
  riskySymbol: string,
  riskyDecimals: BigNumberish,
  stableSymbol: string,
  stableDecimals: BigNumberish,
}> {
  const tokenInterface = new utils.Interface(erc20Abi);

  try {
    const decodedTokensCall = await aggregate(
      provider,
      multicallAddress,
      [
        {
          target: riskyAddress,
          interface: tokenInterface,
          function: 'symbol',
        },
        {
          target: riskyAddress,
          interface: tokenInterface,
          function: 'decimals',
        },
        {
          target: stableAddress,
          interface: tokenInterface,
          function: 'symbol',
        },
        {
          target: stableAddress,
          interface: tokenInterface,
          function: 'decimals',
        },
      ],
    );

    return {
      riskySymbol: decodedTokensCall[0][0],
      riskyDecimals: decodedTokensCall[1][0],
      stableSymbol: decodedTokensCall[2][0],
      stableDecimals: decodedTokensCall[3][0],
    }
  } catch (e) {
    throw new Error(`Cannot get tokens info: ${e}`);
  }
}

export async function getThumbnail(
  riskySymbol: string,
  stableSymbol: string,
): Promise<MessageAttachment> {
  const canvas = Canvas.createCanvas(256, 256);
  const context = canvas.getContext('2d');

  const riskyIcon = tokens.tokens.find((obj) => obj.symbol === riskySymbol);
  const stableIcon = tokens.tokens.find((obj) => obj.symbol === stableSymbol);

  const riskyIconImage = await Canvas.loadImage(riskyIcon ? riskyIcon.logoURI : 'https://ipfs.io/ipfs/QmewoJ1H4nRK5VKf9t8bi9qX7Xqb9iKyTXsWAcsY4qswgn');
  context.drawImage(riskyIconImage, 0, 0, 128, 256, 0, 0, 128, 256);

  const stableIconImage = await Canvas.loadImage(stableIcon ? stableIcon.logoURI : 'https://ipfs.io/ipfs/QmewoJ1H4nRK5VKf9t8bi9qX7Xqb9iKyTXsWAcsY4qswgn');
  context.drawImage(stableIconImage, 128, 0, 128, 256, 128, 0, 128, 256);

  const thumbnailAttachment = new MessageAttachment(canvas.toBuffer(), 'thumb.png');

  return thumbnailAttachment;
}

export async function getPayerInfo(
  provider: providers.WebSocketProvider | providers.JsonRpcProvider,
  payer: string,
): Promise<{
  name: string,
  url: string,
  iconURL: string,
  attachment?: MessageAttachment,
}> {
  const payerShort = `${payer.substr(0, 6)}...${payer.substr(-4)}`;

  try {
    const ens = await provider.lookupAddress(payer);

    let avatar;
    let attachment;

    if (ens) {
      avatar = await provider.getAvatar(ens);
    } else {
      attachment = new MessageAttachment(
        Buffer.from(makeBlockie(payer).split(',')[1], 'base64'),
        'blockie.png'
      );
    }

    return {
      name: ens ? `${ens} (${payerShort})` : payerShort,
      url: `https://rinkeby.etherscan.io/address/${payer}`,
      iconURL: avatar ? avatar : 'attachment://blockie.png',
      attachment,
    };
  } catch (e) {
    throw new Error(`Cannot get payer info: ${e}`);
  }
}

export function formatMaturity(maturity: number): string {
  return new Date(maturity * 1000).toISOString().split('T')[0];
}

export function formatStrike(
  strike: BigNumberish,
  stableDecimals: BigNumberish,
  stableSymbol: string,
): string {
  return `${getPrettyAmount(utils.formatUnits(strike, stableDecimals))} ${stableSymbol}`;
}

export function formatGamma(gamma: number): string {
  return `${(10000 - gamma) / 10000}%`;
}

export function formatSigma(sigma: number): string {
  return `${sigma / 10000}%`;
}

export function formatReserve(
  reserve: BigNumberish,
  decimals: BigNumberish,
  symbol: string,
): string {
  return `${getPrettyAmount(utils.formatUnits(reserve, decimals))} ${symbol}`;
}

export function formatSpotprice(
  reserveRisky: BigNumberish,
  riskyDecimals: BigNumberish,
  strike: BigNumberish,
  stableDecimals: BigNumberish,
  sigma: number,
  tau: number,
) {
  console.log(
    parseFloat(utils.formatUnits(reserveRisky, riskyDecimals)),
    parseFloat(utils.formatUnits(strike, stableDecimals)),
    sigma,
    tau
  );

  const spotPrice = getSpotPrice(
    parseFloat(utils.formatUnits(reserveRisky, riskyDecimals)),
    parseFloat(utils.formatUnits(strike, stableDecimals)),
    sigma,
    tau,
  );

  return spotPrice;
}

export async function getEmbedMessage(
  title: string,
  action: string,
  provider: providers.WebSocketProvider | providers.JsonRpcProvider,
  multicallAddress: string,
  payer: any,
  engine: any,
  poolId: any,
  delLiquidity: any,
  delRisky: any,
  delStable: any,
  event: any,
): Promise<{
  embeds: MessageEmbed[],
  files: MessageAttachment[]
}> {
  try {
    const engineInfo = await getEngineInfo(
      provider,
      multicallAddress,
      engine,
      poolId,
    );

    const tokensInfo = await getTokensInfo(
      provider,
      multicallAddress,
      engineInfo.riskyAddress,
      engineInfo.stableAddress,
    );

    const author = await getPayerInfo(provider, payer);

    const embed = new MessageEmbed()
      .setTitle(title)
      .setURL(`https://rinkeby.etherscan.io/tx/${event.transactionHash}`)
      .setAuthor({
        name: author.name,
        url: author.url,
        iconURL: author.iconURL,
      })
      .setThumbnail('attachment://thumb.png')
      .setDescription(
        `**${getPrettyAmount(utils.formatUnits(delRisky, tokensInfo.riskyDecimals))} ${tokensInfo.riskySymbol}** and **${getPrettyAmount(utils.formatUnits(delStable, tokensInfo.stableDecimals))} ${tokensInfo.stableSymbol}** (${getPrettyAmount(utils.formatUnits(delLiquidity, tokensInfo.riskyDecimals))} liquidity pool tokens) were ${action} this [pool](https://app.primitive.finance/):`,
      )
      .addFields(
        {
          name: '🔥 Risky',
          value: `[${tokensInfo.riskySymbol}](https://rinkeby.etherscan.io/address/${engineInfo.riskyAddress})`,
          inline: true
        },
        {
          name: '💵 Stable',
          value: `[${tokensInfo.stableSymbol}](https://rinkeby.etherscan.io/address/${engineInfo.stableAddress})`,
          inline: true
        },
        {
          name: '⌛️ Maturity',
          value: formatMaturity(engineInfo.calibration.maturity),
          inline: true,
        },
        {
          name: '⚡️ Strike',
          value: formatStrike(engineInfo.calibration.strike, tokensInfo.stableDecimals, tokensInfo.stableSymbol),
          inline: true
        },
        {
          name: '🌪 Gamma',
          value: formatGamma(engineInfo.calibration.gamma),
          inline: true,
        },
        {
          name: '🌪 Sigma',
          value: formatSigma(engineInfo.calibration.sigma),
          inline: true,
        },
        {
          name: '🔥 Risky reserve',
          value: formatReserve(engineInfo.reserve.reserveRisky, tokensInfo.riskyDecimals, tokensInfo.riskySymbol),
          inline: true
        },
        {
          name: '💵 Stable reserve',
          value: formatReserve(engineInfo.reserve.reserveStable, tokensInfo.stableDecimals, tokensInfo.stableSymbol),
          inline: true
        },
      )
      .setTimestamp()
      .setFooter({ text: 'Rinkeby', iconURL: 'https://ethereum.org/static/a183661dd70e0e5c70689a0ec95ef0ba/81d9f/eth-diamond-purple.webp' })

    const thumbnailAttachment = await getThumbnail(
      tokensInfo.riskySymbol,
      tokensInfo.stableSymbol,
    );

    return {
      embeds: [embed],
      files: author.attachment ? [author.attachment, thumbnailAttachment] : [thumbnailAttachment],
    };
  } catch (e) {
    throw new Error(`Cannot get embed message: ${e}`);
  }
}
