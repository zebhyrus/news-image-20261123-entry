# AGENT.md — news-image-20261123 entry

## What this entry is

A program (`main.ts`, Node stdlib only) that draws a newspaper front page,
"THE WORLD", datelined "MONDAY 23 NOVEMBER 2026", as a 1024x1024 PNG
(`entry.png`). It hand-writes a 5x7 bitmap font and a PNG encoder, draws
every story from code, and never reads an image at runtime. It is
deterministic: two fresh runs produce byte-identical output
(sha256 `2ce2073f007532ed71109758a4023085fedad9c50d8c177951a7ec9f3e182552`,
19,869 bytes).

## The six stories

1. **Hero — NATO meets on the Poland incursion.** The North Atlantic Council
   meets in Brussels on Monday 23 November after Polish prosecutors said all
   three objects that fell on Poland were Russian Kh-101 missiles. No one was
   hurt; Poland calls it a deliberate provocation.
   Source: EU Today, "NATO Calls Emergency Brussels Meeting After Russian
   Missile Incursion into Poland" (North Atlantic Council to meet Monday
   23 November); Polish prosecutors' statement of Sunday 22 November, via
   political.org.
2. **Nepal's PM meets Modi in New Delhi.** Balendra Shah holds delegation-level
   talks with Narendra Modi on 23 November, his first trip to India since
   taking office in March 2026.
   Source: IANS, "Nepal PM Balen Shah leaves for India on two-day State
   Visit" (talks on November 23); India's Ministry of External Affairs
   statement via New Kerala.
3. **Java factory search resumes.** The search resumes on Monday morning at
   the PT Fonusa Agung Mulia candy factory in Cikande. 24 body bags were
   removed on Sunday; 29 workers are still missing after Saturday's blaze.
   Source: Reuters, "Search for Indonesia factory fire missing to resume
   Monday, police remove 24 body bags" (Jakarta, Nov 22).
4. **Nine more killed in Gaza.** Gaza's health ministry said on Monday that
   nine people died in 24 hours; 970 have died since the October 2025
   ceasefire took effect.
   Source: WE News English, "Israeli Strikes Kill Nine More Palestinians In
   Gaza As Death Toll Nears 73,000" (ministry statement on Monday).
5. **Bangladesh garment pay talks open.** Factory owners table a wage offer
   for nearly 4 million garment workers on Monday 23 November. Unions want
   Tk32,000 a month, up from Tk12,500.
   Source: The Business Standard (23 November 2026), via Channel Bangladesh.
6. **Sport — India eye a Wellington win on the final day.** India declared
   on a record 720 for 9; New Zealand are 119 for 2 at stumps on day four,
   still 233 behind with eight wickets in hand, with 90 overs left on Monday.
   Source: ESPNcricinfo, "New Zealand battle to save the Test after India
   batters' record-breaking day" (stumps, day 4, 22 November 2026).

## What was deliberately left out

Stories whose event and first reporting fall on 21-22 November with no new
23 November development were not used as 23 November news: the COP31 deal /
collapse, the Peru earthquake, the Bahrain strikes and Bahrain's UN demand
(Sunday 22 November), the BepiColombo Mercury orbit insertion (21 November),
South Korea's education minister resigning (Sunday 22 November), the
"El Chapo Isidro" capture (Friday 20 November), the Nigeria boat capsizing
(Sunday 22 November), and the Lisbon cost-of-living march (Saturday
21 November). Where a story in the image rests on a weekend incident, the
image names the Monday development (the NATO meeting, the resumed search,
the Monday ministry statement) and dates the incident itself.

## Verification

- Each story was checked with independent web searches before being drawn.
- The image was read back visually: masthead, dateline, all six headlines
  readable, no clipped text, layout sane.
- Two fresh runs (different output directories) gave identical sha256.
