import {
  providers,
  Contract,
  utils,
} from 'ethers';
import { Interface } from 'ethers/lib/utils';
import multicallAbi from './abis/multicall.json';

type Call = {
  target: string,
  interface: utils.Interface,
  function: string,
  values?: any,
};

type EncodedCall = {
  target: string,
  callData: string,
};

export default async function aggregate(
  provider: providers.JsonRpcProvider | providers.WebSocketProvider,
  address: string,
  calls: Call[],
): Promise<any[]> {
  const multicall = new Contract(address, multicallAbi, provider);
  const encodedCalls: EncodedCall[] = [];

  for (let i = 0; i < calls.length; i += 1) {
    const call = calls[i];
    const callData = call.interface.encodeFunctionData(call.function, call.values);
    encodedCalls.push({
      callData,
      target: call.target,
    });
  }

  const aggregated = await multicall.callStatic.aggregate(encodedCalls);
  const decodedReturnData: any[] = [];

  for (let i = 0; i < aggregated.returnData.length; i += 1) {
    const decoded = calls[i].interface.decodeFunctionResult(calls[i].function, aggregated.returnData[i]);
    decodedReturnData.push(decoded);
  }

  return decodedReturnData;
}
