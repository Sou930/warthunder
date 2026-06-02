import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Engine — F-4E Phantom II のエンジン (J79-GE-17A ×2) とアフターバーナー。
 *
 * MiG-21 が単発なのに対し、F-4 は **双発**。胴体後端に
 * 左右 2 つの排気ノズルが並ぶ。各ノズルに可変フラップと
 * アフターバーナーの炎プルーム・ショックダイヤモンドを持たせ、
 * update() で 2 基同時にアニメートする。
 *
 * 機尾 (-X 側) に左右対称配置。
 */
export class Engine extends AircraftPart {
    constructor(options = {}) {
        super('engine', { critical: true, health: 220, ...options });

        this.afterburnerOn = true;
        this._abLevel = 1.0;
        this._abCurrent = 1.0;
    }

    buildGeometry() {
        const tailX = -6.9;       // ノズル開口位置
        this._tailX = tailX;
        const sep = 0.78;         // 左右ノズルの間隔 (中心からのオフセット)

        // 全プルーム/ディスク/コアを保持
        this.plumeMeshes = [];
        this.machDisks = [];
        this.abLights = [];

        // 左右 2 基を構築
        for (const dir of [1, -1]) {
            this._buildNozzle(tailX, dir * sep, dir);
        }

        // 初期状態を反映
        this._applyAfterburnerVisual(this.afterburnerOn ? 1 : 0);
    }

    /**
     * 片側のノズル + アフターバーナーを構築。
     * @param {number} tailX ノズル開口の X
     * @param {number} z     ノズル中心の Z (左右オフセット)
     * @param {number} dir   +1=右, -1=左
     */
    _buildNozzle(tailX, z, dir) {
        const side = dir === 1 ? 'R' : 'L';

        // --- エンジンナセル後端 (ノズル手前の絞り・焼け色) ---
        const nacelleGeo = new THREE.CylinderGeometry(0.46, 0.44, 0.7, 28, 1, true);
        nacelleGeo.rotateZ(-Math.PI / 2);
        const nacelle = this.addMesh(nacelleGeo, Materials.nozzleBurnt, `nacelle${side}`);
        nacelle.position.set(tailX + 0.7, 0, z);

        // --- ノズル外殻 (後方に広がる円錐台・無塗装焼け金属) ---
        const shellGeo = new THREE.CylinderGeometry(0.42, 0.34, 1.0, 28, 1, true);
        shellGeo.rotateZ(-Math.PI / 2);
        const shell = this.addMesh(shellGeo, Materials.nozzle, `nozzleShell${side}`);
        shell.position.set(tailX, 0, z);

        // --- ノズル後縁リング (一番外の口) ---
        const rimGeo = new THREE.TorusGeometry(0.35, 0.03, 8, 28);
        rimGeo.rotateY(Math.PI / 2);
        const rim = this.addMesh(rimGeo, Materials.nozzleBurnt, `nozzleRim${side}`);
        rim.position.set(tailX - 0.5, 0, z);

        // --- 可変ノズルフラップ (ペタル) — 数を増やしてリアルに ---
        const petalCount = 18;
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const petalGeo = new THREE.BoxGeometry(0.5, 0.025, 0.085);
            const petal = this.addMesh(petalGeo, Materials.nozzle, `petal${side}${i}`);
            const r = 0.37;
            petal.position.set(
                tailX - 0.14,
                Math.sin(angle) * r,
                z + Math.cos(angle) * r
            );
            petal.rotation.x = angle;
            // 後方すぼまりを表現するため僅かに内向き
            petal.rotation.z = THREE.MathUtils.degToRad(-6);
        }

        // --- アフターバーナーコア (内側で発光する円錐) ---
        const coreGeo = new THREE.ConeGeometry(0.3, 1.0, 18, 1, true);
        coreGeo.rotateZ(Math.PI / 2);
        const core = this.addMesh(coreGeo, Materials.afterburner.clone(), `afterburnerCore${side}`);
        core.position.set(tailX - 0.05, 0, z);

        // --- タービン放射状ブレード (奥に見えるフレームホルダー) ---
        const bladeCount = 8;
        for (let i = 0; i < bladeCount; i++) {
            const a = (i / bladeCount) * Math.PI * 2;
            const bladeGeo = new THREE.BoxGeometry(0.06, 0.26, 0.02);
            const blade = this.addMesh(bladeGeo, Materials.nozzle, `flameholder${side}${i}`);
            blade.position.set(tailX + 0.18, 0, z);
            blade.rotation.x = a;
            blade.translateY(0.13);
        }

        // --- タービン中心ハブ ---
        const hubGeo = new THREE.ConeGeometry(0.1, 0.34, 14);
        hubGeo.rotateZ(-Math.PI / 2);
        const hub = this.addMesh(hubGeo, Materials.nozzle, `turbineHub${side}`);
        hub.position.set(tailX + 0.2, 0, z);

