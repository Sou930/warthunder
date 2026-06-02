# War Thunder Style Aircraft Viewer

Three.jsで制作した航空機ビューワーです。

将来的なWar Thunder風航空機ゲーム開発の基盤として作成しており、現在は航空機の表示・観察機能を実装しています。

機体は外部3Dモデルを使用せず、すべてThree.jsのジオメトリのみで手続き的に生成しています。

## Aircraft

| 機体                          | 特徴                                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **MiG-21MF** (単発・単座)        | 機首円形インテーク + 可動ショックコーン + 長いピトーブーム、クリップトデルタ翼 + 境界層フェンス、ソ連赤星マーキング、パネルライン、航法灯、R-3S / R-60 ミサイル、中心線増槽、アフターバーナー            |
| **F-4E Phantom II** (双発・複座) | 機首レドーム + 側面インテーク、ドッグトゥース付き上反外翼、強アンヒドラル水平尾翼、HUD付きタンデム複座コックピット、SEA迷彩切替、AIM-7 Sparrow ×4、AIM-9 Sidewinder ×4、双発アフターバーナー |

## Features

* 機体切替
* 降着装置表示切替
* 兵装表示切替
* ワイヤーフレーム表示
* ヒットボックス表示
* 自動回転
* 明るさ調整
* アフターバーナー ON/OFF
* 推力レベル調整
* OrbitControlsによる自由視点操作

## Controls

| 操作  | マウス     |
| --- | ------- |
| 回転  | 左ドラッグ   |
| パン  | 右ドラッグ   |
| ズーム | マウスホイール |

## Run

ローカルサーバー経由で起動してください。

```bash
python3 -m http.server 8000
```

または

```bash
npx serve .
```

ブラウザで以下を開きます。

```text
http://localhost:8000/
```

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

## Future Plans

* FlightModel
* DamageSystem
* WeaponSystem
* RadarSystem
* MissileSystem
* Multiplayer

機体構成はモジュール化されており、新しい航空機を容易に追加できる設計になっています。

## Tech Stack

* HTML5 / CSS3
* JavaScript (ES6 Modules)
* Three.js r160
* OrbitControls
