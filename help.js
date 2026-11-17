function helpPage() {
  return head(
    'USER GUIDE',
    'How to use Study Studio',
    'Set up your semester, track what you’ve studied and work out what marks you need next.'
  ) + `
    <div class="two">
      <section class="panel">
        <div class="eyebrow">STEP 1</div>
        <h2>Set up your workspace</h2>
        <p class="muted">On a phone, use the bottom navigation to open your overview, subjects, syllabus and grades. Tap <strong>More</strong> for workspace management, import, settings and help. Choose <strong>Sign in</strong> to save your work across devices. Use Google, GitHub or email and password. If you create an email account, confirm your address before signing in. You can also start as a guest in this browser.</p>
        <p class="muted">Start in the empty <strong>My studies</strong> profile. Rename it in <strong>Workspace → Manage workspace</strong>, or use the <strong>+</strong> next to the profile selector to create a separate semester or course profile.</p>
      </section>
      <section class="panel">
        <div class="eyebrow">STEP 2</div>
        <h2>Bring in your syllabus</h2>
        <p class="muted">Go to <strong>Workspace → Import curriculum</strong> and choose a text-based PDF, DOCX or TXT file up to 20 MB. Review the detected semesters and check course codes, credits, units and topics. <strong>Create semester profiles</strong> adds a new profile for each semester in the preview.</p>
        <p class="muted">If the preview misses content, correct it before saving. Run OCR first on scanned PDFs. For manual entry, go to <strong>Manage workspace → Add course</strong>, then open the course in <strong>Course editor</strong>, add units and use <strong>Save topics</strong> for each unit.</p>
      </section>
      <section class="panel">
        <div class="eyebrow">STEP 3</div>
        <h2>Track topics and plan revision</h2>
        <p class="muted">Open <strong>Study → Syllabus tracker</strong> and choose one status per topic. Search or filter to focus on the topics you want to study. <strong>Finished</strong> and <strong>Exam ready</strong> both count toward completion.</p>
        <p class="muted">Use <strong>Overview → Review now</strong> to jump into revision when topics are flagged, or open <strong>Study → Subject overview</strong> to compare courses and check progress by unit. Edit status labels in <strong>Manage workspace</strong>.</p>
      </section>
      <section class="panel">
        <div class="eyebrow">STEP 4</div>
        <h2>Plan your grades</h2>
        <p class="muted">In <strong>Study → Scores &amp; grades</strong>, select a course and enter the score, maximum mark and final grade weight for each assessment. Leave unknown marks blank. Check your institution’s grade boundaries and make sure the planned weights add up to 100%.</p>
        <ul class="muted">
          <li><strong>Predicted subject grade point</strong> uses the selected course’s weighted average so far.</li>
          <li><strong>Predicted SGPA</strong> combines eligible scored courses by credit. <strong>Predicted CGPA</strong> also uses the previous credits and CGPA you enter.</li>
          <li><strong>Target grade calculator</strong> shows the average needed across all unentered weight. If only the final exam remains, that’s the percentage you need on that exam.</li>
        </ul>
        <p class="note">Predictions assume your assessed average continues. Use practical estimates only for what-if scenarios.</p>
      </section>
    </div>
    <section class="section panel">
      <h2>Defaults, sync and backups</h2>
      <p class="muted"><strong>Common settings.</strong> Set default grade boundaries for new profiles and assessment weights for new courses. To use the defaults in the current profile, use the apply buttons. Applying grade defaults replaces that profile’s boundaries. Applying assessment defaults fills courses that have no assessments.</p>
      <p class="muted"><strong>Sync.</strong> Wait for <strong>Saved to your account</strong> before leaving. Sign in with the same account on another device. If a sync conflict appears, export a backup before choosing <strong>Load latest account data</strong>.</p>
      <p class="muted"><strong>Backups.</strong> Export or import a JSON backup in <strong>Manage workspace</strong>. Guest work stays in its original browser and site address. To move it between site addresses, export it at the old address and import it at the new one. Importing a backup or choosing <strong>My account → Copy guest workspace to my account</strong> replaces the destination workspace after confirmation.</p>
      <div class="toolbar">
        <a class="button secondary" href="https://github.com/NotAsh0/study-studio#readme" target="_blank" rel="noopener noreferrer">Project on GitHub ↗</a>
        <a class="button secondary" href="privacy.html" target="_blank" rel="noopener noreferrer">Privacy &amp; data ↗</a>
      </div>
    </section>`;
}
