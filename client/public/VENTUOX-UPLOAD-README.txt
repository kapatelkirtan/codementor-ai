CodeMentor AI — PWA app-install button and Ventuox upload

The Download App button asks the browser to display its native installation prompt when the browser supports it. The Ventuox build workflow creates correctly sized 192x192 and 512x512 PNG app icons from favicon.png, which helps supported browsers recognize the site as installable. If a browser does not expose an installation prompt, the button displays device-specific install steps and a Copy Website Link option.

A website cannot force-install an app or bypass browser/device approval. This installs the website as a PWA/home-screen app when supported; it does not download an APK.

UPLOAD:
1. Wait for the GitHub Actions workflow named "Build Ventuox upload package" to finish successfully.
2. Download its "codementor-ai-ventuox-upload" artifact and extract it.
3. Back up your current website files.
4. Upload the CONTENTS of the extracted ZIP directly into the Ventuox Website Root; do not upload the ZIP as a nested folder.
5. Overwrite matching files and replace/update the assets/ directory using files from this same package. Keep the generated icon-192.png and icon-512.png files beside index.html and manifest.webmanifest.
6. Keep .htaccess, .well-known, cgi-bin, backend/environment/database settings and unrelated hosting files. Do not delete the entire hosting directory.
7. Visit https://codementor-ai.ventuox.com/ and hard-refresh with Ctrl+F5. If old visuals remain, test in an InPrivate/Incognito window or clear this site's browser cache/site data.

If an already-installed shortcut still shows stale branding, remove it and install again after refreshing the website. AI and code execution still require an internet connection and the separately hosted backend.
