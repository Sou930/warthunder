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

    /**
     * addMesh を override し、生成したメッシュを this.group ではなく
     * 翼専用グループ (this.wingGroup) に追加する。
     *
     * 旧実装では翼本体メッシュだけに position/scale/rotation を与え、
     * フェンス・航法灯・パネルライン等のディテールは this.group 直下へ
     * 別基準で配置していたため、翼本体とディテールが互いにズレ、
     * さらに左右 (Z 反転) で食い違う原因になっていた。
     *
     * ここでは全パーツを wingGroup にまとめ、グループ全体へ
     * 取付オフセット / 上反角 / 左右反転を一括適用する。これにより
     * 各ディテールはローカル座標 (オフセットも反転も無し) で素直に
     * 記述でき、確実に翼へ追従し左右対称になる。
     */
    addMesh(geometry, material, subName = '') {
        const mesh = super.addMesh(geometry, material, subName);
        if (this.wingGroup) {
            // super.addMesh が this.group へ入れた分を取り外し、翼グループへ
            this.group.remove(mesh);
            this.wingGroup.add(mesh);
        }
        return mesh;
    }

    buildGeometry() {
        const side = this.options.side; // "left" | "right"
        const dir = side === 'right' ? 1 : -1; // +Z = 右

        // 翼本体とすべてのディテールをまとめる専用グループ。
        // 取付位置 / 上反角 / 左右反転をこのグループへ一括適用する。
        this.wingGroup = new THREE.Group();
        this.wingGroup.name = `${this.name}:wingGroup`;
        this.group.add(this.wingGroup);

        // ----------------------------------------------------------
        //  デルタ翼プロファイル (XZ 平面で定義し、後で薄く押し出す)
        //  原点は翼付け根(胴体側)。
        //   X = 前後 (前方 +X)
        //   Y(Shape の y) = スパン方向 (翼端へ)
        // ----------------------------------------------------------
        const root = 0.0;        // 付け根 (胴体接続)
        const span = 3.3;        // 片翼スパン
        // ----------------------------------------------------------
        //  翼根を大型化し、前縁後退角を約57°へ強調したデルタ翼形状。
        //  前縁後退角 Λ = atan(ΔX / span)。
        //  ΔX = leadingRootX - tipFrontX = tan(57°) * span ≒ 1.54 * 3.3 ≒ 5.08
        // ----------------------------------------------------------
        const leadingRootX = 2.55;  // 付け根前縁位置 (翼根を前方へ大型化)
        const trailingRootX = -2.55; // 付け根後縁位置 (翼根コードを拡大)
        const sweepDeg = 57;        // 前縁後退角 (度)
        // 前縁後退角57°を満たす翼端前縁位置
        const tipFrontX = leadingRootX - Math.tan(THREE.MathUtils.degToRad(sweepDeg)) * span; // ≒ -2.53
        // 実機 MiG-21 はクリップトデルタ — 翼端が短く切り落とされている
        const tipRearX = tipFrontX - 0.5;   // 翼端後縁の前後位置 (短い翼端コード)
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

        // 翼本体はグループ内ローカルに素直に配置 (オフセット/反転はグループ側)
        const wing = this.addMesh(wingGeo, Materials.body, 'surface');

        // --- 翼グループ全体へ取付オフセット / 上反角 / 左右反転を適用 ---
        // 旧実装で翼本体メッシュに与えていた値をグループへ移譲する。
        //  scale.z = dir : 右翼(+Z)はそのまま、左翼は Z 反転
        //  position    : 付け根を僅かに外・下へ (中翼配置)
        //  rotation.x  : 上反角 (わずか)
        this.wingGroup.scale.set(1, 1, dir);
        this.wingGroup.position.set(-0.3, -0.15, 0.45);
        this.wingGroup.rotation.x = THREE.MathUtils.degToRad(-2);

        const tipMidX = (tipFrontX + tipRearX) / 2; // 翼端中央 X

        // ----------------------------------------------------------
        //  翼下ハードポイント (WeaponSystem 用に座標を公開)
        //  ※ 旧版は翼端に可視のランチャーレール (BoxGeometry) を置いていたが、
        //    兵装は翼下パイロン (weapons.js) に吊るすため、翼端の宙に浮いた
        //    レール板が「謎の灰色バー」として描画される不具合になっていた。
        //    実機 MiG-21 も翼端レールは持たないので可視メッシュは廃止し、
        //    不可視の参照点のみ残す。
        // ----------------------------------------------------------
        //  ※ 座標はすべて「右翼基準のローカル」で記述する。
        //    左右反転 (dir) と取付オフセットは wingGroup 側が一括適用する。
        this.hardpoint = new THREE.Object3D();
        this.hardpoint.position.set(tipMidX, -0.27, span - 0.1);
        this.wingGroup.add(this.hardpoint);

        // ----------------------------------------------------------
        //  エルロン/フラップの分割ライン (見た目のディテール)
        // ----------------------------------------------------------
        const lineGeo = new THREE.BoxGeometry(0.04, 0.14, span * 0.9);
        const line = this.addMesh(lineGeo, Materials.panelLine, 'controlSurfaceLine');
        line.position.set(trailingRootX + 0.35, -0.1, span * 0.5 + 0.3);

        // ----------------------------------------------------------
        //  境界層フェンス (Boundary-layer fence) — 翼上面の前後方向の薄板。
        //  実機 MiG-21 の象徴的なディテール。各翼に 1 枚。
        //
        //  ※旧実装は ExtrudeGeometry + rotation.y の組合せが破綻しており、
        //    板が翼弦方向ではなくスパン方向へ「寝た巨大な壁」として
        //    翼から大きくはみ出していた (左右で見た目も食い違う)。
        //    ここでは XZ 平面 (翼上面) に対し:
        //      X = 翼弦(前後)方向に細長く
        //      Y = 上方へ低く立ち上がる (フェンス高さ)
        //      Z = ごく薄い板厚
        //    となる素直な Box ベースの薄板へ作り直し、確実に翼上面へ
        //    垂直に立てる。左右反転は wingGroup 側に委ねる。
        // ----------------------------------------------------------
        const fenceChord = 1.5;   // 翼弦方向の長さ (前後)
        const fenceHeight = 0.15; // 上方への立ち上がり高さ (低い)
        const fenceThick = 0.02;  // 板厚
        const fenceGeo = new THREE.BoxGeometry(fenceChord, fenceHeight, fenceThick);
        const fence = this.addMesh(fenceGeo, Materials.bodyDark, 'boundaryFence');
        // 翼上面 (翼厚 0.12 → 上面 ≒ Y+0.06) のすぐ上に、翼弦中央付近・
        // 中間スパン付近へ立てる。板面は前後(X)方向を向いており回転不要。
        const fenceX = -0.2;                      // 翼弦中央やや後ろ
        const fenceY = 0.06 + fenceHeight / 2;    // 翼上面 + 高さの半分
        const fenceZ = span * 0.55;               // 中間スパン (右翼基準)
        fence.position.set(fenceX, fenceY, fenceZ);

        // ----------------------------------------------------------
        //  翼端航法灯 (右=緑 / 左=赤) — クリップした翼端前縁に埋め込む。
        //  色は左右で異なるため dir で出し分ける (座標は右翼基準)。
        // ----------------------------------------------------------
        const navGeo = new THREE.SphereGeometry(0.06, 10, 8);
        const navMat = dir === 1 ? Materials.navLightGreen : Materials.navLightRed;
        const nav = this.addMesh(navGeo, navMat, 'navLight');
        nav.position.set(tipFrontX + 0.05, 0.0, span - 0.05);

        // ----------------------------------------------------------
        //  翼上面のパネルライン (スパン方向 + 翼弦方向の簡易スジ彫り)
        // ----------------------------------------------------------
        const spanLineGeo = new THREE.BoxGeometry(0.02, 0.13, span * 0.85);
        const spanLine = this.addMesh(spanLineGeo, Materials.panelLine, 'wingPanelSpan');
        spanLine.position.set(0.2, -0.06, span * 0.5);
    }
}
