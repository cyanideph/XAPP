const app = require('./app.json');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

module.exports = {
  ...app,
  expo: {
    ...app.expo,
    extra: {
      ...app.expo?.extra,
      supabaseUrl,
      supabaseKey,
    },
  },
};
