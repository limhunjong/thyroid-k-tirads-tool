# Changelog

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
