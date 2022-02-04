import { TextChannel, Client } from 'discord.js';
import { BigNumberish, Contract, Event, providers } from 'ethers';
import dotenv from 'dotenv';
import { abi as managerAbi } from '@primitivefi/rmm-manager/artifacts/contracts/PrimitiveManager.sol/PrimitiveManager.json';

import { getLiquidityEmbedMessage, getCreateEmbedMessage } from './utils';

import Config from './config.json';

dotenv.config();

interface IConfig {
  activeNetworks: string[];
  channels: {
    liquidityAlerts: string,
    swapAlerts: string,
    testAlerts: string,
  },
  addresses: {
    [key: string]: {
      manager: string;
      multicall: string;
    },
  },
};

const config = Config as IConfig;

const client = new Client({
  intents: ['GUILDS', 'GUILD_MESSAGES'],
});

client.on('ready', async () => {
  console.log(`Logged in as ${client.user?.id}`);
  client.user?.setActivity('Primitive pools', { type: 'WATCHING' });

  for (let i = 0; i < config.activeNetworks.length; i += 1) {
    const networkId = config.activeNetworks[i];

    const provider = new providers.WebSocketProvider(
      process.env[`NETWORK_${networkId}`]!,
      networkId,
    );

    const manager = new Contract(
      config.addresses[networkId].manager,
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
        config.addresses[networkId].multicall,
        payer,
        engine,
        poolId,
        delLiquidity,
        event,
      );

      const channelId = networkId === "1" ? config.channels.liquidityAlerts : config.channels.testAlerts;
      const channel = client.channels.cache.get(channelId) as TextChannel;

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
        config.addresses[networkId].multicall,
        payer,
        engine,
        poolId,
        delLiquidity,
        delRisky,
        delStable,
        event,
      );

      const channelId = networkId === "1" ? config.channels.liquidityAlerts : config.channels.testAlerts;
      const channel = client.channels.cache.get(channelId) as TextChannel;

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
        config.addresses[networkId].multicall,
        payer,
        engine,
        poolId,
        delLiquidity,
        delRisky,
        delStable,
        event,
      );

      const channelId = networkId === "1" ? config.channels.liquidityAlerts : config.channels.testAlerts;
      const channel = client.channels.cache.get(channelId) as TextChannel;

      channel.send({
        embeds: embedMessage.embeds,
        files: embedMessage.files,
      });
    });
  }
});

client.on('messageCreate', async (msg) => {
  // Does nothing right now
});

client.login(process.env.TOKEN);
