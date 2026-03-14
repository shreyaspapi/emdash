// @vitest-environment jsdom
import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ProviderCustomConfig } from '../../shared/providers/customConfig';
import type { ProviderId } from '../../shared/providers/registry';

function Harness({
  TaskAdvancedSettings,
  TaskAgentPresetsModal,
}: {
  TaskAdvancedSettings: (props: any) => React.JSX.Element;
  TaskAgentPresetsModal: (props: any) => React.JSX.Element | null;
}) {
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presets, setPresets] = useState<Partial<Record<ProviderId, ProviderCustomConfig>>>({});

  return (
    <>
      <TaskAdvancedSettings
        isOpen={false}
        projectPath={undefined}
        useWorktree={true}
        onUseWorktreeChange={() => {}}
        autoApprove={false}
        onAutoApproveChange={() => {}}
        hasAutoApproveSupport={true}
        initialPrompt=""
        onInitialPromptChange={() => {}}
        hasInitialPromptSupport={true}
        activeAgents={['codex']}
        configuredAgentPresetCount={0}
        onConfigureAgentPresets={() => setIsPresetModalOpen(true)}
        primaryPresetAgent={'codex'}
        quickPresetModel=""
        quickPresetModelOptions={['gpt-5', 'gpt-5-mini']}
        quickPresetExtraArgs=""
        onQuickPresetModelChange={() => {}}
        onQuickPresetExtraArgsChange={() => {}}
        selectedLinearIssue={null}
        onLinearIssueChange={() => {}}
        isLinearConnected={false}
        onLinearConnect={async () => {}}
        selectedGithubIssue={null}
        onGithubIssueChange={() => {}}
        linkedGithubIssueMap={new Map()}
        isGithubConnected={false}
        onGithubConnect={async () => {}}
        githubLoading={false}
        githubInstalled={false}
        selectedJiraIssue={null}
        onJiraIssueChange={() => {}}
        isJiraConnected={false}
        onJiraConnect={async () => {}}
        selectedGitlabIssue={null}
        onGitlabIssueChange={() => {}}
        isGitlabConnected={false}
        onGitlabConnect={async () => {}}
        selectedPlainThread={null}
        onPlainThreadChange={() => {}}
        isPlainConnected={false}
        onPlainConnect={async () => {}}
        selectedForgejoIssue={null}
        onForgejoIssueChange={() => {}}
        isForgejoConnected={false}
        onForgejoConnect={async () => {}}
      />
      <TaskAgentPresetsModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        agentIds={['codex']}
        value={presets}
        onSave={setPresets}
      />
    </>
  );
}

describe('Task presets modal open behavior', () => {
  it('opens presets dialog when Configure is clicked', async () => {
    (window as any).electronAPI = {
      invoke: vi.fn(async () => ({ success: true })),
      getProviderCustomConfig: vi.fn(async () => ({ success: false, config: undefined })),
    };

    const { TaskAdvancedSettings } = await import('../../renderer/components/TaskAdvancedSettings');
    const { default: TaskAgentPresetsModal } = await import(
      '../../renderer/components/TaskAgentPresetsModal'
    );

    render(
      <Harness
        TaskAdvancedSettings={TaskAdvancedSettings as any}
        TaskAgentPresetsModal={TaskAgentPresetsModal as any}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /advanced options/i }));
    fireEvent.click(screen.getByRole('button', { name: /configure/i }));

    const dialog = await screen.findByRole('dialog', { name: /agent presets/i });
    expect(dialog).toBeTruthy();
  });
});
