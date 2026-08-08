import type { Preview, Decorator } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '../src/lib/auth';
import '../src/styles/index.css';

const withProviders: Decorator = (Story, ctx) => {
  const initialEntries = [(ctx.parameters?.route as string) || '/'];
  return (
    <HelmetProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <Story />
        </AuthProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
};

const withTheme: Decorator = (Story, ctx) => {
  const theme = ctx.globals.theme || 'light';
  if (typeof document !== 'undefined') {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }
  return <Story />;
};

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: '#ffffff' },
        { name: 'surface-muted', value: '#f1f5f9' },
        { name: 'ink', value: '#0f172a' },
      ],
    },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile (iPhone 14)', styles: { width: '390px', height: '844px' } },
        tablet: { name: 'Tablet', styles: { width: '820px', height: '1180px' } },
        desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' } },
      },
    },
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
    layout: 'padded',
  },
  globalTypes: {
    theme: {
      description: 'Light / Dark theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme, withProviders],
};

export default preview;
