# Changelog

## ver0.31

- Changed isthmus nodule `Location` controls from `Upper / Middle / Lower` to optional `Right / Left / Paraisthmus` modifiers.
- Enforced mutual exclusivity between `Right` and `Left` for isthmus nodules while allowing `Paraisthmus` to combine with either side.
- Allowed no isthmus location modifier as a valid central-isthmus state; validation no longer requires Location for isthmus nodules, but still requires Location for right/left lobe nodules.
- Updated report formatting so central isthmus nodules omit the extra location comma, while selected modifiers appear as text such as `Right Paraisthmus`.
- Kept diagram-created isthmus nodules valid without auto-setting `Middle`, and verified diagram popup/card location UI synchronization.

## ver0.30

- Fixed the Diagram-opened nodule Quick add row where `PTC` and `Follicular Neoplasm` still looked vertically off because the surrounding `.preset-strip.in-card` had asymmetric top/bottom padding.
- Made `.preset-strip` padding symmetric and gave in-card preset strips a control-height row with centered alignment.
- Set preset chips to a fixed 34px height with zero vertical padding and centered flex alignment, producing equal top/bottom spacing in both the popup and nodule add areas.
- Verified JavaScript syntax, browser-computed popup Quick add top/bottom gaps, and visual alignment in the Diagram nodule popup and below-diagram nodule add area.

## ver0.29

- Centered QUICK ADD preset-chip labels such as `PTC` and `Follicular Neoplasm` by converting `.preset-chip` to `inline-flex` with `align-items: center` and `justify-content: center`.
- Removed asymmetric vertical chip padding in favor of fixed min-height plus symmetric horizontal padding so labels sit visually centered in rounded buttons.
- Verified JavaScript syntax, browser-computed preset-chip alignment, and visual centering of both top-level and in-card QUICK ADD chips.

## ver0.28

- Refined nodule option-control layout so sparse long choices such as `Extensive parenchymal PEF` and `Diffuse infiltrative lesion` stay compact instead of stretching with excessive right-side whitespace.
- Added equal-width wrapping grid behavior for nodule option sections with 3+ choices, improving alignment and consistency across Composition, Echogenicity, Margin, Echogenic foci, Vascularity, and ETE-style groups.
- Preserved compact two-option groups such as `Initial` / `Follow-up` and long diffuse lesion choices without forcing full-row expansion.
- Changed validation errors triggered by `판독문` from bottom-sheet placement to a centered alert dialog, and removed the inline `max-width:500px` override so centered alert CSS applies consistently.
- Verified JavaScript syntax, browser-computed control widths, compact long-option groups, equal-width 3+ groups, and centered validation dialog placement.

## ver0.27

- Fixed visual centering for Date `Year` / `MM` / `DD` selects by removing asymmetric select padding and assigning explicit compact date widths.
- Applied the same date-select sizing to dynamically generated biopsy date controls via `data-date-part` attributes.
- Changed segmented controls from full-row stretching to compact `fit-content` sizing with similar button widths.
- Removed mobile `radio-group` forced `width:100%` and `label flex:1`, so sparse groups such as `Initial` / `Follow-up` keep natural, consistent widths.
- Verified JavaScript syntax, browser-computed date select alignment, compact segmented group widths, and visual layout in browser.

## ver0.26

- Added shared typography/control tokens for more consistent font sizing across the tool.
- Increased base body/form typography for better legibility while preserving the existing compact clinical layout.
- Center-aligned text and placeholders inside text inputs and selects, including Clinical Information `custom` and Thyroid Size AP/T/L boxes.
- Standardized segmented controls, checkbox labels, table labels, date selects, nodule cells, and lymph-node table typography/weights.
- Verified JavaScript syntax and browser-computed styles for centered inputs/selects and larger consistent font sizes.

## ver0.25

- Replaced single-item Diagram delete restore with a multi-item delete history stack.
- Repeated `복원` clicks now restore previously deleted nodules sequentially, not only the immediately deleted one.
- The inline Diagram undo bar now shows how many deleted nodules remain restorable.
- Updated the top-right `판독문` button styling: inactive state uses a white background, while active preview state changes to green with white text.
- Verified JavaScript syntax, multi-item delete/restore behavior, and inactive/active report button colors in browser.

## ver0.24

- Reduced QUICK ADD presets to only `PTC` and `Follicular Neoplasm`.
- Added QUICK ADD to existing nodule forms, including nodules opened from the Diagram popup, so presets can be applied after diagram-based nodule creation.
- Redesigned Diagram span resize controls from plain blue circles into polished blue pill-shaped grip handles with subtle stems and grip marks.
- Verified PTC/Follicular preset application, popup QUICK ADD rendering, and handle SVG shape replacement in browser.

## ver0.23

- Split Diagram marker interactions into two explicit modes.
- Dragging the marker body now moves/repositions the nodule while preserving span size: single-zone stays single-zone, two-zone stays two-zone, and three-zone stays Upper-to-lower.
- Added separate blue upper/lower span handles; dragging these handles changes the location span/marker size intentionally.
- Verified body drag `Middle → Lower` becomes `Lower`, handle drag `Middle → Lower` becomes `Middle to lower`, and body drag `Upper to middle → Lower` shifts to `Middle to lower`.

## ver0.22

