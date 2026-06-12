import type { Meta, StoryObj } from '@storybook/react';
import { Header } from '@/components/Header';

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
};

export const Tablet: Story = {
  parameters: { viewport: { defaultViewport: 'tablet' } },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  parameters: { backgrounds: { default: 'ink' } },
};
