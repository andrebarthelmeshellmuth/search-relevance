export default function (eleventyConfig) {
  // Trims the blank lines/indentation Nunjucks otherwise leaves behind every {% if/for %} block tag —
  // without this, generated output is full of trailing-whitespace-only lines that fail html-validate
  // for no content reason (Nunjucks' own default, matching Jinja2's, is to NOT trim these).
  eleventyConfig.setNunjucksEnvironmentOptions({
    trimBlocks: true,
    lstripBlocks: true,
  });

  eleventyConfig.setTemplateFormats(["njk"]);

  // Static assets this migration does not touch — copied through exactly as they are today.
  eleventyConfig.addPassthroughCopy("styles.css");
  eleventyConfig.addPassthroughCopy("script.js");
  eleventyConfig.addPassthroughCopy("screenshots.js");
  eleventyConfig.addPassthroughCopy("screenshots");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("og-image.png");
  // Not part of the site itself -- only served locally to screenshot it while regenerating og-image.png.
  eleventyConfig.addPassthroughCopy("tools/og-card.html");

  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
  };
}
