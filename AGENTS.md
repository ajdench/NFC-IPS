## Next Steps
- Extend regression coverage across encode/decode + parse UI flows
- Verify OPCP empty-state styling remains consistent (particularly POI)
- Architectural refinement: rename payload viewer `right-input` field to `right-output` and update dependent selectors/logic for terminology clarity.

### Update 2025-09-21
- `config.specialClass` path in `createInfoBoxes` commented out so POI pane now shares standard wrapper/title classes.
- Encoding grid panes now mirror main payload left/right styling; right-hand Parse buttons remain disabled placeholders.
- Switched encoding left headers to grid layout with hidden preset spacer so spacing mirrors the viewer pane.
- Payload pane layout: removed inter-element gap so header/input stack without additional vertical spacing.
- Removed Debug Regenerate control; payload header now sits directly above panes with standard padding only.
- Payload header spacing tuned: margin set to 0.75× standard while title margin stays zero to keep panes tight without feeling cramped.

# Agent Notes (2025-09-21)

- UI palette refined so AXP sits chromatically between CASEVAC/MEDEVAC and R3 carries a richer lavender tone.
- Default startup behaviour remains manual: left pane shows FHIR bundle, right pane empty until user clicks Encode/Parse.
- Fixed POI empty-state styling so it uses the shared condensed title marker like other OPCP panes.
- BUG: POI pane still shows full-height empty state instead of the shared condensed style.
