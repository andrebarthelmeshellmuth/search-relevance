# Search Relevance

Website for [search-relevance.dev](https://search-relevance.dev).

The homepage presents the ranking formula as an interactive, breadcrumb-driven explorer. It explains text-score normalization, the saturation point, business signals, normalized signal weights, and the entropy shift before linking quietly to the implementation repositories.

## Public packages

- [Search Ranking](https://github.com/andrebarthelmeshellmuth/spryker-search-ranking)
- [Search Debug](https://github.com/andrebarthelmeshellmuth/spryker-search-debugger)
- [Search Optimization](https://github.com/andrebarthelmeshellmuth/spryker-search-ranking-optimizer)
- [Search Feedback](https://github.com/andrebarthelmeshellmuth/spryker-search-feedback)

## Local preview

`screenshots.html` fetches `screenshots-data.json` at runtime, which needs a real HTTP origin — opening
the file directly via a `file://` URL fails with a CORS error. Serve the site locally instead:

```sh
docker compose up -d
```

Then open `http://localhost:8000/`. Stop it with `docker compose down`.
