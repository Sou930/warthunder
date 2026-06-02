import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Cockpit — F-4E Phantom II のコックピット。
 *
 * F-4 は前席(Pilot)・後席(WSO)の **タンデム複座**。長いキャノピーが
 * 2 区画に分かれ、中央に太いフレーム桁が入るのが特徴。
 *
 * リアリティのため以下を再現:
 *   - 前後 2 区画のバブルキャノピー (それぞれ後ろ開き) + 風防フレーム
 *   - キャノピー縦フレーム/中央桁、後端フェアリング
 *   - 暗い内装タブ + 2 名分の MB Mk.H7 風射出座席
 *   - 計器盤 + 前席 HUD コンバイナ + バックミラー
 *   - 着座パイロット 2 名 (ヘルメット/バイザー/酸素マスク/四肢/Gスーツ)
 *
 * 機首寄り (+X 側) の上面に置く。
 */
export class Cockpit extends AircraftPart {
    constructor(options = {}) {
        super('cockpit', { critical: true, health: 90, ...options });
    }

    buildGeometry() {
        // 前席 / 後席の基準位置
        const baseY = 1.02;
        const frontX = 4.3;  // 前席 (Pilot)
        const rearX = 2.75;  // 後席 (WSO)

        // ----------------------------------------------------------
        //  コックピット内装タブ (暗い箱) — ガラス下の見える内部。
        // ----------------------------------------------------------
        const tubGeo = new THREE.BoxGeometry(3.2, 0.5, 0.92);
        const tub = this.addMesh(tubGeo, Materials.cockpitInterior, 'tub');
        tub.position.set((frontX + rearX) / 2, baseY - 0.22, 0);

        // コーミング (計器盤の上端カバー・前席前方)
        const cowlGeo = new THREE.BoxGeometry(0.5, 0.2, 0.85);
        const cowl = this.addMesh(cowlGeo, Materials.frame, 'glareShield');
        cowl.position.set(frontX + 0.72, baseY + 0.05, 0);

        // ----------------------------------------------------------
        //  キャノピー (前後 2 区画) — それぞれバブル形状のドーム。
        //  半球を縦長に潰し、後方へやや伸ばした形に。
        // ----------------------------------------------------------
        for (const [cx, label, len] of [[frontX, 'Front', 1.45], [rearX, 'Rear', 1.4]]) {
            const glassGeo = new THREE.SphereGeometry(0.6, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2);
            const glass = this.addMesh(glassGeo, Materials.canopy, `glass${label}`);
            glass.scale.set(len, 1.05, 0.92);
            glass.position.set(cx, baseY, 0);
            glass.renderOrder = 5;
        }

        // ----------------------------------------------------------
        //  キャノピーフレーム — 前風防/中央桁/後端の 3 本 + 縦リブ。
        // ----------------------------------------------------------
        this._buildArchFrame(frontX + 0.88, baseY, 0.56, 'frontWindscreen'); // 前風防
        this._buildArchFrame((frontX + rearX) / 2, baseY, 0.62, 'midFrame');  // 中央桁
        this._buildArchFrame(rearX - 0.85, baseY, 0.6, 'rearFrame');          // 後端

        // 後端フェアリング (キャノピー後方のスパインへ繋ぐ整形)
        const fairGeo = new THREE.SphereGeometry(0.5, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2);
        fairGeo.scale(1.6, 0.7, 0.8);
        const fair = this.addMesh(fairGeo, Materials.body, 'canopyFairing');
        fair.position.set(rearX - 1.4, baseY - 0.05, 0);

        // ----------------------------------------------------------
        //  座席 + パイロット + 計器
        // ----------------------------------------------------------
        this._buildSeat(frontX, baseY, 'Front');
        this._buildSeat(rearX, baseY, 'Rear');
        this._buildPilot(frontX, baseY, 'Front');
        this._buildPilot(rearX, baseY, 'Rear');

        // 前席計器盤
        const panelGeo = new THREE.BoxGeometry(0.12, 0.42, 0.66);
        const panel = this.addMesh(panelGeo, Materials.cockpitInterior, 'instrumentPanel');
        panel.position.set(frontX + 0.52, baseY + 0.0, 0);

        // 後席計器盤 (レーダースコープ)
        const rPanelGeo = new THREE.BoxGeometry(0.12, 0.4, 0.6);
        const rPanel = this.addMesh(rPanelGeo, Materials.cockpitInterior, 'rearPanel');
        rPanel.position.set(rearX + 0.5, baseY + 0.0, 0);

        // 前席 HUD コンバイナ (ガラス板)
        const hudGeo = new THREE.BoxGeometry(0.02, 0.22, 0.26);
        const hud = this.addMesh(hudGeo, Materials.canopy, 'hudCombiner');
        hud.position.set(frontX + 0.32, baseY + 0.28, 0);
        hud.renderOrder = 6;

        // バックミラー (キャノピー前枠上 ×2)
        for (const dir of [1, -1]) {
            const mirrorGeo = new THREE.BoxGeometry(0.06, 0.08, 0.1);
            const mirror = this.addMesh(mirrorGeo, Materials.visor, `mirror${dir === 1 ? 'R' : 'L'}`);
            mirror.position.set(frontX + 0.68, baseY + 0.38, dir * 0.18);
        }
    }

