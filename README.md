# X-App

Modern React Native social/chat client built with:

- Expo 57
- Expo Router
- React Native 0.86
- TypeScript
- Tamagui 2.7.7
- Supabase

## Design direction

**Bento social UI + light/dark themes.**

Claymorphism has been intentionally removed from the design direction.

## Backend integration

The frontend uses the existing Supabase backend through:

- one shared Supabase client: `src/lib/supabase.ts`
- shared RPC wrapper: `src/lib/backend.ts`
- existing chat backend adapter: `src/features/chat/backend.ts`
- Expo Router screens for auth, discovery, rooms, conversations and profile

Never place a service-role key in the mobile app.

## Current frontend stage

The frontend is connected to real backend data for authentication, public room discovery, online-user counts, favorites, notifications, profile data and realtime room/conversation messaging.

Remaining frontend work is UI/product completion and verification; it must reuse the existing backend contracts rather than introduce duplicate services.

## Verification

Before merging frontend work, verify:

1. TypeScript typecheck
2. Expo Doctor/dependency health
3. Expo preview/QR workflow
4. Auth → profile provisioning
5. Room discovery → room open → send/edit/reply/delete/reaction
6. Conversation messaging
7. Realtime updates and typing
8. Light/dark rendering

No backend schema or RPC changes are included in this frontend branch.
