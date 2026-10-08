# Adaptai — Codex design instructions

Rebrand this personal endurance training app as **Adaptai**. The tone is calm, precise and supportive; training adapts to the athlete. Keep existing routes, features, validation, review/acceptance flows and data intact. Avoid unrelated refactoring.

## Architecture and integration

This is an Expo / React Native app with Expo Router tabs. `src/ui.tsx` owns shared colors and styles. `src/screens.tsx` exports `Page`, used by Plan, Chat, Settings and Workout Library. `src/BrandHeader.tsx` replaces the old brand eyebrow in that shared page. Keep the existing page title, subtitle and navigation. `app.json` owns the app display name.

## Palette

| Token | Color | Use |
| --- | --- | --- |
| Background | `#0B0F0F` | Page canvas |
| Surface | `#141A1A` | Cards and tabs |
| Text | `#F5F7F6` | Wordmark, headings, body |
| Muted | `#8A9491` | Labels and supporting text |
| Accent | `#24CEB1` | Primary actions, active tabs, focus and selected states |

Use one brand accent. Preserve semantic error styling. Keep current card spacing, borders, radii and typography hierarchy. Prefer restraint over gradients, glows or decorative effects. Primary buttons use dark text on teal; do not use white text on teal. Preserve visible keyboard focus and accessible controls. Contrast against background/surface is approximately 17.9/16.3 for text, 6.2/5.7 for muted and 9.6/8.7 for teal. Do not fade essential text or focus cues.

## Logo and header

Use the geometric ribbon-like teal A with a white **Adaptai** wordmark. `assets/brand/adaptai-mark.svg` is the transparent vector symbol; `adaptai-logo.svg` is a transparent horizontal lockup. The SVG lockup uses Arial/Helvetica/system sans-serif text, so font appearance can vary; convert the wordmark to outlines before print production if fixed typography is required. `adaptai-mark.png` is the matching high-resolution transparent native fallback; no SVG rendering dependency is needed. Keep clear space at least one quarter of the symbol height and avoid stretching. The header uses a 36px-high symbol with scalable native text and a restrained endurance-training descriptor. Allow wrapping at large accessibility font sizes; do not truncate the name.

The original conversation image was unavailable through the conversation reference. These assets interpret the supplied description, rather than claim an exact trace of that image.

## Compatibility and verification

Preserve `stride-ai` package/Expo slug, URL scheme, Android application ID, database names, storage keys, secure-store keys, backup format and calendar event UIDs. These are compatibility identifiers, not visible branding. Changing them requires a separate migration. Calendar producer branding and app display name may use Adaptai. Do not rename ordinary training “strides.”

Run TypeScript checking and the existing Jest suite. Build the web preview where feasible. Check all four tabs, chat scrolling/composer, plan acceptance, backup restore, disabled controls and error states. Review narrow screens and large text, contrast, keyboard focus and screen-reader naming. Native device rendering and installed app naming require a device build to verify.
