import { IRelayer, RelayerGetResponse, RelayerParams, RelayerStatus } from './models/relayer';
import { JsonRpcResponse, SignMessagePayload, SignTypedDataPayload, SignedMessagePayload } from './models/rpc';
import {
  ListTransactionsRequest,
  PaginatedTransactionResponse,
  RelayerTransaction,
  RelayerTransactionPayload,
} from './models/transactions';
import { isApiCredentials, isActionCredentials, validatePayload } from './ethers/utils';
import { RelaySignerClient } from './api';
import { DefenderRelayProvider, DefenderRelaySigner, DefenderRelaySignerOptions } from './ethers';
import { JsonRpcProvider } from 'ethers';
import { DefenderRelayProviderV5 } from './ethers/provider-v5';
import { DefenderRelaySignerOptionsV5, DefenderRelaySignerV5 } from './ethers/signer-v5';
import { Provider } from '@ethersproject/abstract-provider';

export class Relayer implements IRelayer {
  private relayer: IRelayer;
  private credentials: RelayerParams;

  public constructor(credentials: RelayerParams) {
    this.credentials = credentials;
    if (isActionCredentials(credentials)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ActionRelayer } = require('./action');
      this.relayer = new ActionRelayer(credentials);
    } else if (isApiCredentials(credentials)) {
      this.relayer = new RelaySignerClient(credentials);
    } else {
      throw new Error(
        `Missing credentials for creating a Relayer instance. If you are running this code in an Action, make sure you pass the "credentials" parameter from the handler to the Relayer constructor. If you are running this on your own process, then pass an object with the "apiKey" and "apiSecret" generated by the relayer.`,
      );
    }
  }

  public getRelayer(): Promise<RelayerGetResponse> {
    return this.relayer.getRelayer();
  }

  public getRelayerStatus(): Promise<RelayerStatus> {
    return this.relayer.getRelayerStatus();
  }

  public getProvider(): DefenderRelayProvider {
    if (!this.credentials) throw new Error(`Missing credentials for creating a DefenderRelayProvider instance.`);
    else return new DefenderRelayProvider(this.credentials);
  }

  public getProviderV5(): DefenderRelayProviderV5 {
    if (!this.credentials) throw new Error(`Missing credentials for creating a DefenderRelayProvider instance.`);
    return new DefenderRelayProviderV5(this.credentials);
  }

  public async getSigner(
    provider: JsonRpcProvider,
    options: DefenderRelaySignerOptions = {},
  ): Promise<DefenderRelaySigner> {
    if (!this.credentials) throw new Error(`Missing credentials for creating a DefenderRelaySigner instance.`);
    const relayer = await this.relayer.getRelayer();
    return new DefenderRelaySigner(this.credentials, provider, relayer.address, options);
  }

  public getSignerV5(provider: Provider, options: DefenderRelaySignerOptionsV5): DefenderRelaySignerV5 {
    if (!this.credentials) throw new Error(`Missing credentials for creating a DefenderRelaySigner instance.`);
    return new DefenderRelaySignerV5(this.credentials, provider, options);
  }

  public sign(payload: SignMessagePayload): Promise<SignedMessagePayload> {
    return this.relayer.sign(payload);
  }

  public signTypedData(payload: SignTypedDataPayload): Promise<SignedMessagePayload> {
    return this.relayer.signTypedData(payload);
  }

  public sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    validatePayload(payload);
    return this.relayer.sendTransaction(payload);
  }

  public replaceTransactionById(id: string, payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    validatePayload(payload);
    return this.relayer.replaceTransactionById(id, payload);
  }

  public replaceTransactionByNonce(nonce: number, payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    validatePayload(payload);
    return this.relayer.replaceTransactionByNonce(nonce, payload);
  }

  public getTransaction(id: string): Promise<RelayerTransaction> {
    return this.relayer.getTransaction(id);
  }

  public listTransactions(
    criteria?: ListTransactionsRequest,
  ): Promise<RelayerTransaction[] | PaginatedTransactionResponse> {
    return this.relayer.listTransactions(criteria);
  }

  public call({ method, params }: { method: string; params: string[] }): Promise<JsonRpcResponse> {
    return this.relayer.call({ method, params });
  }
}
