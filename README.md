# X-App

Modern React Native social/chat client built with:

- Expo
- Expo Router
- TypeScript
- Tamagui
- Tamagui Bento patterns
- Supabase

## Design direction

**Bento social UI + light/dark themes.**

Claymorphism has been intentionally removed from the design direction.

## Theme

X-App uses the device light/dark preference through Tamagui and React Native.

## Backend

Supabase is wired through environment variables:

- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY

Never place a service-role key in the mobile app.

## Current stage

Foundation only. The Bento screens are UI scaffolding; real Supabase data, authentication, realtime messaging, profiles, discovery, notifications and moderation are added in subsequent phases.

## References

- https://tamagui.dev/bento/cart
- https://tamagui.dev/docs/guides/expo
