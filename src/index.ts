import { TextChannel, Client, MessageEmbed, MessageAttachment } from 'discord.js';
import { Contract, providers, utils, Wallet } from 'ethers';
import dotenv from 'dotenv';
import makeBlockie from 'ethereum-blockies-base64';
import Canvas from 'canvas';
import { abi as managerAbi } from '@primitivefi/rmm-manager/artifacts/contracts/PrimitiveManager.sol/PrimitiveManager.json';
import { abi as engineAbi } from '@primitivefi/rmm-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json';

import erc20Abi from './abis/erc20.json';
import aggregate from './multicall';

import tokens from './tokens.json';

dotenv.config();

const client = new Client({
  intents: ['GUILDS', 'GUILD_MESSAGES'],
});

client.on('ready', async () => {
  console.log(`Logged in as ${client.user?.id}`);
  client.user?.setActivity('Primitive pools', { type: 'WATCHING' });

  const provider = new providers.WebSocketProvider(
    'wss://eth-rinkeby.alchemyapi.io/v2/55XYQVY5-bFXCcxAKkKx2-qX0jCLU4C7',
    4,
  );

  const manager = new Contract(
    '0x24f2a98B9B92c5D00C746bc07cFcc4BA26956F8b',
    managerAbi,
    provider,
  );

  manager.on('Allocate', async (
    payer: any,
    engine: any,
    poolId: any,
    delLiquidity: any,
    delRisky: any,
    delStable: any,
    fromMargin: any,
    event: any,
  ) => {
    console.log(
      payer,
      engine,
      poolId,
      delLiquidity,
      delRisky,
      delStable,
      fromMargin,
      event,
    );

    const authorShortAddress = `${payer.substr(0, 6)}...${payer.substr(-4)}`;
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

    const engineInterface = new utils.Interface(engineAbi);

    const decodedEngineCall = await aggregate(
      provider,
      '0x42Ad527de7d4e9d9d011aC45B31D8551f8Fe9821',
      [
        {
          target: engine,
          interface: engineInterface,
          function: 'calibrations',
          values: [poolId],
        },
        {
          target: engine,
          interface: engineInterface,
          function: 'risky',
        },
        {
          target: engine,
          interface: engineInterface,
          function: 'stable',
        },
      ],
    );

    console.log(decodedEngineCall);

    const tokenInterface = new utils.Interface(erc20Abi);

    const decodedTokensCall = await aggregate(
      provider,
      '0x42Ad527de7d4e9d9d011aC45B31D8551f8Fe9821',
      [
        {
          target: decodedEngineCall[1][0],
          interface: tokenInterface,
          function: 'symbol',
        },
        {
          target: decodedEngineCall[1][0],
          interface: tokenInterface,
          function: 'decimals',
        },
        {
          target: decodedEngineCall[2][0],
          interface: tokenInterface,
          function: 'symbol',
        },
        {
          target: decodedEngineCall[2][0],
          interface: tokenInterface,
          function: 'decimals',
        },
      ],
    );

    console.log(decodedTokensCall);

    const canvas = Canvas.createCanvas(256, 256);
    const context = canvas.getContext('2d');

    const riskyIcon = tokens.tokens.find((obj) => obj.symbol === decodedTokensCall[0][0]);
    const stableIcon = tokens.tokens.find((obj) => obj.symbol === decodedTokensCall[2][0]);

    const riskyIconImage = await Canvas.loadImage(riskyIcon ? riskyIcon.logoURI : 'https://ipfs.io/ipfs/QmewoJ1H4nRK5VKf9t8bi9qX7Xqb9iKyTXsWAcsY4qswgn');
    context.drawImage(riskyIconImage, 0, 0, 128, 256, 0, 0, 128, 256);

    const stableIconImage = await Canvas.loadImage(stableIcon ? stableIcon.logoURI : 'https://ipfs.io/ipfs/QmewoJ1H4nRK5VKf9t8bi9qX7Xqb9iKyTXsWAcsY4qswgn');
    context.drawImage(stableIconImage, 128, 0, 128, 256, 128, 0, 128, 256);

    const thumbnailAttachment = new MessageAttachment(canvas.toBuffer(), 'thumb.png');

    const embed = new MessageEmbed()
      .setTitle('⬇️ Allocate')
      .setURL(`https://rinkeby.etherscan.io/tx/${event.transactionHash}`)
      .setAuthor({
        name: ens ? `${ens} (${authorShortAddress})` : authorShortAddress,
        url: `https://rinkeby.etherscan.io/address/${payer}`,
        iconURL: avatar ? avatar : 'attachment://blockie.png',
      })
      .setThumbnail('attachment://thumb.png')
      .setDescription(
        'Liquidity added'
      )
      .addFields(
        {
          name: '🔥 Risky',
          value: `${utils.formatUnits(delRisky, decodedTokensCall[1][0])} ${decodedTokensCall[0][0]}`,
          inline: true
        },
        {
          name: '💵 Stable',
          value: `${utils.formatUnits(delStable, decodedTokensCall[3][0])} ${decodedTokensCall[2][0]}`,
          inline: true
        },
        {
          name: '💧 Liquidity Tokens',
          value: utils.formatUnits(delLiquidity, decodedTokensCall[1][0]),
          inline: true,
        },
        { name: '⌛️ Maturity', value: new Date(decodedEngineCall[0].maturity * 1000).toISOString().split('T')[0], inline: true },
        {
          name: '⚡️ Strike',
          value: `${utils.formatUnits(decodedEngineCall[0].strike, decodedTokensCall[3][0])} ${decodedTokensCall[2][0]}`,
          inline: true
        },
        { name: '🌪 Gamma', value: decodedEngineCall[0].gamma.toString(), inline: true },
        { name: '🌪 Sigma', value: decodedEngineCall[0].sigma.toString(), inline: true },
      )
      .setTimestamp()
      .setFooter({ text: 'Rinkeby', iconURL: 'https://ethereum.org/static/a183661dd70e0e5c70689a0ec95ef0ba/81d9f/eth-diamond-purple.webp' })

      const channel = client.channels.cache.get('934553459787718706') as TextChannel;

      channel.send({
        embeds: [embed],
        files: attachment ? [attachment, thumbnailAttachment] : [thumbnailAttachment],
      });
  });

  manager.on('Remove', (
    payer,
    engine,
    poolId,
    delLiquidity,
    delRisky,
    delStable,
  ) => {
    console.log(
      payer,
      engine,
      poolId,
      delLiquidity,
      delRisky,
      delStable,
    );
  });

  manager.on('Swap', (
    payer,
    recipient,
    engine,
    poolId,
    riskyForStable,
    deltaIn,
    deltaOut,
  ) => {
    console.log(
      payer,
      recipient,
      engine,
      poolId,
      riskyForStable,
      deltaIn,
      deltaOut,
    );
  });
});

