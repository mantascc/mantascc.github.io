"""Generate equally scaled waveform artwork. Requires ffmpeg; never edits audio."""
from array import array
from math import log10, sqrt
from pathlib import Path
from statistics import median
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1] / 'aida'
BAR_COUNT = 48


def generate(source, destination):
    samples = array('f', subprocess.check_output([
        'ffmpeg', '-v', 'error', '-i', str(ROOT / source),
        '-ar', '8000', '-ac', '2', '-f', 'f32le', '-'
    ]))
    if sys.byteorder != 'little':
        samples.byteswap()
    frames = len(samples) // 2
    levels = []
    for i in range(BAR_COUNT):
        chunk = samples[2 * (i * frames // BAR_COUNT):2 * ((i + 1) * frames // BAR_COUNT)]
        rms = sqrt(sum(value * value for value in chunk) / len(chunk))
        levels.append(20 * log10(max(rms, 1e-8)))
    # Center both tracks at the same visual height; preserve their own dynamics.
    center = median(levels)
    ordered = sorted(levels)
    spread = max(center - ordered[2], ordered[-3] - center, 1)
    heights = [max(8, min(36, 24 + 12 * (level - center) / spread)) for level in levels]
    bars = ''.join(
        f'<rect x="{i * 5 + 1}" y="{(44 - height) / 2:.2f}" width="3" height="{height:.2f}" rx="1.5"/>'
        for i, height in enumerate(heights)
    )
    (ROOT / destination).write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 44" '
        f'preserveAspectRatio="none"><g fill="white">{bars}</g></svg>\n'
    )
    print(f'{destination}: {BAR_COUNT} bars, median height {median(heights):.1f}px')


generate('poliklinika.mp3', 'waveform.svg')
generate('garsas-loop.wav', 'garsas-waveform.svg')
