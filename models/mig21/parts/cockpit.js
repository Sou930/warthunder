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
        const canopyGeo = new THREE.SphereGeometry(0.55, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const canopy = this.addMesh(canopyGeo, Materials.canopy, 'glass');
        canopy.scale.set(1.9, 1.0, 0.95);  // 前後に長いバブル形状
        canopy.position.set(baseX, baseY, 0);

        // ----------------------------------------------------------
        //  風防フレーム (前枠) — 前面の補強フレーム
        // ----------------------------------------------------------
        const frontFrameGeo = new THREE.TorusGeometry(0.5, 0.04, 6, 16, Math.PI);
        frontFrameGeo.rotateY(Math.PI / 2);
        const frontFrame = this.addMesh(frontFrameGeo, Materials.frame, 'frontFrame');
        frontFrame.scale.set(1.0, 1.0, 0.95);
        frontFrame.position.set(baseX + 0.9, baseY, 0);

        // 中央フレーム (キャノピー中央の桁)
        const midFrameGeo = new THREE.TorusGeometry(0.52, 0.035, 6, 16, Math.PI);
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

        // ----------------------------------------------------------
        //  パイロット — 射出座席に座ったパイロットフィギュア。
        //  ヘルメット・胴体・腕・脚を簡易プリミティブで構成し、
        //  座席の前(機首寄り)に正しく着座させる。
        // ----------------------------------------------------------
        this._buildPilot(baseX, baseY);
    }

    /**
     * パイロットフィギュアを構築する。
     * 座席座面の上に着座姿勢で配置。+X が機首=前方なので
     * パイロットは +X を向く。
     * @param {number} baseX コックピット基準 X
     * @param {number} baseY コックピット基準 Y
     */
    _buildPilot(baseX, baseY) {
        const pilot = new THREE.Group();
        pilot.name = 'pilot';

        // 着座基準: 座席座面のすぐ上
        const seatX = baseX - 0.18;
        const seatY = baseY + 0.06;

        // --- 胴 (トルソ) — ややダークなフライトスーツ ---
        const torsoGeo = new THREE.CapsuleGeometry(0.16, 0.34, 6, 12);
        const torso = this.addMesh(torsoGeo, Materials.pilotSuit, 'pilotTorso');
        torso.rotation.z = THREE.MathUtils.degToRad(-12); // 背もたれにもたれる
        torso.position.set(seatX - 0.02, seatY + 0.32, 0);
        pilot.add(torso);

        // --- ヘルメット (頭部) — 白っぽいフライトヘルメット ---
        const helmetGeo = new THREE.SphereGeometry(0.16, 20, 16);
        const helmet = this.addMesh(helmetGeo, Materials.helmet, 'pilotHelmet');
        helmet.position.set(seatX + 0.02, seatY + 0.62, 0);
        pilot.add(helmet);

        // --- バイザー (顔前面の暗いシールド) ---
        const visorGeo = new THREE.SphereGeometry(
            0.155, 16, 12,
            Math.PI * 0.15, Math.PI * 0.5,   // 横方向の弧 (前面のみ)
            Math.PI * 0.35, Math.PI * 0.4    // 縦方向の弧 (顔の高さ)
        );
        const visor = this.addMesh(visorGeo, Materials.visor, 'pilotVisor');
        visor.position.set(seatX + 0.02, seatY + 0.6, 0);
        pilot.add(visor);

        // --- 酸素マスク風の前方の出っ張り ---
        const maskGeo = new THREE.SphereGeometry(0.07, 12, 8);
        const mask = this.addMesh(maskGeo, Materials.frame, 'pilotMask');
        mask.position.set(seatX + 0.15, seatY + 0.55, 0);
        pilot.add(mask);

        // --- 肩〜腕 (左右) ---
        for (const dir of [1, -1]) {
            const armGeo = new THREE.CapsuleGeometry(0.05, 0.28, 5, 8);
            const arm = this.addMesh(armGeo, Materials.pilotSuit, dir === 1 ? 'pilotArmR' : 'pilotArmL');
            // 前方へ伸ばし操縦桿を握る姿勢
            arm.position.set(seatX + 0.18, seatY + 0.28, dir * 0.15);
            arm.rotation.z = THREE.MathUtils.degToRad(60);
            arm.rotation.y = dir * THREE.MathUtils.degToRad(10);
            pilot.add(arm);
        }

        // --- 太もも (左右) — 前方水平に伸びる ---
        for (const dir of [1, -1]) {
            const thighGeo = new THREE.CapsuleGeometry(0.07, 0.3, 5, 8);
            const thigh = this.addMesh(thighGeo, Materials.pilotSuit, dir === 1 ? 'pilotThighR' : 'pilotThighL');
            thigh.rotation.z = THREE.MathUtils.degToRad(78); // ほぼ水平
            thigh.position.set(seatX + 0.22, seatY + 0.06, dir * 0.1);
            pilot.add(thigh);

            // すね (やや下向き)
            const shinGeo = new THREE.CapsuleGeometry(0.055, 0.26, 5, 8);
            const shin = this.addMesh(shinGeo, Materials.pilotSuit, dir === 1 ? 'pilotShinR' : 'pilotShinL');
            shin.rotation.z = THREE.MathUtils.degToRad(30);
            shin.position.set(seatX + 0.42, seatY - 0.08, dir * 0.1);
            pilot.add(shin);
        }

        this.group.add(pilot);
        this.pilot = pilot;
    }
}
