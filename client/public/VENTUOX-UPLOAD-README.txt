CodeMentor AI — Ventuox website upload instructions

This ZIP is a complete, freshly built static website package from the current GitHub main branch. It includes the Download App buttons in the top navigation and homepage, along with the matching JavaScript/CSS assets and PWA install files.

IMPORTANT: Upload the CONTENTS of this ZIP directly into your Ventuox Website Root. Do not upload the ZIP as a single file and do not put these files inside an extra nested folder.

Before replacing files:
1. Make a backup of your current website files, especially index.html, index.php, assets/, manifest.webmanifest, sw.js and favicon.png.
2. Upload all files from this ZIP into the website root, allowing matching files to be overwritten.
3. Replace/update the assets/ directory with the assets/ files from this ZIP. index.html refers to the hashed JavaScript and CSS filenames in this build, so the matching assets must be uploaded too.
4. Keep your existing .htaccess, .well-known, cgi-bin, backend files/settings, environment files, database files and other unrelated hosting files. Do not delete the whole hosting directory.
5. Visit https://codementor-ai.ventuox.com/ and do a hard refresh (Ctrl+F5 on Windows). If it still looks old, test in an InPrivate/Incognito window and clear the browser cache/site data for this site.

This build reuses the existing CodeMentor AI brand logo for the website and installed web-app icon. The Download App buttons open the browser install prompt when supported; otherwise, they show installation guidance. Browser installation creates a website app/PWA shortcut, not an APK. AI and code-running features still depend on the separately hosted backend and an internet connection.

If you previously installed CodeMentor AI, refresh the website first, then remove the old shortcut/app and install it again if the browser continues showing cached branding or metadata.
