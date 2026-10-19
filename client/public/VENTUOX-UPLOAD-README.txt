CodeMentor AI — Install App button and Ventuox upload instructions

This complete static website package includes the updated Download App button and installation guidance. In supported browsers it requests the browser's PWA installation prompt. If the browser does not expose an install prompt, the button explains the available device/browser steps and can copy the site URL for opening in Microsoft Edge or Google Chrome.

IMPORTANT: A website cannot silently force-install itself or bypass browser/device approval. The PWA install prompt is controlled by the browser. Browsers that do not support PWA installation may only be able to add a home-screen shortcut or open the website normally.

UPLOAD:
1. Back up your current website files.
2. Upload the CONTENTS of this ZIP directly into the Ventuox Website Root; do not upload the ZIP as a nested folder.
3. Overwrite matching files and replace/update the assets/ directory using the matching assets from this same ZIP.
4. Keep your existing .htaccess, .well-known, cgi-bin, backend/environment/database settings, and unrelated hosting files. Do not delete the entire hosting directory.
5. Visit https://codementor-ai.ventuox.com/ and hard-refresh with Ctrl+F5. If it looks old, test in an InPrivate/Incognito window or clear the site's browser cache/site data.

The manifest references app-icon.svg at the required 192x192 and 512x512 scalable icon sizes, as well as the existing favicon. The service-worker cache has been versioned so clients can replace old cached app-shell files.

If an older app shortcut is already installed and the icon or app metadata remains stale after upload, remove the old shortcut/app and install again from the refreshed site. AI and code execution still require an internet connection and the separately hosted backend.
