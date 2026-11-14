# How Study Studio works

Study Studio is a static HTML, CSS and JavaScript application. The browser handles the interface and study calculations. Supabase provides authentication and stores signed-in workspaces, and Vercel serves the production site.

## Workspace and synchronization

A workspace contains profiles with courses, units, topics, statuses, assessments and grade rules. Guest data is stored in the browser's local storage for the current site address. Signing in loads the account's workspace. Users can explicitly copy their guest workspace to the account after reviewing the replacement confirmation.

The account button exposes the current save status on hover or keyboard focus. Changes are saved after a short delay. The client sends the workspace and its expected revision to the database, which rejects stale updates. If another session saved a newer revision, the app offers a backup and an option to load the latest data. Account records are protected by Supabase row-level security.

## Accounts and email

Supabase Auth handles Google, GitHub and email/password sign-in. New email/password users are prompted to confirm their address. The confirmation and password-reset messages include a reminder to check spam or junk folders. Email delivery depends on the configured SMTP provider.

## Curriculum import

The importer reads TXT, DOCX and text-based PDF files in the browser, detects semester tables and syllabus headings, and presents an editable preview. Users review course codes, credits, units and topics before creating separate profiles. Image-only PDFs require OCR before import, and detection depends on the document's layout.

## Grade projections

Each recorded assessment contributes its score as a fraction of its maximum, multiplied by its course weight. The projection extends the weighted average of recorded assessments across the remaining weight. Grade boundaries translate that percentage into points. Predicted SGPA is credit-weighted across eligible courses with scores, while CGPA combines the prediction with the previous credits and CGPA entered by the user.

The target calculator reports the average required across unentered assessment weight. Practical estimates are hypothetical, and institutional rounding and individual exam minimums are not modeled.

## Source map

| File | Responsibility |
| --- | --- |
| `index.html`, `style.css`, `navigation.js` | Application shell, visual design and navigation |
| `app.js`, `subject-overview.js` | Workspace interface, tracking and grade calculations |
| `extra.js` | Curriculum import and shared defaults |
| `cloud.js`, `backend/schema.sql` | Authentication, synchronization and database access rules |
| `help.js` | In-app user guide |

Run `node tests/curriculum-import.cjs` to check the curriculum parser. See the [README](../README.md) for local setup and the [backend setup](../backend/README.md) for account configuration.
