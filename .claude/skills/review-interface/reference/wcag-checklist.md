# WCAG checklist

The success criteria that actually bite in application UI, at the level this project
targets: **WCAG 2.2, Level AA**. Criteria are listed with their number so a finding
can cite it.

## Contents

- Conformance target and the APCA note
- Perceivable
- Operable
- Understandable
- Robust
- New in WCAG 2.2
- Quick numbers

## Conformance target and the APCA note

WCAG 2.2 Level AA is the bar. It is the operative benchmark for accessibility
regulation, and it is what a finding should be measured against.

APCA is the perceptual contrast algorithm proposed for the next generation of
guidance. It models contrast better than the 2.x ratio for thin text, light text on
dark backgrounds, and mid-tone pairings, so it is useful judgment when a colour pair
passes 1.4.3 on paper and still reads badly.

Two limits matter. WCAG 3.0 is a Working Draft and is years from being a
Recommendation, and APCA is not part of its normative text. APCA scores are not
convertible to 2.x ratios, so a pair can pass one and fail the other. Use APCA to
argue for a better colour, never to excuse one that fails 1.4.3.

## Perceivable

- **1.1.1 Non-text Content (A).** Meaningful images have a text alternative.
  Decorative ones are hidden from the accessibility tree.
- **1.3.1 Info and Relationships (A).** Structure conveyed visually is also in the
  markup: headings, lists, tables with headers, fieldsets with legends, labels bound
  to controls.
- **1.3.2 Meaningful Sequence (A).** Reading order in the DOM matches the visual
  order. Reordering with CSS is where this breaks.
- **1.3.4 Orientation (AA).** Nothing is locked to portrait or landscape.
- **1.3.5 Identify Input Purpose (AA).** Personal fields carry the right
  `autocomplete` value.
- **1.4.1 Use of Color (A).** Colour is never the only carrier of meaning. An error
  needs text or an icon, not just red.
- **1.4.3 Contrast (Minimum) (AA).** 4.5:1 for text, 3:1 for large text.
- **1.4.4 Resize Text (AA).** Text scales to 200 percent without loss of content or
  function. Fixed pixel heights on text containers break this.
- **1.4.5 Images of Text (AA).** Real text, not text baked into an image.
- **1.4.10 Reflow (AA).** No two-dimensional scrolling at 320 CSS pixels wide,
  equivalent to 400 percent zoom on a 1280 pixel viewport. Data tables and complex
  diagrams are the allowed exception, and they scroll inside their own container.
- **1.4.11 Non-text Contrast (AA).** 3:1 for interface component boundaries, focus
  indicators, states, and meaningful graphics.
- **1.4.12 Text Spacing (AA).** Content survives increased line height, paragraph
  spacing, letter spacing, and word spacing.
- **1.4.13 Content on Hover or Focus (AA).** Tooltips and popovers are dismissible
  without moving the pointer, hoverable, and persistent until dismissed.

## Operable

- **2.1.1 Keyboard (A).** Every function is available from the keyboard.
- **2.1.2 No Keyboard Trap (A).** Focus can always leave, by keyboard alone.
- **2.1.4 Character Key Shortcuts (A).** Single-character shortcuts can be turned
  off or remapped.
- **2.2.1 Timing Adjustable (A).** Time limits can be extended or turned off.
- **2.2.2 Pause, Stop, Hide (A).** Anything moving or auto-updating for more than
  five seconds can be paused.
- **2.3.1 Three Flashes (A).** Nothing flashes more than three times a second.
- **2.4.1 Bypass Blocks (A).** A skip link or landmarks let a keyboard user reach
  the main content.
- **2.4.2 Page Titled (A).** Each page has a title describing its purpose.
- **2.4.3 Focus Order (A).** Tab order preserves meaning and operability.
- **2.4.4 Link Purpose (In Context) (A).** The link text says where it goes.
- **2.4.5 Multiple Ways (AA).** More than one route to each page.
- **2.4.6 Headings and Labels (AA).** They describe the topic or purpose.
- **2.4.7 Focus Visible (AA).** A visible indicator on every focused element.
- **2.4.11 Focus Not Obscured (Minimum) (AA).** Sticky headers, footers, and toolbars
  do not fully hide the focused element.
- **2.5.3 Label in Name (A).** The accessible name contains the visible label text,
  so voice control can address it.
- **2.5.7 Dragging Movements (AA).** Anything draggable has a single-pointer
  alternative.
- **2.5.8 Target Size (Minimum) (AA).** Targets are at least 24 by 24 CSS pixels, or
  spaced so that a 24 pixel circle around each does not overlap another. Inline
  links in a sentence are exempt.

## Understandable

- **3.1.1 Language of Page (A).** The `lang` attribute is set and correct, including
  when the locale switches.
- **3.2.1 On Focus (A)** and **3.2.2 On Input (A).** Focusing or changing a control
  does not trigger a surprise context change.
- **3.2.3 Consistent Navigation (AA)** and **3.2.4 Consistent Identification (AA).**
  The same component is named and placed the same way across pages.
- **3.2.6 Consistent Help (A).** Help lives in the same relative place on every page
  that offers it.
- **3.3.1 Error Identification (A).** The failing field is identified in text.
- **3.3.2 Labels or Instructions (A).** Fields say what they expect before the user
  gets it wrong.
- **3.3.3 Error Suggestion (AA).** The message suggests a correction when one is
  known.
- **3.3.4 Error Prevention (AA).** Legal, financial, and destructive actions are
  reversible, checked, or confirmed.
- **3.3.7 Redundant Entry (A).** Information already entered in the same process is
  reused or offered, not demanded again.
- **3.3.8 Accessible Authentication (Minimum) (AA).** No cognitive function test
  (puzzle, memorised code, transcription) unless there is an alternative. Pasting
  into a password or code field must work, and a password manager must be able to
  fill it.

## Robust

- **4.1.2 Name, Role, Value (A).** Every custom control exposes all three, and value
  changes are reported.
- **4.1.3 Status Messages (AA).** Status, success, and error messages reach
  assistive technology without stealing focus.

Note that 4.1.1 Parsing was removed in WCAG 2.2. Do not raise it.

## New in WCAG 2.2

Nine criteria were added, and these are the ones teams miss most:

| Criterion                              | Level | The trap                                          |
| -------------------------------------- | ----- | ------------------------------------------------- |
| 2.4.11 Focus Not Obscured (Minimum)    | AA    | Sticky headers covering the focused row           |
| 2.5.7 Dragging Movements               | AA    | Drag-to-reorder with no button alternative        |
| 2.5.8 Target Size (Minimum)            | AA    | Icon buttons under 24 pixels, tight table actions |
| 3.2.6 Consistent Help                  | A     | Support entry point moving between pages          |
| 3.3.7 Redundant Entry                  | A     | Re-asking for an email already given in the flow  |
| 3.3.8 Accessible Authentication (Min.) | AA    | Blocking paste in a one-time-code field           |

## Quick numbers

| Thing                          | Threshold                                     |
| ------------------------------ | --------------------------------------------- |
| Body text contrast             | 4.5:1                                         |
| Large text contrast            | 3:1 (24px regular, or 18.66px bold and above) |
| Interface and graphic contrast | 3:1                                           |
| Enhanced text contrast (AAA)   | 7:1                                           |
| Minimum target size            | 24 by 24 CSS pixels                           |
| Reflow width                   | 320 CSS pixels, no second scroll axis         |
| Text zoom                      | 200 percent                                   |
