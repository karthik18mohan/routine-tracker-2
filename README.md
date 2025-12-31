# Habit Tracker Dashboard

A production-ready habit tracker dashboard built with Next.js (App Router), TypeScript, Tailwind CSS, Zustand, date-fns, and Recharts. The UI mimics a spreadsheet-like habit tracker with sticky headers, scrollable grids, and pastel dashboard styling.

## Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Build

```bash
npm run build
npm run start
```

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repo in Vercel.
3. Keep the default Next.js settings.
4. Deploy.

## Data Storage & Export

- Data is stored in `localStorage` under the key `habit-tracker-state`.
- The schema is versioned so future migrations are safe.
- Use the **Export JSON** button to download a backup file.
- Use **Import JSON** to restore state from a file.

## Notes

- The dashboard lives at `/`.
- The monthly habits/goals view lives at `/monthly`.
- The habit grid supports click/tap toggles, drag to fill, and keyboard navigation (arrow keys + space/enter).