client.on('messageCreate', async (msg) => {
  if (msg.content.includes('!swap')) {
    const attachment = new MessageAttachment(
      Buffer.from(makeBlockie('0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8').split(',')[1], 'base64'),
      'blockie.png'
    );

    const embed = new MessageEmbed()
      .setTitle('🔁 Swap')
      .setURL('https://etherscan.io/tx/0xff82df3e9a0562f154d2f1600c02b8410a22cb082e1b67c317e56521c3c89bb0')
      .setAuthor({
        name: 'nick.eth (0xff82...9bb0)',
        iconURL: 'attachment://blockie.png',
        url: 'https://etherscan.io/tx/0xff82df3e9a0562f154d2f1600c02b8410a22cb082e1b67c317e56521c3c89bb0',
      })
      .setDescription('**300 DAI** swapped for **1 ETH**')
      .addFields(
        { name: '🔥 Risky', value: 'ETH', inline: true },
        { name: '💵 Stable', value: 'DAI', inline: true },
        { name: '⌛️ Expiry', value: '2022/12/31', inline: true },
      )
      .setTimestamp()
      .setFooter({ text: 'Ethereum Mainnet' });

      msg.channel.send({
        embeds: [embed],
        files: [attachment],
      });
  }

  if (msg.content.includes('!allocate')) {
    const embed = new MessageEmbed()
      .setTitle('⬇️ Allocate')
      .setURL('https://etherscan.io/tx/0xff82df3e9a0562f154d2f1600c02b8410a22cb082e1b67c317e56521c3c89bb0')
      .setAuthor({ name: 'nick.eth (0xff82...9bb0)', iconURL: 'https://metadata.ens.domains/mainnet/avatar/nick.eth', url: 'https://etherscan.io/tx/0xff82df3e9a0562f154d2f1600c02b8410a22cb082e1b67c317e56521c3c89bb0' })
      .setDescription('**300 DAI** and **1 ETH** allocated (1.424 liquidity tokens)')
      .addFields(
        { name: '🔥 Risky', value: 'ETH', inline: true },
        { name: '💵 Stable', value: 'DAI', inline: true },
        { name: '⌛️ Expiry', value: '2022/12/31', inline: true },
      )
      .setTimestamp()
      .setFooter({ text: 'Ethereum Mainnet' })

      msg.channel.send({
        embeds: [embed],
      });
  }

  if (msg.content.includes('!remove')) {
    const embed = new MessageEmbed()
      .setTitle('⬆️ Remove')
      .setURL('https://etherscan.io/tx/0xff82df3e9a0562f154d2f1600c02b8410a22cb082e1b67c317e56521c3c89bb0')
      .setAuthor({ name: 'nick.eth (0xff82...9bb0)', iconURL: 'https://metadata.ens.domains/mainnet/avatar/nick.eth', url: 'https://etherscan.io/tx/0xff82df3e9a0562f154d2f1600c02b8410a22cb082e1b67c317e56521c3c89bb0' })
      .setDescription('**300 DAI** and **1 ETH** removed (1.424 liquidity tokens)')
      .addFields(
        { name: '🔥 Risky', value: 'ETH', inline: true },
        { name: '💵 Stable', value: 'DAI', inline: true },
        { name: '⌛️ Expiry', value: '2022/12/31', inline: true },
      )
      .setTimestamp()
      .setFooter({ text: 'Ethereum Mainnet' })

      msg.channel.send({
        embeds: [embed],
      });
  }
});

client.login(process.env.TOKEN);
