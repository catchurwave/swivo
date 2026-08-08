import type { Meta, StoryObj } from '@storybook/react';
import {
  IllustrationHero,
  IllustrationChat,
  IllustrationDossier,
  IllustrationGrowth,
  IllustrationShield,
} from '@/components/Illustrations';

const meta: Meta = {
  title: 'Brand/Illustrations',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Hero: Story    = { render: () => <IllustrationHero className="h-80 w-full" /> };
export const Chat: Story    = { render: () => <IllustrationChat className="h-60 w-full" /> };
export const Dossier: Story = { render: () => <IllustrationDossier className="h-60 w-full" /> };
export const Growth: Story  = { render: () => <IllustrationGrowth className="h-60 w-full" /> };
export const Shield: Story  = { render: () => <IllustrationShield className="h-60 w-full" /> };

export const Gallery: Story = {
  render: () => (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="card p-4"><IllustrationHero className="h-48 w-full" /><p className="mt-2 text-xs text-ink-muted">Hero</p></div>
      <div className="card p-4"><IllustrationChat className="h-48 w-full" /><p className="mt-2 text-xs text-ink-muted">Chat</p></div>
      <div className="card p-4"><IllustrationDossier className="h-48 w-full" /><p className="mt-2 text-xs text-ink-muted">Dossier</p></div>
      <div className="card p-4"><IllustrationGrowth className="h-48 w-full" /><p className="mt-2 text-xs text-ink-muted">Growth</p></div>
      <div className="card p-4 sm:col-span-2"><IllustrationShield className="h-48 w-full" /><p className="mt-2 text-xs text-ink-muted">Shield</p></div>
    </div>
  ),
};
