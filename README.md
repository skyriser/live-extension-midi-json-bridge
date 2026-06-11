# MIDI JSON Bridge

An Ableton Live extension that exports/imports MIDI clip notes as JSON.
It's designed for workflows where melodies or chord progressions are
generated/edited as JSON in a chat with Claude (or similar tools) and
then applied to a clip in Live.

## Features

### Single clip

- **Export as JSON**: Right-click a MIDI clip → note data (`pitch`,
  `startTime`, `duration`, `velocity`, `muted`) is shown as JSON in a
  modal dialog, ready to copy to the clipboard.
- **Import from JSON**: Right-click a MIDI clip → paste JSON and click
  "Apply" to replace the clip's notes.

### Whole track (Session View)

- **Export track clips as JSON**: Right-click a MIDI track → every
  clip in its session clip slots is collected into one JSON document.
- **Import track clips from JSON**: Right-click a MIDI track → paste
  JSON. For each entry, the clip in the matching slot is overwritten
  (or created if the slot is empty) with the given name and notes.

## JSON format

See [docs/json-format.md](docs/json-format.md) for the full
specification of both the single-clip note array and the whole-track
document, including field reference, import/export behavior, and
examples.

## Development

```bash
npm install
npm start        # build and launch the Live Extension Host (requires Developer Mode)
npm run package  # create a .ablx package
```
