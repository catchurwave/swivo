import type { Meta, StoryObj } from '@storybook/react';
import { Logo } from '@/components/Logo';

const meta: Meta<typeof Logo> = {
  title: 'Brand/Logo',
  component: Logo,
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
    mark: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Logo>;

export const Default: Story = { args: { className: 'h-10 w-auto' } };
export const MarkOnly: Story = { args: { mark: true, className: 'h-12 w-12' } };
export const Large: Story = { args: { className: 'h-20 w-auto' } };
export const OnDark: Story = {
  args: { className: 'h-10 w-auto text-ink-inverse' },
  parameters: { backgrounds: { default: 'ink' } },
};
