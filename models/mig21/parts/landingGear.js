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
        const strutGeo = new THREE.CylinderGeometry(0.06, 0.06, strutLen, 8);
        const strut = this.addMesh(strutGeo, Materials.strut, `${name}:strut`);
        strut.position.set(0, -strutLen / 2, 0);
        leg.add(strut);

        // トルクリンク風の補強 (斜め支柱)
        const braceGeo = new THREE.CylinderGeometry(0.03, 0.03, strutLen * 0.7, 6);
        const brace = this.addMesh(braceGeo, Materials.strut, `${name}:brace`);
        brace.position.set(0.12, -strutLen * 0.45, 0);
        brace.rotation.z = THREE.MathUtils.degToRad(20);
        leg.add(brace);

        // ホイール (タイヤ)
        const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.16, 16);
        wheelGeo.rotateX(Math.PI / 2); // 車軸を Z 方向へ
        const wheel = this.addMesh(wheelGeo, Materials.tire, `${name}:wheel`);
        wheel.position.set(0, -strutLen, 0);
        leg.add(wheel);

        // ホイールハブ
        const hubGeo = new THREE.CylinderGeometry(wheelR * 0.4, wheelR * 0.4, 0.18, 10);
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

        // ----------------------------------------------------------
        //  主脚 (左右) — 胴体中央 (重心付近) へ内側引き込み式
        //  実機 MiG-21 の主脚は翼ではなく胴体中央下部に格納される。
        //  脚柱の取り付け基部を胴体寄り (z = ±0.55) に移し、
        //  ホイールはタイヤが胴体下の収納部へ収まる配置とする。
        // ----------------------------------------------------------
        this._makeLeg('mainGearRight', {
            x: -0.5, z: 0.55,
            strutLen: 1.45, wheelR: 0.28,
        });
        this._makeLeg('mainGearLeft', {
            x: -0.5, z: -0.55,
            strutLen: 1.45, wheelR: 0.28,
        });

        // ----------------------------------------------------------
        //  脚収納部 (ホイールウェル) と収納ポッド (バルジ)
        //  脚は降着装置と一緒に表示/非表示が切り替わると不自然なため、
        //  ウェル開口とポッドは常時表示の機体構造として fuselage 側では
        //  なくここに置きつつ、構造体は脚上げでも残す扱いとする。
        //  → ここでは降着装置パーツに含め、開いた状態のウェルとして表現。
        // ----------------------------------------------------------
        this._buildMainGearWells();
        this._buildGearPods();
    }

    /**
     * 主脚収納部 (ホイールウェル) — 胴体中央下面に左右一対の凹み開口。
     * 暗色の箱で「開いた格納庫」を表現し、脚柱基部と接続する。
     */
    _buildMainGearWells() {
        for (const dir of [1, -1]) {
            const well = new THREE.Group();
            well.name = dir === 1 ? 'mainWellRight' : 'mainWellLeft';

            // ウェル内壁 (暗い箱の内側) — 上面と側面で凹みを表現
            const innerGeo = new THREE.BoxGeometry(1.3, 0.45, 0.55);
            const inner = this.addMesh(innerGeo, Materials.intake, `${well.name}:cavity`);
            inner.position.set(-0.5, -0.62, dir * 0.5);
            well.add(inner);

            // ウェルドア (開いた状態の薄い扉板 — 外側へ少し倒す)
            const doorGeo = new THREE.BoxGeometry(1.25, 0.03, 0.5);
            const door = this.addMesh(doorGeo, Materials.strut, `${well.name}:door`);
            door.position.set(-0.5, -0.86, dir * 0.78);
            door.rotation.x = dir * THREE.MathUtils.degToRad(55);
            well.add(door);

            this.group.add(well);
        }
    }

    /**
     * 主脚収納ポッド (バルジ) — 胴体下面側部の膨らみ。
     * 実機 MiG-21 は主脚タイヤを胴体内へ収めるため、下面付け根に
     * 整形されたフェアリング状の膨らみ (ポッド) を持つ。
     */
    _buildGearPods() {
        for (const dir of [1, -1]) {
            // 紡錘形のバルジ (前後に細める)
            const podGeo = new THREE.CapsuleGeometry(0.3, 1.0, 6, 14);
            podGeo.rotateZ(Math.PI / 2);
            const pod = this.addMesh(
                podGeo,
                Materials.body,
                dir === 1 ? 'gearPodRight' : 'gearPodLeft'
            );
            pod.scale.set(1.0, 0.7, 0.85);
            pod.position.set(-0.45, -0.66, dir * 0.62);
            // ポッドは脚上げ時も機体構造として残したいが、
            // 本パーツの setVisible に連動するため簡略に同居させる。
        }
    }
}
