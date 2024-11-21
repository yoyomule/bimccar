import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourdomain.arapp',
  appName: 'AR App',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: 'release.keystore',
      keystoreAlias: 'key0',
      keystorePassword: 'your_password',
      keystoreKeyPassword: 'your_password',
    }
  }
};

export default config; 