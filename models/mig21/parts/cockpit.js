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

        // ==========================================================
        //  キャノピーを前後方向へ延長し、前面ガラス(風防)と
        //  フレーム構造を追加する。
        //  構成:
        //    1) 前面ガラス (Windscreen) — 機首寄りの傾斜した固定風防
        //    2) 後方バブルキャノピー — パイロットを覆う可動風防
        //    3) フレーム構造 — 前枠 / 風防後縁アーチ / 中央桁 / 縦通材 / 後縁
        // ==========================================================

        // 前後延長量: 旧キャノピーより前後それぞれ広げる
        const canopyFrontX = baseX + 1.15;  // 風防前端
        const canopyRearX = baseX - 1.25;   // バブル後端

        // ----------------------------------------------------------
        //  1) 前面ガラス (Windscreen) — 前方へ傾斜した固定風防
        //     球の前方部分を切り出し、前傾させて取り付ける。
        // ----------------------------------------------------------
        const wsGeo = new THREE.SphereGeometry(
            0.55, 24, 14,
            0, Math.PI * 2,
            0, Math.PI * 0.55
        );
        const windscreen = this.addMesh(wsGeo, Materials.canopy, 'windscreen');
        windscreen.scale.set(1.15, 1.15, 0.92); // 前方へ伸ばした傾斜風防
        windscreen.rotation.z = THREE.MathUtils.degToRad(-32); // 前傾
        windscreen.position.set(baseX + 0.72, baseY + 0.02, 0);

        // ----------------------------------------------------------
        //  2) 後方バブルキャノピー (半透明ドーム) — 前後に長く延長
        // ----------------------------------------------------------
        const canopyGeo = new THREE.SphereGeometry(0.55, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const canopy = this.addMesh(canopyGeo, Materials.canopy, 'glass');
        // 前後にさらに長く延長 (旧 1.9 → 2.25)、やや背の高いバブル形状
        canopy.scale.set(2.25, 1.22, 1.0);
        canopy.position.set(baseX - 0.15, baseY, 0);

        // ----------------------------------------------------------
        //  3) フレーム構造
        // ----------------------------------------------------------
        // 前面ガラス前縁フレーム (風防最前部の太い枠)
        const wsFrontGeo = new THREE.TorusGeometry(0.5, 0.05, 6, 18, Math.PI);
        wsFrontGeo.rotateY(Math.PI / 2);
        const wsFront = this.addMesh(wsFrontGeo, Materials.frame, 'windscreenFrontFrame');
        wsFront.scale.set(1.0, 0.9, 0.92);
        wsFront.rotation.x = THREE.MathUtils.degToRad(20);
        wsFront.position.set(canopyFrontX, baseY - 0.02, 0);

        // 風防後縁アーチ (前面ガラスと後方バブルの境界フレーム)
        const archGeo = new THREE.TorusGeometry(0.54, 0.045, 6, 18, Math.PI);
        archGeo.rotateY(Math.PI / 2);
        const arch = this.addMesh(archGeo, Materials.frame, 'windscreenArch');
        arch.scale.set(1.0, 1.05, 0.96);
        arch.position.set(baseX + 0.35, baseY, 0);

        // 中央フレーム (キャノピー中央の桁)
        const midFrameGeo = new THREE.TorusGeometry(0.55, 0.035, 6, 18, Math.PI);
        midFrameGeo.rotateY(Math.PI / 2);
        const midFrame = this.addMesh(midFrameGeo, Materials.frame, 'midFrame');
        midFrame.scale.set(1.0, 1.05, 0.96);
        midFrame.position.set(baseX - 0.4, baseY, 0);

        // 後縁フレーム (バブル後端の枠)
        const rearFrameGeo = new THREE.TorusGeometry(0.5, 0.04, 6, 18, Math.PI);
        rearFrameGeo.rotateY(Math.PI / 2);
        const rearFrame = this.addMesh(rearFrameGeo, Materials.frame, 'rearFrame');
        rearFrame.scale.set(1.0, 0.95, 0.92);
        rearFrame.rotation.x = THREE.MathUtils.degToRad(-12);
        rearFrame.position.set(canopyRearX, baseY - 0.04, 0);

        // 左右の縦通材 (キャノピーレール) — 前後を結ぶ細い桁
        for (const dir of [1, -1]) {
            const railGeo = new THREE.BoxGeometry(canopyFrontX - canopyRearX, 0.04, 0.05);
            const rail = this.addMesh(railGeo, Materials.frame, dir === 1 ? 'canopyRailR' : 'canopyRailL');
            rail.position.set((canopyFrontX + canopyRearX) / 2, baseY - 0.18, dir * 0.5);
        }

        // ----------------------------------------------------------
        //  コックピット床 (ガラス越しに見える暗い底) — 延長に合わせて拡大
        // ----------------------------------------------------------
        const tubGeo = new THREE.BoxGeometry(2.3, 0.3, 0.85);
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
        torso.position.set(seatX - 0.02, seatY + 0.24, 0);
        pilot.add(torso);

        // --- ヘルメット (頭部) — 白っぽいフライトヘルメット ---
        //  ※ キャノピー内に収まるよう高さを下げた (旧: +0.62 で頭が突き抜けていた)
        const helmetGeo = new THREE.SphereGeometry(0.15, 20, 16);
        const helmet = this.addMesh(helmetGeo, Materials.helmet, 'pilotHelmet');
        helmet.position.set(seatX + 0.02, seatY + 0.42, 0);
        pilot.add(helmet);

        // --- バイザー (顔前面の暗いシールド) ---
        const visorGeo = new THREE.SphereGeometry(
            0.145, 16, 12,
            Math.PI * 0.15, Math.PI * 0.5,   // 横方向の弧 (前面のみ)
            Math.PI * 0.35, Math.PI * 0.4    // 縦方向の弧 (顔の高さ)
        );
        const visor = this.addMesh(visorGeo, Materials.visor, 'pilotVisor');
        visor.position.set(seatX + 0.02, seatY + 0.40, 0);
        pilot.add(visor);

        // --- 酸素マスク風の前方の出っ張り ---
        const maskGeo = new THREE.SphereGeometry(0.06, 12, 8);
        const mask = this.addMesh(maskGeo, Materials.frame, 'pilotMask');
        mask.position.set(seatX + 0.14, seatY + 0.36, 0);
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
