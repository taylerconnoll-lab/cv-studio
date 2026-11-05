# CV Studio

A single-page CV builder. Pick a CV type, edit directly on the sheet, change fonts, colours and spacing, drag sections around, then save as PDF, HTML or a draft file. Everything runs in the browser. There is no build step and no server, and nothing is uploaded.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page structure and `<head>` |
| `styles.css` | App interface styles (light and dark mode, phone layout) |
| `app.js` | All behaviour. Also holds `CV_CSS`, the styles for the CV sheet itself, so the HTML export can embed them |
| `favicon.svg` | Tab icon |

External resources: Google Fonts, plus html2canvas and jsPDF (and pdf.js, loaded only when you import a PDF) from cdnjs. If cdnjs is unreachable, jsDelivr is tried. If both fail, **Save as PDF** opens the browser print dialog instead, and importing a PDF reports that the reader could not load. If Google Fonts fails, the CV falls back to system fonts.

## Run locally

Any static server works:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` directly from disk also works.

## Deploy to GitHub Pages

The site is plain static files, so Pages can serve the `main` branch directly.

1. Create a new empty repository on GitHub, for example `cv-studio`.
2. Push this folder to it:
   ```sh
   git remote add origin https://github.com/<you>/cv-studio.git
   git push -u origin main
   ```
3. In the repository, go to **Settings → Pages**, set **Source** to **Deploy from a branch**, choose branch `main` and folder `/ (root)`, and save.
4. After a minute the site appears at `https://<you>.github.io/cv-studio/`. Every push to `main` redeploys it.

All paths in the site are relative, so it works under the `/cv-studio/` sub-path.

## Other hosts

- **Netlify:** drag the folder onto <https://app.netlify.com/drop>, or connect the repo with no build command and publish directory `.`.
- **Vercel:** `npx vercel --prod`, or import the repo. Framework preset "Other", no build command, output directory `.`.

## Notes

- Your draft autosaves in this browser's local storage. **Save draft** writes a `.json` file you can reopen with **Open a saved draft**.
- **Import a PDF CV to edit** reads the first four pages of a PDF, shows it exactly as it was, and lets you click any line to edit it in place. The imported pages are kept in this browser's local storage, which can fill up with large PDFs; use **Save as PDF** to keep your result.
- In an imported PDF you can move **whole sections**: use the arrows in the Sections list, or ▲ ▼ and the ⇕ drag handle beside a heading. The section it passes swaps places, and line gaps and left alignment stay exactly as they were. Headings are found by their wording (Profile, Experience, Education and so on) and spacing; if one is missed, hover its line and press **H**. Rules, boxes and images printed in the original PDF stay where they were.
- **Save as PDF** produces an image-based PDF. For applications that read CVs automatically, use **Save as HTML**, open the file and print to PDF so the text stays selectable.
