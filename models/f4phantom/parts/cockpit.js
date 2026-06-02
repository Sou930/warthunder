import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Cockpit — F-4E Phantom II のコックピット。
 *
 * MiG-21 が単座なのに対し、F-4 は前席(Pilot)・後席(WSO)の
 * **タンデム複座**。長いキャノピーが 2 区画に分かれ、
 * 中央に太いフレーム桁が入るのが特徴。
 *
 * 2 名分の射出座席・パイロットフィギュアを配置する。
 * 機首寄り (+X 側) の上面に置く。
 */
export class Cockpit extends AircraftPart {
    constructor(options = {}) {
        super('cockpit', { critical: true, health: 90, ...options });
    }

    buildGeometry() {
        // 前席 / 後席の基準位置
        const baseY = 1.0;
        const frontX = 4.2;  // 前席 (Pilot)
        const rearX = 2.7;   // 後席 (WSO)

        // ----------------------------------------------------------
        //  キャノピー (前後 2 区画) — それぞれバブル形状のドーム。
        //  間に太い中央フレームを挟むのが F-4 らしさ。
        // ----------------------------------------------------------
        for (const [cx, label] of [[frontX, 'Front'], [rearX, 'Rear']]) {
            const glassGeo = new THREE.SphereGeometry(0.62, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            const glass = this.addMesh(glassGeo, Materials.canopy, `glass${label}`);
            glass.scale.set(1.35, 1.0, 0.95);
            glass.position.set(cx, baseY, 0);
        }

        // 中央フレーム桁 (前席と後席の間)
        const midFrameGeo = new THREE.TorusGeometry(0.6, 0.06, 8, 16, Math.PI);
        midFrameGeo.rotateY(Math.PI / 2);
        midFrameGeo.scale(1.0, 1.0, 0.95);
        const midFrame = this.addMesh(midFrameGeo, Materials.frame, 'midCanopyFrame');
        midFrame.position.set((frontX + rearX) / 2, baseY, 0);

        // 前風防フレーム (最前面)
        const frontFrameGeo = new THREE.TorusGeometry(0.55, 0.05, 8, 16, Math.PI);
        frontFrameGeo.rotateY(Math.PI / 2);
        frontFrameGeo.scale(1.0, 1.0, 0.95);
        const frontFrame = this.addMesh(frontFrameGeo, Materials.frame, 'frontFrame');
        frontFrame.position.set(frontX + 0.85, baseY, 0);

        // 後端フレーム
        const rearFrameGeo = new THREE.TorusGeometry(0.58, 0.05, 8, 16, Math.PI);
        rearFrameGeo.rotateY(Math.PI / 2);
        rearFrameGeo.scale(1.0, 1.0, 0.95);
        const rearFrame = this.addMesh(rearFrameGeo, Materials.frame, 'rearFrame');
        rearFrame.position.set(rearX - 0.85, baseY, 0);

        // ----------------------------------------------------------
        //  コックピット床 (前後通しの長いタブ)
        // ----------------------------------------------------------
        const tubGeo = new THREE.BoxGeometry(3.0, 0.34, 0.95);
        const tub = this.addMesh(tubGeo, Materials.frame, 'tub');
        tub.position.set((frontX + rearX) / 2, baseY - 0.08, 0);

        // ----------------------------------------------------------
        //  2 名分の座席 + パイロット + 計器盤
        // ----------------------------------------------------------
        this._buildSeat(frontX, baseY, 'Front');
        this._buildSeat(rearX, baseY, 'Rear');
        this._buildPilot(frontX, baseY, 'Front');
        this._buildPilot(rearX, baseY, 'Rear');

        // 前席計器盤 (前方)
        const panelGeo = new THREE.BoxGeometry(0.1, 0.4, 0.65);
        const panel = this.addMesh(panelGeo, Materials.bodyDark, 'instrumentPanel');
        panel.position.set(frontX + 0.5, baseY + 0.12, 0);
    }

    /** 射出座席 (背もたれ + 座面) を構築 */
    _buildSeat(cx, baseY, label) {
        const seatBackGeo = new THREE.BoxGeometry(0.14, 0.6, 0.5);
        const seatBack = this.addMesh(seatBackGeo, Materials.frame, `seatBack${label}`);
        seatBack.position.set(cx - 0.45, baseY + 0.22, 0);

        const seatBaseGeo = new THREE.BoxGeometry(0.48, 0.14, 0.5);
        const seatBase = this.addMesh(seatBaseGeo, Materials.frame, `seatBase${label}`);
        seatBase.position.set(cx - 0.22, baseY + 0.02, 0);
    }

    /**
     * パイロットフィギュア (着座姿勢) を構築する。
     * +X が機首=前方なのでパイロットは +X を向く。
     * @param {number} cx    座席基準 X
     * @param {number} baseY 座席基準 Y
     * @param {string} label "Front" | "Rear"
     */
    _buildPilot(cx, baseY, label) {
        const pilot = new THREE.Group();
        pilot.name = `pilot${label}`;

        const seatX = cx - 0.18;
        const seatY = baseY + 0.08;

        // --- 胴 (トルソ) ---
        const torsoGeo = new THREE.CapsuleGeometry(0.17, 0.36, 6, 12);
        const torso = this.addMesh(torsoGeo, Materials.pilotSuit, `pilotTorso${label}`);
        torso.rotation.z = THREE.MathUtils.degToRad(-12);
        torso.position.set(seatX - 0.02, seatY + 0.34, 0);
        pilot.add(torso);

        // --- ヘルメット ---
        const helmetGeo = new THREE.SphereGeometry(0.17, 20, 16);
        const helmet = this.addMesh(helmetGeo, Materials.helmet, `pilotHelmet${label}`);
        helmet.position.set(seatX + 0.02, seatY + 0.66, 0);
        pilot.add(helmet);

        // --- バイザー ---
        const visorGeo = new THREE.SphereGeometry(
            0.165, 16, 12,
            Math.PI * 0.15, Math.PI * 0.5,
            Math.PI * 0.35, Math.PI * 0.4
        );
        const visor = this.addMesh(visorGeo, Materials.visor, `pilotVisor${label}`);
        visor.position.set(seatX + 0.02, seatY + 0.64, 0);
        pilot.add(visor);

        // --- 酸素マスク ---
        const maskGeo = new THREE.SphereGeometry(0.07, 12, 8);
        const mask = this.addMesh(maskGeo, Materials.frame, `pilotMask${label}`);
        mask.position.set(seatX + 0.16, seatY + 0.58, 0);
        pilot.add(mask);

        // --- 肩〜腕 (左右) ---
        for (const dir of [1, -1]) {
            const armGeo = new THREE.CapsuleGeometry(0.05, 0.3, 5, 8);
            const arm = this.addMesh(armGeo, Materials.pilotSuit, `pilotArm${label}${dir === 1 ? 'R' : 'L'}`);
            arm.position.set(seatX + 0.18, seatY + 0.3, dir * 0.16);
            arm.rotation.z = THREE.MathUtils.degToRad(60);
            arm.rotation.y = dir * THREE.MathUtils.degToRad(10);
            pilot.add(arm);
        }

        // --- 太もも + すね (左右) ---
        for (const dir of [1, -1]) {
            const thighGeo = new THREE.CapsuleGeometry(0.07, 0.32, 5, 8);
            const thigh = this.addMesh(thighGeo, Materials.pilotSuit, `pilotThigh${label}${dir === 1 ? 'R' : 'L'}`);
            thigh.rotation.z = THREE.MathUtils.degToRad(78);
            thigh.position.set(seatX + 0.24, seatY + 0.08, dir * 0.1);
            pilot.add(thigh);

            const shinGeo = new THREE.CapsuleGeometry(0.055, 0.28, 5, 8);
            const shin = this.addMesh(shinGeo, Materials.pilotSuit, `pilotShin${label}${dir === 1 ? 'R' : 'L'}`);
            shin.rotation.z = THREE.MathUtils.degToRad(30);
            shin.position.set(seatX + 0.46, seatY - 0.08, dir * 0.1);
            pilot.add(shin);
        }

        this.group.add(pilot);
    }
}
