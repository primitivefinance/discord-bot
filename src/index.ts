import { Channel, Client, MessageEmbed } from 'discord.js';
import { Contract, providers } from 'ethers';
import dotenv from 'dotenv';
// import { PrimitiveManager__factory } from '@primitivefi/rmm-manager/typechain/factories/PrimitiveManager__factory';

dotenv.config();

const abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "factory_",
        type: "address",
      },
      {
        internalType: "address",
        name: "WETH9_",
        type: "address",
      },
      {
        internalType: "address",
        name: "positionDescriptor_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "requiredAmount",
        type: "uint256",
      },
    ],
    name: "BalanceTooLowError",
    type: "error",
  },
  {
    inputs: [],
    name: "DeadlineReachedError",
    type: "error",
  },
  {
    inputs: [],
    name: "EngineNotDeployedError",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSigError",
    type: "error",
  },
  {
    inputs: [],
    name: "LockedError",
    type: "error",
  },
  {
    inputs: [],
    name: "MinLiquidityOutError",
    type: "error",
  },
  {
    inputs: [],
    name: "MinRemoveOutError",
    type: "error",
  },
  {
    inputs: [],
    name: "NotEngineError",
    type: "error",
  },
  {
    inputs: [],
    name: "OnlyWETHError",
    type: "error",
  },
  {
    inputs: [],
    name: "SigExpiredError",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferError",
    type: "error",
  },
  {
    inputs: [],
    name: "WrongConstructorParametersError",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroDelError",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroLiquidityError",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "payer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "engine",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "poolId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "delLiquidity",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "delRisky",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "delStable",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "fromMargin",
        type: "bool",
      },
    ],
    name: "Allocate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "payer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "engine",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "poolId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint128",
        name: "strike",
        type: "uint128",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "sigma",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "maturity",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "gamma",
        type: "uint32",
      },
    ],
    name: "Create",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "payer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "engine",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "risky",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "stable",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "delRisky",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "delStable",
        type: "uint256",
      },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "payer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "engine",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "poolId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "delLiquidity",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "delRisky",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "delStable",
        type: "uint256",
      },
    ],
    name: "Remove",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "payer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "engine",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "poolId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "riskyForStable",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "deltaIn",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "deltaOut",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "fromMargin",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "toMargin",
        type: "bool",
      },
    ],
    name: "Swap",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "values",
        type: "uint256[]",
      },
    ],
    name: "TransferBatch",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "TransferSingle",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "value",
        type: "string",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "URI",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "payer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "engine",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "risky",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "stable",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "delRisky",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "delStable",
        type: "uint256",
      },
    ],
    name: "Withdraw",
    type: "event",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "WETH9",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "poolId",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "risky",
        type: "address",
      },
      {
        internalType: "address",
        name: "stable",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "delRisky",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "delStable",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "fromMargin",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "minLiquidityOut",
        type: "uint256",
      },
    ],
    name: "allocate",
    outputs: [
      {
        internalType: "uint256",
        name: "delLiquidity",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "delRisky",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "delStable",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "allocateCallback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "accounts",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
    ],
    name: "balanceOfBatch",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "risky",
        type: "address",
      },
      {
        internalType: "address",
        name: "stable",
        type: "address",
      },
      {
        internalType: "uint128",
        name: "strike",
        type: "uint128",
      },
      {
        internalType: "uint32",
        name: "sigma",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "maturity",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "gamma",
        type: "uint32",
      },
      {
        internalType: "uint256",
        name: "riskyPerLp",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "delLiquidity",
        type: "uint256",
      },
    ],
    name: "create",
    outputs: [
      {
        internalType: "bytes32",
        name: "poolId",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "delRisky",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "delStable",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "delRisky",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "delStable",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "createCallback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "address",
        name: "risky",
        type: "address",
      },
      {
        internalType: "address",
        name: "stable",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "delRisky",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "delStable",
        type: "uint256",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "delRisky",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "delStable",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "depositCallback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "factory",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "margins",
    outputs: [
      {
        internalType: "uint128",
        name: "balanceRisky",
        type: "uint128",
      },
      {
        internalType: "uint128",
        name: "balanceStable",
        type: "uint128",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes[]",
        name: "data",
        type: "bytes[]",
      },
    ],
    name: "multicall",
    outputs: [
      {
        internalType: "bytes[]",
        name: "results",
        type: "bytes[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "nonces",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "positionDescriptor",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "refundETH",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "engine",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "poolId",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "delLiquidity",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minRiskyOut",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minStableOut",
        type: "uint256",
      },
    ],
    name: "remove",
    outputs: [
      {
        internalType: "uint256",
        name: "delRisky",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "delStable",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeBatchTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "selfPermit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expiry",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "selfPermitAllowed",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expiry",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "selfPermitAllowedIfNecessary",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "selfPermitIfNecessary",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "address",
            name: "risky",
            type: "address",
          },
          {
            internalType: "address",
            name: "stable",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "poolId",
            type: "bytes32",
          },
          {
            internalType: "bool",
            name: "riskyForStable",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "deltaIn",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "deltaOut",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "fromMargin",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "toMargin",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
        ],
        internalType: "struct ISwapManager.SwapParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "swap",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "delRisky",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "delStable",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "swapCallback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountMin",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
    ],
    name: "sweepToken",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountMin",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
    ],
    name: "unwrap",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "uri",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "address",
        name: "engine",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "delRisky",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "delStable",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "wrap",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];

const client = new Client({
  intents: ['GUILDS', 'GUILD_MESSAGES'],
});

client.on('ready', async () => {
  console.log(`Logged in as ${client.user?.id}`);

  const provider = new providers.WebSocketProvider(
    'wss://eth-mainnet.alchemyapi.io/v2/s33fwb9BGq-1_t_4G4u3stGB5pDU3g0f',
    1,
  );

  console.log(await provider.lookupAddress('0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5'));

  const manager = new Contract(
    '0x24f2a98B9B92c5D00C746bc07cFcc4BA26956F8b',
    abi,
    provider,
  );

  manager.on('Allocate', (
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
    const embed = new MessageEmbed()
      .setTitle('New swap')
      .setAuthor({ name: 'nick.eth (0xff82...9bb0)', iconURL: 'https://metadata.ens.domains/mainnet/avatar/nick.eth', url: 'https://etherscan.io/tx/0xff82df3e9a0562f154d2f1600c02b8410a22cb082e1b67c317e56521c3c89bb0' })
      .setURL('https://etherscan.io')
      .setDescription('**300 DAI** swapped for **1 ETH**')
      .setTimestamp()
      .addFields(
        { name: 'In', value: '3000 DAI', inline: true },
        { name: 'Out', value: '1 ETH', inline: true },
        { name: 'Transaction', value: '[0xff82...9bb0](https://etherscan.io/tx/0xff82df3e9a0562f154d2f1600c02b8410a22cb082e1b67c317e56521c3c89bb0)', inline: true },
      )
      // .setFooter({ text: '[See on Etherscan](https://etherscan.io/tx/0xff82df3e9a0562f154d2f1600c02b8410a22cb082e1b67c317e56521c3c89bb0)' })
      // .setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' });

      msg.channel.send({
        embeds: [embed],
      });
  }
  // msg.reply('Please wait for your turn :eyes:');
});

client.login(process.env.TOKEN);