    /**
     * キャノピーのアーチ型フレームを構築 (半円トーラス + 下端ピン)。
     */
    _buildArchFrame(cx, baseY, radius, name) {
        const frameGeo = new THREE.TorusGeometry(radius, 0.045, 8, 20, Math.PI);
        frameGeo.rotateY(Math.PI / 2);
        frameGeo.scale(1.0, 1.0, 0.92);
        const frame = this.addMesh(frameGeo, Materials.frame, name);
        frame.position.set(cx, baseY, 0);
        frame.renderOrder = 6;
    }

    /** 射出座席 (背もたれ + 座面 + ヘッドボックス) を構築 */
    _buildSeat(cx, baseY, label) {
        const seatBackGeo = new THREE.BoxGeometry(0.16, 0.66, 0.52);
        const seatBack = this.addMesh(seatBackGeo, Materials.frame, `seatBack${label}`);
        seatBack.position.set(cx - 0.46, baseY + 0.16, 0);
        seatBack.rotation.z = THREE.MathUtils.degToRad(-8);

        const seatBaseGeo = new THREE.BoxGeometry(0.5, 0.15, 0.5);
        const seatBase = this.addMesh(seatBaseGeo, Materials.frame, `seatBase${label}`);
        seatBase.position.set(cx - 0.2, baseY - 0.06, 0);

        // ヘッドボックス (射出座席上部)
        const headBoxGeo = new THREE.BoxGeometry(0.18, 0.2, 0.42);
        const headBox = this.addMesh(headBoxGeo, Materials.bodyDark, `headBox${label}`);
        headBox.position.set(cx - 0.5, baseY + 0.52, 0);
    }

    /**
     * パイロットフィギュア (着座姿勢) を構築する。
     * +X が機首=前方なのでパイロットは +X を向く。
     */
    _buildPilot(cx, baseY, label) {
        const pilot = new THREE.Group();
        pilot.name = `pilot${label}`;

        const seatX = cx - 0.16;
        const seatY = baseY + 0.06;

        // --- 胴 (トルソ) ---
        const torsoGeo = new THREE.CapsuleGeometry(0.18, 0.38, 6, 12);
        const torso = this.addMesh(torsoGeo, Materials.pilotSuit, `pilotTorso${label}`);
        torso.rotation.z = THREE.MathUtils.degToRad(-12);
        torso.position.set(seatX - 0.02, seatY + 0.36, 0);
        pilot.add(torso);

        // --- ハーネス (胸の Gスーツ ストラップ) ---
        const harnessGeo = new THREE.BoxGeometry(0.12, 0.34, 0.28);
        const harness = this.addMesh(harnessGeo, Materials.pilotHarness, `pilotHarness${label}`);
        harness.rotation.z = THREE.MathUtils.degToRad(-12);
        harness.position.set(seatX + 0.08, seatY + 0.36, 0);
        pilot.add(harness);

        // --- ヘルメット ---
        const helmetGeo = new THREE.SphereGeometry(0.175, 20, 16);
        const helmet = this.addMesh(helmetGeo, Materials.helmet, `pilotHelmet${label}`);
        helmet.position.set(seatX + 0.02, seatY + 0.68, 0);
        pilot.add(helmet);

        // --- バイザー ---
        const visorGeo = new THREE.SphereGeometry(
            0.17, 16, 12,
            Math.PI * 0.15, Math.PI * 0.5,
            Math.PI * 0.35, Math.PI * 0.4
        );
        const visor = this.addMesh(visorGeo, Materials.visor, `pilotVisor${label}`);
        visor.position.set(seatX + 0.02, seatY + 0.66, 0);
        pilot.add(visor);

        // --- 酸素マスク ---
        const maskGeo = new THREE.SphereGeometry(0.075, 12, 8);
        const mask = this.addMesh(maskGeo, Materials.frame, `pilotMask${label}`);
        mask.position.set(seatX + 0.17, seatY + 0.6, 0);
        pilot.add(mask);

        // --- 肩〜腕 (左右) ---
        for (const dir of [1, -1]) {
            const armGeo = new THREE.CapsuleGeometry(0.052, 0.3, 5, 8);
            const arm = this.addMesh(armGeo, Materials.pilotSuit, `pilotArm${label}${dir === 1 ? 'R' : 'L'}`);
            arm.position.set(seatX + 0.19, seatY + 0.32, dir * 0.17);
            arm.rotation.z = THREE.MathUtils.degToRad(62);
            arm.rotation.y = dir * THREE.MathUtils.degToRad(10);
            pilot.add(arm);
        }

        // --- 太もも + すね (左右) ---
        for (const dir of [1, -1]) {
            const thighGeo = new THREE.CapsuleGeometry(0.072, 0.32, 5, 8);
            const thigh = this.addMesh(thighGeo, Materials.pilotSuit, `pilotThigh${label}${dir === 1 ? 'R' : 'L'}`);
            thigh.rotation.z = THREE.MathUtils.degToRad(78);
            thigh.position.set(seatX + 0.26, seatY + 0.06, dir * 0.1);
            pilot.add(thigh);

            const shinGeo = new THREE.CapsuleGeometry(0.057, 0.28, 5, 8);
            const shin = this.addMesh(shinGeo, Materials.pilotSuit, `pilotShin${label}${dir === 1 ? 'R' : 'L'}`);
            shin.rotation.z = THREE.MathUtils.degToRad(28);
            shin.position.set(seatX + 0.48, seatY - 0.1, dir * 0.1);
            pilot.add(shin);
        }

        this.group.add(pilot);
    }
}
