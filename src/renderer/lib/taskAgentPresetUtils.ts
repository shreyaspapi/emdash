import type { ProviderCustomConfig } from '@shared/providers/customConfig';
import { PROVIDERS, type ProviderId } from '@shared/providers/registry';

export type ProviderPresetMap = Partial<Record<ProviderId, ProviderCustomConfig>>;
export type PresetTemplateId = 'safe' | 'fast' | 'deep';

const MODEL_FLAG_CANDIDATES_BY_PROVIDER: Partial<Record<ProviderId, string[]>> = {
  codex: ['--model', '-m'],
  claude: ['--model', '-m'],
  gemini: ['--model', '-m'],
  qwen: ['--model', '-m'],
  cursor: ['--model', '-m'],
  copilot: ['--model', '-m'],
  opencode: ['--model', '-m'],
  amp: ['--model', '-m'],
  auggie: ['--model', '-m'],
  kimi: ['--model', '-m'],
  kilocode: ['--model', '-m'],
  cline: ['--model', '-m'],
  continue: ['--model', '-m'],
  codebuff: ['--model', '-m'],
  mistral: ['--model', '-m'],
};

const MODEL_OPTIONS_BY_PROVIDER: Partial<Record<ProviderId, string[]>> = {
  codex: ['gpt-5', 'gpt-5-codex', 'gpt-5-mini'],
  claude: ['claude-opus-4.1', 'claude-sonnet-4', 'claude-haiku-3.5'],
  gemini: ['gemini-2.5-pro', 'gemini-2.5-flash'],
  qwen: ['qwen3-coder-plus', 'qwen3-coder'],
  cursor: ['claude-sonnet-4', 'gpt-5', 'gemini-2.5-pro'],
  copilot: ['gpt-5', 'claude-sonnet-4', 'gemini-2.5-pro'],
  opencode: ['gpt-5', 'claude-sonnet-4', 'gemini-2.5-pro'],
  amp: ['claude-sonnet-4', 'gpt-5', 'gemini-2.5-pro'],
  cline: ['claude-sonnet-4', 'gpt-5', 'gemini-2.5-pro'],
  continue: ['claude-sonnet-4', 'gpt-5', 'gemini-2.5-pro'],
  codebuff: ['claude-sonnet-4', 'gpt-5', 'gemini-2.5-pro'],
  mistral: ['mistral-medium', 'mistral-small'],
};

const UNSAFE_FLAGS = [
  '--full-auto',
  '--dangerously-skip-permissions',
  '--dangerously-allow-all',
  '--allow-all-tools',
  '--yolo',
  '--auto',
];

function cleanWhitespace(value: string | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function getModelFlags(providerId: ProviderId): string[] {
  return MODEL_FLAG_CANDIDATES_BY_PROVIDER[providerId] ?? ['--model', '-m'];
}

export function getModelOptions(providerId: ProviderId): string[] {
  return MODEL_OPTIONS_BY_PROVIDER[providerId] ?? [];
}

export function extractModelFromArgs(providerId: ProviderId, args: string | undefined): string {
  const source = args ?? '';
  if (!source.trim()) return '';

  for (const flag of getModelFlags(providerId)) {
    const escaped = escapeRegExp(flag);
    const assignmentMatch = source.match(new RegExp(`${escaped}\\s*=\\s*(".*?"|'.*?'|\\S+)`, 'i'));
    if (assignmentMatch?.[1]) return stripWrappingQuotes(assignmentMatch[1]);

    const separatedMatch = source.match(new RegExp(`${escaped}\\s+(".*?"|'.*?'|\\S+)`, 'i'));
    if (separatedMatch?.[1]) return stripWrappingQuotes(separatedMatch[1]);
  }

  return '';
}

function stripModelFromArgs(providerId: ProviderId, args: string | undefined): string {
  if (!args?.trim()) return '';

  let next = ` ${args} `;
  for (const flag of getModelFlags(providerId)) {
    const escaped = escapeRegExp(flag);
    next = next.replace(new RegExp(`\\s${escaped}\\s*=\\s*(".*?"|'.*?'|\\S+)`, 'gi'), ' ');
    next = next.replace(new RegExp(`\\s${escaped}\\s+(".*?"|'.*?'|\\S+)`, 'gi'), ' ');
  }

  return cleanWhitespace(next);
}

export function applyModelToArgs(
  providerId: ProviderId,
  args: string | undefined,
  model: string
): string {
  const stripped = stripModelFromArgs(providerId, args);
  const trimmedModel = model.trim();
  if (!trimmedModel) return stripped;

  return cleanWhitespace(`${stripped} --model ${trimmedModel}`);
}

export function stripUnsafeFlags(args: string | undefined): string {
  const tokens = cleanWhitespace(args).split(' ').filter(Boolean);
  const filtered = tokens.filter((token) => !UNSAFE_FLAGS.includes(token));
  return filtered.join(' ');
}

export function getTemplateModel(providerId: ProviderId, template: PresetTemplateId): string {
  const options = getModelOptions(providerId);
  if (options.length === 0) return '';
  if (template === 'fast') return options[options.length - 1];
  if (template === 'deep') return options[0];
  return options[Math.min(1, options.length - 1)];
}

export function sanitizePresetConfig(
  config: ProviderCustomConfig | undefined
): ProviderCustomConfig | undefined {
  if (!config) return undefined;

  const next: ProviderCustomConfig = {
    cli: cleanWhitespace(config.cli),
    resumeFlag: cleanWhitespace(config.resumeFlag),
    defaultArgs: cleanWhitespace(config.defaultArgs),
    extraArgs: cleanWhitespace(config.extraArgs),
    autoApproveFlag: cleanWhitespace(config.autoApproveFlag),
    initialPromptFlag: cleanWhitespace(config.initialPromptFlag),
    env: config.env && Object.keys(config.env).length > 0 ? config.env : undefined,
  };

  if (!next.cli) delete next.cli;
  if (!next.resumeFlag) delete next.resumeFlag;
  if (!next.defaultArgs) delete next.defaultArgs;
  if (!next.extraArgs) delete next.extraArgs;
  if (!next.autoApproveFlag) delete next.autoApproveFlag;
  if (!next.initialPromptFlag) delete next.initialPromptFlag;
  if (!next.env || Object.keys(next.env).length === 0) delete next.env;

  return Object.keys(next).length > 0 ? next : undefined;
}

export function isLikelyFlagSequence(value: string): boolean {
  const trimmed = cleanWhitespace(value);
  if (!trimmed) return true;
  return trimmed
    .split(' ')
    .every((token) => token.startsWith('-') || token.startsWith('"') || token.startsWith("'"));
}

type PresetSummary = {
  providerId: ProviderId;
  providerName: string;
  model: string;
  extraArgs: string;
  envCount: number;
};

export function getPresetSummaries(presets: ProviderPresetMap | null | undefined): PresetSummary[] {
  if (!presets) return [];
  return Object.entries(presets)
    .filter(([providerId, config]) => Boolean(config) && Boolean(providerId))
    .map(([providerId, config]) => {
      const typedProviderId = providerId as ProviderId;
      const providerName =
        PROVIDERS.find((provider) => provider.id === typedProviderId)?.name ?? typedProviderId;
      const typedConfig = config as ProviderCustomConfig;
      return {
        providerId: typedProviderId,
        providerName,
        model: extractModelFromArgs(typedProviderId, typedConfig.defaultArgs),
        extraArgs: cleanWhitespace(typedConfig.extraArgs),
        envCount: Object.keys(typedConfig.env ?? {}).length,
      };
    })
    .sort((a, b) => a.providerName.localeCompare(b.providerName));
}
