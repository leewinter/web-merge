import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

import logoUrl from './logo.png';

const theme = create({
  base: 'dark',
  brandTitle: 'web-merge',
  brandUrl: 'https://github.com/leewinter/web-merge',
  brandImage: logoUrl,
  brandTarget: '_self',
  colorPrimary: '#10b981',
  colorSecondary: '#3c88ff',
  textColor: '#f1f5f9',
  appBg: '#020617',
  barBg: '#020617',
  barTextColor: '#e2e8f0',
  appBorderRadius: 8,
  fontBase: '"Inter", system-ui, sans-serif'
});

addons.setConfig({ theme });
