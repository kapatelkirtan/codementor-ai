CodeMentor AI — Ventuox website package

IMPORTANT: UPLOAD THE CONTENTS OF THIS ZIP TO THE WEBSITE DOCUMENT ROOT
1. Back up the current live website files first.
2. Extract this ZIP on your device.
3. Upload every item inside the ZIP directly into the website document root (usually public_html), overwriting the old website files when prompted.
4. Keep index.php, index.html, assets/, sw.js, manifest.webmanifest and favicon.png together at the same level.
5. This ZIP intentionally does not include a replacement .htaccess file. Keep the host's existing .htaccess so its custom routing/security settings are not accidentally overwritten.
6. Open the domain in a private/incognito tab. If an old cached page remains, clear the site's browser cache and refresh.

WHY index.php IS INCLUDED
Some shared hosts prioritize index.php over index.html. The supplied index.php simply serves the built CodeMentor AI index.html, so a previous placeholder PHP homepage should not take precedence after you replace it with this file.

IMPORTANT ABOUT AI FEATURES
- This package contains the built React frontend; it is not a static demo page.
- AI Teacher, AI Debugger, code generation and code execution call the separately hosted API configured in the frontend at https://codementor-ai-backend-b276.onrender.com.
- If the page opens but says "Backend Offline" or AI actions fail, the API service must be available and configured separately. Uploading static frontend files cannot start the backend.
- Do not upload this package inside an additional nested folder unless that folder is intended to be the site's URL.

IMPORTANT FOR YOUR EXISTING VENTUOX WEBSITE ROOT
- Upload the extracted contents of this ZIP into Website Root; do not upload the ZIP file itself as the website.
- Back up the current Website Root first. Replace the website files included here and allow the assets/ folder to merge/overwrite.
- Do NOT delete the .well-known or cgi-bin folders, your existing .htaccess, hosting settings, or unrelated files. This ZIP does not include a replacement .htaccess.
- The working stylesheet and JavaScript are inside assets/. Extra old files such as top-level index-D8jvu507.css or styles.css are not referenced by this index.html; only remove them after backup and after confirming no other site relies on them.
