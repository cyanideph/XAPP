# X-App

X-App is a mobile-first React Native social/chat client built around Expo Router, Tamagui, and a Supabase backend.

## Stack
- Expo 57
- Expo Router 57
- React Native 0.86
- React 19.2
- TypeScript 6
- Tamagui 2.7.7
- Supabase JS 2.x
- Supabase PostgreSQL 17
- Expo Image Picker
- Realtime broadcast/presence
- Supabase Storage

## Product areas
- Authentication: sign in, sign up, password recovery, restore/deep-link flow
- Home/feed and discovery
- Chats and private/group conversations
- Public rooms and room creation
- Room invites and administration
- Realtime room chat
- Profiles and public profile views
- Profile comments and replies
- Follows, blocks and favorites
- Notifications and notification preferences
- Check-ins and engagement/leaderboard data
- Content posts, comments, reactions, saves, categories and polls
- Featured/hidden content administration
- Room moderation, reports, co-hosts, bans, mutes and strikes
- Room media uploads and signed media URLs
- Message replies, reactions, mentions, stickers and read state

## Architecture
```text
Expo / React Native
        |
        +-- Expo Router screens
        +-- Chat feature adapters
        +-- src/lib/backend.ts
        +-- src/lib/supabase.ts
        |
        v
Supabase Data API / RPC
        +-- PostgreSQL tables
        +-- RLS policies
        +-- authorization functions
        +-- realtime broadcast/presence
        +-- Storage
```

The main shared backend wrapper is src/lib/backend.ts. Room and conversation operations are grouped under src/features/chat/backend.ts and src/features/chat/roomManagement.ts.

The production Supabase backend is maintained separately from this repository. The repository contains the latest audit/security migration, while the live backend contains the complete migration history.

## Room/chat architecture
Rooms are the core realtime surface.

Room flow:
1. Authenticate with Supabase Auth.
2. Open or create a room.
3. Join through the join_room RPC.
4. Load paginated messages through list_room_messages.
5. Maintain room presence through touch_room_presence.
6. Subscribe to the private realtime room channel.
7. Send/edit/delete/reply to messages through authorized RPCs.
8. Handle reactions, mentions, stickers, reads and media through their respective contracts.
9. Apply room administration through server-authorized RPCs.

The UI exposes room settings and moderation controls, but authorization is enforced by the backend rather than trusted to the client.

## Conversations
Private/group conversations use the same chat architecture with a separate conversation channel.

Supported operations include:
- Conversation listing
- Conversation invitations
- Accept/decline invites
- Paginated messages
- Send/edit/delete messages
- Replies
- Read state
- Realtime message-change broadcasts

## Media
Room media is uploaded to the Supabase room-media storage bucket.

The client:
- Reads the selected local asset
- Enforces a 50 MB client-side size limit
- Uploads with upsert disabled
- Creates a media metadata row
- Removes the uploaded object if metadata insertion fails
- Generates one-hour signed URLs for playback/display

The backend remains the authority for database authorization and Storage policies.

## Authentication
Authentication uses Supabase Auth.

Supported flows:
- Email/password sign in
- Email/password sign up
- Email confirmation
- Password recovery
- Deep-link restore flow
- Password changes
- Email changes

Never place a service-role or other secret Supabase key in the mobile application.

