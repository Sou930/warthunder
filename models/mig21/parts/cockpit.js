import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Cockpit — コックピットとキャノピー。
 *
 * MiG-21 のキャノピーは胴体前方上面に位置する。
 * 半透明のガラスドームと、その周囲のフレーム、
 * 簡易的な射出座席で構成。
 *
 * 機首寄り (+X 側) の上面に配置する。
 */
export class Cockpit extends AircraftPart {
    constructor(options = {}) {
        super('cockpit', { critical: true, health: 80, ...options });
    }

    buildGeometry() {
        // 配置基準: 機首寄り上面
        const baseX = 3.3;
        const baseY = 0.78;

        // ----------------------------------------------------------
        //  キャノピー本体 (半透明ドーム)
        //  半球を前後に伸ばし、流線型のバブルキャノピーに。
        // ----------------------------------------------------------
        const canopyGeo = new THREE.SphereGeometry(0.55, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
        const canopy = this.addMesh(canopyGeo, Materials.canopy, 'glass');
        canopy.scale.set(1.9, 1.0, 0.95);  // 前後に長いバブル形状
        canopy.position.set(baseX, baseY, 0);

        // ----------------------------------------------------------
        //  風防フレーム (前枠) — 前面の補強フレーム
        // ----------------------------------------------------------
        const frontFrameGeo = new THREE.TorusGeometry(0.5, 0.04, 8, 24, Math.PI);
        frontFrameGeo.rotateY(Math.PI / 2);
        const frontFrame = this.addMesh(frontFrameGeo, Materials.frame, 'frontFrame');
        frontFrame.scale.set(1.0, 1.0, 0.95);
        frontFrame.position.set(baseX + 0.9, baseY, 0);

        // 中央フレーム (キャノピー中央の桁)
        const midFrameGeo = new THREE.TorusGeometry(0.52, 0.035, 8, 24, Math.PI);
        midFrameGeo.rotateY(Math.PI / 2);
        const midFrame = this.addMesh(midFrameGeo, Materials.frame, 'midFrame');
        midFrame.scale.set(1.0, 1.0, 0.95);
        midFrame.position.set(baseX - 0.2, baseY, 0);

        // ----------------------------------------------------------
        //  コックピット床 (ガラス越しに見える暗い底)
        // ----------------------------------------------------------
        const tubGeo = new THREE.BoxGeometry(1.9, 0.3, 0.85);
        const tub = this.addMesh(tubGeo, Materials.frame, 'tub');
        tub.position.set(baseX, baseY - 0.05, 0);

        // ----------------------------------------------------------
        //  射出座席 (簡易) — 背もたれ + 座面
        // ----------------------------------------------------------
        const seatBackGeo = new THREE.BoxGeometry(0.12, 0.55, 0.45);
        const seatBack = this.addMesh(seatBackGeo, Materials.frame, 'seatBack');
        seatBack.position.set(baseX - 0.45, baseY + 0.2, 0);

        const seatBaseGeo = new THREE.BoxGeometry(0.45, 0.12, 0.45);
        const seatBase = this.addMesh(seatBaseGeo, Materials.frame, 'seatBase');
        seatBase.position.set(baseX - 0.22, baseY + 0.0, 0);

        // 計器盤 (前方)
        const panelGeo = new THREE.BoxGeometry(0.1, 0.35, 0.6);
        const panel = this.addMesh(panelGeo, Materials.bodyDark, 'instrumentPanel');
        panel.position.set(baseX + 0.55, baseY + 0.1, 0);
    }
}
