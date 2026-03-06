import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.braincash.app',
  appName: 'Brain Cash',
  webDir: 'dist',
  server: {
    url: 'https://www.braincash.com.br',
    cleartext: false,
    allowNavigation: ['api.braincash.com.br', '*.braincash.com.br']
  },
  plugins: {
    SystemBars: { hidden: false }
  }
};

export default config;
