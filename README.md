# Search Relevance

Website for [search-relevance.dev](https://search-relevance.dev).

The homepage presents the ranking formula as an interactive, breadcrumb-driven explorer. It explains text-score normalization, the saturation point, business signals, normalized signal weights, and the query-specificity shift before linking quietly to the implementation repositories.

## Public packages

- [Search Ranking](https://github.com/andrebarthelmeshellmuth/spryker-search-ranking)
- [Search Debug](https://github.com/andrebarthelmeshellmuth/spryker-search-debug)
- [Search Optimization](https://github.com/andrebarthelmeshellmuth/spryker-search-ranking-optimizer)
- [Search Feedback](https://github.com/andrebarthelmeshellmuth/spryker-search-feedback)
- [Search Variant Facets](https://github.com/andrebarthelmeshellmuth/spryker-search-variant-facets)
- [Search Index Alias](https://github.com/andrebarthelmeshellmuth/spryker-search-index-alias)
- [Search Analyzer Config](https://github.com/andrebarthelmeshellmuth/spryker-search-analyzer-config)

## Local preview

The site is built with [Eleventy](https://www.11ty.dev/): shared templates live in `_includes/`,
per-language content in `_data/en.js` and `_data/de.js`. Build it, then serve the output:

```sh
npm install
npm run build
docker compose up -d
```

Then open `http://localhost:8000/`. Stop it with `docker compose down`. `npm run serve` (Eleventy's
own dev server, with live rebuild) works as a lighter-weight alternative to the two steps above.

## Screenshots

`screenshots/` holds the 1920px PNGs, which are the source of truth but are never served to a browser.
The gallery loads two WebP derivatives per screenshot instead — a 420×240 thumbnail for the carousel
strip and a ≤1920px copy for the main viewer and lightbox. The thumbnail is the one that matters: the
strip loads every screenshot of the selected package at once, so serving the originals there meant
around 3 MB to draw a row of 210px images.

After adding, replacing or removing a screenshot, add its entry to `_data/screenshotsEn.json` (and its
German translation to `_data/screenshotsDe.json`) with `title`, `description` and `src`, then run:

```sh
npm install        # once; sharp is an optionalDependency, so CI skips it
npm run images
```

That writes the `-thumb.webp` / `-full.webp` files and fills in each entry's `thumb`, `full`, `width`
and `height` keys. An entry with no `src` is an intentional "coming soon" placeholder and is skipped.

## Open Graph image

`og-image.png` (1200×630) is what LinkedIn and Slack show when the site is shared. It's rendered from
`tools/og-card.html` rather than drawn by hand, so it uses the site's real stylesheet and the formula
gets real layout. To regenerate it after editing that file: serve the site (above), load
`http://localhost:8000/tools/og-card.html` in a headless browser at exactly 1200×630, screenshot the
viewport, and save the result to `og-image.png`.

