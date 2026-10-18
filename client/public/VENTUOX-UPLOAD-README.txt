CodeMentor AI — Ventuox website update

UPLOAD THE CONTENTS, NOT THE ZIP ITSELF
1. Back up the current live website files.
2. Extract this ZIP on your device.
3. Upload every item from inside the extracted ZIP directly into the website's document root (usually public_html).
4. Keep index.html, .htaccess, assets/, sw.js, manifest.webmanifest and favicon.png at that same level.
5. If an older index.php is still showing a different/dummy page, back it up and rename it (for example, index.php.old) so index.html can open. The .htaccess included here prioritizes index.html when the server allows this setting.
6. Open the domain in a private/incognito tab or clear browser cache.

IMPORTANT
- This package contains the built frontend. It calls the separately hosted CodeMentor AI API at codementor-ai-backend-b276.onrender.com.
- If the page opens but AI, debugging, or code execution reports "Backend Offline", the backend service must be running and configured separately. Uploading frontend files cannot start the backend.
- Do not upload this package inside an additional nested folder unless that folder is meant to be the website URL.
