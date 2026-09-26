# X-App

Modern React Native social/chat client built with:

- Expo
- Expo Router
- TypeScript
- Tamagui
- Supabase

## Design direction

**Bento social UI + light/dark themes.**

Claymorphism has been intentionally removed from the design direction.

## Theme

X-App follows the device light/dark preference through Tamagui and React Native.

## Backend

Supabase is wired through:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Never place a service-role key in the mobile app.

### Existing chat architecture

The chat implementation is already integrated and should be extended rather than duplicated.

- `src/lib/supabase.ts` — single Supabase client
- `src/lib/backend.ts` — shared RPC wrapper
- `src/features/chat/backend.ts` — room/conversation message RPCs
- `src/features/chat/useChatMessages.ts` — shared message state, pagination, realtime and typing
- `src/components/MessageList.tsx` — shared message UI
- `src/components/MessageComposer.tsx` — shared composer
- `app/room/[id].tsx` — room chat
- `app/conversation/[id].tsx` — direct conversation chat

The backend already provides room and conversation message RPCs, membership checks, read state, reactions, replies, and Realtime broadcasts. Do not introduce a second message service, Supabase client, or parallel realtime implementation without first auditing the existing path.

## Current stage

The project has moved beyond UI scaffolding. Authentication, Supabase data access, room/conversation messaging, pagination, profiles, presence, typing broadcasts and realtime message updates are implemented.

Remaining work should be treated as incremental hardening and feature completion rather than a fresh chat implementation.

## Development checks

Run:

```bash
npm run typecheck
npx expo install --check
npx expo-doctor@latest
```

CI runs the same validation before starting the Expo Go preview.

## Security

The mobile client uses only the Supabase anonymous/public key. Database authorization remains the source of truth for authenticated access to rooms, conversations and messages.

Security-advisor findings involving existing SECURITY DEFINER functions and UzzapBot tables should be reviewed separately from chat changes so backend behavior is not unintentionally changed.

## References

- https://tamagui.dev/bento/cart
- https://tamagui.dev/docs/guides/expo
