import {
  initialize,
  MidiClip,
  MidiTrack,
  type ActivationContext,
  type Handle,
  type NoteDescription,
} from "@ableton-extensions/sdk";
import exportHtml from "./export.html";
import importHtml from "./import.html";

// ─── JSON shape ────────────────────────────────────────────────────────────

interface NoteJson {
  pitch: number;
  startTime: number;
  duration: number;
  velocity?: number;
  muted?: boolean;
}

function toJson(notes: NoteDescription[]): NoteJson[] {
  return notes.map((n) => {
    const note: NoteJson = {
      pitch: n.pitch,
      startTime: n.startTime,
      duration: n.duration,
    };
    if (n.velocity !== undefined) note.velocity = n.velocity;
    if (n.muted) note.muted = n.muted;
    return note;
  });
}

function fromJson(notes: NoteJson[]): NoteDescription[] {
  return notes.map((n) => {
    const note: NoteDescription = {
      pitch: n.pitch,
      startTime: n.startTime,
      duration: n.duration,
    };
    if (n.velocity !== undefined) note.velocity = n.velocity;
    if (n.muted !== undefined) note.muted = n.muted;
    return note;
  });
}

function isNoteJson(value: unknown): value is NoteJson {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.pitch !== "number") return false;
  if (typeof v.startTime !== "number") return false;
  if (typeof v.duration !== "number") return false;
  if (v.velocity !== undefined && typeof v.velocity !== "number") return false;
  if (v.muted !== undefined && typeof v.muted !== "boolean") return false;
  return true;
}

function parseNotesJson(text: string): NoteJson[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("JSONの形式が正しくありません");
  }
  const arr = Array.isArray(parsed) ? parsed : (parsed as { notes?: unknown }).notes;
  if (!Array.isArray(arr)) {
    throw new Error("ノートの配列、または { notes: [...] } の形式である必要があります");
  }
  if (!arr.every(isNoteJson)) {
    throw new Error("各ノートには pitch, startTime, duration (数値) が必要です");
  }
  return arr;
}

// ─── Track-level JSON shape ────────────────────────────────────────────────

interface ClipJson {
  slotIndex: number;
  name: string;
  notes: NoteJson[];
}

function isClipJson(value: unknown): value is ClipJson {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.slotIndex !== "number") return false;
  if (typeof v.name !== "string") return false;
  if (!Array.isArray(v.notes) || !v.notes.every(isNoteJson)) return false;
  return true;
}

function parseClipsJson(text: string): ClipJson[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("JSONの形式が正しくありません");
  }
  const clips = (parsed as { clips?: unknown }).clips;
  if (!Array.isArray(clips)) {
    throw new Error('{ "clips": [...] } の形式である必要があります');
  }
  if (!clips.every(isClipJson)) {
    throw new Error("各クリップには slotIndex, name, notes が必要です");
  }
  return clips;
}

// ─── Extension entry ──────────────────────────────────────────────────────

export function activate(activation: ActivationContext) {
  const context = initialize(activation, "1.0.0");

  // Export: MIDI clip notes -> JSON (shown in a copyable modal)
  context.commands.registerCommand(
    "midi-json-bridge.export",
    (args: unknown) =>
      (async (handle: Handle) => {
        const clip = context.getObjectFromHandle(handle, MidiClip);
        const json = JSON.stringify(toJson(clip.notes), null, 2);

        const html = exportHtml.replace(
          "__ENCODED_DATA__",
          encodeURIComponent(json),
        );

        await context.ui.showModalDialog(
          `data:text/html,${encodeURIComponent(html)}`,
          560,
          460,
        );
      })(args as Handle).catch((e) => console.error(e)),
  );

  // Import: paste JSON -> overwrite the clip's notes
  context.commands.registerCommand(
    "midi-json-bridge.import",
    (args: unknown) =>
      (async (handle: Handle) => {
        const clip = context.getObjectFromHandle(handle, MidiClip);

        const result = await context.ui.showModalDialog(
          `data:text/html,${encodeURIComponent(importHtml)}`,
          560,
          460,
        );

        if (!result) return; // cancelled

        const notesJson = parseNotesJson(result);
        clip.notes = fromJson(notesJson);
      })(args as Handle).catch((e) => console.error(e)),
  );

  // Export: all clips in a MIDI track's session slots -> JSON
  context.commands.registerCommand(
    "midi-json-bridge.exportTrack",
    (args: unknown) =>
      (async (handle: Handle) => {
        const track = context.getObjectFromHandle(handle, MidiTrack);

        const clips: ClipJson[] = [];
        track.clipSlots.forEach((slot, slotIndex) => {
          const clip = slot.clip;
          if (clip instanceof MidiClip) {
            clips.push({
              slotIndex,
              name: clip.name,
              notes: toJson(clip.notes),
            });
          }
        });

        const json = JSON.stringify({ clips }, null, 2);
        const html = exportHtml.replace(
          "__ENCODED_DATA__",
          encodeURIComponent(json),
        );

        await context.ui.showModalDialog(
          `data:text/html,${encodeURIComponent(html)}`,
          560,
          460,
        );
      })(args as Handle).catch((e) => console.error(e)),
  );

  // Import: paste JSON -> create/overwrite clips in a MIDI track's session slots
  context.commands.registerCommand(
    "midi-json-bridge.importTrack",
    (args: unknown) =>
      (async (handle: Handle) => {
        const track = context.getObjectFromHandle(handle, MidiTrack);

        const result = await context.ui.showModalDialog(
          `data:text/html,${encodeURIComponent(importHtml)}`,
          560,
          460,
        );

        if (!result) return; // cancelled

        const clipsJson = parseClipsJson(result);
        const slots = track.clipSlots;

        for (const clipJson of clipsJson) {
          const slot = slots[clipJson.slotIndex];
          if (!slot) continue;

          const notes = fromJson(clipJson.notes);
          const maxEnd = notes.reduce(
            (max, n) => Math.max(max, n.startTime + n.duration),
            0,
          );
          const length = Math.max(4, Math.ceil(maxEnd / 4) * 4);

          const existing = slot.clip;
          const clip = existing instanceof MidiClip
            ? existing
            : await slot.createMidiClip(length);
          clip.name = clipJson.name;
          clip.notes = notes;
        }
      })(args as Handle).catch((e) => console.error(e)),
  );

  context.ui.registerContextMenuAction(
    "MidiClip",
    "JSONとしてエクスポート",
    "midi-json-bridge.export",
  );
  context.ui.registerContextMenuAction(
    "MidiClip",
    "JSONからインポート",
    "midi-json-bridge.import",
  );
  context.ui.registerContextMenuAction(
    "MidiTrack",
    "トラック内クリップをJSONエクスポート",
    "midi-json-bridge.exportTrack",
  );
  context.ui.registerContextMenuAction(
    "MidiTrack",
    "トラック内クリップにJSONをインポート",
    "midi-json-bridge.importTrack",
  );

  console.log("MIDI JSON Bridge: loaded");
}
