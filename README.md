# MIDI JSON Bridge

An Ableton Live extension that exports/imports MIDI clip notes as JSON.
It's designed for workflows where melodies or chord progressions are
generated/edited as JSON in a chat with Claude (or similar tools) and
then applied to a clip in Live.

## Features

- **Export as JSON**: Right-click a MIDI clip → note data (`pitch`,
  `startTime`, `duration`, `velocity`, `muted`) is shown as JSON in a
  modal dialog, ready to copy to the clipboard.
- **Import from JSON**: Right-click a MIDI clip → paste JSON and click
  "Apply" to replace the clip's notes.

## JSON format

```json
[
  { "pitch": 60, "startTime": 0, "duration": 1, "velocity": 100 },
  { "pitch": 64, "startTime": 1, "duration": 1 },
  { "pitch": 67, "startTime": 2, "duration": 2, "muted": false }
]
```

- `pitch`: MIDI note number (0-127, 60 = C3)
- `startTime`: start position from the clip's beginning, in beats
- `duration`: length in beats
- `velocity`: velocity (optional, defaults to ~100)
- `muted`: muted flag (optional)

The `{ "notes": [...] }` form is also accepted.

## Development

```bash
npm install
npm start        # build and launch the Live Extension Host (requires Developer Mode)
npm run package  # create a .ablx package
```
