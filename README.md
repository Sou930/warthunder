# War Thunder Style Aircraft Viewer

Three.jsで制作した航空機ビューワーです。

将来的なWar Thunder風の航空機ゲーム開発に向けた基盤として作成しており、現在は航空機の表示・観察機能を実装しています。

外部3Dモデルは使用せず、すべてThree.jsのジオメトリのみで機体を手続き的に生成しています。

---

## Features

### MiG-21MF

* 円形インテーク
* 可動ショックコーン
* クリップトデルタ翼
* ソ連赤星マーキング
* R-3S / R-60 ミサイル
* 中心線増槽
* アフターバーナー演出
* 航法灯・アンテナ・パネルライン

### F-4E Phantom II

* 双発・複座コックピット
* 側面インテーク
* SEA迷彩切替
* AIM-7 Sparrow ×4
* AIM-9 Sidewinder ×4
* HUD・WSO席
* 双発アフターバーナー
* 航法灯・フォーメーションライト

---

## Viewer Functions

* 機体切替
* 降着装置表示切替
* 兵装表示切替
* ワイヤーフレーム表示
* ヒットボックス表示
* 自動回転
* シーン明るさ調整
* アフターバーナーON/OFF
* 推力レベル調整
* OrbitControlsによる自由視点操作

---

## Controls

| 操作  | マウス     |
| --- | ------- |
| 回転  | 左ドラッグ   |
| パン  | 右ドラッグ   |
| ズーム | マウスホイール |

---

## Project Structure

```text
project/
├─ index.html
├─ style.css
├─ script.js
├─ libs/
│   ├─ three.module.js
│   └─ OrbitControls.js
└─ models/
    ├─ mig21/
    └─ f4phantom/
```

---

## Run

ローカルサーバー経由で起動してください。

```bash
python3 -m http.server 8000
```

または

```bash
npx serve .
```

起動後、ブラウザで以下を開きます。

```text
http://localhost:8000/
```

---

## Future Plans

今後は以下のシステムを追加予定です。

* FlightModel
* DamageSystem
* WeaponSystem
* RadarSystem
* MissileSystem
* Multiplayer

機体構成はモジュール化されており、新しい航空機を容易に追加できる設計になっています。

---

## Tech Stack

* JavaScript (ES6 Modules)
* Three.js r160
* OrbitControls
* HTML5 / CSS3
