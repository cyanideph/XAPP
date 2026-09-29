const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

module.exports = {
  expo: {
    name: 'X-App',
    slug: 'x-app',
    version: '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    scheme: 'xapp',
    newArchEnabled: true,
    plugins: ['expo-router'],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    android: {
      package: 'com.xapp.mobile',
      edgeToEdgeEnabled: true,
    },
    ios: {
      bundleIdentifier: 'com.xapp.mobile',
    },
    web: {
      bundler: 'metro',
    },
    extra: {
      supabaseUrl,
      supabaseKey,
    },
  },
};
