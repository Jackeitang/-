# Public hosting

The Site is prepared for public access. Static assets, reading, listening and dictionary GET endpoints accept anonymous visitors. ChatGPT sign-in is required for server-side model configuration and AI calls. Each user supplies and pays for their own provider API key.

Sites dispatch supplies verified identity headers. `LINGOLOOP_OWNER_EMAIL` is a server secret used for shared-content authorization. Only the matching signed-in owner can PUT reading/listening editions or generate shared reading drafts. Anonymous service-token requests have no user identity and are denied by these endpoints. Existing schedules remain paused.

The owner retains `private/model-connection-v1.json`, preserving existing encrypted configuration. Other users receive a distinct R2 key derived from the SHA-256 of their Site user ID. Encryption uses the existing `LINGOLOOP_KEY_ENCRYPTION`; never rotate it without migrating encrypted records. Anonymous configuration reads return no saved model metadata. Each configuration is also checked against its stored owner ID.

These public access rules supersede the former owner-private assumptions in the original integration/update notes. Do not deploy this Worker outside the trusted Sites identity gateway without replacing its authentication and authorization.

Run `node scripts/test-public-access.mjs` alongside the existing tests. Provider requests in tests are mocked; real AI availability depends on each visitor's provider key, model permissions and balance. Local learning history remains in each browser. Reading/listening materials come from existing R2 content or the bundled fallback edition, not an active automatic news schedule.
