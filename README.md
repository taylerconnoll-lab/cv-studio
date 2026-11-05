# CV Studio

A single-page CV builder. Pick a CV type, edit directly on the sheet, change fonts, colours and spacing, drag sections around, then save as PDF, HTML or a draft file. Everything runs in the browser. There is no build step and no server, and nothing is uploaded.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page structure and `<head>` |
| `styles.css` | App interface styles (light and dark mode, phone layout) |
| `app.js` | All behaviour. Also holds `CV_CSS`, the styles for the CV sheet itself, so the HTML export can embed them |
| `favicon.svg` | Tab icon |

External resources: Google Fonts, plus html2canvas and jsPDF from cdnjs. If cdnjs is unreachable, jsDelivr is tried. If both fail, **Save as PDF** opens the browser print dialog instead. If Google Fonts fails, the CV falls back to system fonts.

## Run locally

Any static server works:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` directly from disk also works.

## Deploy to GitHub Pages

A workflow is included at `.github/workflows/pages.yml`.

1. Create a new empty repository on GitHub, for example `cv-studio`.
2. Push this folder to it:
   ```sh
   git remote add origin https://github.com/<you>/cv-studio.git
   git push -u origin main
   ```
3. In the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
4. The workflow runs on every push to `main`. The site appears at `https://<you>.github.io/cv-studio/`.

All paths in the site are relative, so it works under the `/cv-studio/` sub-path.

## Other hosts

- **Netlify:** drag the folder onto <https://app.netlify.com/drop>, or connect the repo with no build command and publish directory `.`.
- **Vercel:** `npx vercel --prod`, or import the repo. Framework preset "Other", no build command, output directory `.`.

## Notes

- Your draft autosaves in this browser's local storage. **Save draft** writes a `.json` file you can reopen with **Open a saved draft**.
- **Save as PDF** produces an image-based PDF. For applications that read CVs automatically, use **Save as HTML**, open the file and print to PDF so the text stays selectable.
