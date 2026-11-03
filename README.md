# Stock Research Hub — iPhone PWA

A functional, installable iPhone-friendly research app with a saved watchlist, automatic SEC EDGAR XBRL financial data, financial calculations with full substitutions, SEC filing links, and a learning library.

## Deploy (no Mac required)

1. Create a free GitHub repository and upload all files in this folder (not the enclosing folder).
2. Create a Node web service on a hosting provider supporting Node 18+ (for example Render or Railway), connecting that GitHub repository.
3. Set the start command to `npm start` and set environment variable `SEC_USER_AGENT` to `StockResearchHub Your Name contact-your-real-email@example.com` with a real contact email. The SEC requires a declared user agent and fair access. Do not use the example address.
4. Deploy. Open the resulting HTTPS URL in Safari on iPhone.
5. Tap Share > Add to Home Screen > Add.

For local testing on a computer with Node 18+, run `npm start`, then visit http://localhost:3000.

## Features and limitations

- SEC ticker search; 10-K and 10-Q links; annual revenue and net income change; annual simplified free cash flow; cash-to-liabilities comparison.
- Source disclosures: US-GAAP taxonomy tag, period, filed date, filing type, and SEC archive.
- Watchlist persists in browser localStorage on the same device; there is no login or cloud synchronization.
- No live price data, current P/E, current dividend yield, push notifications, or broker account connection. These are explicitly shown as unavailable rather than invented.
- SEC companyfacts does not provide uniform standardized tags for every company. Missing values are reported as unavailable. Some company-specific XBRL extensions and reporting complexities are not covered.
- Annual financial figures may reflect amended/restated filings; always check the original 10-K and 10-Q.
- SEC may throttle requests; server caches company data for one hour and tickers for one day. For significant usage, implement a persistent cache, stronger error handling, and SEC rate limits.
- The server does not collect Robinhood credentials or place trades.

## Security and operations

Use HTTPS hosting. Do not add brokerage credentials to this project. Change the default example SEC_USER_AGENT before deploying. This is an educational starter production-style prototype, not audited investment software.
