import { BaseApiClient } from '@openzeppelin/platform-sdk-base-client';
import { ApiRelayerParams, IRelayer, RelayerGetResponse } from '../models/relayer';
import { ListTransactionsRequest, RelayerTransaction, RelayerTransactionPayload } from '../models/transactions';
import { JsonRpcResponse, SignMessagePayload, SignTypedDataPayload, SignedMessagePayload } from '../models/rpc';

export const getRelaySignerApiUrl = () =>
  process.env.PLATFORM_RELAY_SIGNER_API_URL || 'https://api.defender.openzeppelin.com/';

export class RelaySignerClient extends BaseApiClient implements IRelayer {
  private jsonRpcRequestNextId: number;

  public constructor(params: ApiRelayerParams) {
    super(params);
    this.jsonRpcRequestNextId = 1;
  }

  protected getPoolId(): string {
    return process.env.PLATFORM_RELAY_SIGNER_POOL_ID || 'us-west-2_iLmIggsiy';
  }

  protected getPoolClientId(): string {
    return process.env.PLATFORM_RELAY_SIGNER_POOL_CLIENT_ID || '1bpd19lcr33qvg5cr3oi79rdap';
  }

  protected getApiUrl(): string {
    return getRelaySignerApiUrl();
  }

  public async getRelayer(): Promise<RelayerGetResponse> {
    return this.apiCall(async (api) => {
      return (await api.get('/relayer')) as RelayerGetResponse;
    });
  }

  public async sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    return this.apiCall(async (api) => {
      return (await api.post('/txs', payload)) as RelayerTransaction;
    });
  }

  public async replaceTransactionById({
    id,
    payload,
  }: {
    id: string;
    payload: RelayerTransactionPayload;
  }): Promise<RelayerTransaction> {
    return this.apiCall(async (api) => {
      return (await api.put(`/txs/${id}`, payload)) as RelayerTransaction;
    });
  }

  public async replaceTransactionByNonce({
    nonce,
    payload,
  }: {
    nonce: number;
    payload: RelayerTransactionPayload;
  }): Promise<RelayerTransaction> {
    return this.apiCall(async (api) => {
      return (await api.put(`/txs/${nonce}`, payload)) as RelayerTransaction;
    });
  }

  public async signTypedData(payload: SignTypedDataPayload): Promise<SignedMessagePayload> {
    return this.apiCall(async (api) => {
      return (await api.post('/sign-typed-data', payload)) as SignedMessagePayload;
    });
  }

  public async sign(payload: SignMessagePayload): Promise<SignedMessagePayload> {
    return this.apiCall(async (api) => {
      return (await api.post('/sign', payload)) as SignedMessagePayload;
    });
  }

  public async getTransaction({ id }: { id: string }): Promise<RelayerTransaction> {
    return this.apiCall(async (api) => {
      return (await api.get(`txs/${id}`)) as RelayerTransaction;
    });
  }

  public async listTransactions(criteria?: ListTransactionsRequest): Promise<RelayerTransaction[]> {
    return this.apiCall(async (api) => {
      return (await api.get(`txs`, { params: criteria ?? {} })) as RelayerTransaction[];
    });
  }

  public async call({ method, params }: { method: string; params: string[] }): Promise<JsonRpcResponse> {
    return this.apiCall(async (api) => {
      return (await api.post(`/relayer/jsonrpc`, {
        method,
        params,
        jsonrpc: '2.0',
        id: this.jsonRpcRequestNextId++,
      })) as JsonRpcResponse;
    });
  }
}