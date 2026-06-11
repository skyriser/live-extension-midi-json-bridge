# MIDI JSON Bridge

MIDIクリップのノート情報をJSONでエクスポート/インポートするAbleton Live拡張です。
Claudeなどのチャットでメロディやコード進行をJSON形式で生成・編集し、Liveのクリップへ反映する用途を想定しています。

## 機能

- **JSONとしてエクスポート**: MIDIクリップを右クリック→ノート情報(`pitch`, `startTime`, `duration`, `velocity`, `muted`)をJSONとしてモーダル表示し、クリップボードにコピーできます。
- **JSONからインポート**: MIDIクリップを右クリック→JSONを貼り付けて「適用」すると、クリップのノートを置き換えます。

## JSONフォーマット

```json
[
  { "pitch": 60, "startTime": 0, "duration": 1, "velocity": 100 },
  { "pitch": 64, "startTime": 1, "duration": 1 },
  { "pitch": 67, "startTime": 2, "duration": 2, "muted": false }
]
```

- `pitch`: MIDIノート番号 (0-127, 60 = C3)
- `startTime`: クリップ先頭からの開始位置 (拍単位)
- `duration`: 長さ (拍単位)
- `velocity`: ベロシティ (省略可、デフォルト100程度)
- `muted`: ミュート (省略可)

`{ "notes": [...] }` の形式でも読み込めます。

## 開発

```bash
npm install
npm start    # ビルドしてLive Extension Hostを起動 (Developer Mode必須)
npm run package  # .ablx パッケージを作成
```
