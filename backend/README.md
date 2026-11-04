# Private accounts for Study Studio

GitHub Pages serves the app. Supabase Auth manages sign-in, and Postgres stores one versioned workspace per account. The browser uses only the public project URL and publishable key. Passwords and provider secrets do not belong in the repository.

## Project setup

1. Create a Supabase project with Data API enabled. Keep automatic row-level security enabled. Automatic exposure of new tables can remain disabled.
2. Run `schema.sql` in the project's SQL editor. It grants authenticated users access only to their own workspace. Anonymous users cannot read workspace rows.
3. Set the Auth Site URL to `https://notash0.github.io/study-studio/`. Add that exact URL to allowed redirects. For local testing, also allow `http://127.0.0.1:4173/`.
4. Configure at least one sign-in provider.
5. Put the project URL and **publishable** key in `cloud-config.js`. Set `githubEnabled` and `emailEnabled` to match the providers actually configured.

## Sign-in providers

For GitHub login, create an OAuth app in GitHub's developer settings. Use the live app as its homepage and the callback URL displayed by Supabase as its authorization callback. Enter the client ID and client secret in Supabase's GitHub provider settings. The client secret must never be copied into the public website.

For email/password registration, configure a custom SMTP provider before enabling public sign-ups. Supabase's default mail service is intended for development and only emails authorized team addresses. Keep email confirmation enabled. The app supports sign-up, sign-in, and password reset.

Official setup references:

- https://supabase.com/docs/guides/auth/social-login/auth-github
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/database/postgres/row-level-security

## Data behavior

- A new account receives its own Semester 1 and Semester 2 workspace.
- Existing guest data stays local until the user chooses **Copy guest workspace to my account** and confirms replacement.
- Changes save after a short pause. The sidebar reports whether they have reached the account database.
- Sessions persist through browser restarts; signing out returns to the device's guest workspace.
- A revision check prevents an older device from overwriting newer saved data. Export a backup and load the latest data when a conflict appears.
- Unsynced account drafts stay in the tab's session storage. Export a backup before closing a tab with unsaved changes.

## Verify before opening registration

Test two separate accounts: save different metrics, sign out and back in, and verify each sees only its own workspace. Verify persistence after a reload and on a second device. An anonymous request to the workspace table must fail. A user must not be able to read or write another user's row. Verify a concurrent edit returns a conflict rather than overwriting newer data.
