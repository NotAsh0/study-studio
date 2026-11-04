# Vercel and additional login methods

Import NotAsh0/study-studio into Vercel using framework Other, no build command, and repository root as the output directory. Production project: snucstudies. Verified public URL: https://snucstudies.vercel.app/. GitHub sign-in at this origin loads the existing private workspace.

The production Site URL and exact allowed redirect are https://snucstudies.vercel.app/. When changing domains, add its exact origin plus trailing slash in Supabase Authentication > URL Configuration, preserving the GitHub Pages redirect for existing users. Set Site URL to the new production origin. GitHub's OAuth callback remains https://mkrqngwtgkkemutluhqk.supabase.co/auth/v1/callback.

## Google
Create a Web application OAuth client in Google Auth Platform. Set authorized JavaScript origin to the final Vercel origin and authorized redirect URI to https://mkrqngwtgkkemutluhqk.supabase.co/auth/v1/callback. Configure public production audience (testing mode only permits test users). Enter the client ID and secret directly in Supabase's Google provider, enable and save it. Never commit the secret. After verification, set googleEnabled: true in cloud-config.js. Until then the UI clearly marks Google Coming soon.

## Email and password
Email sign-in and reset UI are prepared. Public registration is intentionally unavailable until an SMTP provider is connected in Supabase Authentication > Emails > SMTP Settings. Keep email confirmation enabled. The built-in mailer does not deliver to arbitrary public users. Supply sender identity and SMTP credentials directly in Supabase; verify confirmation and recovery delivery, then set emailSignupEnabled: true in cloud-config.js. Do not commit SMTP credentials.

## Existing accounts and local work
The Supabase database and RLS remain unchanged. Existing cloud accounts retain their records. Browser guest data is origin-specific: export from the old address and import at the new address if it was never copied to an account. Users sign in again at the new origin.

