import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Wing — F-4E Phantom II の主翼 (左右共通の基底実装)。
 *
 * 実機 F-4 の主翼は非常に個性的:
 *   - 内翼は水平、外翼端だけ強い上反角 (12°) で跳ね上がる「カソードラル」
 *   - 前縁中央にドッグトゥース (鋸歯状の段差 = 前縁延長)
 *   - 中程度の後退角の台形翼 + 翼端を切り落とした形
 *   - 前縁スラット / 後縁フラップ / エルロン / スポイラーのパネル分割
 *   - 翼下パイロンと増槽 (370gal ドロップタンク)
 *   - 翼端の航法灯 (右=緑, 左=赤)
 *
 * 内翼と外翼を別メッシュで構成し、外翼を上反させて F-4 らしさを出す。
 * `side` ("left"/"right") で Z 方向に反転する。
 */
export class Wing extends AircraftPart {
    constructor(side, options = {}) {
        super(`${side}Wing`, { side, health: 130, ...options });
    }

    buildGeometry() {
        const side = this.options.side;
        const dir = side === 'right' ? 1 : -1; // +Z = 右

        // 翼の前後縁にエアフォイル風のテーパーを与えるためのベベル設定。
        const extrudeAirfoil = {
            bevelEnabled: true,
            bevelThickness: 0.06,
            bevelSize: 0.07,
            bevelSegments: 3,
        };

        // ----------------------------------------------------------
        //  内翼 (Inner Panel) — 付け根から折れ線 (dogtooth) まで。
        //  水平 (上反なし)。前縁に向かってコードが長い台形。
        //   X = 前後 (前方 +X), Shape の y = スパン方向 (翼端へ)
        // ----------------------------------------------------------
        const innerSpan = 2.2;     // 内翼スパン
        const innerShape = new THREE.Shape();
        innerShape.moveTo(2.0, 0);             // 付け根前縁
        innerShape.lineTo(1.6, innerSpan);     // 折れ目前縁 (やや後退)
        innerShape.lineTo(-2.0, innerSpan);    // 折れ目後縁
        innerShape.lineTo(-2.35, 0);           // 付け根後縁
        innerShape.closePath();

        const innerGeo = new THREE.ExtrudeGeometry(innerShape, { depth: 0.18, ...extrudeAirfoil });
        innerGeo.rotateX(-Math.PI / 2);
        innerGeo.computeVertexNormals();
        const inner = this.addMesh(innerGeo, Materials.camoGreen, 'innerPanel');
        inner.scale.set(1, 1, dir);
        inner.position.set(-0.2, -0.2, dir * 1.0);

        // 内翼上面の迷彩パッチ (タン帯)
        const innerCamoShape = new THREE.Shape();
        innerCamoShape.moveTo(1.0, 0.2);
        innerCamoShape.lineTo(0.7, innerSpan - 0.3);
        innerCamoShape.lineTo(-1.6, innerSpan - 0.3);
        innerCamoShape.lineTo(-1.9, 0.2);
        innerCamoShape.closePath();
        const innerCamoGeo = new THREE.ExtrudeGeometry(innerCamoShape, { depth: 0.02, bevelEnabled: false });
        innerCamoGeo.rotateX(-Math.PI / 2);
        const innerCamo = this.addMesh(innerCamoGeo, Materials.camoTan, 'innerCamo');
        innerCamo.scale.set(1, 1, dir);
        innerCamo.position.set(-0.2, 0.0, dir * 1.0);

        // ----------------------------------------------------------
        //  ドッグトゥース (前縁の段差) — 内翼前縁から少し前に出る三角の延長。
        //  F-4 の象徴的な前縁鋸歯。
        // ----------------------------------------------------------
        const toothShape = new THREE.Shape();
        toothShape.moveTo(1.6, innerSpan);           // 折れ目内側前縁
        toothShape.lineTo(2.05, innerSpan);          // 前に張り出す
        toothShape.lineTo(1.55, innerSpan + 0.5);    // 外側へ細る
        toothShape.closePath();
        const toothGeo = new THREE.ExtrudeGeometry(toothShape, { depth: 0.16, ...extrudeAirfoil });
        toothGeo.rotateX(-Math.PI / 2);
        toothGeo.computeVertexNormals();
        const tooth = this.addMesh(toothGeo, Materials.camoGreen, 'dogtooth');
        tooth.scale.set(1, 1, dir);
        tooth.position.set(-0.2, -0.18, dir * 1.0);

        // ----------------------------------------------------------
        //  外翼 (Outer Panel) — 折れ目から翼端まで。強い上反角で跳ね上がる。
        //  翼端をやや切り落とした台形に。別 Group に入れて上反回転。
        // ----------------------------------------------------------
        const outerSpan = 1.7;
        const outerShape = new THREE.Shape();
        outerShape.moveTo(1.55, 0);                // 折れ目前縁 (= dogtooth 外側)
        outerShape.lineTo(0.75, outerSpan);        // 翼端前縁 (後退)
        outerShape.lineTo(-0.7, outerSpan);        // 翼端後縁 (切り落とし)
        outerShape.lineTo(-2.0, 0);                // 折れ目後縁
        outerShape.closePath();

        const outerGeo = new THREE.ExtrudeGeometry(outerShape, { depth: 0.15, ...extrudeAirfoil });
        outerGeo.rotateX(-Math.PI / 2);
        outerGeo.computeVertexNormals();
        const outer = new THREE.Mesh(outerGeo, Materials.camoGreen);
        outer.name = `${this.name}:outerPanel`;
        outer.userData.part = this;
        outer.castShadow = true;
        outer.receiveShadow = true;
        this.meshes.push(outer);

        const outerPivot = new THREE.Group();
        outerPivot.name = `outerPivot:${side}`;
        // 折れ目位置 (内翼端) に pivot を置く
        outerPivot.position.set(-0.2, -0.2, dir * (1.0 + innerSpan));
        outer.scale.set(1, 1, dir);
        outer.position.set(0, 0, 0);
        outerPivot.add(outer);

        // 外翼前縁スラット (細い帯)
        const slatGeo = new THREE.BoxGeometry(0.3, 0.1, outerSpan * 0.92);
        const slat = new THREE.Mesh(slatGeo, Materials.bodyDark);
        slat.name = `${this.name}:leadingSlat`;
        slat.userData.part = this;
        slat.castShadow = true;
        slat.position.set(1.1, 0.02, dir * outerSpan * 0.5);
        this.meshes.push(slat);
        outerPivot.add(slat);

        // 翼端航法灯 (右=緑 / 左=赤)
        const navGeo = new THREE.SphereGeometry(0.07, 10, 8);
        const navMat = dir === 1 ? Materials.navLightGreen : Materials.navLightRed;
        const nav = new THREE.Mesh(navGeo, navMat);
        nav.name = `${this.name}:navLight`;
        nav.userData.part = this;
        nav.position.set(0.0, 0.06, dir * (outerSpan + 0.02));
        this.meshes.push(nav);
        outerPivot.add(nav);

        // 上反角 12° (翼端が上に跳ね上がる) — 左右で回転方向反転
        outerPivot.rotation.x = dir * THREE.MathUtils.degToRad(-12);
        this.group.add(outerPivot);

        // ----------------------------------------------------------
        //  後縁フラップ + エルロン (内翼後縁の薄い分割パネル)
        // ----------------------------------------------------------
        const flapGeo = new THREE.BoxGeometry(0.55, 0.13, innerSpan * 0.62);
        const flap = this.addMesh(flapGeo, Materials.camoGreen, 'flap');
        flap.position.set(-2.0, -0.18, dir * (innerSpan * 0.4 + 1.0));

        const flapLineGeo = new THREE.BoxGeometry(0.04, 0.16, innerSpan * 0.85);
        const flapLine = this.addMesh(flapLineGeo, Materials.panelLine, 'flapLine');
        flapLine.position.set(-1.72, -0.16, dir * (innerSpan * 0.5 + 1.0));

        // ----------------------------------------------------------
        //  翼下パイロン (ハードポイント土台) — 内翼下面。
        // ----------------------------------------------------------
        const pylonGeo = new THREE.BoxGeometry(1.4, 0.22, 0.18);
        const pylon = this.addMesh(pylonGeo, Materials.bodyDark, 'pylon');
        pylon.position.set(-0.1, -0.36, dir * 2.0);

        // ----------------------------------------------------------
        //  増槽 (370 gal ドロップタンク) — パイロン下に吊り下げる。
        // ----------------------------------------------------------
        const tankProfile = [
            [0.0, 0.02],
            [0.3, 0.12],
            [0.8, 0.19],
            [1.6, 0.22],
            [2.6, 0.21],
            [3.4, 0.15],
            [3.9, 0.07],
            [4.1, 0.0],
        ];
        const tankPts = tankProfile.map(([x, r]) => new THREE.Vector2(r, x));
        const tankGeo = new THREE.LatheGeometry(tankPts, 20);
        tankGeo.rotateZ(-Math.PI / 2);
        tankGeo.computeVertexNormals();
        const tank = this.addMesh(tankGeo, Materials.fuelTank, 'dropTank');
        tank.position.set(1.9, -0.62, dir * 2.0);

        // 増槽の安定フィン (尾部 ×3)
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
            const finGeo = new THREE.BoxGeometry(0.5, 0.16, 0.02);
            const fin = this.addMesh(finGeo, Materials.fuelTank, `tankFin${i}`);
            fin.position.set(-1.7, -0.62 + Math.sin(a) * 0.15, dir * 2.0 + Math.cos(a) * 0.15);
            fin.rotation.x = a;
        }

        this.hardpoint = new THREE.Object3D();
        this.hardpoint.position.copy(pylon.position);
        this.hardpoint.position.y -= 0.2;
        this.group.add(this.hardpoint);
    }
}
