import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Wing — デルタ翼 (左右共通の基底実装)。
 *
 * MiG-21 は後退角の強いデルタ翼が象徴。
 * Shape + ExtrudeGeometry で薄い三角翼を生成し、
 * `side` ("left" / "right") に応じて Z 方向へ展開・反転する。
 *
 * leftWing.js / rightWing.js はこのクラスを薄くラップする。
 */
export class Wing extends AircraftPart {
    /**
     * @param {"left"|"right"} side
     * @param {object} options
     */
    constructor(side, options = {}) {
        // super() より前に this を触れないので、一旦保持用に options へ
        super(`${side}Wing`, { side, health: 120, ...options });
    }

    buildGeometry() {
        const side = this.options.side; // "left" | "right"
        const dir = side === 'right' ? 1 : -1; // +Z = 右

        // ----------------------------------------------------------
        //  デルタ翼プロファイル (XZ 平面で定義し、後で薄く押し出す)
        //  原点は翼付け根(胴体側)。
        //   X = 前後 (前方 +X)
        //   Y(Shape の y) = スパン方向 (翼端へ)
        // ----------------------------------------------------------
        const root = 0.0;        // 付け根 (胴体接続)
        const span = 3.3;        // 片翼スパン
        const leadingRootX = 1.85;  // 付け根前縁位置 (前方へ伸ばし後退角を強調)
        const trailingRootX = -1.9; // 付け根後縁位置
        // 実機 MiG-21 はクリップトデルタ — 翼端が短く切り落とされている
        const tipFrontX = -1.05;  // 翼端前縁の前後位置 (前縁後退角 約57°)
        const tipRearX = -1.55;   // 翼端後縁の前後位置
        const tipChord = tipFrontX - tipRearX; // 翼端コード長 (短い)

        const shape = new THREE.Shape();
        // 付け根前縁 → 翼端前縁 → 翼端後縁(クリップ) → 付け根後縁
        shape.moveTo(leadingRootX, root);
        shape.lineTo(tipFrontX, span);         // 前縁 (強い後退角 ~57°)
        shape.lineTo(tipRearX, span);          // 翼端 (切り落とし)
        shape.lineTo(trailingRootX, root);     // 後縁 (ほぼ直角)
        shape.closePath();

        const extrudeSettings = {
            depth: 0.12,            // 翼厚
            bevelEnabled: true,
            bevelThickness: 0.04,
            bevelSize: 0.05,
            bevelSegments: 2,
        };

        const wingGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        // Shape は XY 平面 → スパン(Y)を Z 方向へ、厚み(Z)を Y(上下)方向へ
        wingGeo.rotateX(-Math.PI / 2);
        wingGeo.translate(0, 0, 0);
        wingGeo.computeVertexNormals();

        const wing = this.addMesh(wingGeo, Materials.body, 'surface');
        // 左翼は Z を反転
        wing.scale.set(1, 1, dir);
        // 付け根を胴体半径ぶん外へ、わずかに下げて中翼配置に
        wing.position.set(-0.3, -0.15, dir * 0.45);
        // 上反角 (わずか)
        wing.rotation.x = dir * THREE.MathUtils.degToRad(-2);

        const tipMidX = (tipFrontX + tipRearX) / 2; // 翼端中央 X

        // ----------------------------------------------------------
        //  翼下ハードポイント (WeaponSystem 用に座標を公開)
        //  ※ 旧版は翼端に可視のランチャーレール (BoxGeometry) を置いていたが、
        //    兵装は翼下パイロン (weapons.js) に吊るすため、翼端の宙に浮いた
        //    レール板が「謎の灰色バー」として描画される不具合になっていた。
        //    実機 MiG-21 も翼端レールは持たないので可視メッシュは廃止し、
        //    不可視の参照点のみ残す。
        // ----------------------------------------------------------
        this.hardpoint = new THREE.Object3D();
        this.hardpoint.position.set(tipMidX, -0.27, dir * (span - 0.1));
        this.group.add(this.hardpoint);

        // ----------------------------------------------------------
        //  エルロン/フラップの分割ライン (見た目のディテール)
        // ----------------------------------------------------------
        const lineGeo = new THREE.BoxGeometry(0.04, 0.14, span * 0.9);
        const line = this.addMesh(lineGeo, Materials.panelLine, 'controlSurfaceLine');
        line.position.set(trailingRootX + 0.35, -0.1, dir * (span * 0.5 + 0.3));

        // ----------------------------------------------------------
        //  境界層フェンス (Boundary-layer fence) — 翼上面の前後方向の薄板。
        //  実機 MiG-21 の象徴的なディテール。各翼に 1 枚。
        // ----------------------------------------------------------
        const fenceShape = new THREE.Shape();
        fenceShape.moveTo(1.2, 0);
        fenceShape.lineTo(-1.4, 0);
        fenceShape.lineTo(-1.4, 0.12);
        fenceShape.lineTo(1.2, 0.16);
        fenceShape.closePath();
        const fenceGeo = new THREE.ExtrudeGeometry(fenceShape, {
            depth: 0.02, bevelEnabled: false,
        });
        // XY 平面の板を XZ(翼上面)に立てる: Z 方向(スパン)の位置に薄く立てる
        const fence = this.addMesh(fenceGeo, Materials.bodyDark, 'boundaryFence');
        fence.position.set(-0.1, 0.0, dir * (span * 0.62));
        fence.rotation.y = -Math.PI / 2; // 板面を前後方向に向ける

        // ----------------------------------------------------------
        //  翼端航法灯 (右=緑 / 左=赤) — クリップした翼端前縁に埋め込む。
        // ----------------------------------------------------------
        const navGeo = new THREE.SphereGeometry(0.06, 10, 8);
        const navMat = dir === 1 ? Materials.navLightGreen : Materials.navLightRed;
        const nav = this.addMesh(navGeo, navMat, 'navLight');
        nav.position.set(tipFrontX, -0.05, dir * (span - 0.02));

        // ----------------------------------------------------------
        //  翼上面のパネルライン (スパン方向 + 翼弦方向の簡易スジ彫り)
        // ----------------------------------------------------------
        const spanLineGeo = new THREE.BoxGeometry(0.02, 0.13, span * 0.85);
        const spanLine = this.addMesh(spanLineGeo, Materials.panelLine, 'wingPanelSpan');
        spanLine.position.set(0.4, -0.06, dir * (span * 0.5));
    }
}
