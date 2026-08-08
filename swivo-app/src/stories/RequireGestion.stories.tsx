import type { Meta, StoryObj } from '@storybook/react';
import { RequireGestion } from '@/components/RequireGestion';

const meta: Meta<typeof RequireGestion> = {
  title: 'Auth/RequireGestion',
  component: RequireGestion,
  tags: ['autodocs'],
  args: { feature: 'facturation', children: <div className="card p-8 text-center">Contenu protégé débloqué ✅</div> },
};
export default meta;
type Story = StoryObj<typeof RequireGestion>;

export const LockedNoUser: Story = {};

export const LockedNoSubscription: Story = {
  decorators: [
    (Story) => {
      try {
        localStorage.setItem('swivo.user.v1', JSON.stringify({ id: 1, name: 'Camille Test', email: 'c@test.fr', gestion: { active: false } }));
      } catch {}
      return <Story />;
    },
  ],
};

export const Unlocked: Story = {
  decorators: [
    (Story) => {
      try {
        localStorage.setItem('swivo.user.v1', JSON.stringify({ id: 1, name: 'Camille Test', email: 'c@test.fr', gestion: { active: true, until: '2099-12-31' } }));
      } catch {}
      return <Story />;
    },
  ],
};
