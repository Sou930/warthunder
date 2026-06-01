import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Tail — 尾翼アセンブリ。
 *
 * MiG-21 の尾部:
 *   - 大きく後退した垂直尾翼 (1 枚)
 *   - 全遊動式の水平尾翼 (スタビレーター) 左右
 *   - 腹びれ (ベントラルフィン)
 *
 * 機尾 (-X 側) に配置。
 */
export class Tail extends AircraftPart {
    constructor(options = {}) {
        super('tail', { health: 90, ...options });
    }

    buildGeometry() {
        // ----------------------------------------------------------
        //  垂直尾翼 (Vertical Stabilizer)
        //  XY 平面の後退翼シェイプを Z 方向へ薄く押し出す。
        // ----------------------------------------------------------
        const vShape = new THREE.Shape();
        vShape.moveTo(-3.8, 0);     // 付け根後端
        vShape.lineTo(-1.4, 0);     // 付け根前端
        vShape.lineTo(-2.6, 2.1);   // 上端前 (後退角)
        vShape.lineTo(-3.6, 2.1);   // 上端後
        vShape.closePath();

        const vGeo = new THREE.ExtrudeGeometry(vShape, {
            depth: 0.14,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.04,
            bevelSegments: 2,
        });
        vGeo.translate(0, 0, -0.07); // Z 中心揃え
        vGeo.computeVertexNormals();
        const vfin = this.addMesh(vGeo, Materials.body, 'verticalStabilizer');
        vfin.position.set(-2.0, 0.6, 0);

        // ラダー分割ライン
        const rudderLineGeo = new THREE.BoxGeometry(0.05, 1.9, 0.16);
        const rudderLine = this.addMesh(rudderLineGeo, Materials.bodyDark, 'rudderLine');
        rudderLine.position.set(-3.55, 1.6, 0);

        // ----------------------------------------------------------
        //  水平尾翼 (スタビレーター) — 左右
        //  小さな後退デルタ。
        // ----------------------------------------------------------
        for (const dir of [1, -1]) {
            const hShape = new THREE.Shape();
            hShape.moveTo(0.6, 0);     // 付け根前
            hShape.lineTo(-1.0, 0);    // 付け根後
            hShape.lineTo(-1.3, 1.5);  // 翼端後
            hShape.lineTo(-0.4, 1.5);  // 翼端前 (後退角)
            hShape.closePath();

            const hGeo = new THREE.ExtrudeGeometry(hShape, {
                depth: 0.08,
                bevelEnabled: true,
                bevelThickness: 0.02,
                bevelSize: 0.03,
                bevelSegments: 1,
            });
            hGeo.rotateX(-Math.PI / 2); // スパンを Z 方向へ
            hGeo.computeVertexNormals();
            const stab = this.addMesh(hGeo, Materials.body, dir === 1 ? 'stabRight' : 'stabLeft');
            stab.scale.set(1, 1, dir);
            stab.position.set(-4.4, 0.0, dir * 0.45);
        }

        // ----------------------------------------------------------
        //  腹びれ (Ventral Fin) — 胴体下面の安定板
        // ----------------------------------------------------------
        const vfShape = new THREE.Shape();
        vfShape.moveTo(-3.6, 0);
        vfShape.lineTo(-1.8, 0);
        vfShape.lineTo(-2.6, -0.9);
        vfShape.lineTo(-3.5, -0.9);
        vfShape.closePath();

        const vfGeo = new THREE.ExtrudeGeometry(vfShape, {
            depth: 0.1,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.03,
            bevelSegments: 1,
        });
        vfGeo.translate(0, 0, -0.05);
        vfGeo.computeVertexNormals();
        const ventral = this.addMesh(vfGeo, Materials.bodyDark, 'ventralFin');
        ventral.position.set(-2.0, -0.7, 0);
    }
}
