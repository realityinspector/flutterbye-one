Do these in roughly this order; each item is a discrete pull-request-sized chunk.

Cut scope to a “walking slice.”
Keep only auth, lead list, lead detail, call log, and call-create screens. Stub all other menu items behind a “coming soon” flag. ​
Delete the web landing page from /src and host it separately.
Shipping a single‐bundle mobile app keeps Expo build <25 MB and removes the DOM-centric CSS/JS bloat. ​
Flatten navigation.
Replace the tab+stack maze with one stack: Leads → LeadDetail → CallLog. The FAB on every screen opens “New Call.” Minimal cognitive load = faster taps.
Strip NativeBase to its core tokens.
Use native-base only for primitives (Box, Heading, VStack). Replace the 25 KB theme object with a 4-color palette.
Drop React Query until you really cache.
Seven extra deps and 160 KB of JS for optimistic caching you aren’t using. Use axios + a single useAsync hook; re-introduce React Query when reports ship.
Auto-log every outbound call.
Integrate react-native-callkeep (iOS) and react-native-incall-manager (Android) → fire POST /api/calls on callConnected event. That single feature makes the CRM “magical.”
Replace Passport sessions with JWT.
Mobile + fetch ⇒ cookies are fragile. Issue 24 h JWT, refresh with /api/refresh. Saves 10 KB of server middleware, kills connect-pg-simple.
Move Drizzle models to /shared/db/*.ts and generate Zod types.
Frontend imports the Zod types directly: zero manual DTOs, compile-time safety, and no dual-schema drift.
Add expo-sqlite offline queue.
Cache /api/leads locally; new calls insert into SQLite table pending_calls. Flush on reconnect. Removes the “my subway ride killed my notes” complaint.
Kill unused packages.
@expo/vector-icons, helmet, server-side compression, GraphQL polyfills, etc. Run depcheck, prune, shrink node_modules by ~40 %.
One EAS build profile only.
developmentClient + production. Delete staging/preview profiles; use feature flags not env splits. Faster CI, simpler env-var handling.
Add a share-sheet viral hook.
After saving a call, prompt: “Text this recap to the prospect?” Uses Linking.openURL("sms:${phone}?body=${encode(rec ap)}"). Converts calls → follow-ups.
Super-lean analytics.
Add a 50-line Postgres function to aggregate calls per lead and seconds on call. Expose /metrics/quick for the home dashboard; postpone full charting.
Write 5 Detox tests only.
Cover login, lead open, start call, end call, offline cache. Anything else is churn.
GitHub Actions: lint-test-build.
Node 20, bun install, expo prebuild --no-install, EAS submit to TestFlight on main. No Docker, no matrix.
Document your API with openapi-comment-parser.
Inline JSDoc on each Express route, autogen /docs. Avoid a separate Swagger file.
Hardcode a demo company on first run.
Seed DB with Acme Demo Leads so new users see data instantly. Viral rule: empty apps don’t spread.
Use .env.example with only the six keys you actually read.
Anything else belongs in the README, not in code.
Rename everything “WalkNTalk CRM” consistently.
Package.json, display name, bundle ID. Helps App Store review and push-notification auth.