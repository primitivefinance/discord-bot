import { TextChannel, Client, MessageEmbed } from 'discord.js';
import { BigNumberish, Contract, Event, providers } from 'ethers';
import dotenv from 'dotenv';
import { abi as managerAbi } from '@primitivefi/rmm-manager/artifacts/contracts/PrimitiveManager.sol/PrimitiveManager.json';

import { getLiquidityEmbedMessage, getCreateEmbedMessage } from './utils';

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

  manager.on('Create', async (
    payer: string,
    engine: string,
    poolId: BigNumberish,
    strike: BigNumberish,
    sigma: BigNumberish,
    maturity: BigNumberish,
    gamma: BigNumberish,
    delLiquidity: BigNumberish,
    event: Event,
  ) => {
    const embedMessage = await getCreateEmbedMessage(
      provider,
      '0x42Ad527de7d4e9d9d011aC45B31D8551f8Fe9821',
      payer,
      engine,
      poolId,
      delLiquidity,
      event,
    );

    const channel = client.channels.cache.get('934553459787718706') as TextChannel;

    channel.send({
      embeds: embedMessage.embeds,
      files: embedMessage.files,
    });
  });

  manager.on('Allocate', async (
    payer: string,
    engine: string,
    poolId: BigNumberish,
    delLiquidity: BigNumberish,
    delRisky: BigNumberish,
    delStable: BigNumberish,
    fromMargin: boolean,
    event: Event,
  ) => {
    const embedMessage = await getLiquidityEmbedMessage(
      'Liquidity allocated',
      'allocated into',
      provider,
      '0x42Ad527de7d4e9d9d011aC45B31D8551f8Fe9821',
      payer,
      engine,
      poolId,
      delLiquidity,
      delRisky,
      delStable,
      event,
    );

    const channel = client.channels.cache.get('934553459787718706') as TextChannel;

    channel.send({
      embeds: embedMessage.embeds,
      files: embedMessage.files,
    });
  });

  manager.on('Remove', async (
    payer: string,
    engine: string,
    poolId: BigNumberish,
    delLiquidity: BigNumberish,
    delRisky: BigNumberish,
    delStable: BigNumberish,
    event: Event,
  ) => {
    const embedMessage = await getLiquidityEmbedMessage(
      'Liquidity removed',
      'removed from',
      provider,
      '0x42Ad527de7d4e9d9d011aC45B31D8551f8Fe9821',
      payer,
      engine,
      poolId,
      delLiquidity,
      delRisky,
      delStable,
      event,
    );

    const channel = client.channels.cache.get('934553459787718706') as TextChannel;

    channel.send({
      embeds: embedMessage.embeds,
      files: embedMessage.files,
    });
  });
});

client.on('messageCreate', async (msg) => {
  // Does nothing right now
});

client.login(process.env.TOKEN);
