import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Tail — F-4E Phantom II の尾翼アセンブリ。
 *
 * F-4 の尾部で最も特徴的なのは:
 *   - 大きな後退角の垂直尾翼 (1 枚) + 後縁ラダー
 *   - **強いアンヒドラル (下反角 約23°)** の全遊動式水平尾翼 (スタビレーター)
 *     → 主翼の上反 (カソードラル) と対をなし、F-4 のシルエットを決定づける
 *   - 垂直尾翼前縁付け根のドーサルフィン (背びれの延長)
 *   - スタビレーター前縁の鋸歯 (一部型) と整形された翼端
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
            bevelThickness: 0.04,
            bevelSize: 0.05,
            bevelSegments: 3,
        };

        // ----------------------------------------------------------
        //  垂直尾翼 (Vertical Stabilizer) — 大きく後退した1枚。
        //  実機に近い、前縁が直線的で上端をやや切り落とした台形。
        // ----------------------------------------------------------
        const vShape = new THREE.Shape();
        vShape.moveTo(-4.6, 0);     // 付け根後端
        vShape.lineTo(-1.2, 0);     // 付け根前端
        vShape.lineTo(-2.7, 2.7);   // 上端前 (後退角)
        vShape.lineTo(-3.9, 2.7);   // 上端後 (やや切り落とし)
        vShape.closePath();

        const vGeo = new THREE.ExtrudeGeometry(vShape, { depth: 0.18, ...extrudeBase });
        vGeo.translate(0, 0, -0.09);
        vGeo.computeVertexNormals();
        const vfin = this.addMesh(vGeo, Materials.body, 'verticalStabilizer');
        vfin.position.set(-2.4, 0.78, 0);

        // 垂直尾翼上面のタン迷彩パッチ
        const vCamoShape = new THREE.Shape();
        vCamoShape.moveTo(-4.2, 0.3);
        vCamoShape.lineTo(-1.7, 0.3);
        vCamoShape.lineTo(-2.8, 2.4);
        vCamoShape.lineTo(-3.7, 2.4);
        vCamoShape.closePath();
        const vCamoGeo = new THREE.ExtrudeGeometry(vCamoShape, { depth: 0.02, bevelEnabled: false });
        const vCamo = this.addMesh(vCamoGeo, Materials.camoTan, 'vStabCamo');
        vCamo.position.set(-2.4, 0.78, 0.10);

        // --- ラダー (後縁可動部) ---
        const rudderShape = new THREE.Shape();
        rudderShape.moveTo(-4.6, 0.1);
        rudderShape.lineTo(-4.0, 0.1);
        rudderShape.lineTo(-4.0, 2.5);
        rudderShape.lineTo(-4.5, 2.5);
        rudderShape.closePath();
        const rudderGeo = new THREE.ExtrudeGeometry(rudderShape, { depth: 0.14, ...extrudeBase });
        rudderGeo.translate(0, 0, -0.07);
        const rudder = this.addMesh(rudderGeo, Materials.bodyDark, 'rudder');
        rudder.position.set(-2.4, 0.78, 0);

        // ラダー分割ライン
        const rudderLineGeo = new THREE.BoxGeometry(0.04, 2.4, 0.2);
        const rudderLine = this.addMesh(rudderLineGeo, Materials.panelLine, 'rudderLine');
        rudderLine.position.set(-6.35, 2.0, 0);

        // --- 垂直尾翼頂部のフェアリング (ECM/アンテナ整形) ---
        const tipGeo = new THREE.BoxGeometry(1.3, 0.16, 0.22);
        const tip = this.addMesh(tipGeo, Materials.bareMetal, 'finTipFairing');
        tip.position.set(-5.7, 3.46, 0);
        tip.rotation.z = THREE.MathUtils.degToRad(-30);

        // --- ドーサルフィン (背びれ → 垂直尾翼前縁付け根の整形) ---
        const dorsalShape = new THREE.Shape();
        dorsalShape.moveTo(0, 0);
        dorsalShape.lineTo(-2.4, 0);
        dorsalShape.lineTo(-2.2, 0.55);
        dorsalShape.closePath();
        const dorsalGeo = new THREE.ExtrudeGeometry(dorsalShape, { depth: 0.14, ...extrudeBase });
        dorsalGeo.translate(0, 0, -0.07);
        const dorsal = this.addMesh(dorsalGeo, Materials.body, 'dorsalFin');
        dorsal.position.set(-1.6, 0.78, 0);

        // ----------------------------------------------------------
        //  水平尾翼 (全遊動スタビレーター) — 左右、強いアンヒドラル。
        //  各スタビレーターを pivot Group に入れ、下反 23° 回転させる。
        //  前縁を後退させ、翼端をやや切り落とした台形に整形。
        // ----------------------------------------------------------
        for (const dir of [1, -1]) {
            const side = dir === 1 ? 'Right' : 'Left';
            const hShape = new THREE.Shape();
            hShape.moveTo(1.0, 0);      // 付け根前
            hShape.lineTo(-1.5, 0);     // 付け根後
            hShape.lineTo(-2.0, 2.4);   // 翼端後
            hShape.lineTo(-0.7, 2.4);   // 翼端前 (後退角)
            hShape.closePath();

            const hGeo = new THREE.ExtrudeGeometry(hShape, { depth: 0.12, ...extrudeBase });
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
            pivot.position.set(-5.4, 0.06, 0);
            stab.position.set(0, 0, 0);
            pivot.add(stab);

            // スタビレーター前縁の境界層スリット (一部型の特徴)
            const slotGeo = new THREE.BoxGeometry(0.18, 0.14, 2.2);
            const slot = new THREE.Mesh(slotGeo, Materials.bareMetal);
            slot.name = `tail:stabSlot${side}`;
            slot.userData.part = this;
            slot.position.set(0.5, 0.02, dir * 1.25);
            this.meshes.push(slot);
            pivot.add(slot);

            // 下反角 23° (翼端が下がる) — 左右で回転方向反転
            pivot.rotation.x = dir * THREE.MathUtils.degToRad(23);
            this.group.add(pivot);
        }
    }
}
