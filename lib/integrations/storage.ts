/**
 * meta: module=integrations-storage owner=platform stage=alpha
 */

export type ExternalStorageProvider = 'sharepoint' | 'google-drive';

export interface ExternalStorageAdapterConfig {
  provider: ExternalStorageProvider;
  rootFolder: string;
  siteUrl?: string;
  driveId?: string;
  clientId?: string;
  clientSecret?: string;
  enabled: boolean;
}

export interface ExternalStorageSyncAttachment {
  name: string;
  url: string;
  mimeType?: string | null;
}

export interface ExternalAttachmentSyncResult {
  provider: ExternalStorageProvider;
  synced: Array<{ name: string; sourceUrl: string; externalUrl: string }>;
  skipped: number;
}

function resolveConfiguredAdapters(): ExternalStorageAdapterConfig[] {
  const providers = process.env.MARKETPLACE_STORAGE_PROVIDERS;
  if (!providers) {
    return [];
  }

  try {
    const parsed = JSON.parse(providers) as ExternalStorageAdapterConfig[];
    return parsed.filter((entry) => entry && entry.enabled !== false);
  } catch (error) {
    console.error('[integrations][storage][config-invalid]', error);
    return [];
  }
}

function buildExternalUrl(provider: ExternalStorageProvider, rootFolder: string, revisionId: string, attachment: ExternalStorageSyncAttachment) {
  const safeName = encodeURIComponent(attachment.name || 'attachment');
  return `external://${provider}/${rootFolder}/${revisionId}/${safeName}`;
}

async function syncWithAdapter(
  config: ExternalStorageAdapterConfig,
  payload: {
    negotiationId: string;
    contractId: string;
    revisionId: string;
    attachments: ExternalStorageSyncAttachment[];
  }
): Promise<ExternalAttachmentSyncResult> {
  if (!config.enabled || payload.attachments.length === 0) {
    return { provider: config.provider, synced: [], skipped: payload.attachments.length };
  }

  const synced = payload.attachments.map((attachment) => ({
    name: attachment.name,
    sourceUrl: attachment.url,
    externalUrl: buildExternalUrl(config.provider, config.rootFolder, payload.revisionId, attachment),
  }));

  return { provider: config.provider, synced, skipped: 0 };
}

export async function syncContractRevisionAttachments(payload: {
  negotiationId: string;
  contractId: string;
  revisionId: string;
  attachments: ExternalStorageSyncAttachment[];
}): Promise<ExternalAttachmentSyncResult[]> {
  const configs = resolveConfiguredAdapters();
  if (configs.length === 0 || payload.attachments.length === 0) {
    return [];
  }

  const results = await Promise.all(configs.map((config) => syncWithAdapter(config, payload)));
  return results;
}
