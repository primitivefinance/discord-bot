import { Client } from 'discord.js';
import { providers } from 'ethers';
import dotenv from 'dotenv';
import { PrimitiveManager__factory } from '@primitivefi/rmm-manager/typechain/factories/PrimitiveManager__factory';

dotenv.config();

const client = new Client({
  intents: ['GUILDS', 'GUILD_MESSAGES'],
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.id}`);

  const provider = new providers.WebSocketProvider(
    'wss://eth-rinkeby.alchemyapi.io/v2/55XYQVY5-bFXCcxAKkKx2-qX0jCLU4C7',
    4,
  );

  const manager = PrimitiveManager__factory.connect(
    '0x24f2a98B9B92c5D00C746bc07cFcc4BA26956F8b',
    provider,
  );

  manager.on(manager.filters.Allocate(), (
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

  manager.on(manager.filters.Remove(), (
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

  manager.on(manager.filters.Swap(), (
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
  // msg.reply('Please wait for your turn :eyes:');
});

client.login(process.env.TOKEN);
