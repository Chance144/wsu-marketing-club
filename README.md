# WSU Marketing Club

Static site for the Marketing Club of Washington State University, Carson College of Business. It is a first version for club leadership to react to.

GitHub Pages, from the `/docs` folder on `main`:

**https://chance144.github.io/wsu-marketing-club/**

In the repo settings, set Pages to deploy from the `main` branch and the `/docs` folder.

## Local preview

```bash
python3 -m http.server 4173 --directory docs
```

Open http://127.0.0.1:4173/

Paths are relative, so the page works at the project-site root. `docs/.nojekyll` keeps GitHub Pages from running Jekyll.

## What is on the page

From the recruiting flyer and the Fall 2026 executive roadmap:

- Headline: Don’t just study marketing. Do it.
- Tagline: Build your skills, expand your network, and create what’s next.
- Six pillars: Industry Connections, A Creative Community, Real-World Projects, Launch Your Future, Leadership Opportunity, Skills That Set You Apart.
- Company sessions, named in type (not logos): Sep 23 LinkedIn, Oct 21 Meta, Nov 4 Google, Nov 18 Miris, Dec 2 Uber, Dec 9 Finish.
- Meetings: Wednesdays, biweekly, 4:00 p.m. Pacific, Spark 223.

A small script compares those dates with today in Pacific Time and marks each one past, today, or upcoming.

## Placeholders leadership still needs to fill

- Instagram handle, link, and a real QR code. The mark on the page is not scannable.
- Join form action. The form does not save or send anything.
- Executive names and roles. The four seats are empty on purpose.
- Calendar length and the biweekly anchor, if the real series differs.

The calendar file (`docs/calendar/wsu-marketing-club.ics`) repeats every other Wednesday at 4:00 p.m. Pacific from September 23, 2026 through December 2, 2026, so it stays on the same weekday rhythm as the roadmap. October 7 is on that rhythm and is not a labeled company session. December 9 stays the roadmap finish, not an extra event. The one-hour block is only so the event has an end time.

## Stack

HTML, CSS, and one script. No build step. Fonts (Archivo, Archivo Black, Caveat, Outfit) are self-hosted under `docs/fonts/` and licensed under the SIL Open Font License; see the `OFL.txt` files beside them.

There is no official WSU logo on the page. The wordmark is type only. The clock tower is an illustration, not a photograph.
