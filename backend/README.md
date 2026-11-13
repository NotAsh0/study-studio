# Private accounts for Study Studio

Vercel serves the primary app and GitHub Pages serves a secondary copy. Supabase Auth manages sign-in, and Postgres stores one versioned workspace per account. The browser uses the public project URL and publishable key. Keep passwords and provider secrets outside the repository.

## Project setup

1. Create a Supabase project with Data API enabled. Keep automatic row-level security enabled. Automatic exposure of new tables can remain disabled.
2. Run `schema.sql` in the project's SQL editor. It grants authenticated users access only to their own workspace. Anonymous users cannot read workspace rows.
3. Set the Auth Site URL to your production address and add that exact URL to the allowed redirects. Study Studio uses `https://studystudio-tracker.vercel.app/` in production and also allows `https://notash0.github.io/study-studio/`. For local testing, allow `http://127.0.0.1:4173/` in your own Supabase project.
4. Configure at least one sign-in provider.
5. Put the project URL and **publishable** key in `cloud-config.js`. Set `githubEnabled`, `googleEnabled`, `emailEnabled` and `emailSignupEnabled` to match the providers you configured.

## Sign-in providers

For GitHub login, create an OAuth app in GitHub's developer settings. Use the live app as its homepage and the callback URL displayed by Supabase as its authorization callback. Enter the client ID and client secret in Supabase's GitHub provider settings. The client secret must never be copied into the public website.

For email/password registration, configure a custom SMTP provider before enabling public sign-ups. Supabase's default mail service is intended for development and only emails authorized team addresses. Keep email confirmation enabled. The app supports sign-up, sign-in, and password reset.

Official setup references:

- https://supabase.com/docs/guides/auth/social-login/auth-github
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/database/postgres/row-level-security

## Data behavior

- A new account starts with an empty **My studies** profile.
- Existing guest data stays local until the user chooses **Copy guest workspace to my account** and confirms replacement.
- Changes save after a short pause. The top navigation reports whether they have reached the account database.
- Sessions persist through browser restarts; signing out returns to the device's guest workspace.
- A revision check prevents an older device from overwriting newer saved data. Export a backup and load the latest data when a conflict appears.
- Unsynced account drafts stay in the tab's session storage. Export a backup before closing a tab with unsaved changes.

## Verify before opening registration

Test two separate accounts: save different metrics, sign out and back in, and verify each sees only its own workspace. Verify persistence after a reload and on a second device. An anonymous request to the workspace table must fail. A user must not be able to read or write another user's row. Verify a concurrent edit returns a conflict rather than overwriting newer data.
