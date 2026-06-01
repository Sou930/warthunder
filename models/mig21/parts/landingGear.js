import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * LandingGear — 三輪式降着装置 (ノーズギア + 主脚 ×2)。
 *
 * 表示/非表示を切り替えられるよう独立パーツ化。
 * `setVisible(false)` で「脚上げ」状態を表現する。
 * 将来 FlightModel が脚上げ/下げをアニメーションさせる土台。
 *
 * 接地時に機体が地面より上に来るよう、ホイール下端を
 * おおよそ y = -1.5 付近に配置する。
 */
export class LandingGear extends AircraftPart {
    constructor(options = {}) {
        super('landingGear', { health: 40, ...options });
    }

    /** 1 脚 (ストラット + ホイール) を生成して返すヘルパー */
    _makeLeg(name, { x, z, strutLen, wheelR }) {
        const leg = new THREE.Group();
        leg.name = name;

        // ストラット (脚柱)
        const strutGeo = new THREE.CylinderGeometry(0.06, 0.06, strutLen, 12);
        const strut = this.addMesh(strutGeo, Materials.strut, `${name}:strut`);
        strut.position.set(0, -strutLen / 2, 0);
        leg.add(strut);

        // トルクリンク風の補強 (斜め支柱)
        const braceGeo = new THREE.CylinderGeometry(0.03, 0.03, strutLen * 0.7, 8);
        const brace = this.addMesh(braceGeo, Materials.strut, `${name}:brace`);
        brace.position.set(0.12, -strutLen * 0.45, 0);
        brace.rotation.z = THREE.MathUtils.degToRad(20);
        leg.add(brace);

        // ホイール (タイヤ)
        const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.16, 20);
        wheelGeo.rotateX(Math.PI / 2); // 車軸を Z 方向へ
        const wheel = this.addMesh(wheelGeo, Materials.tire, `${name}:wheel`);
        wheel.position.set(0, -strutLen, 0);
        leg.add(wheel);

        // ホイールハブ
        const hubGeo = new THREE.CylinderGeometry(wheelR * 0.4, wheelR * 0.4, 0.18, 12);
        hubGeo.rotateX(Math.PI / 2);
        const hub = this.addMesh(hubGeo, Materials.strut, `${name}:hub`);
        hub.position.set(0, -strutLen, 0);
        leg.add(hub);

        leg.position.set(x, 0, z);
        this.group.add(leg);
        return leg;
    }

    buildGeometry() {
        // ノーズギア (機首寄り、やや長い)
        this._makeLeg('noseGear', {
            x: 3.6, z: 0,
            strutLen: 1.35, wheelR: 0.22,
        });

        // 主脚 (左右、胴体重心付近)
        this._makeLeg('mainGearRight', {
            x: -0.6, z: 0.75,
            strutLen: 1.45, wheelR: 0.28,
        });
        this._makeLeg('mainGearLeft', {
            x: -0.6, z: -0.75,
            strutLen: 1.45, wheelR: 0.28,
        });
    }
}
