# Saber's Gym

A personal workout tracker built around a four-day split (push / pull / legs / full upper), with set-by-set logging, a rest timer, automatic progression suggestions, daily check-ins, weekly weigh-ins and progress charts.

All data lives in the browser (localStorage). Use **Settings → Export backup** to move it between devices.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Pages

| Route | What it does |
|---|---|
| `/` | Today's session, week strip, check-in prompts, weights ready to go up, recent sessions |
| `/workout` | Pick a day, log weight × reps per set, rest timer, cardio, notes, finish with progression review |
| `/checkin` | Daily (sleep, energy, soreness, mood) and weekly (bodyweight, chest, waist, arms) |
| `/progress` | Training heatmap, per-exercise top set / est. 1RM / volume, weekly volume, bodyweight, sleep |
| `/program` | Edit schedule, days, exercises, weights and rep ranges; progression and rest rules; equipment |
| `/history` | Every logged session with its sets |
| `/settings` | Name, units, theme, rest timer, export / import / erase |

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · Zustand (persisted) · hand-rolled SVG charts.
