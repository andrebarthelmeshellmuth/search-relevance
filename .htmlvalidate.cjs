module.exports = {
  extends: ["html-validate:recommended"],
  rules: {
    // <!doctype html> (lowercase) is valid HTML5 and the more common modern convention (e.g. Prettier's
    // own default output) -- this rule just enforces one style opinion, not a real defect.
    "doctype-style": "off",
  },
};
