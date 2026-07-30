import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'kr.intothepicture.app',
  appName: 'Into the Picture',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
