# Vercel and additional login methods

Import the repository into Vercel using framework **Other**, with the repository root as the output directory and no build command. The production project is `snucstudies` and its public address is [studystudio-tracker.vercel.app](https://studystudio-tracker.vercel.app/).

In **Supabase → Authentication → URL Configuration**, use `https://studystudio-tracker.vercel.app/` as the Site URL and an allowed redirect. Keep the legacy Vercel and GitHub Pages URLs on the allowlist while they serve the app. For both GitHub and Google, use the callback URL shown by the Supabase provider settings.

## Google
Create a Web application OAuth client in Google Auth Platform. Set the authorized JavaScript origin to the final Vercel origin and the authorized redirect URI to the Supabase callback. Configure a production audience for public access. Enter the client ID and secret directly in Supabase’s Google provider settings and enable the provider. After verification, set `googleEnabled: true` in `cloud-config.js`. Keep the secret in Supabase.

## Email and password
For public registration, connect a custom SMTP provider under **Supabase → Authentication → Emails → SMTP Settings** and keep email confirmation enabled. Supply the sender identity and credentials directly in Supabase. Verify confirmation and password reset delivery, then set `emailSignupEnabled: true` in `cloud-config.js`. Keep SMTP credentials in Supabase.

## Existing accounts and local work
The Supabase database and RLS remain unchanged. Existing cloud accounts retain their records. Browser guest data is origin-specific: export from the old address and import at the new address if it was never copied to an account. Users sign in again at the new origin.

