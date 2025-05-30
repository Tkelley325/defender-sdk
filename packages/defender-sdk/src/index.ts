import { MonitorClient } from '@openzeppelin/defender-sdk-monitor-client';
import { ActionClient } from '@openzeppelin/defender-sdk-action-client';
import { RelayClient } from '@openzeppelin/defender-sdk-relay-client';
import { ProposalClient } from '@openzeppelin/defender-sdk-proposal-client';
import { DeployClient } from '@openzeppelin/defender-sdk-deploy-client';
import { NotificationChannelClient } from '@openzeppelin/defender-sdk-notification-channel-client';
import { NetworkClient } from '@openzeppelin/defender-sdk-network-client';
import { AccountClient } from '@openzeppelin/defender-sdk-account-client';
import { ApprovalProcessClient } from '@openzeppelin/defender-sdk-approval-process-client';
import { RelayGroupClient } from '@openzeppelin/defender-sdk-relay-group-client';
import { KeyValueStoreClient, LocalKeyValueStoreCreateParams } from '@openzeppelin/defender-sdk-key-value-store-client';
import { AddressBookClient } from '@openzeppelin/defender-sdk-address-book-client';
import { Newable, ClientParams } from './types';
import { ActionRelayerParams, Relayer as RelaySignerClient } from '@openzeppelin/defender-sdk-relay-signer-client';
import {
  ListNetworkRequestOptions,
  NetworkDefinition,
} from '@openzeppelin/defender-sdk-network-client/lib/models/networks';
import { AuthConfig, Network, RetryConfig } from '@openzeppelin/defender-sdk-base-client';
import https from 'https';
import {
  isActionKVStoreCredentials,
  isActionRelayerCredentials,
  isApiCredentials,
  isRelaySignerOptions,
} from './utils';

export interface DefenderOptions {
  apiKey?: string;
  apiSecret?: string;
  relayerApiKey?: string;
  relayerApiSecret?: string;
  credentials?: ActionRelayerParams;
  relayerARN?: string;
  httpsAgent?: https.Agent;
  retryConfig?: RetryConfig;
  useCredentialsCaching?: boolean;
  kvstoreARN?: string;
}

function getClient<T>(Client: Newable<T>, credentials: Partial<ClientParams> | ActionRelayerParams): T {
  if (
    !isActionRelayerCredentials(credentials) &&
    !isApiCredentials(credentials) &&
    !isActionKVStoreCredentials(credentials)
  ) {
    throw new Error(`API key and secret are required`);
  }

  return new Client(credentials);
}

export class Defender {
  private apiKey: string | undefined;
  private apiSecret: string | undefined;
  private relayerApiKey: string | undefined;
  private relayerApiSecret: string | undefined;
  private actionCredentials: ActionRelayerParams | undefined;
  private actionRelayerArn: string | undefined;
  private actionKVStoreArn: string | undefined;
  private httpsAgent?: https.Agent;
  private retryConfig?: RetryConfig;
  private authConfig?: AuthConfig;

  constructor(options: DefenderOptions) {
    this.apiKey = options.apiKey;
    this.apiSecret = options.apiSecret;
    this.relayerApiKey = options.relayerApiKey;
    this.relayerApiSecret = options.relayerApiSecret;
    // support for using relaySigner from Defender Actions
    this.actionCredentials = options.credentials;
    this.actionRelayerArn = options.relayerARN;
    this.actionKVStoreArn = options.kvstoreARN;
    this.httpsAgent = options.httpsAgent;
    this.retryConfig = options.retryConfig;
    this.authConfig = {
      useCredentialsCaching: options.useCredentialsCaching ?? true,
      type: isRelaySignerOptions(options) ? 'relay' : 'admin',
    };
  }

  public async networks(params: ListNetworkRequestOptions & { includeDefinition: true }): Promise<NetworkDefinition[]>;
  public async networks(params?: ListNetworkRequestOptions & { includeDefinition?: false }): Promise<Network[]>;

