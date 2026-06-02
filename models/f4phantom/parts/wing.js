import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Wing — F-4E Phantom II の主翼 (左右共通の基底実装)。
 *
 * MiG-21 が単純なデルタ翼なのに対し、F-4 の主翼は非常に個性的:
 *   - 内翼は水平、外翼端だけ強い上反角 (12°) で跳ね上がる「カソードラル」
 *   - 前縁中央にドッグトゥース (鋸歯状の段差 = 前縁延長)
 *   - 中程度の後退角の台形翼
 *
 * 内翼と外翼を別メッシュで構成し、外翼を上反させて F-4 らしさを出す。
 * `side` ("left"/"right") で Z 方向に反転する。
 *
 * leftWing.js / rightWing.js がこのクラスを薄くラップする。
 */
export class Wing extends AircraftPart {
    constructor(side, options = {}) {
        super(`${side}Wing`, { side, health: 130, ...options });
    }

    buildGeometry() {
        const side = this.options.side;
        const dir = side === 'right' ? 1 : -1; // +Z = 右

        const extrudeBase = {
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.04,
            bevelSegments: 2,
        };

        // ----------------------------------------------------------
        //  内翼 (Inner Panel) — 付け根から折れ線 (dogtooth) まで。
        //  水平 (上反なし)。前縁に向かってコードが長い台形。
        //   X = 前後 (前方 +X), Shape の y = スパン方向 (翼端へ)
        // ----------------------------------------------------------
        const innerSpan = 2.2;     // 内翼スパン
        const innerShape = new THREE.Shape();
        innerShape.moveTo(1.9, 0);             // 付け根前縁
        innerShape.lineTo(1.55, innerSpan);    // 折れ目前縁 (やや後退)
        innerShape.lineTo(-1.9, innerSpan);    // 折れ目後縁
        innerShape.lineTo(-2.2, 0);            // 付け根後縁
        innerShape.closePath();

        const innerGeo = new THREE.ExtrudeGeometry(innerShape, { depth: 0.16, ...extrudeBase });
        innerGeo.rotateX(-Math.PI / 2);
        innerGeo.computeVertexNormals();
        const inner = this.addMesh(innerGeo, Materials.body, 'innerPanel');
        inner.scale.set(1, 1, dir);
        inner.position.set(-0.2, -0.2, dir * 1.0);

        // ----------------------------------------------------------
        //  ドッグトゥース (前縁の段差) — 内翼前縁から少し前に出る三角の延長。
        //  F-4 の象徴的な前縁鋸歯。
        // ----------------------------------------------------------
        const toothShape = new THREE.Shape();
        toothShape.moveTo(1.55, innerSpan);          // 折れ目内側前縁
        toothShape.lineTo(1.95, innerSpan);          // 前に張り出す
        toothShape.lineTo(1.5, innerSpan + 0.45);    // 外側へ細る
        toothShape.closePath();
        const toothGeo = new THREE.ExtrudeGeometry(toothShape, { depth: 0.14, ...extrudeBase });
        toothGeo.rotateX(-Math.PI / 2);
        toothGeo.computeVertexNormals();
        const tooth = this.addMesh(toothGeo, Materials.body, 'dogtooth');
        tooth.scale.set(1, 1, dir);
        tooth.position.set(-0.2, -0.18, dir * 1.0);

        // ----------------------------------------------------------
        //  外翼 (Outer Panel) — 折れ目から翼端まで。強い上反角で跳ね上がる。
        //  別 Group に入れ、付け根 (Z 内側端) を中心に上反回転させる。
        // ----------------------------------------------------------
        const outerSpan = 1.6;
        const outerShape = new THREE.Shape();
        outerShape.moveTo(1.5, 0);                 // 折れ目前縁 (= dogtooth 外側)
        outerShape.lineTo(0.6, outerSpan);         // 翼端前縁 (後退)
        outerShape.lineTo(-0.9, outerSpan);        // 翼端後縁
        outerShape.lineTo(-1.9, 0);                // 折れ目後縁
        outerShape.closePath();

        const outerGeo = new THREE.ExtrudeGeometry(outerShape, { depth: 0.13, ...extrudeBase });
        outerGeo.rotateX(-Math.PI / 2);
        outerGeo.computeVertexNormals();
        const outer = this.addMesh(outerGeo, Materials.body, 'outerPanel');
        // addMesh は this.group に入れるので、上反のため一旦外して Group へ
        this.group.remove(outer);

        const outerPivot = new THREE.Group();
        outerPivot.name = `outerPivot:${side}`;
        // 折れ目位置 (内翼端) に pivot を置く
        outerPivot.position.set(-0.2, -0.2, dir * (1.0 + innerSpan));
        outer.scale.set(1, 1, dir);
        outer.position.set(0, 0, 0);
        outerPivot.add(outer);
        // 上反角 12° (翼端が上に跳ね上がる) — 左右で回転方向反転
        outerPivot.rotation.x = dir * THREE.MathUtils.degToRad(-12);
        this.group.add(outerPivot);

        // ----------------------------------------------------------
        //  翼下パイロン (ハードポイント土台) — 内翼下面。
        //  将来 WeaponSystem がここに増槽/ミサイルを取り付ける想定。
        // ----------------------------------------------------------
        const pylonGeo = new THREE.BoxGeometry(0.7, 0.18, 0.14);
        const pylon = this.addMesh(pylonGeo, Materials.bodyDark, 'pylon');
        pylon.position.set(-0.1, -0.34, dir * 2.0);

        this.hardpoint = new THREE.Object3D();
        this.hardpoint.position.copy(pylon.position);
        this.hardpoint.position.y -= 0.2;
        this.group.add(this.hardpoint);

        // ----------------------------------------------------------
        //  エルロン/フラップの分割ライン (見た目のディテール)
        // ----------------------------------------------------------
        const lineGeo = new THREE.BoxGeometry(0.05, 0.18, innerSpan * 0.85);
        const line = this.addMesh(lineGeo, Materials.bodyDark, 'controlSurfaceLine');
        line.position.set(-1.7, -0.16, dir * (innerSpan * 0.5 + 1.0));
    }
}
