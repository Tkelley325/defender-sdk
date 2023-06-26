import { BaseApiClient } from '@openzeppelin/platform-sdk-base-client';
import {
  ApiRelayerParams,
  IRelayer,
  JsonRpcResponse,
  ListTransactionsRequest,
  RelayerGetResponse,
  RelayerTransaction,
  RelayerTransactionPayload,
  SignedMessagePayload,
  SignTypedDataPayload,
  SignMessagePayload,
  CreateRelayerRequest,
  RelayerListResponse,
  UpdateRelayerPoliciesRequest,
  UpdateRelayerRequest,
  RelayerApiKey,
  DeleteRelayerApiKeyResponse,
} from '../models';

export const RelaySignerApiUrl = () =>
  process.env.PLATFORM_RELAY_SIGNER_API_URL || 'https://api.defender.openzeppelin.com/';

export class RelayClient extends BaseApiClient {
  protected getPoolId(): string {
    return process.env.PLATFORM_POOL_ID || 'us-west-2_94f3puJWv';
  }

  protected getPoolClientId(): string {
    return process.env.PLATFORM_POOL_CLIENT_ID || '40e58hbc7pktmnp9i26hh5nsav';
  }

  protected getApiUrl(): string {
    return process.env.PLATFORM_API_URL || 'https://defender-api.openzeppelin.com/relayer/';
  }

  public async get({ relayerId }: { relayerId: string }): Promise<RelayerGetResponse> {
    return this.apiCall(async (api) => {
      return await api.get(`/relayers/${relayerId}`);
    });
  }

  public async list(): Promise<RelayerListResponse> {
    return this.apiCall(async (api) => {
      return await api.get('/relayers/summary');
    });
  }

  public async create({ relayer }: { relayer: CreateRelayerRequest }): Promise<RelayerGetResponse> {
    return this.apiCall(async (api) => {
      return await api.post('/relayers', relayer);
    });
  }

  public async update({ relayerId, relayerUpdateParams }: {relayerId: string, relayerUpdateParams: UpdateRelayerRequest }): Promise<RelayerGetResponse> {
    const currentRelayer = await this.get({ relayerId });

    if (relayerUpdateParams.policies) {
      const relayerPolicies = {
        ...currentRelayer.policies,
        ...relayerUpdateParams.policies,
      };
      const updatedRelayer = await this.updatePolicies({ relayerId, relayerPolicies });
      // if policies are the only update, return
      if (Object.keys(relayerUpdateParams).length === 1) return updatedRelayer;
    }

    return this.apiCall(async (api) => {
      return await api.put(`/relayers`, {
        ...currentRelayer,
        ...relayerUpdateParams,
      });
    });
  }

  private async updatePolicies({ relayerId, relayerPolicies }: {
    relayerId: string,
    relayerPolicies: UpdateRelayerPoliciesRequest,
  }): Promise<RelayerGetResponse> {
    return this.apiCall(async (api) => {
      return await api.put(`/relayers/${relayerId}`, relayerPolicies);
    });
  }

  public async createKey({ relayerId, stackResourceId }: {relayerId: string, stackResourceId?: string}): Promise<RelayerApiKey> {
    return this.apiCall(async (api) => {
      return await api.post(`/relayers/${relayerId}/keys`, { stackResourceId });
    });
  }

  public async listKeys({ relayerId }: { relayerId: string }): Promise<RelayerApiKey[]> {
    return this.apiCall(async (api) => {
      return await api.get(`/relayers/${relayerId}/keys`);
    });
  }

  public async deleteKey({ relayerId, keyId }: { relayerId: string, keyId: string }): Promise<DeleteRelayerApiKeyResponse> {
    return this.apiCall(async (api) => {
      return await api.delete(`/relayers/${relayerId}/keys/${keyId}`);
    });
  }
}

export class ApiRelayer extends BaseApiClient implements IRelayer {
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
    return RelaySignerApiUrl();
  }

  public async getRelayer(): Promise<RelayerGetResponse> {
    return this.apiCall(async (api) => {
      return (await api.get('/relayer')) as RelayerGetResponse;
    });
  }

  public async sendTransaction({ payload }: { payload: RelayerTransactionPayload }): Promise<RelayerTransaction> {
    return this.apiCall(async (api) => {
      return (await api.post('/txs', payload)) as RelayerTransaction;
    });
  }

  public async replaceTransactionById({ id, payload }: { id: string, payload: RelayerTransactionPayload }): Promise<RelayerTransaction> {
    return this.apiCall(async (api) => {
      return (await api.put(`/txs/${id}`, payload)) as RelayerTransaction;
    });
  }

  public async replaceTransactionByNonce({ nonce, payload }: {
    nonce: number,
    payload: RelayerTransactionPayload,
  }): Promise<RelayerTransaction> {
    return this.apiCall(async (api) => {
      return (await api.put(`/txs/${nonce}`, payload)) as RelayerTransaction;
    });
  }

  public async signTypedData({ payload }: { payload: SignTypedDataPayload }): Promise<SignedMessagePayload> {
    return this.apiCall(async (api) => {
      return (await api.post('/sign-typed-data', payload)) as SignedMessagePayload;
    });
  }

  public async sign({ payload }: { payload: SignMessagePayload }): Promise<SignedMessagePayload> {
    return this.apiCall(async (api) => {
      return (await api.post('/sign', payload)) as SignedMessagePayload;
    });
  }

  public async query({ id }: { id: string }): Promise<RelayerTransaction> {
    return this.apiCall(async (api) => {
      return (await api.get(`txs/${id}`)) as RelayerTransaction;
    });
  }

  public async list({ criteria }: { criteria?: ListTransactionsRequest }): Promise<RelayerTransaction[]> {
    return this.apiCall(async (api) => {
      return (await api.get(`txs`, { params: criteria ?? {} })) as RelayerTransaction[];
    });
  }

  public async call({ method, params }: { method: string, params: string[] }): Promise<JsonRpcResponse> {
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
