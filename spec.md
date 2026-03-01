# Specification

## Summary
**Goal:** Add cinema camera-style controls to the viewfinder and increase background blur intensity across all blur effects in Lens Studio.

**Planned changes:**
- Add a dedicated "Cinema Controls" panel that slides up when Cinematic or Video mode is active, containing:
  - A circular exposure wheel/dial for EV adjustment (replacing/augmenting the existing EV slider)
  - A cine color profile selector (Rec.709, Log-C flat, D-Cinema) that applies CSS/canvas filters to the live preview
  - An anamorphic 2.39:1 letterbox crop guide toggle rendered as a semi-transparent overlay on the viewfinder
  - A focal length/lens indicator HUD label (e.g. "24mm eq.") overlaid on the viewfinder
- Wire all new Cinema Controls to existing hooks (useManualControls, useCinematicMode, etc.)
- Style all new controls using the existing dark amber/gold theme and glass-morphism design tokens
- Increase default blur sigma in `useAIBlur` to a minimum equivalent of CSS `blur(24px)`
- Increase default blur sigma in `useCinematicMode` to a minimum equivalent of CSS `blur(28px)`
- Raise default and maximum blur intensity values in FocusEditPanel for more pronounced bokeh
- Add a "Blur Strength" quick-toggle button (Light / Strong / Max) to the camera controls row, visible when AI Blur or Cinematic mode is active, that scales the blur multiplier across all active blur effects at runtime
- Persist the selected blur strength level in localStorage

**User-visible outcome:** Users get a professional cinema camera UI with a sliding Cinema Controls panel featuring an exposure dial, color profile selector, anamorphic crop guides, and lens indicator overlay. Background blur is visibly stronger by default, and a three-level Blur Strength toggle lets users dial up to near-complete background obscuration.
