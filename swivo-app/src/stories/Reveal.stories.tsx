import type { Meta, StoryObj } from '@storybook/react';
import { Reveal } from '@/components/Reveal';

const meta: Meta<typeof Reveal> = {
  title: 'Effects/Reveal',
  component: Reveal,
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'select', options: ['up', 'left', 'right', 'scale'] },
    delay: { control: { type: 'number', min: 0, max: 1000, step: 50 } },
    once: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Reveal>;

const Card = ({ label }: { label: string }) => (
  <div className="card flex h-32 items-center justify-center p-6 text-center">
    <span className="font-display text-lg">{label}</span>
  </div>
);

export const Up: Story = { args: { direction: 'up' }, render: (a) => <Reveal {...a}><Card label="Up" /></Reveal> };
export const Left: Story = { args: { direction: 'left' }, render: (a) => <Reveal {...a}><Card label="Left" /></Reveal> };
export const Right: Story = { args: { direction: 'right' }, render: (a) => <Reveal {...a}><Card label="Right" /></Reveal> };
export const Scale: Story = { args: { direction: 'scale' }, render: (a) => <Reveal {...a}><Card label="Scale" /></Reveal> };

export const Staggered: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-3">
      {[0, 120, 240, 360, 480, 600].map((delay) => (
        <Reveal key={delay} delay={delay}><Card label={`+${delay}ms`} /></Reveal>
      ))}
    </div>
  ),
};