Configure the client with:
```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

## Backend audit
A live Supabase audit was performed against the backend used by X-App on 2026-09-26.

### Database inventory
- 38 public tables
- 38/38 public tables have Row Level Security enabled
- 93 public RLS policies
- 106 public/private database functions
- 0 Supabase Edge Functions
- PostgreSQL 17

The backend uses database RPCs, RLS, triggers, realtime broadcasts/presence and Storage rather than Edge Functions for the current application contract.

### Security audit
Supabase security advisors currently report 0 security lints.

The database also uses a dedicated non-exposed private schema for internal authorization/realtime helper functions. Security-sensitive application operations are primarily implemented as SECURITY INVOKER RPCs with RLS enforcing row access.

The latest repository security migration hardens execution privileges for administrative content/room functions and restricts message-reply visibility to authenticated room members.

### Performance audit
Supabase performance advisors currently report:
- 21 unindexed foreign-key findings
- 51 unused-index findings
- 4 multiple-permissive-policy findings

These are performance findings, not security failures. The unused-index findings should not automatically be removed: the application is still early in usage and indexes can become useful as traffic grows.

The 21 foreign-key findings are the clearest database optimization backlog. Index changes should be based on actual query plans and workload rather than blindly adding or removing indexes.

## Frontend audit
The repository was audited together with the live backend contract to check that the major backend capabilities have corresponding frontend surfaces.

### Covered frontend/backend areas
- Auth and profile provisioning
- Profile editing and public profiles
- Profile relationships
- Profile wall comments
- Notifications
- Notification preferences
- Public room discovery/search
- Room creation
- Room membership
- Room invites
- Room presence/online members
- Room messages
- Room message editing/deletion
- Replies
- Reactions
- Mentions
- Stickers
- Read state
- Room media
- Room settings
- Room locking/view-only mode
- Pinned messages
- Co-host requests and assignments
- Member moderation
- Reports and report resolution
- Private/group conversations
- Conversation invites
- Conversation messaging
- Content feed and content administration
- Content comments/reactions/saves
- Content categories
- Poll voting
- Featured/hidden content
- Check-ins and engagement data

### Important implementation notes
The client does not attempt to reproduce backend authorization rules locally. UI controls are convenience surfaces; the database/RPC layer remains authoritative.

The app uses pagination/cursors for high-volume message, notification, room and profile-comment queries rather than loading unlimited datasets.

## Known audit follow-ups
1. Optimize the 21 unindexed foreign keys after reviewing real query plans.
2. Review the 51 unused indexes after sufficient production workload exists.
3. Consolidate the 4 multiple-permissive-policy cases where doing so improves policy evaluation without changing access semantics.
4. Continue end-to-end testing of every room and conversation action with authenticated test users.
5. Verify media upload, Storage policy enforcement and cleanup behavior with real devices.
6. Keep frontend contracts synchronized with the separate Supabase backend migration/function contract.
7. Keep the Expo Go tunnel workflow verified separately from normal typecheck/Doctor validation.

## Development
Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm start
```

For mobile testing when the phone is not on the same LAN:
```bash
npx expo start --tunnel --go
```

The repository CI workflow validates dependencies, Expo Doctor and TypeScript, and provides a dedicated Expo Go tunnel preview on pushes.

## Verification checklist
- [ ] TypeScript passes
- [ ] Expo dependency check passes
- [ ] Expo Doctor passes
- [ ] Authentication works
- [ ] Profile provisioning works
- [ ] Room discovery works
- [ ] Room open/join works
- [ ] Room message send/edit/delete works
- [ ] Replies/reactions/mentions work
- [ ] Presence and realtime updates work
- [ ] Media upload and signed URLs work
- [ ] Room settings/moderation respect backend authorization
- [ ] Conversation messaging works
- [ ] Notifications update correctly
- [ ] Light and dark themes render correctly
- [ ] Expo Go tunnel can produce a usable QR/deep link

## Project structure
```text
app/
  (auth)/                 Authentication screens
  (tabs)/                 Main navigation
  room/                   Room UI and administration
  conversation/           Conversation UI
  content/                Content UI/admin
  me/                     Profile/settings/notifications

src/
  components/             Shared UI
  features/chat/          Chat backend, room management and message hook
  hooks/                  Shared React hooks
  lib/                    Supabase client and application RPC wrappers
  theme/                  X-App theme

supabase/
  migrations/             Repository-side migration/audit records

.github/workflows/
  ci.yml                  Expo validation and Expo Go tunnel workflow
```

## Design direction
X-App uses a modern bento-style social interface with light/dark themes. Retro and claymorphism styling are not part of the current design direction.

## Security principles
- Never ship service-role keys in the mobile app.
- Treat the client as untrusted.
- Enforce authorization with RLS and backend RPC contracts.
- Keep privileged helper functions in a non-exposed schema where appropriate.
- Prefer SECURITY INVOKER for application RPCs.
- Validate Storage ownership and relationships server-side.
- Keep database migrations and frontend/backend contracts synchronized.
