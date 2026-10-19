CodeMentor AI — Use the exact website logo for the installed app

This build uses the existing client/public/favicon.png brand image as BOTH the website favicon/touch icon and the installed web-app icon. No replacement logo artwork is generated.

For a targeted icon fix, upload these files into Ventuox Website Root, alongside the existing index.html, favicon.png and assets/:
- index.html
- manifest.webmanifest
- sw.js
- favicon.png (included for consistency; it is the existing CodeMentor AI logo image)

Overwrite the matching index.html, manifest.webmanifest and sw.js files. The package's favicon.png is the exact website logo already present in the project. Keep .well-known, cgi-bin, existing .htaccess, backend files/settings, and unrelated hosting files.

To refresh an app that was already installed:
1. Upload the corrected files.
2. Open the website in Edge/Chrome and refresh once or twice.
3. Uninstall the old CodeMentor AI shortcut/app.
4. Re-open the website and install it again so the browser reads the updated manifest.
5. If the old logo remains, clear this site's browser cache/site data and reinstall.

This package changes the website and installed-app logo metadata only; it does not remove the Download App button or change AI/backend functionality.