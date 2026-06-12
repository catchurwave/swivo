import type { Meta, StoryObj } from '@storybook/react';
import { Layout } from '@/components/Layout';

const meta: Meta<typeof Layout> = {
  title: 'Layout/Layout',
  component: Layout,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof Layout>;

export const Shell: Story = {};
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile' } } };
