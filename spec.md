# Camera App

## Current State
Full-featured pro camera app with modes (Photo, Video, Portrait, Cinematic, Night, Pro), manual controls panel, zoom slider, mode selector bar, and bottom controls row. Controls are split into a mode selector strip, then a bottom bar with grid/timer/torch buttons, capture button, and settings.

## Requested Changes (Diff)

### Add
- Top bar: flash/exposure icon (left), timer icon (center), settings/gear icon (right) — all overlaid on the live viewfinder
- Info (i) button overlaid top-right of the viewfinder
- Pro parameters row (ISO, S, WB, AF, EV) displayed as a horizontal strip just below the viewfinder, always visible in Pro mode — styled with label + value, active param highlighted in amber/orange
- Horizontal ruler/tick-mark scrubber below the parameter strip showing current parameter value (e.g. "1/23s") with center amber tick
- Bottom row: last-photo thumbnail (bottom-left, circular/rounded), large capture button (center, white circle ring), AI-auto toggle button (bottom-right, circular with "A" icon and refresh arrows)
- Zoom level pill (e.g. "1X") overlaid on the viewfinder above the parameter strip
- Lens dots (e.g. "• •") next to the zoom pill for multiple focal lengths

### Modify
- Remove AppHeader and AppFooter banners entirely (already done in v9)
- Redesign CameraPage layout to match the Sony Xperia Pro-I style:
  - Full-screen viewfinder occupies the entire screen
  - Top controls (flash, timer, settings) float over the viewfinder
  - Grid overlay remains on the viewfinder
  - Mode selector bar moved above the parameter strip (bottom area)
  - Pro parameter strip (ISO, S, WB, AF, EV) is a horizontal row with amber highlight on active param
  - Horizontal tick scrubber replaces the slider for adjusting the selected parameter
  - Bottom action row: thumbnail | shutter | AI-auto
- ProModeControls: replace the vertical slider panel at the bottom with the new inline parameter strip + scrubber pattern
- ModeSelector: keep existing modes, but render it just above the parameter strip

### Remove
- Old bottom controls bar (grid/timer/torch icon buttons row separate from capture button)
- Vertical ISO/Shutter/WB sliders in ProModeControls (replaced by scrubber)
- ZoomSlider component (replaced by zoom pill overlay with dots)

## Implementation Plan
1. Redesign CameraPage layout:
   - Full-screen video with all controls floating over it
   - Top floating row: flash toggle (left), timer (center), gear/settings (right), info (i) top-right corner
   - Viewfinder grid overlay remains
   - Zoom pill + dots overlaid above parameter strip
   - Recording indicator stays top-center
   - AI badges stay top-center
2. Create new XperiaParamStrip component: horizontal row showing ISO | S | WB | AF | EV with label and value, active one highlighted amber with underline
3. Create new XperiaRulerScrubber component: shows current value large text + horizontal tick ruler with amber center marker, draggable to adjust value
4. Create new XperiaBottomRow component: left=last photo thumbnail, center=capture/record button, right=AI-auto mode button
5. Wire param strip selection to ruler scrubber (selecting ISO shows ISO ruler, selecting S shows shutter ruler, etc.)
6. Keep all existing hooks and logic (zoom, torch, recording, noise reduction, etc.)
7. Top bar controls (flash, timer, grid) accessible via floating icon buttons on viewfinder
