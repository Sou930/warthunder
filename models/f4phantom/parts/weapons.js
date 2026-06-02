import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Weapons — F-4E Phantom II の標準的な空対空ミサイル搭載。
 *
 * F-4 の象徴的な兵装レイアウトを再現:
 *   - AIM-7 Sparrow ×4 … 胴体下面の半埋め込み (recessed) 4 発
 *   - AIM-9 Sidewinder ×4 … 内翼パイロンのレールに 2 発ずつ
 *
 * 将来 WeaponSystem がここのミサイルを発射体として切り離す想定。
 * 各ミサイルは細長いボディ + ノーズコーン + 前後フィンで構成する。
 *
 * 座標系: +X = 前方(機首), +Y = 上, +Z = 右
 */
export class Weapons extends AircraftPart {
    constructor(options = {}) {
        super('weapons', { health: 20, ...options });
    }

    /**
     * 1 発のミサイルを Group として生成する。
     * @param {object} cfg
     * @param {number} cfg.length  全長
     * @param {number} cfg.radius  胴体半径
     * @param {string} cfg.name
     * @param {boolean} [cfg.frontFins] 前部フィンを付けるか (AIM-7/AIM-9)
     */
    _makeMissile({ length, radius, name, frontFins = true }) {
        const g = new THREE.Group();
        g.name = name;

        // --- 本体 (円筒) ---
        const bodyGeo = new THREE.CylinderGeometry(radius, radius, length * 0.74, 16);
        bodyGeo.rotateZ(-Math.PI / 2);
        const body = this.addMesh(bodyGeo, Materials.missileBody, `${name}:body`);
        body.position.set(0, 0, 0);
        g.add(body);

        // --- ノーズコーン (先端) ---
        const noseGeo = new THREE.ConeGeometry(radius, length * 0.22, 16);
        noseGeo.rotateZ(-Math.PI / 2);
        const nose = this.addMesh(noseGeo, Materials.missileFin, `${name}:nose`);
        nose.position.set(length * 0.48, 0, 0);
        g.add(nose);

        // --- 尾部ノズル ---
        const tailGeo = new THREE.CylinderGeometry(radius * 0.7, radius, length * 0.06, 12);
        tailGeo.rotateZ(-Math.PI / 2);
        const tail = this.addMesh(tailGeo, Materials.missileFin, `${name}:tail`);
        tail.position.set(-length * 0.4, 0, 0);
        g.add(tail);

        // --- 後部フィン (×4 十字) ---
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            const finGeo = new THREE.BoxGeometry(length * 0.18, 0.02, radius * 2.4);
            const fin = this.addMesh(finGeo, Materials.missileFin, `${name}:rearFin${i}`);
            fin.position.set(-length * 0.33, 0, 0);
            fin.rotation.x = a;
            fin.translateZ(radius * 1.2);
            g.add(fin);
        }

        // --- 前部フィン (×4 十字, やや小さい) ---
        if (frontFins) {
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
                const finGeo = new THREE.BoxGeometry(length * 0.12, 0.02, radius * 1.8);
                const fin = this.addMesh(finGeo, Materials.missileFin, `${name}:frontFin${i}`);
                fin.position.set(length * 0.18, 0, 0);
                fin.rotation.x = a;
                fin.translateZ(radius * 0.9);
                g.add(fin);
            }
        }

        this.group.add(g);
        return g;
    }

    buildGeometry() {
        // ----------------------------------------------------------
        //  AIM-7 Sparrow ×4 — 胴体下面に半埋め込み。
        //  前後 2 列 × 左右 2 で配置。
        // ----------------------------------------------------------
        const sparrowPositions = [
            [1.5, -1.0, 0.55],
            [1.5, -1.0, -0.55],
            [-0.6, -1.05, 0.7],
            [-0.6, -1.05, -0.7],
        ];
        sparrowPositions.forEach((p, i) => {
            const m = this._makeMissile({
                length: 3.4, radius: 0.1, name: `sparrow${i}`, frontFins: true,
            });
            m.position.set(p[0], p[1], p[2]);
        });

        // ----------------------------------------------------------
        //  AIM-9 Sidewinder ×4 — 内翼パイロル外側のレールに 2 発ずつ。
        //  (パイロンは wing.js 側にあるためミサイル本体のみ配置)
        // ----------------------------------------------------------
        const sidewinderZ = 2.0;
        for (const dir of [1, -1]) {
            for (const dz of [-0.18, 0.18]) {
                const m = this._makeMissile({
                    length: 2.6, radius: 0.07, name: `sidewinder_${dir}_${dz}`, frontFins: true,
                });
                m.position.set(0.6, -0.62, dir * sidewinderZ + dz);
            }
        }
    }
}
