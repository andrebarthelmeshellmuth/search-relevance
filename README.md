# Search Relevance

Website for [search-relevance.dev](https://search-relevance.dev).

The homepage presents the ranking formula as an interactive, breadcrumb-driven explorer. It explains text-score normalization, the saturation point, business signals, normalized signal weights, and the query-specificity shift before linking quietly to the implementation repositories.

## Public packages

- [Search Ranking](https://github.com/andrebarthelmeshellmuth/spryker-search-ranking)
- [Search Debug](https://github.com/andrebarthelmeshellmuth/spryker-search-debugger)
- [Search Optimization](https://github.com/andrebarthelmeshellmuth/spryker-search-ranking-optimizer)
- [Search Feedback](https://github.com/andrebarthelmeshellmuth/spryker-search-feedback)

## Local preview

```sh
docker compose up -d
```

Then open `http://localhost:8000/`. Stop it with `docker compose down`.

## Open Graph image

`og-image.png` (1200×630) is what LinkedIn and Slack show when the site is shared. It's rendered from
`tools/og-card.html` rather than drawn by hand, so it uses the site's real stylesheet and the formula
gets real layout. To regenerate it after editing that file: serve the site (above), load
`http://localhost:8000/tools/og-card.html` in a headless browser at exactly 1200×630, screenshot the
viewport, and save the result to `og-image.png`.

