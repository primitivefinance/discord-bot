import { TextChannel, Client } from 'discord.js';
import { BigNumberish, Contract, Event, providers } from 'ethers';
import dotenv from 'dotenv';
import { abi as managerAbi } from '@primitivefi/rmm-manager/artifacts/contracts/PrimitiveManager.sol/PrimitiveManager.json';

import { getLiquidityEmbedMessage, getCreateEmbedMessage, getSwapEmbedMessage } from './utils';

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
      parseInt(networkId, 10),
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
        networkId,
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
      recipient: string,
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
        recipient,
        engine,
        poolId,
        delLiquidity,
        delRisky,
        delStable,
        event,
        networkId,
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
        networkId,
      );

      const channelId = networkId === "1" ? config.channels.liquidityAlerts : config.channels.testAlerts;
      const channel = client.channels.cache.get(channelId) as TextChannel;

      channel.send({
        embeds: embedMessage.embeds,
        files: embedMessage.files,
      });
    });

    manager.on('Swap', async (
      payer: string,
      engine: string,
      poolId: BigNumberish,
      deltaIn: BigNumberish,
      deltaOut: BigNumberish,
      riskyForStable: boolean,
      event: Event,
    ) => {
      const embedMessage = await getSwapEmbedMessage(
        'Tokens swapped',
        provider,
        config.addresses[networkId].multicall,
        payer,
        engine,
        poolId,
        deltaIn,
        deltaOut,
        riskyForStable,
        event,
        networkId,
      );

      const channelId = networkId === "1" ? config.channels.swapAlerts : config.channels.testAlerts;
      const channel = client.channels.cache.get(channelId) as TextChannel;

      channel.send({
        embeds: embedMessage.embeds,
        files: embedMessage.files,
      });
    });
  }
});

client.on('messageCreate', async (msg) => {
  if (msg.content === '!testswapalert') {
    const provider = new providers.WebSocketProvider('https://eth-mainnet.alchemyapi.io/v2/s33fwb9BGq-1_t_4G4u3stGB5pDU3g0f', 1);
    const contract = new Contract(Config.addresses[1].manager, managerAbi, provider);
    const swaps = await contract.queryFilter(contract.filters.Swap());
    console.log(swaps);

    const swap = swaps[0];
    const networkId = '1';

    const embedMessage = await getSwapEmbedMessage(
      'Tokens swapped',
      provider,
      config.addresses[networkId].multicall,
      swap.args!.payer,
      swap.args!.engine,
      swap.args!.poolId,
      swap.args!.deltaIn,
      swap.args!.deltaOut,
      swap.args!.riskyForStable,
      swap,
      networkId,
    );

    const channel = client.channels.cache.get(config.channels.testAlerts) as TextChannel;

    channel.send({
      embeds: embedMessage.embeds,
      files: embedMessage.files,
    });
  }
});

client.login(process.env.TOKEN);
