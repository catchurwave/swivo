import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = { title: 'Docs/Design Tokens', tags: ['autodocs'] };
export default meta;
type Story = StoryObj;

const colorScale = (name: string, prefix: string, shades: number[]) => (
  <div className="space-y-2">
    <p className="font-display text-sm font-semibold text-ink">{name}</p>
    <div className="flex flex-wrap gap-2">
      {shades.map((s) => (
        <div key={s} className="flex flex-col items-center">
          <div className={`h-14 w-14 rounded-lg shadow-soft bg-${prefix}-${s}`} />
          <span className="mt-1 font-mono text-[10px] text-ink-muted">{s}</span>
        </div>
      ))}
    </div>
  </div>
);

export const Colors: Story = {
  render: () => (
    <div className="space-y-6">
      {colorScale('Primary', 'primary', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900])}
      {colorScale('Secondary', 'secondary', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900])}
      {colorScale('Accent', 'accent', [300, 400, 500, 600])}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4"><div className="h-10 rounded bg-surface border border-surface-border" /><p className="mt-2 text-xs">surface</p></div>
        <div className="card p-4"><div className="h-10 rounded bg-surface-muted" /><p className="mt-2 text-xs">surface-muted</p></div>
        <div className="card p-4"><div className="h-10 rounded bg-ink" /><p className="mt-2 text-xs">ink</p></div>
      </div>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="space-y-4">
      <h1 className="font-display text-6xl font-bold text-ink">Display 6xl</h1>
      <h1 className="font-display text-5xl font-bold text-ink">Display 5xl</h1>
      <h2 className="font-display text-4xl font-bold text-ink">Heading 4xl</h2>
      <h3 className="font-display text-3xl font-bold text-ink">Heading 3xl</h3>
      <h4 className="font-display text-2xl font-semibold text-ink">Heading 2xl</h4>
      <p className="text-lg text-ink">Lead 1.125rem — Lorem ipsum dolor sit amet.</p>
      <p className="text-base text-ink">Body 1rem — The quick brown fox jumps over the lazy dog.</p>
      <p className="text-sm text-ink-muted">Small muted 0.875rem — secondary content.</p>
      <p className="text-xs uppercase tracking-wider text-ink-muted">Label · uppercase 0.75rem</p>
    </div>
  ),
};

export const Buttons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <button className="btn-primary">Primary</button>
      <button className="btn-secondary">Secondary</button>
      <button className="btn-outline">Outline</button>
      <button className="btn-ghost">Ghost</button>
      <button className="btn-primary" disabled>Disabled</button>
    </div>
  ),
};

export const Badges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <span className="badge-primary">Primary</span>
      <span className="badge-secondary">Secondary</span>
      <span className="badge bg-amber-100 text-amber-800">Warning</span>
      <span className="badge bg-rose-100 text-rose-800">Danger</span>
      <span className="badge bg-ink-muted/10 text-ink-muted">Neutral</span>
    </div>
  ),
};

export const Cards: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="card p-5"><p className="font-semibold">Card simple</p><p className="text-sm text-ink-muted">Texte par défaut</p></div>
      <div className="card p-5 shadow-elevated"><p className="font-semibold">Card elevated</p><p className="text-sm text-ink-muted">Ombre prononcée</p></div>
      <div className="card border-primary-300 bg-primary-50 p-5"><p className="font-semibold text-primary-800">Highlight</p><p className="text-sm text-primary-700">Accent primary</p></div>
    </div>
  ),
};

export const Inputs: Story = {
  render: () => (
    <div className="max-w-md space-y-3">
      <div>
        <label className="label">Email</label>
        <input className="input" placeholder="vous@email.fr" />
      </div>
      <div>
        <label className="label">Numéro</label>
        <input className="input" type="number" placeholder="0" />
      </div>
      <div>
        <label className="label">Message</label>
        <textarea className="input min-h-[100px]" placeholder="Décrivez votre projet…" />
      </div>
    </div>
  ),
};
