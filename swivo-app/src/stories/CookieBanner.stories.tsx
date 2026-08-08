import type { Meta, StoryObj } from '@storybook/react';
import { CookieBanner } from '@/components/CookieBanner';

const meta: Meta<typeof CookieBanner> = {
  title: 'RGPD/CookieBanner',
  component: CookieBanner,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => {
      try { localStorage.removeItem('swivo.consent.v1'); } catch {}
      return <Story />;
    },
  ],
};
export default meta;
type Story = StoryObj<typeof CookieBanner>;

export const FirstVisit: Story = {};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
};
