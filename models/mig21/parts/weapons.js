import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Weapons — MiG-21MF の標準的な兵装搭載。
 *
 * MiG-21MF の典型的な空対空ミサイルレイアウトを再現:
 *   - R-3S / R-13M (AA-2 "Atoll") … 内側パイロンに 2 発
 *   - R-60 (AA-8 "Aphid") 短射程 IR ミサイル … 外側パイロンに 2 発
 *   - 800L 増槽 (ドロップタンク) … 機体中心線下に 1 本
 *
 * 各兵装はパイロン (兵装架) を介して翼下に吊り下げる。
 * 将来 WeaponSystem がここのミサイルを発射体として切り離す想定。
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
     * @param {number} cfg.length   全長
     * @param {number} cfg.radius   胴体半径
     * @param {string} cfg.name
     * @param {number} [cfg.finSpan] フィンの張り出し倍率
     */
    _makeMissile({ length, radius, name, finSpan = 2.2 }) {
        const g = new THREE.Group();
        g.name = name;

        // --- 本体 (円筒) ---
        const bodyGeo = new THREE.CylinderGeometry(radius, radius, length * 0.7, 14);
        bodyGeo.rotateZ(-Math.PI / 2);
        const body = this.addMesh(bodyGeo, Materials.missileBody, `${name}:body`);
        g.add(body);

        // --- ノーズ (IR シーカー — 半球+短い円錐) ---
        const seekerGeo = new THREE.SphereGeometry(radius * 0.95, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        seekerGeo.rotateZ(-Math.PI / 2);
        const seeker = this.addMesh(seekerGeo, Materials.seekerGlass, `${name}:seeker`);
        seeker.position.set(length * 0.35, 0, 0);
        g.add(seeker);

        // --- 尾部ノズル ---
        const tailGeo = new THREE.CylinderGeometry(radius * 0.65, radius, length * 0.06, 12);
        tailGeo.rotateZ(-Math.PI / 2);
        const tail = this.addMesh(tailGeo, Materials.missileFin, `${name}:tail`);
        tail.position.set(-length * 0.38, 0, 0);
        g.add(tail);

        // --- 後部フィン (×4 十字 — 操舵翼) ---
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            const finGeo = new THREE.BoxGeometry(length * 0.2, 0.02, radius * finSpan);
            const fin = this.addMesh(finGeo, Materials.missileFin, `${name}:rearFin${i}`);
            fin.position.set(-length * 0.3, 0, 0);
            fin.rotation.x = a;
            fin.translateZ(radius * (finSpan / 2));
            g.add(fin);
        }

        // --- 前部カナード (×4 十字, 小型) ---
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const finGeo = new THREE.BoxGeometry(length * 0.1, 0.02, radius * (finSpan * 0.7));
            const fin = this.addMesh(finGeo, Materials.missileFin, `${name}:canard${i}`);
            fin.position.set(length * 0.22, 0, 0);
            fin.rotation.x = a;
            fin.translateZ(radius * (finSpan * 0.35));
            g.add(fin);
        }

        this.group.add(g);
        return g;
    }

    /**
     * パイロン (兵装架) を生成して翼下に取り付ける。
     * @returns {THREE.Mesh}
     */
    _makePylon({ x, y, z, name, depth = 0.7, height = 0.35 }) {
        const pylonGeo = new THREE.BoxGeometry(depth, height, 0.1);
        const pylon = this.addMesh(pylonGeo, Materials.pylon, name);
        pylon.position.set(x, y, z);
        return pylon;
    }

    /**
     * 機体中心線下の増槽 (ドロップタンク) を生成する。
     */
    _makeFuelTank() {
        const g = new THREE.Group();
        g.name = 'centerlineTank';

        const len = 3.6;
        const r = 0.32;
        // 紡錘形タンク (前後を細める LatheGeometry)
        const profile = [
            [-len * 0.5, 0.02],
            [-len * 0.4, r * 0.6],
            [-len * 0.2, r * 0.95],
            [0.0, r],
            [len * 0.25, r * 0.92],
            [len * 0.42, r * 0.5],
            [len * 0.5, 0.04],
        ];
        const pts = profile.map(([x, rr]) => new THREE.Vector2(rr, x));
        const tankGeo = new THREE.LatheGeometry(pts, 20);
        tankGeo.rotateZ(-Math.PI / 2);
        tankGeo.computeVertexNormals();
        const tank = this.addMesh(tankGeo, Materials.fuelTank, 'fuelTankBody');
        g.add(tank);

        // 尾部の安定フィン (×4)
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const finGeo = new THREE.BoxGeometry(0.6, 0.02, r * 1.6);
            const fin = this.addMesh(finGeo, Materials.missileFin, `tankFin${i}`);
            fin.position.set(-len * 0.32, 0, 0);
            fin.rotation.x = a;
            fin.translateZ(r * 0.8);
            g.add(fin);
        }

        // 機体中心線下に取り付け
        g.position.set(-0.4, -1.05, 0);
        this.group.add(g);
        return g;
    }

    buildGeometry() {
        // ----------------------------------------------------------
        //  ハードポイント定義 — 実機 MiG-21MF (5 ハードポイント構成)
        //   ・内翼 ×2 : 翼根寄りの主パイロン (大型 IR ミサイル/増槽対応)
        //   ・外翼 ×2 : 外側の補助パイロン (短射程 IR ミサイル)
        //   ・胴体中央 ×1 : 中心線パイロン (増槽 / 爆弾)
        //  wing.js のデルタ翼スパン (span=3.3) を基準に、内翼を翼根寄り、
        //  外翼を中間スパン付近へ配置する。座標は WeaponSystem からも参照。
        // ----------------------------------------------------------
        const innerZ = 1.45;      // 内翼パイロン (翼根寄り)
        const outerZ = 2.45;      // 外翼パイロン (中間スパン)
        const pylonY = -0.35;     // 翼下面あたり
        const missileY = -0.66;   // ミサイル中心高さ

        // ハードポイント座標を公開 (将来の WeaponSystem 用)
        this.hardpoints = {
            innerRight:  { x: -0.2, y: missileY, z:  innerZ },
            innerLeft:   { x: -0.2, y: missileY, z: -innerZ },
            outerRight:  { x: -0.1, y: missileY, z:  outerZ },
            outerLeft:   { x: -0.1, y: missileY, z: -outerZ },
            centerline:  { x: -0.4, y: -1.05,    z:  0 },
        };

        for (const dir of [1, -1]) {
            // --- 内翼: R-3S "Atoll" (やや大きい IR ミサイル) ---
            this._makePylon({
                x: -0.2, y: pylonY, z: dir * innerZ,
                name: `pylonInner_${dir}`, depth: 0.85, height: 0.38,
            });
            const atoll = this._makeMissile({
                length: 2.8, radius: 0.075, name: `r3s_${dir}`, finSpan: 2.4,
            });
            atoll.position.set(0.0, missileY, dir * innerZ);

            // --- 外翼: R-60 "Aphid" (小型 IR ミサイル) ---
            this._makePylon({
                x: -0.1, y: pylonY, z: dir * outerZ,
                name: `pylonOuter_${dir}`, depth: 0.62, height: 0.3,
            });
            const aphid = this._makeMissile({
                length: 2.1, radius: 0.055, name: `r60_${dir}`, finSpan: 2.6,
            });
            aphid.position.set(0.1, missileY, dir * outerZ);
        }

        // --- 胴体中央 (中心線) ハードポイント: 専用パイロン + 増槽 ---
        this._makePylon({
            x: -0.4, y: -0.78, z: 0,
            name: 'pylonCenterline', depth: 0.9, height: 0.32,
        });
        this._makeFuelTank();
    }
}
