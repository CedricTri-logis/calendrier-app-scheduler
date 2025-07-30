import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'Mon App',
  webDir: 'out',  // ← Change ça (au lieu de 'public')
  server: {
    androidScheme: 'https'
  }
};

export default config;