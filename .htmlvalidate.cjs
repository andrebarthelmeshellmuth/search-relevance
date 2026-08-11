module.exports = {
  extends: ["html-validate:recommended"],
  rules: {
    // <!doctype html> (lowercase) is valid HTML5 and the more common modern convention (e.g. Prettier's
    // own default output) -- this rule just enforces one style opinion, not a real defect.
    "doctype-style": "off",
    // screenshots.html's <h2 id="screenshot-title"> starts empty by design -- screenshots.js fills it in
    // once its fetch("screenshots-data.json") resolves. A static analyzer can't see that, so this would
    // otherwise be a permanent false positive on every run.
    "empty-heading": "off",
  },
};
