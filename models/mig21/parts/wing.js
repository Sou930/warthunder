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
        const leadingRootX = 1.6;  // 付け根前縁位置
        const trailingRootX = -1.9; // 付け根後縁位置
        const tipX = -1.4;        // 翼端の前後位置 (後退角で後ろへ)
        const tipChord = 0.5;     // 翼端コード長

        const shape = new THREE.Shape();
        // 付け根前縁 → 翼端前縁 → 翼端後縁 → 付け根後縁
        shape.moveTo(leadingRootX, root);
        shape.lineTo(tipX + tipChord, span);   // 前縁 (強い後退角)
        shape.lineTo(tipX, span);              // 翼端
        shape.lineTo(trailingRootX, root);     // 後縁
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

        // ----------------------------------------------------------
        //  翼端のミサイルランチャーレール (ハードポイントの土台)
        //  将来 WeaponSystem がここにミサイルを取り付ける想定。
        // ----------------------------------------------------------
        const railGeo = new THREE.BoxGeometry(0.9, 0.08, 0.1);
        const rail = this.addMesh(railGeo, Materials.bodyDark, 'pylonRail');
        rail.position.set(tipX + tipChord * 0.5, -0.12, dir * (span - 0.1));

        // ハードポイント参照 (WeaponSystem 用に座標を公開)
        this.hardpoint = new THREE.Object3D();
        this.hardpoint.position.copy(rail.position);
        this.hardpoint.position.y -= 0.15;
        this.group.add(this.hardpoint);

        // ----------------------------------------------------------
        //  エルロン/フラップの分割ライン (見た目のディテール)
        // ----------------------------------------------------------
        const lineGeo = new THREE.BoxGeometry(0.04, 0.14, span * 0.9);
        const line = this.addMesh(lineGeo, Materials.bodyDark, 'controlSurfaceLine');
        line.position.set(trailingRootX + 0.35, -0.1, dir * (span * 0.5 + 0.3));
    }
}
