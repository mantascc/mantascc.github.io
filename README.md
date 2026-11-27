# mantascc.github.io

Personal site for Mantas Lilis. Live at [mantas.cc](https://mantas.cc).

Static HTML, no build step. Open `index.html` directly to preview.

## Audio player checks

Run `node --test tests/poliklinika-loop.test.cjs` (Node.js 18+; no dependencies).
The Poliklinika player decodes the MP3 once for audio-clock looping, blending only
30 ms across the seam. The original MP3 stays unchanged. Serve the site over HTTP
for a local preview of the Web Audio player; browser fetch does not support `file:` URLs.

## Previews

[Baime audiobook cover](https://mantas.cc/preview/111026-baime.html) — 10 November 2026. Selected snapshot from min1/baime; dated preview filenames use MMDDYY. The 2:05:00 player is a static mockup; the cover loops independently every 20 seconds.

## Loop publishing

Follow [Aida loop publishing rules](aida/AGENTS.md): match every new loop to the published player’s perceived loudness (currently about -16.7 LUFS-I), accounting for playback gain and channel layout, and verify true peaks and the loop seam.
