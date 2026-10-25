# Edit mode (copy editor)

Double-click any title or paragraph on the live site, type the new copy, and export the changes.

## Use it

1. Open any page with `?edit` on the end, e.g. `https://www.cameronkuey.com/?edit` (or `#edit`).
   It stays on for the browser tab (sessionStorage). `?edit=off` or the toolbar's Exit button turns it off.
2. Double-click text (double-tap on a phone). Type. Enter saves, Esc cancels, clicking away saves.
   Edited text gets a soft tan highlight. Edits are kept in this browser (localStorage) until you clear them.
3. Rotating hero titles: toolbar button "Rotating titles" (one title per line).
4. Toolbar: Copy changes (also Cmd/Ctrl+Shift+C), Download .json, Review list (revert or jump to each edit),
   Undo last, Clear, Exit.
5. Paste the copied text to the assistant, or apply it yourself:

   ```
   python3 scripts/apply-edits.py edits.json --dry-run   # report only
   python3 scripts/apply-edits.py edits.json             # write
   ```
   It edits a file only when the old text has exactly one match. Ambiguous, partial and not-found
   edits are listed with file and line so they can be changed by hand.

## Turn it off (one switch)

`src/data/site-flags.ts` is the only switch. Either:

- build with `PUBLIC_EDIT_MODE=off npm run build`, or
- set `EDIT_MODE_DEFAULT = false` in `src/data/site-flags.ts`.

When off, the loader is not written into any page and `dist/edit-mode.js` is not created
(the built site is byte-identical to a site without the feature; `/edit-mode.js` returns 404).
Default is on.

## Files

- `editor/edit-mode.js`: the editor. Copied to `dist/edit-mode.js` at build time only when on.
- `src/data/site-flags.ts`: the switch.
- `astro.config.mjs`: a small `editMode()` integration that does the copy (and serves it in `astro dev`).
- `src/layouts/Base.astro`: a one-line loader, rendered only when the switch is on. Visitors without
  `?edit` download nothing extra.
- `scripts/apply-edits.py`: applies an export to `src/`.

## Notes

- `?edit` works for anyone who knows it, but edits only exist in that browser and can never change the site.
- Not editable in place: the logo, the Pause/Play/Menu buttons, alt text, page title and meta description,
  lightbox captions, text drawn by CSS or inside images and video, and labels that change by script.
