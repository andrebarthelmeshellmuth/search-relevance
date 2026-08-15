export default function (eleventyConfig) {
  // Trims the blank lines/indentation Nunjucks otherwise leaves behind every {% if/for %} block tag —
  // without this, generated output is full of trailing-whitespace-only lines that fail html-validate
  // for no content reason (Nunjucks' own default, matching Jinja2's, is to NOT trim these).
  eleventyConfig.setNunjucksEnvironmentOptions({
    trimBlocks: true,
    lstripBlocks: true,
  });

  // Only .njk files are real templates — plain .html (screenshots.html, its de/ mirror) stays
  // untouched, byte-for-byte, via passthrough below. Keeping html out of templateFormats means
  // Eleventy never risks parsing Liquid/Nunjucks-looking syntax inside that already-working,
  // hand-rolled JS-driven page.
  eleventyConfig.setTemplateFormats(["njk"]);

  // Static assets this migration does not touch — copied through exactly as they are today.
  eleventyConfig.addPassthroughCopy("styles.css");
  eleventyConfig.addPassthroughCopy("script.js");
  eleventyConfig.addPassthroughCopy("screenshots.html");
  eleventyConfig.addPassthroughCopy("screenshots.js");
  eleventyConfig.addPassthroughCopy("screenshots-data.json");
  eleventyConfig.addPassthroughCopy("screenshots-data.de.json");
  eleventyConfig.addPassthroughCopy("de/screenshots.html");
  eleventyConfig.addPassthroughCopy("screenshots");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("og-image.png");

  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
  };
}
