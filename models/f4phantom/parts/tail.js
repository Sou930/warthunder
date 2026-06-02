import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Tail — F-4E Phantom II の尾翼アセンブリ。
 *
 * F-4 の尾部で最も特徴的なのは:
 *   - 大きな後退角の垂直尾翼 (1 枚)
 *   - **強いアンヒドラル (下反角 約23°)** の全遊動式水平尾翼 (スタビレーター)
 *     → 主翼の上反 (カソードラル) と対をなし、F-4 のシルエットを決定づける
 *
 * 機尾 (-X 側) に配置。
 */
export class Tail extends AircraftPart {
    constructor(options = {}) {
        super('tail', { health: 100, ...options });
    }

    buildGeometry() {
        const extrudeBase = {
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.04,
            bevelSegments: 2,
        };

        // ----------------------------------------------------------
        //  垂直尾翼 (Vertical Stabilizer) — 大きく後退した1枚。
        //  XY 平面の後退翼シェイプを Z 方向へ薄く押し出す。
        // ----------------------------------------------------------
        const vShape = new THREE.Shape();
        vShape.moveTo(-4.4, 0);     // 付け根後端
        vShape.lineTo(-1.4, 0);     // 付け根前端
        vShape.lineTo(-2.9, 2.5);   // 上端前 (後退角)
        vShape.lineTo(-4.0, 2.5);   // 上端後
        vShape.closePath();

        const vGeo = new THREE.ExtrudeGeometry(vShape, { depth: 0.16, ...extrudeBase });
        vGeo.translate(0, 0, -0.08);
        vGeo.computeVertexNormals();
        const vfin = this.addMesh(vGeo, Materials.body, 'verticalStabilizer');
        vfin.position.set(-2.4, 0.75, 0);

        // ラダー分割ライン
        const rudderLineGeo = new THREE.BoxGeometry(0.05, 2.2, 0.18);
        const rudderLine = this.addMesh(rudderLineGeo, Materials.bodyDark, 'rudderLine');
        rudderLine.position.set(-6.0, 1.9, 0);

        // ----------------------------------------------------------
        //  水平尾翼 (全遊動スタビレーター) — 左右、強いアンヒドラル。
        //  各スタビレーターを pivot Group に入れ、下反 23° 回転させる。
        // ----------------------------------------------------------
        for (const dir of [1, -1]) {
            const side = dir === 1 ? 'Right' : 'Left';
            const hShape = new THREE.Shape();
            hShape.moveTo(0.9, 0);      // 付け根前
            hShape.lineTo(-1.3, 0);     // 付け根後
            hShape.lineTo(-1.9, 2.3);   // 翼端後
            hShape.lineTo(-0.5, 2.3);   // 翼端前 (後退角)
            hShape.closePath();

            const hGeo = new THREE.ExtrudeGeometry(hShape, { depth: 0.1, ...extrudeBase });
            hGeo.rotateX(-Math.PI / 2);  // スパンを Z 方向へ
            hGeo.computeVertexNormals();
            const stab = new THREE.Mesh(hGeo, Materials.body);
            stab.name = `tail:stab${side}`;
            stab.userData.part = this;
            stab.castShadow = true;
            stab.receiveShadow = true;
            stab.scale.set(1, 1, dir);
            this.meshes.push(stab);

            // pivot を胴体側 (付け根) に置き、アンヒドラル回転
            const pivot = new THREE.Group();
            pivot.name = `stabPivot:${side}`;
            pivot.position.set(-5.4, 0.05, 0);
            stab.position.set(0, 0, 0);
            pivot.add(stab);
            // 下反角 23° (翼端が下がる) — 左右で回転方向反転
            pivot.rotation.x = dir * THREE.MathUtils.degToRad(23);
            this.group.add(pivot);
        }
    }
}
