// ONE build-time switch for the in-page copy editor (?edit).
//   on  (default): the loader is added to every page and /edit-mode.js is written to dist.
//   off          : no loader in the HTML and no /edit-mode.js in dist.
// To turn it off, build with  PUBLIC_EDIT_MODE=off npm run build  or set EDIT_MODE_DEFAULT to false.
// See EDIT-MODE.md.
const EDIT_MODE_DEFAULT = true;
export const EDIT_MODE: boolean = EDIT_MODE_DEFAULT && process.env.PUBLIC_EDIT_MODE !== 'off';
