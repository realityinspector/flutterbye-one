# Project Implementation Tasks

## Completed

✅ Replace Passport sessions with JWT.
- Mobile + fetch ⇒ cookies are fragile. 
- Implemented 24h JWT with /api/refresh endpoint.
- Removed dependency on connect-pg-simple.

✅ Move Drizzle models to /shared/db/*.ts and generate Zod types.
- Created TypeScript schema files in shared/db directory.
- Added Zod validation schemas with proper types.
- Updated all import paths across the codebase.
- Added backwards compatibility for CommonJS.

✅ Frontend imports the Zod types directly.
- Created TypeScript versions of key hooks (useAuth, useLeads, useCalls).
- Created TypeScript versions of core components (LeadCard, CallItem).
- Created TypeScript version of HomeScreen with proper typing.
- Added tsconfig.json for TypeScript support.
- Components now import Zod types directly from shared schema files.

## To Be Implemented

✅ Cut scope to a "walking slice."
- Simplified navigation to focus on Home, Leads, and Calls.
- Created 'Coming Soon' screens for non-essential features.
- Added visual indicators for upcoming features.
- Stubbed out advanced features behind clean placeholders.

✅ Delete the web landing page from /src and host it separately.
- Created a separate 'hosted_separately' directory for web landing page content
- Removed web-serving functionality from the main Express server
- Extracted styles into a standalone CSS file for better organization
- Optimized mobile app bundle size by removing DOM-centric code

✅ Flatten navigation.
- Replaced the tab+stack maze with one stack: Leads → LeadDetail → CallLog
- Added the floating action button (FAB) on every screen to open "New Call"
- Updated HomeScreen, LeadsListScreen, LeadDetailScreen, and CallHistoryScreen
- Removed redundant call buttons and simplified navigation flow

5. Strip NativeBase to its core tokens.
   - Use native-base only for primitives (Box, Heading, VStack).
   - Replace the 25 KB theme object with a 4-color palette.

6. Drop React Query until you really cache.
   - Seven extra deps and 160 KB of JS for optimistic caching you aren't using.
   - Use axios + a single useAsync hook; re-introduce React Query when reports ship.

7. Auto-log every outbound call.
   - Integrate react-native-callkeep (iOS) and react-native-incall-manager (Android).
   - Fire POST /api/calls on callConnected event.
   - That single feature makes the CRM "magical."

8. Add expo-sqlite offline queue.
   - Cache /api/leads locally.
   - New calls insert into SQLite table pending_calls.
   - Flush on reconnect.
   - Removes the "my subway ride killed my notes" complaint.

9. Kill unused packages.
   - @expo/vector-icons, helmet, server-side compression, GraphQL polyfills, etc.
   - Run depcheck, prune, shrink node_modules by ~40%.

10. One EAS build profile only.
    - developmentClient + production.
    - Delete staging/preview profiles; use feature flags not env splits.
    - Faster CI, simpler env-var handling.

11. Add a share-sheet viral hook.
    - After saving a call, prompt: "Text this recap to the prospect?"
    - Uses Linking.openURL("sms:${phone}?body=${encode(recap)}").
    - Converts calls → follow-ups.

12. Super-lean analytics.
    - Add a 50-line Postgres function to aggregate calls per lead and seconds on call.
    - Expose /metrics/quick for the home dashboard; postpone full charting.

13. Write 5 Detox tests only.
    - Cover login, lead open, start call, end call, offline cache.
    - Anything else is churn.

14. GitHub Actions: lint-test-build.
    - Node 20, bun install, expo prebuild --no-install, EAS submit to TestFlight on main.
    - No Docker, no matrix.

15. Document your API with openapi-comment-parser.
    - Inline JSDoc on each Express route, autogen /docs.
    - Avoid a separate Swagger file.

16. Hardcode a demo company on first run.
    - Seed DB with Acme Demo Leads so new users see data instantly.
    - Viral rule: empty apps don't spread.

17. Use .env.example with only the six keys you actually read.
    - Anything else belongs in the README, not in code.

18. Rename everything "WalkNTalk CRM" consistently.
    - Package.json, display name, bundle ID.
    - Helps App Store review and push-notification auth.