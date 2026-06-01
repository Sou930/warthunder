import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Engine — エンジン (Tumansky R13-300) とアフターバーナーノズル。
 *
 * MiG-21 は単発機。胴体後端に排気ノズルが来る。
 * 可変ノズルのフラップ、内側に光るアフターバーナーコアを表現。
 *
 * 機尾 (-X 側) に配置。
 */
export class Engine extends AircraftPart {
    constructor(options = {}) {
        super('engine', { critical: true, health: 200, ...options });
    }

    buildGeometry() {
        const tailX = -6.1; // ノズル開口位置

        // ----------------------------------------------------------
        //  ノズル外殻 (後方に広がる円錐台)
        // ----------------------------------------------------------
        const shellGeo = new THREE.CylinderGeometry(0.46, 0.40, 0.9, 32, 1, true);
        shellGeo.rotateZ(-Math.PI / 2);
        const shell = this.addMesh(shellGeo, Materials.nozzle, 'nozzleShell');
        shell.position.set(tailX, 0, 0);

        // ----------------------------------------------------------
        //  可変ノズルフラップ (円周上に並ぶペタル) — 雰囲気付け
        // ----------------------------------------------------------
        const petalCount = 14;
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const petalGeo = new THREE.BoxGeometry(0.5, 0.02, 0.12);
            const petal = this.addMesh(petalGeo, Materials.nozzle, `petal${i}`);
            const r = 0.43;
            petal.position.set(
                tailX - 0.1,
                Math.sin(angle) * r,
                Math.cos(angle) * r
            );
            petal.rotation.x = angle;
            petal.scale.set(1.0, 1.0, 1.0);
        }

        // ----------------------------------------------------------
        //  アフターバーナーコア (内側で発光する円錐)
        // ----------------------------------------------------------
        const coreGeo = new THREE.ConeGeometry(0.34, 1.1, 24, 1, true);
        coreGeo.rotateZ(Math.PI / 2); // 頂点を前方へ
        const core = this.addMesh(coreGeo, Materials.afterburner, 'afterburnerCore');
        core.position.set(tailX - 0.05, 0, 0);

        // 中央のフレームホルダー (タービン中心)
        const hubGeo = new THREE.SphereGeometry(0.12, 16, 12);
        const hub = this.addMesh(hubGeo, Materials.nozzle, 'turbineHub');
        hub.position.set(tailX + 0.1, 0, 0);
    }

    /**
     * アフターバーナーの発光アニメーション (script.js のループから呼ぶ)
     * @param {number} time 経過秒
     */
    update(time) {
        const core = this.meshes.find((m) => m.name.endsWith('afterburnerCore'));
        if (core && core.material.emissiveIntensity !== undefined) {
            // 軽い揺らぎ
            core.material.emissiveIntensity = 1.0 + Math.sin(time * 12) * 0.25;
        }
    }
}
