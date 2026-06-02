import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * LandingGear — F-4E Phantom II の三輪式降着装置 (ノーズギア + 主脚 ×2)。
 *
 * 表示/非表示を切り替えられるよう独立パーツ化。
 * `setVisible(false)` で「脚上げ」状態を表現する。
 *
 * リアリティのため以下を再現:
 *   - オレオ (ピストン部) を 2 段径で表現
 *   - トルクリンク (シザーズ) 風の補強
 *   - ホイールハブ + ゴムタイヤの色分け、ブレーキディスク
 *   - ギアベイ開口 (白塗装の窪み)
 *   - ノーズギアの着陸灯
 */
export class LandingGear extends AircraftPart {
    constructor(options = {}) {
        super('landingGear', { health: 50, ...options });
    }

    /** 1 脚 (ストラット + ホイール) を生成して返すヘルパー */
    _makeLeg(name, { x, z, strutLen, wheelR, twin = false, light = false }) {
        const leg = new THREE.Group();
        leg.name = name;

        // オレオ上段 (太い外筒)
        const upperGeo = new THREE.CylinderGeometry(0.1, 0.1, strutLen * 0.5, 10);
        const upper = this.addMesh(upperGeo, Materials.strut, `${name}:upperStrut`);
        upper.position.set(0, -strutLen * 0.25, 0);
        leg.add(upper);

        // オレオ下段 (細いピストン・磨き金属)
        const lowerGeo = new THREE.CylinderGeometry(0.07, 0.07, strutLen * 0.55, 10);
        const lower = this.addMesh(lowerGeo, Materials.bareMetal, `${name}:lowerStrut`);
        lower.position.set(0, -strutLen * 0.72, 0);
        leg.add(lower);

        // トルクリンク (シザーズ) 風の補強 (斜め支柱 ×2)
        for (const sign of [1, -1]) {
            const braceGeo = new THREE.CylinderGeometry(0.025, 0.025, strutLen * 0.4, 6);
            const brace = this.addMesh(braceGeo, Materials.strut, `${name}:brace${sign}`);
            brace.position.set(0.13, -strutLen * (0.5 + sign * 0.12), 0);
            brace.rotation.z = THREE.MathUtils.degToRad(20 * sign);
            leg.add(brace);
        }

        // ホイール (タイヤ) — ノーズギアは双輪も可
        const wheelOffsets = twin ? [-0.13, 0.13] : [0];
        for (const wz of wheelOffsets) {
            const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.2, 20);
            wheelGeo.rotateX(Math.PI / 2);
            const wheel = this.addMesh(wheelGeo, Materials.tire, `${name}:wheel`);
            wheel.position.set(0, -strutLen, wz);
            leg.add(wheel);

            // ホイールハブ (塗装メタル)
            const hubGeo = new THREE.CylinderGeometry(wheelR * 0.5, wheelR * 0.5, 0.22, 14);
            hubGeo.rotateX(Math.PI / 2);
            const hub = this.addMesh(hubGeo, Materials.wheelHub, `${name}:hub`);
            hub.position.set(0, -strutLen, wz);

            // ブレーキディスク (主脚のみ目立つが共通で付ける)
            const discGeo = new THREE.CylinderGeometry(wheelR * 0.7, wheelR * 0.7, 0.05, 16);
            discGeo.rotateX(Math.PI / 2);
            const disc = this.addMesh(discGeo, Materials.bodyDark, `${name}:brakeDisc`);
            disc.position.set(0, -strutLen, wz + (twin ? 0 : 0.13));
        }

        // 着陸灯 (ノーズギア前面)
        if (light) {
            const lampGeo = new THREE.SphereGeometry(0.06, 10, 8);
            const lamp = this.addMesh(lampGeo, Materials.navLightGreen, `${name}:landingLight`);
            lamp.material = Materials.intakeWhite;
            lamp.position.set(0.12, -strutLen * 0.4, 0);
            leg.add(lamp);
        }

        leg.position.set(x, 0, z);
        this.group.add(leg);
        return leg;
    }

    /** ギアベイ (白塗装の窪み) を作る */
    _makeBay(x, z, w, d) {
        const bayGeo = new THREE.BoxGeometry(w, 0.1, d);
        const bay = this.addMesh(bayGeo, Materials.gearBayWhite, `gearBay_${x}_${z}`);
        bay.position.set(x, -0.35, z);
        return bay;
    }

    buildGeometry() {
        // ギアベイ
        this._makeBay(4.4, 0, 0.8, 0.7);
        this._makeBay(-0.4, 1.0, 0.7, 0.9);
        this._makeBay(-0.4, -1.0, 0.7, 0.9);

        // ノーズギア (機首寄り、双輪、着陸灯付き)
        this._makeLeg('noseGear', {
            x: 4.4, z: 0,
            strutLen: 1.5, wheelR: 0.26, twin: true, light: true,
        });

        // 主脚 (左右、胴体重心付近、太め)
        this._makeLeg('mainGearRight', {
            x: -0.4, z: 1.0,
            strutLen: 1.66, wheelR: 0.34,
        });
        this._makeLeg('mainGearLeft', {
            x: -0.4, z: -1.0,
            strutLen: 1.66, wheelR: 0.34,
        });
    }
}
