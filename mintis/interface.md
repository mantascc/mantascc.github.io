# mintis — Interface and editorial rules

Canonical interface and editorial rules for mantas.cc/mintis. Apply them to the index, stories, and walkthroughs. These consolidate the walkthrough review and subsequent page design decisions.

## Let the story lead

Make the interesting idea and its evidence the focal point. Interface labels, controls, and metadata should support reading without competing for attention.

## Remove bookkeeping from the presentation

Omit counts of plates, total duration, redundant progress fractions, and decorative status rows. Keep information only when it helps the reader understand the story or choose where to go. A chapter list already provides orientation; the stage does not need another numbered heading.

## Explain what is interesting in the data

Write captions as a friendly guide: point out a surprising pattern, explain the comparison, and say why it matters. Use familiar words and connected sentences. Avoid making the caption primarily a technical key or a description of how the visualization was built.

## Keep the evidence honest

Friendly storytelling must preserve the difference between measurements, editorial judgments, reported claims, and unknown values. Include a brief qualification where it changes the interpretation. Never turn missing data into a result or a possible connection into proof.

## Use the smallest useful controls

Default to minimal Play and Pause controls. Keep chapter navigation for direct exploration. Add scrubbers, speed selectors, timers, and extra replay controls only when the reader’s task calls for them. Retain accessible names, keyboard operation, visible focus, and reduced-motion support.

## Keep sources close and quiet

End with a simple “Source notes” link. Put detailed methodology and evidence explanations in the source material, while retaining essential context beside the relevant graph.

## Preserve the editorial character

Use black and white, deliberate typography, fine rules, and generous space. Let hierarchy and the graphics create interest. Remove UI elements that add density without meaning.

## Review by subtraction

Before publishing, ask: Does this element help someone understand, navigate, or control the story? Does the caption explain the discovery in the data? Can any repeated label or control be removed without losing meaning?


## Make the masthead useful

Show the publication’s address, `mantas.cc/mintis`, as a quiet link to its index. Use the other side of the masthead for the current date, formatted in natural language, such as “November 10, 2026.” Use the publication’s America/Los_Angeles timezone consistently. Keep the current masthead date distinct from each article’s fixed publication date.

## Keep the index masthead compact

Omit the large mintis title section for now, including its surrounding space and extra divider. The address and current date provide the publication identity. Do not add generic editorial taglines or notebook labels.

## Preserve space when removing labels

Removing a section label or entry counter should not collapse the composition. Keep the divider and the breathing room before the hero image; express that space through layout rather than empty text or placeholder elements.

## Keep the footer simple and current

Use only the current year and publication name; omit the parent-site link. Avoid repeating the masthead’s description or adding another tagline. Update the year automatically. Push the footer to the bottom of the viewport when the content is short; let it flow below longer content without overlapping it. Use layout rather than fixed positioning.


## Typography

Use IBM Plex Mono for navigation, dates, metadata, controls, and the footer. Keep Source Serif 4 for the index article title and description. The JetBrains Mono trial was rejected; retain IBM Plex Mono. Preserve the distinct display typography already used in the Memory Metals article.

On the index, use 11px monospace labels with .07em tracking and uppercase text. Navigation keeps natural casing and normal tracking. Use regular-weight serif article titles at 32–55px and descriptions at 18px on desktop, 17px on mobile.

## Invert interactive links

Use an inverted background and foreground on hover: `background: var(--ink)` and `color: var(--paper)`. Apply the same treatment on keyboard focus while retaining a visible focus outline. This applies to the walkthrough card, the “Open case file” link, and the article’s “← mintis” return link. Icons inherit the text color. Use theme variables so the inversion works in both light and dark themes; avoid layout shifts on interaction.

## Link arrow glyphs

Use geometric northeast SVG arrows for index calls to action: 12 × 12px with a true 2px stroke, a straight 45-degree diagonal, square line caps, and sharp miter joins. Use a matching 12 × 12 viewBox. Avoid curved or rounded arrow geometry. Mark decorative icons as hidden from assistive technology.

## Walkthrough preview

Use a meaningful schematic derived from the walkthrough’s subject. The Memory Metals preview shows heating and cooling transition curves with labeled axes, based on its hysteresis diagram. Do not add unrelated bars, dots, or arbitrary curves for decoration. Keep schematics distinct from measured data.

Animate the preview once on entry into view. Hover or keyboard focus must immediately show the completed graph and must not restart the animation. Respect reduced-motion preferences by showing the final state without animation.
