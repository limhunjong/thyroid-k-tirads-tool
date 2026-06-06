# Thyroid Finding Tool - K-TIRADS 2021

Single-file HTML thyroid ultrasound reporting tool based on K-TIRADS 2021 workflow.

## Latest version

- `index.html` is the current latest version, copied from `versions/Thyroid_K_TIRADS_2021_ver0.32.html`.
- Open `index.html` directly in a browser to use the tool.

## Version history

All incremental versions are kept in `versions/`.

- ver0.1: Original baseline.
- ver0.2: Nodule-level Previous Biopsy / Current Biopsy restructuring.
- ver0.3: Mobile/narrow nodule-card layout fix.
- ver0.4: Size input blur/click race fix.
- ver0.5: Size Change Initial / Follow-up converted to mutually exclusive radio behavior.
- ver0.6: Hide follow-up subtype choices when Initial is selected.
- ver0.7: Lobe order changed to Right lobe → Isthmus → Left lobe.
- ver0.8: Bethesda / CNB category select layout improved to prevent overflow.
- ver0.9: Extrathyroidal Lesion input correctly reflected in generated report and conclusion.
- ver0.10: Diagram thyroid schematic redesigned with a cleaner, modern, simple anatomical SVG while preserving click-zone behavior.
- ver0.11: Diagram Right/Left labels moved off the box border; click-and-drag zone selection added for Upper-to-middle / Middle-to-lower / Upper-to-lower nodules.
- ver0.12: Diagram enlarged 2×, side R/L badges removed, and multi-zone dragged nodules now display as taller vertical ellipses spanning the selected zones.
- ver0.13: Existing Diagram nodule markers can be dragged to a new zone/lobe, updating the nodule location and report while click-to-edit remains available.
- ver0.14: Dragging an existing Diagram marker now shows a cursor-following ghost nodule, making marker movement visually continuous.
- ver0.15: Diagram markers now support fine-grained persisted positions, so nodules can be placed more precisely within each zone instead of snapping to fixed centers.
- ver0.16: Diagram is visible by default, scales responsively to the viewport, and each marker has an in-diagram `×` delete control with one-step restore.
- ver0.17: Diagram marker delete `×` badge moved closer to the marker upper-right shoulder so it feels attached rather than detached.
- ver0.18: Diagram marker delete `×` badge remains close but is shifted outside the center label area so `R1` / `L1` text is not obscured.
- ver0.19: Report Preview is hidden by default and can be toggled with the top-right `판독문` button, restoring full-width editing until preview is needed.
- ver0.20: Diagram marker delete `×` badge uses a fixed marker-local upper-right offset for consistent placement across marker sizes/states.
- ver0.21: Moving a nodule marker in the Diagram now updates the nodule Location checkboxes/report to match the dropped Upper/Middle/Lower zone.
- ver0.22: Existing Diagram marker drag now edits multi-zone spans, so Middle→Lower becomes Middle to lower and Upper-to-middle can shift to Middle to lower instead of collapsing to Lower.
- ver0.23: Diagram marker body drag now moves/repositions while preserving span size; separate blue upper/lower handles resize the location span.
- ver0.24: QUICK ADD is limited to PTC and Follicular Neoplasm, existing/Diagram-opened nodule forms now include QUICK ADD, and span handles were redesigned as polished blue pill grips.
- ver0.25: Diagram deletion restore now keeps a multi-item history so older deleted nodules can be restored sequentially, and the top-right `판독문` button is white when inactive but changes color when active.
- ver0.26: Form typography was enlarged and standardized; compact fields such as Clinical Information `custom` and Thyroid Size AP/T/L boxes are centered and easier to read.
- ver0.27: Date selects use visually centered Year/MM/DD values, and segmented controls now keep compact, similar-width buttons instead of stretching sparse options across the full row.
- ver0.28: Nodule option controls were refined so sparse long choices stay compact, 3+ option groups use equal-width wrapping grids, and validation errors open as centered alerts.
- ver0.29: QUICK ADD preset chips now use flex-centered labels so `PTC` and `Follicular Neoplasm` are visually centered in their rounded buttons.
- ver0.30: Diagram-opened nodule Quick add rows now use symmetric preset-strip padding and fixed chip height so top/bottom spacing is balanced.
- ver0.31: Isthmus nodule Location now uses optional Right/Left/Paraisthmus modifiers instead of Upper/Middle/Lower; Right and Left are mutually exclusive while no modifier remains valid for central isthmus.
- ver0.32: Nodule option buttons now use a tokenized equal-grid system so selected blue rectangles such as Macro/Rim have consistent width, height, and symmetric left/right padding.

## Notes

- This repository preserves the iterative development process as separate versioned HTML files.
- Clinical guideline logic should be validated separately against K-TIRADS 2021 source material before clinical deployment.
