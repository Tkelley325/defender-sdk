import { omit } from 'lodash';
import { Relayer } from '../relayer';
import { BigUInt, RelayerParams } from '../models/relayer';
import { PrivateTransactionMode, Speed } from '../models/transactions';
import { isRelayer, isRelayerGroup } from '../ethers/utils';
import {
  EthExecutionAPI,
  JsonRpcPayload,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcResponseWithResult,
  JsonRpcResult,
  LegacySendAsyncProvider,
  SimpleProvider,
} from 'web3';
import { AuthConfig } from '@openzeppelin/defender-sdk-base-client';

type Web3TxPayload = {
  gasPrice: string | undefined;
  maxFeePerGas: BigUInt;
  maxPriorityFeePerGas: BigUInt;
  gas: BigUInt;
  value: string | undefined;
  data: string | undefined;
  to: string | undefined;
  from: string | undefined;
  nonce: string | undefined;
  isPrivate: boolean | undefined;
  privateMode: PrivateTransactionMode | undefined;
};

export type DefenderRelaySenderOptions = Partial<{
  gasPrice: BigUInt;
  maxFeePerGas: BigUInt;
  maxPriorityFeePerGas: BigUInt;
  speed: Speed;
  validForSeconds: number;
}>;

export class DefenderRelaySenderProvider implements LegacySendAsyncProvider {
  protected relayer: Relayer;
  protected id = 1;
  protected txHashToId: Map<string, string> = new Map();

  private address: string | undefined;

  constructor(
    protected base: SimpleProvider<EthExecutionAPI>,
    relayerCredentials: RelayerParams | Relayer,
    protected options: DefenderRelaySenderOptions = {},
  ) {
    this._delegateToProvider(base);
    this.relayer = isRelayer(relayerCredentials) ? relayerCredentials : new Relayer(relayerCredentials);
    if (options) {
      const getUnnecesaryExtraFields = (invalidFields: (keyof DefenderRelaySenderOptions)[]) =>
        invalidFields.map((field: keyof DefenderRelaySenderOptions) => options[field]).filter(Boolean);

      if (options.gasPrice) {
        const unnecesaryExtraFields = getUnnecesaryExtraFields(['maxFeePerGas', 'maxPriorityFeePerGas']);

        if (unnecesaryExtraFields.length > 0)
          throw new Error(`Inconsistent options: gasPrice + (${unnecesaryExtraFields}) not allowed`);
      } else if (options.maxFeePerGas && options.maxPriorityFeePerGas) {
        if (options.maxFeePerGas < options.maxPriorityFeePerGas)
          throw new Error('Inconsistent options: maxFeePerGas should be greater or equal to maxPriorityFeePerGas');
      } else if (options.maxFeePerGas)
        throw new Error('Inconsistent options: maxFeePerGas without maxPriorityFeePerGas specified');
      else if (options.maxPriorityFeePerGas)
        throw new Error('Inconsistent options: maxPriorityFeePerGas without maxFeePerGas specified');
    }
  }

  public get connected(): boolean | undefined {
    return true;
  }

  public getTransactionId(hash: string): string | undefined {
    return this.txHashToId.get(hash);
  }

  protected async getAddress(): Promise<string> {
    if (!this.address) {
      const relayer = await this.relayer.getRelayer();
      if (isRelayerGroup(relayer)) {
        throw new Error('Relayer Group is not supported.');
      }
      this.address = relayer.address;
    }

    return this.address;
  }

  public async request(payload: JsonRpcRequest): Promise<JsonRpcResponseWithResult<any> | unknown> {
    const id = typeof payload.id === 'string' ? parseInt(payload.id) : payload.id ?? this.id++;

    const toJsonRpcResponse = <T>(result: T): JsonRpcResponseWithResult<T> => ({
      jsonrpc: '2.0',
      id,
      result,
    });

    switch (payload.method) {
      case 'eth_sendTransaction':
        return this._sendTransaction(payload.params ?? []).then(toJsonRpcResponse);

      case 'eth_accounts':
        return this._getAccounts(payload.params ?? []).then(toJsonRpcResponse);

      case 'eth_sign':
        return this._signMessage(payload.params ?? []).then(toJsonRpcResponse);

      case 'eth_signTransaction':
        throw new Error(`Method not supported: eth_signTransaction`);
    }

    return this.base.request(payload);
  }

  protected async _getAccounts(params: any[]): Promise<string[]> {
    return [await this.getAddress()];
  }

  protected async _sendTransaction(params: any[]): Promise<string> {
    const tx = params[0] as Web3TxPayload;
    const relayerAddress = (await this.getAddress()).toLowerCase();
    if (tx.from && tx.from.toLowerCase() !== relayerAddress) {
      throw new Error(`Cannot send transaction from ${tx.from}`);
    }

    const gasLimit =
      tx.gas ??
      (await this.request
        .bind(this)({
          method: 'eth_estimateGas',
          params: [{ gasLimit: 1e6, ...tx }],
          jsonrpc: '2.0',
          id: 1,
        })
        .then((response: any) => {
          if (response?.error) {
            throw new Error(`Error estimating gas for transaction: ${JSON.stringify(response.error)}`);
          }
          return response?.result?.toString();
        }));

    const txWithSpeed = this.options.speed
      ? { ...omit(tx, 'gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas'), speed: this.options.speed }
      : tx;
    const payload = { ...this.options, ...txWithSpeed, gasLimit };

    const sent = tx.nonce
      ? await this.relayer.replaceTransactionByNonce(parseInt(tx.nonce), payload)
      : await this.relayer.sendTransaction(payload);

    this.txHashToId.set(sent.hash, sent.transactionId);
    return sent.hash;
  }

  protected async _signMessage(params: any[]): Promise<string> {
    const [from, message] = params as [string, string];
    if (from.toLowerCase() !== (await this.getAddress()).toLowerCase()) {
      throw new Error(`Cannot sign message as ${from}`);
    }

    return this.relayer.sign({ message }).then((r) => r.sig);
  }

  sendAsync<R = JsonRpcResult, P = unknown>(payload: JsonRpcPayload<P>): Promise<JsonRpcResponse<R>> {
    throw new Error('Method not implemented.');
  }

  protected _delegateToProvider(provider: any) {
    // Sorry for all the anys
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = (fn: any) => {
      if (typeof (provider[fn] as any) === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any)[fn] = provider[fn].bind(provider);
      }
    };

    // If the subprovider is a ws or ipc provider, then register all its methods on this provider
    // and delegate calls to the subprovider. This allows subscriptions to work.
    delegate('eventNames');
    delegate('listeners');
    delegate('listenerCount');
    delegate('emit');
    delegate('on');
    delegate('addListener');
    delegate('once');
    delegate('removeListener');
    delegate('off');
    delegate('removeAllListeners');
    delegate('connect');
    delegate('reset');
    delegate('disconnect');
    delegate('supportsSubscriptions');
    delegate('reconnect');
  }
}
