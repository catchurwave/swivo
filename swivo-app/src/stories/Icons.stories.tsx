import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from '@/components/Icons';

const meta: Meta = {
  title: 'Brand/Icons',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4 sm:grid-cols-6">
      {Object.entries(Icon).map(([name, Cmp]) => (
        <div key={name} className="card flex flex-col items-center gap-2 p-4">
          <Cmp className="h-7 w-7 text-primary-700" />
          <span className="font-mono text-xs text-ink-muted">{name}</span>
        </div>
      ))}
    </div>
  ),
};

export const SizeVariants: Story = {
  render: () => (
    <div className="flex items-end gap-6 text-primary-700">
      <Icon.Shield className="h-4 w-4" />
      <Icon.Shield className="h-6 w-6" />
      <Icon.Shield className="h-8 w-8" />
      <Icon.Shield className="h-12 w-12" />
      <Icon.Shield className="h-16 w-16" />
    </div>
  ),
};

export const ColorVariants: Story = {
  render: () => (
    <div className="flex gap-6">
      <Icon.Bolt className="h-8 w-8 text-primary-600" />
      <Icon.Bolt className="h-8 w-8 text-secondary-600" />
      <Icon.Bolt className="h-8 w-8 text-amber-500" />
      <Icon.Bolt className="h-8 w-8 text-rose-600" />
      <Icon.Bolt className="h-8 w-8 text-ink" />
    </div>
  ),
};
