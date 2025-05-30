import { Network } from '@openzeppelin/defender-sdk-base-client';
import { ProposalResponse } from '..';

// Copied from openzeppelin/defender/models/src/types/proposal-api.req.d.ts
export type Hex = string;
export type Address = string;
export type BigUInt = string | number;
export type ProposalType = ProposalStepType | ProposalBatchType;
export type ProposalStepType = 'upgrade' | 'custom' | 'pause' | 'send-funds' | 'access-control';
export type ProposalBatchType = 'batch';
export type ProposalFunctionInputs = (string | boolean | (string | boolean)[])[];

export interface ExternalApiCreateProposalRequest {
  contract: PartialContract | PartialContract[];
  title: string;
  description: string;
  type: ProposalType;
  metadata?: ProposalMetadata;
  via?: Address;
  /**
   * The type of account or mechanism that will execute the proposal:
   * - 'EOA'              : An externally owned account          (hot wallet)
   * - 'Safe'             : A Safe multi-signature wallet        (formerly Gnosis Safe)
   * - 'Gnosis Multisig'  : A legacy Gnosis multi-signature wallet      (not Safe)
   * - 'Relayer'          : A Defender Relayer                  (cloud signer)
   */
  viaType?: 'EOA' | 'Safe' | 'Gnosis Multisig' | 'Relayer';
  functionInterface?: ProposalTargetFunction;
  functionInputs?: ProposalFunctionInputs;
  steps?: ProposalStep[];
  relayerId?: string;
}

export interface PartialContract {
  network: Network;
  address: Address;
  name?: string;
  abi?: string;
}

export interface ProposalStep {
  contractId: string;
  targetFunction?: ProposalTargetFunction;
  functionInputs?: ProposalFunctionInputs;
  metadata?: ProposalMetadata;
  type: ProposalStepType;
}

export interface ProposalMetadata {
  newImplementationAddress?: Address;
  newImplementationAbi?: string;
  proxyAdminAddress?: Address;
  action?: 'pause' | 'unpause' | 'grantRole' | 'revokeRole';
  operationType?: 'call' | 'delegateCall';
  account?: Address;
  role?: Hex;
  sendTo?: Address;
  sendValue?: BigUInt;
  sendCurrency?: Token | NativeCurrency;
}
export interface ProposalTargetFunction {
  name?: string;
  inputs?: ProposalFunctionInputType[];
}
export interface ProposalFunctionInputType {
  name?: string;
  type: string;
  internalType?: string;
  components?: ProposalFunctionInputType[];
}

export interface Token {
  name: string;
  symbol: string;
  address: Address;
  network: Network;
  decimals: number;
  type: 'ERC20';
}
export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
  type: 'native';
}

export interface ProposalListPaginatedResponse {
  items: ProposalResponse[];
  next?: string;
}
