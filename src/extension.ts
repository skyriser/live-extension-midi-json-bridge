import {
  initialize,
  MidiClip,
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

  console.log("MIDI JSON Bridge: loaded");
}
