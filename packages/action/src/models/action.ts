export interface CreateActionRequest {
  name: string;
  encodedZippedCode: string;
  relayerId?: string;
  trigger: {
    type: 'schedule' | 'webhook' | 'sentinel' | 'monitor-filter';
    frequencyMinutes?: number;
    frequencySeconds?: number;
    cron?: string;
  };
  paused: boolean;
  stackResourceId?: string;
  dependenciesVersion?: string;
  environmentVariables?: EnvironmentVariables;
}

export interface UpdateActionRequest extends Omit<CreateActionRequest, 'encodedZippedCode'> {
  actionId: string;
  encodedZippedCode?: string;
}

export interface ScheduleTrigger {
  type: 'schedule';
  frequencyMinutes?: number;
  frequencySeconds?: number;
  cron?: string;
}

export interface WebhookTrigger {
  type: 'webhook';
  token: string;
}

export interface SentinelTrigger {
  type: 'sentinel';
}

export interface MonitorFilterTrigger {
  type: 'monitor-filter';
}

export interface Action
  extends Pick<
    CreateActionRequest,
    'name' | 'relayerId' | 'paused' | 'stackResourceId' | 'dependenciesVersion' | 'environmentVariables'
  > {
  actionId: string;
  encodedZippedCode?: string;
  trigger: ScheduleTrigger | WebhookTrigger | SentinelTrigger | MonitorFilterTrigger;
  createdAt?: string;
  codeDigest?: string;
}

export interface SaveSecretsRequest {
  deletes: string[];
  secrets: SecretsMap;
}
export interface SecretsMap {
  [k: string]: string;
}

export interface GetSecretsResponse {
  secretNames?: string[];
}

export type EnvironmentVariables = { [key: string]: string };
