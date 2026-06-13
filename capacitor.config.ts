import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'online.lifetent.app',
  appName: 'Life Tent',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Use live URL in dev — remove for production APK
    // url: 'http://192.168.1.x:8080',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#0B1733',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0B1733',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#6366f1',
      sound: 'default',
    },
    Camera: {
      // permissions requested at runtime
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // set true for debug builds
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    scheme: 'lifetent',
  },
};

export default config;
