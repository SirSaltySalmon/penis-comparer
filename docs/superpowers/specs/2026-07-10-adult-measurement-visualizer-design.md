# Adult Measurement Visualizer Design

## Purpose

Build a React + Vite web app that lets adults compare personal measurements against an abstract, family-friendly 2D anatomical visual. The app should feel educational and lightly approachable, but not erotic, comedic at the user's expense, or targeted at minors.

The first version is a static client-side app. It has no backend, accounts, database, public gallery, or image export. Users share a URL whose query parameters reconstruct the same visual locally.

## Product Scope

The app opens to an average adult reference preset in an estimated actual-size view. Users can adjust length, diameter, optional soft tissue/fat-layer thickness, color, and unit display. The visual updates immediately.

The scale should be labeled as estimated until the user calibrates it. Browsers cannot reliably know physical display size across zoom, operating-system scaling, external monitors, and privacy limits. The UI should stay lightweight, but the copy must not imply guaranteed physical accuracy without calibration.

Calibration is optional and lives near the bottom of the page. It should not block first use.

## Audience And Safety

The app is explicitly for adults. The visual style is abstract, flat, and non-erotic. It should avoid realistic texture, explicit sexual context, pornographic presentation, jokes that shame the user, ranking language, and public comparison mechanics.

Copy should frame the tool as educational body-measurement visualization, not medical advice. It should normalize variation without diagnosing, promising outcomes, or implying that size determines health, masculinity, or sexual worth.

## Reference Presets

The default average preset uses Veale et al. 2015, "Am I normal? A systematic review and construction of nomograms for flaccid and erect penis length and circumference in up to 15,521 men." This source is preferred for the default because it includes both length and circumference.

- Erect length: 13.12 cm
- Erect circumference: 11.66 cm
- Derived diameter: 11.66 / pi = about 3.71 cm

Belladelli et al. 2023, "Worldwide Temporal Trends in Penile Length: A Systematic Review and Meta-Analysis," should be kept as an optional alternate length benchmark. It reports a pooled global average erect length of 13.93 cm across 75 studies and 55,761 men, but it should not be the default full-size preset unless paired with a compatible circumference or diameter source.

## Measurement Model

Canonical values are metric:

- `lengthCm`
- `diameterCm`
- `fatLayerCm`
- `color`
- `unitMode`
- `presetId`
- `scaleStatus`
- `calibrationFactor`, if calibrated locally

Imperial values are display-only conversions. Shared URLs should store canonical metric values to avoid conversion drift.

The core measurement rule is: length is measured from the pubic-bone reference to the furthest tip of the visual, including the tip/glans. Length must never stop at the shaft/body boundary.

The soft tissue/fat-layer value is a visual guide above the pubic bone. It does not subtract from the entered measured length in v1. A future mode could compare visible length against bone-pressed length, but that is out of scope for this spec.

## Visual Design

Rendering should use SVG so the shape, rulers, labels, and measurement markers remain precise and responsive.

The anatomical form is an abstract side-view silhouette. It should be recognizable enough to compare length and girth, but not realistic or sexualized. It includes:

- Main body/shaft silhouette
- Tip/glans as part of the total measured length
- Pubic-bone reference
- Optional soft tissue/fat-layer guide
- Length marker
- Diameter marker
- Ruler scale
- Estimated/calibrated status

Desktop and tablet use a horizontal canvas. The pubic-bone reference sits at the base side, and length extends horizontally to the furthest tip.

Mobile uses a portrait canvas. The pubic-bone reference sits at the bottom, and length extends upward to the furthest tip. The vertical orientation should avoid sideways scrolling and should match how users naturally hold a phone.

## User Interface

The main screen prioritizes the measurement canvas. Controls are visible but secondary.

Desktop can use a side panel or adjacent controls for:

- Length
- Diameter
- Fat-layer thickness
- Color
- Metric/imperial toggle
- Preset/source selector
- Share URL action

Mobile should keep the visual dominant and place editing controls in a compact bottom area or bottom sheet.

The guide drawer is collapsed by default and expands to explain:

- Adult-only educational framing
- How length is measured from pubic bone to furthest tip
- How circumference converts to diameter
- Why scale is estimated until calibrated
- How optional calibration works
- Source citations
- Non-medical disclaimer

## URL Sharing

Sharing uses query parameters only. Opening a shared URL reconstructs the same measurement values locally.

The URL should encode:

- Length in cm
- Diameter in cm
- Fat-layer thickness in cm
- Color
- Unit display mode
- Preset/source id, if applicable

Calibration should remain local by default because another device has a different physical screen. If calibration is ever encoded, the UI must indicate that it applies only to the originating screen assumptions and may need recalibration.

## Scale Estimation And Calibration

Initial scale estimation can use browser CSS pixel assumptions and available display metadata, but it must expose status as `estimated`. The app may start in estimated actual-size mode without a blocking warning, but visible copy should say "estimated scale" or equivalent.

Optional calibration should allow users to adjust scale using a known reference object or a custom length. Calibration changes the local CSS-pixel-to-centimeter mapping and updates the ruler and visual.

If scale estimation is unavailable or produces unusual values, fall back to the standard CSS assumption of 96 CSS px per inch and keep the scale marked as estimated.

## Architecture

Use React + Vite + TypeScript.

Suggested modules:

- `measurementModel`: canonical metric state, preset data, unit conversions, circumference-to-diameter conversion.
- `urlState`: parse and serialize query parameters, ignore malformed values field by field, restore defaults when needed.
- `scaleEstimator`: produce estimated CSS-pixel-to-centimeter mapping and report scale status.
- `calibration`: optional correction flow and local calibration factor.
- `AnatomySvg`: pure SVG renderer receiving measurement values, orientation, and scale.
- `GuideDrawer`: measurement guide, citations, adult framing, and disclaimer.

## Validation And Error Handling

Inputs should reject or clamp impossible values. Empty, non-numeric, negative, or extreme values should show inline messages while preserving the last valid render.

Malformed shared URLs should ignore only the bad fields and fall back to defaults for those fields. If any field is reset, show a small notice that some shared values were invalid and were reset.

Color choices should stay visually accessible. If custom color input is allowed, the UI should still preserve contrast for measurement markers and labels.

## Testing

Unit tests should cover:

- Metric and imperial conversion
- Circumference-to-diameter conversion
- URL parse and serialize round trips
- Input validation and clamping
- Scale factor math
- Preset selection

Component tests should cover:

- Editing measurements updates the visual state
- Unit toggling changes display but not canonical values
- Shared URL values hydrate correctly
- Guide drawer opens and closes
- Invalid URL params reset only invalid fields

Browser checks should cover:

- Desktop horizontal layout
- Mobile vertical layout
- Length marker reaches the furthest tip
- Diameter marker renders across the visual
- Ruler labels do not overlap
- Text fits on mobile and desktop

## Out Of Scope For V1

- Backend storage
- Accounts
- Public gallery
- PNG export
- Medical diagnosis
- Rankings or leaderboards
- Region/race-based comparison claims
- Explicit sexual content
- Visible-vs-bone-pressed comparison mode

## Sources

- Veale et al. 2015: https://pubmed.ncbi.nlm.nih.gov/25487360/
- King's College record for Veale et al. 2015: https://kclpure.kcl.ac.uk/portal/en/publications/am-i-normal-a-systematic-review-and-construction-of-nomograms-for/
- Belladelli et al. 2023: https://pubmed.ncbi.nlm.nih.gov/36792094/
- Belladelli et al. 2023 full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC10523114/
- MDN `devicePixelRatio`: https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
- MDN CSS values and units: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Values_and_units
