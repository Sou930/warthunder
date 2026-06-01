# War Thunder 風 航空機ビューワー (MiG-21)

Three.js 製の航空機ビューワーです。将来 War Thunder のような航空機ゲームを
作るための **基盤** として、まずは「機体を表示するだけ」のビューワーを実装しています。
飛行・戦闘機能はまだ含みません。

機体は **外部 3D モデルを使わず**、Three.js のジオメトリのみで手続き的に生成しています。

## 特徴

- 円形エアインテーク + 中央**可動**ショックコーン (前後スライドをアニメーション)
- 細長い葉巻型胴体 (LatheGeometry)
- 強い後退角のデルタ翼 (ExtrudeGeometry)
- バブルキャノピー (半透明) + 射出座席 + **着座パイロット** (ヘルメット/バイザー/四肢)
- 大型の後退垂直尾翼 + 全遊動水平尾翼 + 腹びれ
- 三輪式降着装置 (表示/非表示切替可能)
- **本格的なアフターバーナーアニメーション**
  - 多層の炎プルーム (白青コア / オレンジ中間 / 赤外殻、加算合成で発光)
  - 周期的に流れるショックダイヤモンド (マッハディスク)
  - 排気を映す発光ポイントライト
  - ON/OFF + 推力 0〜100% スライダー
- 見えない面のポリゴン削減 (openEnded 円錐/円筒、セグメント数最適化、裏面非描画)
- OrbitControls による 回転 / ズーム / パン
- ヒットボックス / ワイヤーフレーム / 自動回転 のトグル

## 起動方法

ES Modules と `fetch()` を使うため、**ローカルサーバー経由**で開いてください
(`file://` で直接開くと動きません)。

```bash
# プロジェクトルートで
python3 -m http.server 8000
# → ブラウザで http://localhost:8000/ を開く
```

または Node 環境なら:

```bash
npx serve .
```

## 操作方法

| 操作 | マウス |
|------|--------|
| 回転 | 左ドラッグ |
| パン | 右ドラッグ |
| ズーム | ホイール |

右上パネルで「降着装置」「ヒットボックス」「ワイヤーフレーム」「自動回転」を切替できます。

## フォルダ構成

```
project/
├─ index.html              # エントリ HTML (import map で 'three' を解決)
├─ style.css               # UI / HUD スタイル
├─ script.js               # Scene/Camera/Renderer/Light/Loop/Controls
│
├─ libs/
│   ├─ three.module.js     # Three.js 本体 (r160)
│   └─ OrbitControls.js    # カメラ操作
│
└─ models/
    └─ mig21/
        ├─ aircraft.json    # 機体スペック
        ├─ model.js         # 各パーツを組み立てて 1 機を構成
        │
        ├─ parts/
        │   ├─ AircraftPart.js   # 全パーツの基底クラス (共通 IF)
        │   ├─ materials.js      # 共有マテリアル定義
        │   ├─ fuselage.js       # 胴体 + インテーク + ショックコーン
        │   ├─ cockpit.js        # キャノピー + 座席
        │   ├─ engine.js         # ノズル + アフターバーナー
        │   ├─ wing.js           # デルタ翼 (左右共通基底)
        │   ├─ leftWing.js       # 左翼ラッパー
        │   ├─ rightWing.js      # 右翼ラッパー
        │   ├─ tail.js           # 垂直/水平尾翼 + 腹びれ
        │   └─ landingGear.js    # 三輪式降着装置
        │
        ├─ data/
        │   ├─ hitboxes.json     # ヒットボックス (DamageSystem 用)
        │   ├─ fuel.json         # 燃料タンク (FlightModel 用)
        │   └─ armor.json        # 装甲/モジュール (DamageSystem 用)
        │
        └─ textures/             # 将来のテクスチャ置き場
```

## 設計方針 (将来拡張)

将来 `DamageSystem` / `FlightModel` / `WeaponSystem` / `RadarSystem` /
`MissileSystem` / `Multiplayer` を追加しやすいよう、以下を意識しています。

- **各パーツは独立クラス/モジュール** … `AircraftPart` を継承。
  `applyDamage()` / `health` / `dispose()` など共通 IF を持つ。
- **メッシュに `userData.part` を埋め込み** … レイキャストで被弾パーツを逆引き可能。
- **データ駆動** … hitbox / fuel / armor を JSON 外部化。新機体は
  `models/<name>/` を増やすだけで追加可能な構造。
- **翼端ハードポイント** (`Wing.hardpoint`) … WeaponSystem がここに
  ミサイルを取り付ける想定。
- **ショックコーン = レドーム** … RadarSystem の格納位置として予約。

### 座標系

- `+X` = 機首方向 (前方)
- `+Y` = 上
- `+Z` = 右翼方向

## 新しい機体を追加するには

1. `models/<aircraft_name>/` を作成
2. `parts/` 以下に `AircraftPart` を継承したパーツを実装
3. `model.js` でパーツを組み立て
4. `aircraft.json` / `data/*.json` を用意
5. `script.js` の `MODEL_BASE` を切り替え (または機体選択 UI を追加)

## 技術スタック

- HTML / CSS / JavaScript (ES6 Modules)
- [Three.js](https://threejs.org/) r160
- OrbitControls
