# MIDI JSON Bridge — JSON Format Reference

This document specifies the JSON formats used by the MIDI JSON Bridge
extension's Export/Import commands. Use it as a reference when
generating or editing MIDI data (e.g. in a chat with Claude) before
pasting it into Live.

There are two formats:

- **Note array** — the contents of a single MIDI clip.
- **Track document** — all clips in a MIDI track's Session View slots.

## Note object

Both formats are built from note objects with this shape:

```json
{ "pitch": 60, "startTime": 0, "duration": 1, "velocity": 100, "muted": false }
```

| Field       | Type    | Required | Description |
|-------------|---------|----------|-------------|
| `pitch`     | number  | yes      | MIDI note number, 0–127 (60 = C3). |
| `startTime` | number  | yes      | Start position from the clip's beginning, in beats. |
| `duration`  | number  | yes      | Note length, in beats. |
| `velocity`  | number  | no       | Note velocity, 1–127. Omitted ≈ Live's default (~100). |
| `muted`     | boolean | no       | Whether the note is muted. Omitted = `false`. |

Beats, not seconds: a quarter note at 4/4 is `1` beat; a bar is `4`
beats.

## Format 1: Note array (single clip)

Used by **"Export as JSON"** / **"Import from JSON"** on a MIDI clip's
right-click menu.

```json
[
  { "pitch": 60, "startTime": 0, "duration": 1, "velocity": 100 },
  { "pitch": 64, "startTime": 1, "duration": 1 },
  { "pitch": 67, "startTime": 2, "duration": 2, "muted": false }
]
```

- Top level is an array of note objects.
- The wrapped form `{ "notes": [...] }` is also accepted on import.
- An empty array (`[]`) clears all notes from the clip.
- **Import overwrites all existing notes in the clip.**

## Format 2: Track document (whole track, Session View)

Used by **"Export Track Clips as JSON"** / **"Import Track Clips from
JSON"** on a MIDI track's right-click menu.

```json
{
  "clips": [
    {
      "slotIndex": 0,
      "name": "Verse",
      "notes": [
        { "pitch": 60, "startTime": 0, "duration": 1, "velocity": 100 },
        { "pitch": 64, "startTime": 1, "duration": 1 }
      ]
    },
    {
      "slotIndex": 1,
      "name": "Chorus",
      "notes": [
        { "pitch": 64, "startTime": 0, "duration": 2 },
        { "pitch": 67, "startTime": 2, "duration": 2 }
      ]
    }
  ]
}
```

| Field            | Type    | Required | Description |
|------------------|---------|----------|-------------|
| `clips`          | array   | yes      | One entry per clip. |
| `clips[].slotIndex` | number | yes   | 0-based Session View clip slot index. |
| `clips[].name`   | string  | yes      | Clip name. |
| `clips[].notes`  | array   | yes      | Note objects, same shape as Format 1. |

### Import behavior

- For each entry in `clips`, the extension looks up the clip slot at
  `slotIndex` on the right-clicked track:
  - If a MIDI clip already exists in that slot, its `name` and `notes`
    are **overwritten**.
  - If the slot is empty, a new MIDI clip is created with the given
    `name` and `notes`.
- A new clip's length is the smallest multiple of 4 beats (one bar at
  4/4) that fits all of its notes, with a 4-beat minimum.
- Slots referenced by `slotIndex` that don't exist on the track (out
  of range) are skipped.
- Slots on the track that are **not** mentioned in `clips` are left
  untouched.

### Export behavior

- Empty clip slots and non-MIDI (audio) clips are skipped — only MIDI
  clips are included in `clips`.
- `slotIndex` reflects the clip's actual position, so re-importing the
  exported JSON unchanged is a no-op.

## Examples for chat-based generation

A simple C major triad arpeggio, one bar:

```json
[
  { "pitch": 60, "startTime": 0,   "duration": 0.5, "velocity": 100 },
  { "pitch": 64, "startTime": 0.5, "duration": 0.5, "velocity": 100 },
  { "pitch": 67, "startTime": 1,   "duration": 0.5, "velocity": 100 },
  { "pitch": 72, "startTime": 1.5, "duration": 0.5, "velocity": 100 }
]
```

A two-clip chord progression for a "Chord" track (slots 0 and 1):

```json
{
  "clips": [
    {
      "slotIndex": 0,
      "name": "Cmaj7",
      "notes": [
        { "pitch": 60, "startTime": 0, "duration": 4 },
        { "pitch": 64, "startTime": 0, "duration": 4 },
        { "pitch": 67, "startTime": 0, "duration": 4 },
        { "pitch": 71, "startTime": 0, "duration": 4 }
      ]
    },
    {
      "slotIndex": 1,
      "name": "Am7",
      "notes": [
        { "pitch": 57, "startTime": 0, "duration": 4 },
        { "pitch": 60, "startTime": 0, "duration": 4 },
        { "pitch": 64, "startTime": 0, "duration": 4 },
        { "pitch": 67, "startTime": 0, "duration": 4 }
      ]
    }
  ]
}
```