        // --- 炎プルーム (多層) ---
        const plumeGroup = new THREE.Group();
        plumeGroup.name = `afterburnerPlume${side}`;
        const plumeStartX = tailX - 0.4;
        plumeGroup.position.set(plumeStartX, 0, z);

        const layers = [
            [0.19, 3.0, Materials.flameOuter, 'plumeOuter'],
            [0.13, 2.3, Materials.flameMid,   'plumeMid'],
            [0.075, 1.6, Materials.flameCore, 'plumeCore'],
        ];
        for (const [r, len, mat, name] of layers) {
            const geo = new THREE.ConeGeometry(r, len, 16, 1, true);
            geo.rotateZ(Math.PI / 2);
            geo.translate(-len / 2, 0, 0);
            const flame = new THREE.Mesh(geo, mat.clone());
            flame.name = `engine:${name}${side}`;
            flame.userData.part = this;
            flame.userData.baseLength = len;
            flame.userData.baseRadius = r;
            flame.castShadow = false;
            flame.receiveShadow = false;
            plumeGroup.add(flame);
            this.plumeMeshes.push(flame);
        }

        // --- ショックダイヤモンド ---
        const diskCount = 4;
        for (let i = 0; i < diskCount; i++) {
            const dr = 0.095 - i * 0.015;
            const diskGeo = new THREE.SphereGeometry(Math.max(dr, 0.025), 12, 8);
            diskGeo.scale(0.5, 1, 1);
            const disk = new THREE.Mesh(diskGeo, Materials.machDisk.clone());
            disk.name = `engine:machDisk${side}${i}`;
            disk.userData.part = this;
            disk.castShadow = false;
            disk.userData.baseX = -(0.45 + i * 0.5);
            disk.position.set(disk.userData.baseX, 0, 0);
            plumeGroup.add(disk);
            this.machDisks.push(disk);
        }

        this.group.add(plumeGroup);

        // --- 発光ポイントライト ---
        const abLight = new THREE.PointLight(0xff5a1e, 5.0, 7.0, 2.0);
        abLight.position.set(tailX - 0.6, 0, z);
        abLight.castShadow = false;
        this.group.add(abLight);
        this.abLights.push(abLight);
    }

    // ============================================================
    //  アフターバーナー 制御 API
    // ============================================================

    setAfterburner(on) {
        this.afterburnerOn = !!on;
    }

    setAfterburnerLevel(level) {
        this._abLevel = THREE.MathUtils.clamp(level, 0, 1);
    }

    /**
     * 推力値(0..1)に応じて炎/ライト/コアの見た目を即時設定。
     * 双発分すべてのメッシュをまとめて更新する。
     */
    _applyAfterburnerVisual(v, time = 0) {
        const flicker = 1 + Math.sin(time * 30) * 0.06 + Math.sin(time * 53) * 0.03;

        for (const flame of this.plumeMeshes) {
            const sx = (0.25 + v * 0.75) * flicker;
            flame.scale.set(sx, 1, 1);
            const sr = (0.6 + v * 0.4) * (1 + Math.sin(time * 22 + 1) * 0.05);
            flame.scale.y = sr;
            flame.scale.z = sr;
            flame.visible = v > 0.02;
            if (flame.material.opacity !== undefined) {
                if (flame.material.userData?.baseOpacity === undefined) {
                    flame.material.userData = flame.material.userData || {};
                    flame.material.userData.baseOpacity = flame.material.opacity;
                }
                flame.material.opacity = flame.material.userData.baseOpacity * v;
            }
        }

        for (let i = 0; i < this.machDisks.length; i++) {
            const disk = this.machDisks[i];
            const phase = time * 8 - (i % 4) * 0.8;
            disk.material.opacity = (0.4 + 0.5 * (Math.sin(phase) * 0.5 + 0.5)) * v;
            disk.position.x = disk.userData.baseX * (0.5 + v * 0.9);
            disk.visible = v > 0.05;
        }

        // コア発光 (双発分)
        for (const core of this.meshes.filter((m) => m.name.includes('afterburnerCore'))) {
            if (core.material.emissiveIntensity !== undefined) {
                core.material.emissiveIntensity = (0.5 + v * 1.3) * flicker;
            }
        }

        // ポイントライト (双発分)
        for (const light of this.abLights) {
            light.intensity = (0.3 + v * 6.0) * flicker;
            light.color.setHSL(0.05, 1.0, 0.45 + v * 0.1);
        }
    }

    /**
     * アフターバーナーのアニメーション (script.js のループから呼ぶ)
     * @param {number} time 経過秒
     */
    update(time) {
        const target = this.afterburnerOn ? this._abLevel : 0;
        this._abCurrent += (target - this._abCurrent) * 0.08;
        this._applyAfterburnerVisual(this._abCurrent, time);
    }
}
