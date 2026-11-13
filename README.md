# OSINT 7000

Responsive, free static OSINT directory with a large slider pricing switch, instant search, category filters, favorites, per-tool guides, and optional PWA install. No account, paid service, or backend required.

## Run locally on Fedora Linux

```bash
sudo dnf install python3 git
cd osint-7000
python3 -m http.server 8000
```

Open **http://localhost:8000** on your computer. Don't double-click `index.html` because browsers may block reading `tools.json` from `file://`.

## Publish for free with GitHub Pages

1. Create a **public** GitHub repository called `osint-7000`.
2. In this project folder, run:

```bash
git init
git add .
git commit -m "Launch OSINT 7000"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/osint-7000.git
git push -u origin main
```

3. In GitHub repository **Settings → Pages**, choose **Deploy from a branch**, branch **main**, folder **/(root)**, then Save.
4. The address will typically be `https://YOUR_USERNAME.github.io/osint-7000/`.
5. Open that HTTPS link on your phone. In Chrome/Android use the browser's **Install app/Add to Home screen** option when offered; on iPhone use Safari's Share menu → **Add to Home Screen**. Installation availability depends on the device/browser.

## Add a new tool

Open `tools.json`, copy a complete object inside the array, and give it a unique `id`. Required fields:
`id`, `name`, `category`, `pricing` (`free` or `freemium`), `type`, `summary`, `description`, `when`, `where`, `how` (array), `uses` (array), `restrictions` (array), `tags` (array), `url`, `docs`, `verified` (YYYY-MM-DD), `pricingNote`.

Check official pricing and policies before labeling a tool 100% free. Treat free trials and freemium products as `freemium`, not `free`. Verify each guide against primary source documentation; do not use bulk scraped descriptions without permission. Consider licensing and rate limits of external sources.

## Notes

- Starter database contains **6 curated entries**, not every tool worldwide.
- Favorites and pricing mode live in the browser's local storage; favorites won't sync between your phone and computer.
- Offline PWA caching begins after the first HTTPS visit; external tool websites still require an internet connection.
- Updates to `tools.json` are normal Git commits; for large catalogs consider generating the JSON file from a checked/maintained CSV or database.
- Responsible use: public information does not imply permission to invade privacy, evade access controls, or harass others.


## Large catalog and ranking (November 2026)

This version contains 880 entries from uploaded CSVs, excluding entries flagged outdated, duplicates, missing status, and paid-only listings: 659 listed free and 221 listed freemium. Pricing and uptime are based on source records, not live verification of every site.

Search ranks by exact name match, word relevance in names/categories/tags/descriptions, then an editorial heuristic. Category views rank by curated picks, availability of documentation, registration requirements, and public-source links. These signals are not uptime or security guarantees. Quick category buttons and pagination (36 items at a time) make the site usable on phones.


## Smart search (works on phones)

Search runs entirely on-device and has no AI subscription, downloadable model, or per-query service calls. It includes field-weighted word matching, rare-term weighting, related-word expansion, topic-intent boosts, typo tolerance, exact-name matching, and editor tie-breaks. For example, “old versions of websites” prioritizes Wayback Machine and “sherlok” still finds Sherlock. This is rule-based semantic matching, not a trained LLM or Google Search. It does not override pricing/category filters. To improve relatedness, update the synonym groups and intents inside `searchFactory` in `app.js`.


## Imported research listings (13 November 2026)

The site indexes **2,730 total OSINT resource listings**: 880 records from the prior user-supplied catalogue and 1,850 additional leads extracted from three maintained repositories. The new listings are stored in `imports/tools-1.json` through `imports/tools-4.json` and imported by the browser at load time. They are **not** all verified live, completely free, open-source software, or guaranteed to function. **1,766** new listings have no confirmed pricing, so the existing free/freemium switch excludes them unless the visitor deliberately enables **Include unverified research listings**. Additional 52 imported records carry a recent source's free/open-source label and 32 carry a recent source's freemium label; neither was independently re-tested for pricing. This honest status separation is essential to the project.

Source catalogues (names, public links, categories only, with original tool guides written here as generic provisional guidance rather than copied source descriptions):

- **jivoi/awesome-osint** — https://github.com/jivoi/awesome-osint — source curated list released under **CC BY-SA 4.0**. Provide attribution, link to that license, and respect ShareAlike obligations for any adapted source material.
- **cipher387/osint_stuff_tool_collection** — https://github.com/cipher387/osint_stuff_tool_collection — source repository has a **GPL-3.0** license; its list expressly notes that some defunct services remain unidentified. Entries visibly marked with a gravestone were excluded.
- **NezrKaan/osint-toolkit** — https://github.com/NezrKaan/osint-toolkit — an **MIT**-licensed directory with an October 2026 pricing and link review, useful for import prioritization. Its explicitly retired/defunct or warning-marked entries were not imported.

See `imports/import-report.json` for counts and exclusions. These imports use factual tool names and destination URLs; their descriptions are new, provisional summaries. The original source lists retain their respective licenses; individual destination tools have separate licenses and usage terms. Listings were deduplicated by normalized links and names, screened for explicit defunct markers, and filtered by basic URL hygiene. **No full automatic live-link validation was performed.** Please validate a particular provider's uptime, features, and current costs before use. Do not call the total "2,730 verified tools".