- Fixed existing Diagram marker drag so a marker dragged from Middle to Lower is recognized as `Middle to lower`, not only `Lower`.
- Existing markers now support left-click drag span editing within the same lobe: Middle→Lower, Middle→Upper, Upper→Lower, and shifting Upper-to-middle downward to Middle-to-lower.
- Dropped multi-zone markers are re-centered on the selected zone span so the visual ellipse continues to cover the recognized locations.

## ver0.21

- Diagram marker drag now updates the nodule `Location` state to match the marker's dropped anatomical zone.
- Moving an existing marker to Upper / Middle / Lower updates the corresponding Location checkbox and downstream report text.
- The nodule edit popup refreshes after a diagram drag so visible Location checkboxes stay synchronized.

## ver0.20

- Standardized the Diagram nodule marker delete `×` badge position.
- The badge now uses a fixed marker-local upper-right offset instead of changing with marker ellipse size or active-state size.
- This keeps the `×` placement visually consistent across single-zone, multi-zone, and active markers.

## ver0.19

- Report Preview is hidden by default on desktop so the main form can use the full screen width.
- The top-right `판독문` button now toggles the live Report Preview pane instead of requiring the preview to stay permanently visible.
- When the preview is opened, the app temporarily reserves right-side space; closing it restores full-width editing.
- On tablet/mobile, the same `판독문` button opens the existing bottom-sheet preview behavior.

## ver0.18

- Repositioned the Diagram marker delete `×` badge so it remains close to the nodule but no longer covers the center `R1` / `L1` label.
- Reduced the delete badge size slightly and placed it just outside the marker's upper-right edge.
- Verified the delete circle does not overlap the marker label bounding box, while deletion and one-step restore still work.

## ver0.17

- Moved the Diagram marker delete `×` badge closer to the marker itself.
- The delete badge now overlaps the marker's upper-right shoulder using proportional offsets, so it remains visually attached for both small circular markers and taller multi-zone ellipses.
- Preserved in-diagram deletion and one-step restore behavior from ver0.16.

## ver0.16

- Diagram is now visible by default when the Thyroid Nodule section loads.
- Diagram sizing is responsive and expands toward the largest practical size for the current viewport while preserving the SVG aspect ratio.
- Added a small red `×` delete control above each Diagram nodule marker for quick in-diagram deletion.
- Added one-step restore for accidental Diagram deletion via an inline `복원` undo bar.

## ver0.15

- Added fine-grained Diagram marker positioning with persisted `diagramX` / `diagramY` coordinates.
- Dragged markers now remain at the exact dropped SVG position instead of snapping back to fixed zone centers.
- Newly added Diagram nodules are placed at the clicked/dropped point within the selected lobe.
- Coarse location flags and report text still follow Upper / Middle / Lower zone logic, while the marker can be visually positioned more precisely.

## ver0.14

- Added a live ghost marker while dragging an existing Diagram nodule marker.
- The dragged nodule now follows the mouse cursor visually during movement.
- The original marker is dimmed during drag, while the cursor-following marker remains prominent.
- Drop behavior from ver0.13 is preserved: releasing the marker updates the existing nodule location and report.

## ver0.13

- Added drag-to-move interaction for existing Diagram nodule markers.
- Dragging a marker updates the nodule's stored location and generated report without creating a duplicate nodule.
- Dragging a single-zone marker reassigns it to the dropped zone; dragging a two-zone marker preserves a two-zone span when moved.
- Markers can be moved across right lobe, left lobe, and isthmus when the destination lobe is not full.
- Clicking a marker still opens the existing edit popup.

## ver0.12

- Enlarged the interactive Diagram display from 320px to 640px width.
- Removed redundant side `R` / `L` orientation pills while keeping the bottom `Right` / `Left` labels.
- Changed Diagram markers from fixed circles to ellipses.
- Multi-zone dragged nodules now render as taller vertical markers spanning the selected zone range, including Upper to middle and Upper to lower.

## ver0.11

- Moved Diagram bottom `Right` / `Left` labels upward so they no longer overlap the rounded diagram box border.
- Added click-and-drag zone selection in the Diagram.
- Dragging within the same lobe now creates multi-zone nodules such as Upper to middle, Middle to lower, or Upper to lower.
- Single-zone click behavior is preserved.

## ver0.10

- Redesigned the interactive Diagram thyroid schematic.
- Replaced plain ellipse/rectangle anatomy with smoother SVG path lobes and curved isthmus.
- Added subtle gradients, soft shadow, rounded background, zone divider lines, and R/L orientation pills.
- Preserved all existing click-zone IDs and behavior.

## ver0.9

- Fixed Extrathyroidal Lesion textarea state handling.
- Added explicit input handler so typed text updates `state.extraLesion`.
- Confirmed Extrathyroidal Lesion appears in Findings and Conclusion.

## ver0.8

- Improved Bethesda and CNB category select row layout.
- Prevented long option text from expanding outside nodule card boundaries.

## ver0.7

- Corrected lobe order to Right lobe → Isthmus → Left lobe.

## ver0.6

- Hid Follow-up subtype choices when Initial is selected.

## ver0.5

- Converted Size Change Initial / Follow-up controls to mutually exclusive radio behavior.

## ver0.4

- Fixed size input blur/click race that sometimes required double-clicking subsequent controls.

## ver0.3

- Fixed mobile/narrow nodule-card layout overflow by stacking label/data cells and wrapping controls.

## ver0.2

- Restructured biopsy section into Previous Biopsy and Current Biopsy.
- Added nodule-level previous biopsy entries and current biopsy procedure details.

## ver0.1

- Baseline original HTML tool.
