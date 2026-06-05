# Changelog

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