  public networks(opts: ListNetworkRequestOptions = {}): Promise<Network[] | NetworkDefinition[]> {
    const client = getClient(NetworkClient, {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      httpsAgent: this.httpsAgent,
      retryConfig: this.retryConfig,
      authConfig: this.authConfig,
    });

    return opts.includeDefinition
      ? client.listSupportedNetworks({ ...opts, includeDefinition: true })
      : client.listSupportedNetworks({ ...opts, includeDefinition: false });
  }

  get network() {
    return getClient(NetworkClient, {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      httpsAgent: this.httpsAgent,
      retryConfig: this.retryConfig,
      authConfig: this.authConfig,
    });
  }

  get account() {
    return getClient(AccountClient, {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      httpsAgent: this.httpsAgent,
      retryConfig: this.retryConfig,
      authConfig: this.authConfig,
    });
  }

  get approvalProcess() {
    return getClient(ApprovalProcessClient, { apiKey: this.apiKey, apiSecret: this.apiSecret });
  }

  get monitor() {
    return getClient(MonitorClient, {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      httpsAgent: this.httpsAgent,
      retryConfig: this.retryConfig,
      authConfig: this.authConfig,
    });
  }

  get action() {
    return getClient(ActionClient, {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      httpsAgent: this.httpsAgent,
      retryConfig: this.retryConfig,
      authConfig: this.authConfig,
    });
  }

  get relay() {
    return getClient(RelayClient, {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      httpsAgent: this.httpsAgent,
      retryConfig: this.retryConfig,
      authConfig: this.authConfig,
    });
  }

  get relayGroup() {
    return getClient(RelayGroupClient, {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      httpsAgent: this.httpsAgent,
      retryConfig: this.retryConfig,
      authConfig: this.authConfig,
    });
  }

  get proposal() {
    return getClient(ProposalClient, {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      httpsAgent: this.httpsAgent,
      retryConfig: this.retryConfig,
      authConfig: this.authConfig,
    });
  }

  get deploy() {
    return getClient(DeployClient, {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      httpsAgent: this.httpsAgent,
      retryConfig: this.retryConfig,
      authConfig: this.authConfig,
    });
  }

  get notificationChannel() {
    return getClient(NotificationChannelClient, {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      httpsAgent: this.httpsAgent,
      retryConfig: this.retryConfig,
      authConfig: this.authConfig,
    });
  }

  get relaySigner() {
    return getClient(RelaySignerClient, {
      httpsAgent: this.httpsAgent,
      retryConfig: this.retryConfig,
      authConfig: this.authConfig,
      ...(this.actionCredentials ? { credentials: this.actionCredentials } : undefined),
      ...(this.actionRelayerArn ? { relayerARN: this.actionRelayerArn } : undefined),
      ...(this.relayerApiKey ? { apiKey: this.relayerApiKey } : undefined),
      ...(this.relayerApiSecret ? { apiSecret: this.relayerApiSecret } : undefined),
    });
  }

  get addressBook() {
    return getClient(AddressBookClient, {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      httpsAgent: this.httpsAgent,
      retryConfig: this.retryConfig,
      authConfig: this.authConfig,
    });
  }

  get keyValueStore() {
    return getClient(KeyValueStoreClient, {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      httpsAgent: this.httpsAgent,
      retryConfig: this.retryConfig,
      authConfig: this.authConfig,
      ...(this.actionCredentials ? { credentials: this.actionCredentials } : undefined),
      ...(this.actionKVStoreArn ? { kvstoreARN: this.actionKVStoreArn } : undefined),
    });
  }

  static localKVStoreClient(params: LocalKeyValueStoreCreateParams) {
    if (!params.path) {
      throw new Error(`Must provide a path for local key-value store`);
    }
    return new KeyValueStoreClient(params);
  }
}
