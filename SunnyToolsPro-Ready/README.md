# SunnyToolsPro Ready Site v2

A ready-to-deploy SunnyToolsPro website based on the supplied starter ZIP.

## Included live integrations
- Prayer: AlAdhan
- Currency: Frankfurter
- Weather: Open-Meteo
- Gold: gold-api.com public price endpoint
- Jobs: JobDataPool public jobs endpoint, filtered for UAE where possible
- News: NewsAPI through the server proxy when `NEWS_API_KEY` is configured
- Rent: secure provider slot through `/api/rent` (requires an authorized property/room API URL)

## Run locally
1. Install Node.js 18+
2. `npm install`
3. Copy `.env.example` to `.env`
4. Add `NEWS_API_KEY` if you want live UAE news.
5. Add `RENT_API_URL` if you have an authorized room/property feed.
6. `npm start`
7. Open `http://localhost:3000`

## Deploy
This is an Express site. Deploy it to a Node-capable host (Render, Railway, VPS, cPanel Node.js, etc.). Keep API keys in environment variables.

## Important
Jobs and room-rent data are third-party data. Do not scrape sites without permission. Use providers that grant redistribution/embedding rights.
