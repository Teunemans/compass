# Compass

A political quiz of 100 statements, with everyone's results on one shared compass.
It's a static site: plain HTML, CSS and JavaScript, no build step and no server of its own.

## What's in this folder

| File | What it does |
|---|---|
| `index.html` | The page: the quiz, your result, the group views. |
| `style.css` | All styling. Light mode by default; the Dark button switches theme. |
| `app.js` | All behaviour: quiz, scores, result codes, labels and colours, the 2D/3D compass, comparing, sending. |
| `questions.js` | The 100 statements and which axis each one feeds. |
| `STATEMENTS.md` | A readable table of the statements (generated from `questions.js`). |
| `results.js` | The built-in group: one result code per person. |
| `config.js` | Your settings: X handle and the Google Form that receives results. |
| `privacy.html` | The privacy note people agree to. |
| `fonts/` | IBM Plex Sans, hosted here so visitors never contact Google Fonts. |
| `tests/run.py` | Automated checks with Playwright, plus screenshots. |

## Try it locally

From this folder, run `python3 -m http.server 8000` and open http://localhost:8000.
(Opening `index.html` straight from Finder mostly works too, but a local server behaves like GitHub Pages.)

## Put it on GitHub Pages

1. Create a GitHub repository (for example `Compass`) and push this folder to it.
2. In the repository: Settings → Pages → "Deploy from a branch" → branch `main`, folder `/ (root)`.
3. After a minute the site is live at `https://<your-username>.github.io/Compass/`.

## Set up the Google Form (receives results)

The page posts results to a Google Form in the background. You see them in a Google Sheet that only you can open.

1. Create a new Google Form called "Compass results". Add four **Short answer** questions, in this order, all optional:
   `code`, `kind`, `key`, `consent`.
2. Settings → Responses: **don't** collect email addresses, and switch **off** "Limit to 1 response" (that one forces people to sign in).
3. Responses tab → "Link to Sheets" → create a new spreadsheet.
4. Click ⋮ → "Get pre-filled link", type `x` in each of the four fields, then "Get link" and copy it. It looks like
   `https://docs.google.com/forms/d/e/LONG_ID/viewform?usp=pp_url&entry.111=x&entry.222=x&entry.333=x&entry.444=x`
5. In `config.js`: set `action` to the same address but ending in `/formResponse` instead of `/viewform?...`,
   and fill in the four `entry.` numbers, in order (code, kind, key, consent).
6. Publish the form, open your site, do the quiz and press "Add me". A new row should appear in the sheet.

Until `action` is filled in, the page tells people to copy their code and send it to you on X instead.

## Adding people to the group

Rows in the sheet have `kind` = `add` or `remove`. From 19 October 2026 the group is live: the site reads a published tab of the sheet (codes only, never the removal keys), so nothing has to be pushed. A `remove` row hides the matching `add` row automatically.

- **With Claude:** ask "check the Compass sheet and add the new results". Claude opens the Sheet "Compass results (responses)" in the Claude browser, where you're signed in to the account that owns it (your Google Drive connector is linked to a different account), and updates `results.js`.
- **Yourself:** open your site with `?owner` at the end of the address (for example `.../Compass/?owner`). Paste codes into the box, one per line. The compass previews them in your browser. Then "Copy as results.js", paste that into `results.js`, commit and push.

## Removing someone

A `remove` row has the same `key` as that person's `add` row, which proves it came from the same browser.
Delete their line from `results.js`, push, and delete both rows from the sheet.
Their code also exists in older commits on GitHub. If someone asks for full erasure, rewrite the history of `results.js`
(for example with `git filter-repo`) or ask Claude to help.

## Changing the statements

Result codes store answers **by position** in `questions.js`. So:

- Rewording a statement without changing its meaning: fine.
- Changing a statement's axis or weight, or which section it's shown in: fine, scores are recalculated from the answers.
- Adding statements: only **at the end** of the list. Then add a new version to `CODE_LENGTHS` in `app.js`
  (for example `3: 140`) and set `CODE_VERSION` to it. Older codes keep working; the new statements count as unanswered,
  and returning visitors get a button to answer just the new ones.
- Removing or reordering statements: don't. Old codes would be misread.

The quiz shows statements grouped by section, so a statement added at the end still appears in its own section.
After editing `questions.js`, regenerate `STATEMENTS.md` (or ask Claude to).

## How the result code works

`C3` (version) + 69 characters for the 158 answers + 2 check characters + your label + `.` + your name.
Each answer has 6 states (skipped or one of 5 points), so the answers form one big base-6 number, written
in base 64. A typical code is about 80 characters. The check characters catch codes that were cut off or mistyped.

## Tests

`python3 -m pip install playwright`, then `python3 tests/run.py`. It checks the codes, the labels, the quiz flow,
sending (to a fake form), and saves screenshots at desktop and phone width in `tests/screenshots/`.

## Live results (no push needed)

The page reads `liveCsv` from `config.js` every minute: a published CSV of a tab in the response sheet that holds **only the result codes**.
Your computer is never involved (no server, no Docker, no IP address), Google serves the file.

1. In the response sheet add a tab called `public`.
2. In cell A1 paste the formula below (change `'Form Responses 1'` if your responses tab has another name; columns are
   A time, B code, C kind, D key, E consent). It keeps the newest `add` per key that has consent and no later `remove`, and shows only the code column:

   `=LET(r,FILTER('Form Responses 1'!A2:E,'Form Responses 1'!C2:C="add",'Form Responses 1'!E2:E<>""),rm,IFERROR(FILTER('Form Responses 1'!D2:D,'Form Responses 1'!C2:C="remove"),"-"),u,SORTN(SORT(r,1,FALSE),9^9,2,4,TRUE),INDEX(FILTER(u,ISNA(MATCH(INDEX(u,,4),rm,0))),,2))`

3. File → Share → Publish to web → choose only the `public` tab, format CSV → Publish. Copy the link into `liveCsv`.
4. Never publish the whole workbook: the other tab contains the removal keys.
