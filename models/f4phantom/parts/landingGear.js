import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * LandingGear — F-4E Phantom II の三輪式降着装置 (ノーズギア + 主脚 ×2)。
 *
 * 表示/非表示を切り替えられるよう独立パーツ化。
 * `setVisible(false)` で「脚上げ」状態を表現する。
 *
 * F-4 は MiG-21 より大型なので脚も太く長め。接地時に機体下端が
 * 地面 (おおよそ y = -2) より上に来るよう調整する。
 */
export class LandingGear extends AircraftPart {
    constructor(options = {}) {
        super('landingGear', { health: 50, ...options });
    }

    /** 1 脚 (ストラット + ホイール) を生成して返すヘルパー */
    _makeLeg(name, { x, z, strutLen, wheelR, twin = false }) {
        const leg = new THREE.Group();
        leg.name = name;

        // ストラット (脚柱)
        const strutGeo = new THREE.CylinderGeometry(0.08, 0.08, strutLen, 8);
        const strut = this.addMesh(strutGeo, Materials.strut, `${name}:strut`);
        strut.position.set(0, -strutLen / 2, 0);
        leg.add(strut);

        // トルクリンク風の補強 (斜め支柱)
        const braceGeo = new THREE.CylinderGeometry(0.035, 0.035, strutLen * 0.7, 6);
        const brace = this.addMesh(braceGeo, Materials.strut, `${name}:brace`);
        brace.position.set(0.14, -strutLen * 0.45, 0);
        brace.rotation.z = THREE.MathUtils.degToRad(20);
        leg.add(brace);

        // ホイール (タイヤ) — ノーズギアは双輪も可
        const wheelOffsets = twin ? [-0.12, 0.12] : [0];
        for (const wz of wheelOffsets) {
            const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.18, 16);
            wheelGeo.rotateX(Math.PI / 2);
            const wheel = this.addMesh(wheelGeo, Materials.tire, `${name}:wheel`);
            wheel.position.set(0, -strutLen, wz);
            leg.add(wheel);

            const hubGeo = new THREE.CylinderGeometry(wheelR * 0.4, wheelR * 0.4, 0.2, 10);
            hubGeo.rotateX(Math.PI / 2);
            const hub = this.addMesh(hubGeo, Materials.strut, `${name}:hub`);
            hub.position.set(0, -strutLen, wz);
            leg.add(hub);
        }

        leg.position.set(x, 0, z);
        this.group.add(leg);
        return leg;
    }

    buildGeometry() {
        // ノーズギア (機首寄り、双輪)
        // ホイール下端 = -(strutLen + wheelR) がおおよそ地面 (y=-2) に来るよう調整。
        this._makeLeg('noseGear', {
            x: 4.4, z: 0,
            strutLen: 1.5, wheelR: 0.26, twin: true,
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
