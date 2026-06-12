import type { Meta, StoryObj } from '@storybook/react';
import { ChatbotWidget } from '@/components/ChatbotWidget';

const meta: Meta<typeof ChatbotWidget> = {
  title: 'Marketing/ChatbotWidget',
  component: ChatbotWidget,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof ChatbotWidget>;

export const Default: Story = {};
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile' } } };
export const Dark: Story = { globals: { theme: 'dark' } };
