import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from '@/components/ThemeToggle';

const meta: Meta<typeof ThemeToggle> = {
  title: 'Layout/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {};
export const Dark: Story = { globals: { theme: 'dark' }, parameters: { backgrounds: { default: 'ink' } } };
