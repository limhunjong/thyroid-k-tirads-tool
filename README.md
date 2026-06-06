# Thyroid Finding Tool - K-TIRADS 2021

Single-file HTML thyroid ultrasound reporting tool based on K-TIRADS 2021 workflow.

## Latest version

- `index.html` is the current latest version, copied from `versions/Thyroid_K_TIRADS_2021_ver0.16.html`.
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

## Notes

- This repository preserves the iterative development process as separate versioned HTML files.
- Clinical guideline logic should be validated separately against K-TIRADS 2021 source material before clinical deployment.
