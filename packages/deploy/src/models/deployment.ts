import { Network } from '@openzeppelin/defender-sdk-base-client';
import { Address } from '.';

export type DeploymentStatus = 'submitted' | 'completed' | 'failed' | 'pending';
export type SourceCodeLicense =
  | 'None'
  | 'Unlicense'
  | 'MIT'
  | 'GNU GPLv2'
  | 'GNU GPLv3'
  | 'GNU LGPLv2.1'
  | 'GNU LGPLv3'
  | 'BSD-2-Clause'
  | 'BSD-3-Clause'
  | 'MPL-2.0'
  | 'OSL-3.0'
  | 'Apache-2.0'
  | 'GNU AGPLv3'
  | 'BSL 1.1';

export type TxOverrides = {
  gasLimit?: number;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  confirmations?: number;
};

export interface DeployContractRequest {
  contractName: string;
  contractPath: string;
  network: Network;
  artifactPayload?: string;
  artifactUri?: string;
  value?: string;
  salt?: string;
  verifySourceCode: boolean;
  licenseType?: SourceCodeLicense;
  /**
   * @example { "contracts/Library.sol:LibraryName": "0x1234567890123456789012345678901234567890" }
   */
  libraries?: DeployRequestLibraries;
  constructorInputs?: (string | boolean | number)[];
  constructorBytecode?: string;
  relayerId?: string;
  approvalProcessId?: string;
  createFactoryAddress?: string;
  /**
   * @description Only applies to Relayers approval processes, for other default approval processes it has no effect
   * @default undefined
   */
  txOverrides?: TxOverrides;
  /**
   * @description Key-value pairs to be included in the deployment.
   */
  metadata?: DeployMetadata;
  /**
   * @description The client that made the deployment. For internal use only.
   * @warning this variable does not represent the `tx.origin` of the deployment.
   * @default 'SDK'
   */
  origin?: DeploymentOrigin;
}
export interface DeployRequestLibraries {
  [k: `${string}:${string}`]: string;
}

export interface DeployMetadata {
  commitHash?: string;
  tag?: string;
  [k: string]: any;
}

export interface DeploymentUpdateRequest {
  txHash?: string;
  address?: Address;
}

export type DeploymentOrigin = 'SDK' | 'Foundry' | 'Hardhat' | 'Remix' | 'Wizard';

export interface DeploymentResponse {
  deploymentId: string;
  createdAt: string;
  contractName: string;
  contractPath: string;
  network: Network;
  relayerId?: string;
  approvalProcessId?: string;
  createFactoryAddress?: string;
  address?: Address;
  status: DeploymentStatus;
  pending?: number;
  blockExplorerVerification: BlockExplorerVerification;
  deployDataVerification: string;
  bytecodeVerification: string;
  deploymentArtifactId?: string;
  transactionId?: string;
  txHash?: string;
  abi: string;
  bytecode: string;
  constructorBytecode: string;
  value: string;
  salt?: string;
  licenseType?: SourceCodeLicense;
  libraries?: {
    [k: string]: string;
  };
  constructorInputs?: (string | boolean | number)[];
  origin?: DeploymentOrigin;
}
export interface BlockExplorerVerification {
  status: string;
  error?: string;
  etherscanGuid?: string;
}

export type RequestArtifact = Pick<DeployContractRequest, 'artifactPayload' | 'contractName' | 'contractPath'>;

export type ImmutableReferences = {
  [key: string]: Array<{ length: number; start: number }>;
};

export type ContractArtifact = {
  abi: any;
  evm: {
    bytecode: {
      object: string;
      linkReferences: any;
    };
    deployedBytecode: {
      object: string;
      linkReferences: any;
      immutableReferences: ImmutableReferences;
    };
  };
  metadata: string;
};

export type Artifact = {
  input: {
    sources: {
      [path: string]: {
        content: string;
      };
    };
    settings: any;
    language: string;
  };
  output: {
    contracts: {
      [path: string]: {
        [contractName: string]: ContractArtifact;
      };
    };
  };
};
