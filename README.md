# Instant — Revenue Dashboard

**Live prototype:** https://devfawaz.github.io/instant-prototype/

> **Disclaimer:** This is an independent, unofficial design exercise based on a take-home interview challenge from Instant. It is not affiliated with, endorsed by or representative of Instant. The Instant name is used for illustrative, non-commercial portfolio purposes only; the wordmark is plain set type rather than Instant's logo, NovaMart is a fictional store, and all figures are illustrative.

A single-page, interactive build of the Instant revenue dashboard from Figma. Plain HTML, CSS and JavaScript, with no build step.

## What's interactive

- **Load animations:** cards fade up in sequence, headline numbers count up, the flow bars grow in and the revenue line draws across the chart.
- **Revenue over time:** hover (or focus and use ← →) to see each day's total revenue and its biggest contributing flow. The peak lines up with the Top Earning Day card (6 Apr 2025, $28,354.38).
- **Most Revenue From:** hover a flow bar to highlight it and see its share of revenue.
- **Info icons:** hover or focus for the explanation tooltip.
- **Today you made:** the live figure ticks up every few seconds, and the green dot pulses.

Only the dashboard page is built. The navigation, filters and links are visual only.

## Run locally

```bash
npx serve .
```

The chart loads its SVG with `fetch`, so open the page through a local server instead of `file://`.
