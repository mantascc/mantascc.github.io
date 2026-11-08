# mantascc.github.io

Personal site for Mantas Lilis. Live at [mantas.cc](https://mantas.cc).

Static HTML, no build step. Open `index.html` directly to preview.

## Audio player checks

Run `node --test tests/poliklinika-loop.test.cjs` (Node.js 18+; no dependencies).
The Poliklinika player decodes the MP3 once for audio-clock looping, blending only
30 ms across the seam. The original MP3 stays unchanged. Serve the site over HTTP
for a local preview of the Web Audio player; browser fetch does not support `file:` URLs.
