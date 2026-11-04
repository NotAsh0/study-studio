# Study Studio

Live app: https://snucstudies.vercel.app/

A dark study workspace for any course or semester. New users start with an empty profile and build their own syllabus. Existing workspaces are preserved.

## How to use
1. Sign in with Google, GitHub, or email and password. New password accounts must confirm their email. Guest work stays in the current browser.
2. Rename My studies in Manage workspace, or create another profile with the + beside the profile selector.
3. Choose Manage workspace > Add course. Enter a subject name, unique code and credits.
4. Open the subject in Course editor, add units, enter one topic per line and click Save topics.
5. Set topic statuses in Syllabus tracker. Subject overview compares subjects and unit progress. Finished and Exam ready count towards completion. Customize labels in Manage workspace.
6. In Scores & grades, add assessments, maximum marks and final-grade weights. Set the grade boundaries and grade points used by your institution. Enter previous credits and CGPA for cumulative predictions.
7. Wait for Saved to your account before leaving. Export backups from Manage workspace.

## Accounts and saved content
Each account stores its full workspace: profiles, subjects, units, topics, custom status labels, assessment scores, grade boundaries and previous credit history. Supabase row-level security restricts records to their owner; revision checks prevent stale edits overwriting newer saves. The same signed-in account can resume its saved workspace on another device.

Guest data is local to one browser and site origin. To upload it, choose My account > Copy guest workspace to my account; this replaces existing account profiles after confirmation. To move guest work between site URLs, export a backup at the old address and import at the new one.

Predicted subject points, SGPA, CGPA and target marks are estimates, not official results. Configure your own grading rules and assessment weights.

## Hosting and maintenance
The repository root is a static HTML/CSS/JavaScript app. Vercel imports NotAsh0/study-studio, framework Other, with no build command; pushes to main trigger deployment. GitHub Pages remains available as a secondary URL.

- [Backend and private storage setup](backend/README.md)
- [Vercel and additional sign-in setup](backend/VERCEL-AND-LOGIN.md)
- [Privacy and data](https://snucstudies.vercel.app/privacy.html)

Only public Supabase client configuration belongs in cloud-config.js. Never commit service-role keys, OAuth client secrets, SMTP keys, passwords, or user workspace exports. No database migration is needed for users to add subjects and topics.
