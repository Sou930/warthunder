import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Engine — エンジン (Tumansky R13-300) とアフターバーナーノズル。
 *
 * MiG-21 は単発機。胴体後端に排気ノズルが来る。
 * 可変ノズルのフラップ、内側に光るアフターバーナーコアを表現。
 *
 * アフターバーナーは以下を多層で表現し、update() でアニメートする:
 *   - 多層の炎プルーム (白青コア / オレンジ中間 / 赤外殻)
 *   - 周期的に並ぶショックダイヤモンド (マッハディスク)
 *   - 排気口からの発光ポイントライト (シーンを照らす)
 *   - ON/OFF と推力 0..1 を制御できる API
 *
 * 機尾 (-X 側) に配置。
 */
export class Engine extends AircraftPart {
    constructor(options = {}) {
        super('engine', { critical: true, health: 200, ...options });

        // アフターバーナー状態
        this.afterburnerOn = true;     // ON/OFF
        this._abLevel = 1.0;           // 目標推力 0..1
        this._abCurrent = 1.0;         // 現在の補間値
    }

    buildGeometry() {
        const tailX = -6.1; // ノズル開口位置
        this._tailX = tailX;

        // ----------------------------------------------------------
        //  ノズル外殻 (後方に広がる円錐台) — 内外は見えないので openEnded
        // ----------------------------------------------------------
        const shellGeo = new THREE.CylinderGeometry(0.46, 0.40, 0.9, 28, 1, true);
        shellGeo.rotateZ(-Math.PI / 2);
        const shell = this.addMesh(shellGeo, Materials.nozzle, 'nozzleShell');
        shell.position.set(tailX, 0, 0);

        // ノズル後縁の焼け色リング (高温で変色した排気リップ)
        const burntGeo = new THREE.CylinderGeometry(0.4, 0.42, 0.22, 28, 1, true);
        burntGeo.rotateZ(-Math.PI / 2);
        const burnt = this.addMesh(burntGeo, Materials.nozzleBurnt, 'nozzleBurntRing');
        burnt.position.set(tailX - 0.45, 0, 0);

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
        }

        // ----------------------------------------------------------
        //  アフターバーナーコア (内側で発光する円錐) — 排気口直後の高温部
        //  背面/底面は見えないので openEnded
        // ----------------------------------------------------------
        const coreGeo = new THREE.ConeGeometry(0.34, 1.1, 20, 1, true);
        coreGeo.rotateZ(Math.PI / 2); // 頂点を前方へ
        const core = this.addMesh(coreGeo, Materials.afterburner, 'afterburnerCore');
        core.position.set(tailX - 0.05, 0, 0);

        // 中央のフレームホルダー (タービン中心)
        const hubGeo = new THREE.SphereGeometry(0.12, 12, 8);
        const hub = this.addMesh(hubGeo, Materials.nozzle, 'turbineHub');
        hub.position.set(tailX + 0.1, 0, 0);

        // ----------------------------------------------------------
        //  炎プルーム (Afterburner Plume) — ノズル後方へ伸びる多層の炎
        //  3 層の細長い円錐を重ね、後端ほど細く尖らせる。
        //  加算合成マテリアルで発光するように見せる。
        // ----------------------------------------------------------
        this.plumeGroup = new THREE.Group();
        this.plumeGroup.name = 'afterburnerPlume';
        // 炎はノズル開口からさらに後方 (-X) へ伸びる
        const plumeStartX = tailX - 0.35;
        this.plumeGroup.position.set(plumeStartX, 0, 0);

        // 各層: [半径, 長さ, マテリアル, 名前]
        const layers = [
            [0.22, 3.4, Materials.flameOuter, 'plumeOuter'],
            [0.15, 2.6, Materials.flameMid,   'plumeMid'],
            [0.085, 1.8, Materials.flameCore,  'plumeCore'],
        ];
        this.plumeMeshes = [];
        for (const [r, len, mat, name] of layers) {
            // 炎の円錐: 底面(ノズル側)を太く、頂点(後方)を尖らせる。
            const geo = new THREE.ConeGeometry(r, len, 16, 1, true);
            // Cone は +Y 頂点 → 後方(-X)へ頂点が向くよう回転
            geo.rotateZ(Math.PI / 2);        // 頂点 +X
            geo.translate(-len / 2, 0, 0);   // 底面を原点(ノズル側)に
            const flame = new THREE.Mesh(geo, mat.clone());
            flame.name = `engine:${name}`;
            flame.userData.part = this;
            flame.userData.baseLength = len;
            flame.userData.baseRadius = r;
            // 炎は影を落とさない/受けない
            flame.castShadow = false;
            flame.receiveShadow = false;
            this.plumeGroup.add(flame);
            this.plumeMeshes.push(flame);
        }

        // ----------------------------------------------------------
        //  ショックダイヤモンド (マッハディスク) — プルーム内に等間隔で並ぶ明るい点
        // ----------------------------------------------------------
        this.machDisks = [];
        const diskCount = 4;
        for (let i = 0; i < diskCount; i++) {
            const dr = 0.11 - i * 0.018;
            const diskGeo = new THREE.SphereGeometry(Math.max(dr, 0.03), 12, 8);
            diskGeo.scale(0.5, 1, 1); // X方向に潰した円盤状
            const disk = new THREE.Mesh(diskGeo, Materials.machDisk.clone());
            disk.name = `engine:machDisk${i}`;
            disk.userData.part = this;
            disk.castShadow = false;
            // ノズルから後方へ等間隔
            disk.userData.baseX = -(0.5 + i * 0.55);
            disk.position.set(disk.userData.baseX, 0, 0);
            this.plumeGroup.add(disk);
            this.machDisks.push(disk);
        }

        this.group.add(this.plumeGroup);

        // ----------------------------------------------------------
        //  発光ポイントライト — アフターバーナーがシーン (機体後部) を照らす
        // ----------------------------------------------------------
        this.abLight = new THREE.PointLight(0xff5a1e, 6.0, 8.0, 2.0);
        this.abLight.position.set(tailX - 0.6, 0, 0);
        this.abLight.castShadow = false;
        this.group.add(this.abLight);

        // 初期状態を反映
        this._applyAfterburnerVisual(this.afterburnerOn ? 1 : 0);
    }

    // ============================================================
    //  アフターバーナー 制御 API
    // ============================================================

    /** アフターバーナー ON/OFF */
    setAfterburner(on) {
        this.afterburnerOn = !!on;
    }

    /** 推力レベル設定 (0..1) — ON 時の炎の強さ */
    setAfterburnerLevel(level) {
        this._abLevel = THREE.MathUtils.clamp(level, 0, 1);
    }

    /**
     * 推力値(0..1)に応じて炎/ライト/コアの見た目を即時設定する内部関数。
     * @param {number} v 0(消炎) 〜 1(全開)
     * @param {number} [time] 揺らぎ用の時間
     */
    _applyAfterburnerVisual(v, time = 0) {
        // --- 炎プルーム: スケール(長さ)と不透明度を推力で制御 ---
        const flicker = 1 + Math.sin(time * 30) * 0.06 + Math.sin(time * 53) * 0.03;
        for (const flame of this.plumeMeshes) {
            const len = flame.userData.baseLength;
            // 長さ方向(X)を推力でスケール、揺らぎを加える
            const sx = (0.25 + v * 0.75) * flicker;
            flame.scale.set(sx, 1, 1);
            // 径方向も少し脈動
            const sr = (0.6 + v * 0.4) * (1 + Math.sin(time * 22 + 1) * 0.05);
            flame.scale.y = sr;
            flame.scale.z = sr;
            flame.visible = v > 0.02;
            if (flame.material.opacity !== undefined) {
                const baseOp = flame.material.userData?.baseOpacity;
                // 初回に基準不透明度を記録
                if (baseOp === undefined) {
                    flame.material.userData = flame.material.userData || {};
                    flame.material.userData.baseOpacity = flame.material.opacity;
                }
                const ref = flame.material.userData.baseOpacity;
                flame.material.opacity = ref * v;
            }
        }

        // --- マッハディスク: 推力に応じて明滅・移動 ---
        for (let i = 0; i < this.machDisks.length; i++) {
            const disk = this.machDisks[i];
            const phase = time * 8 - i * 0.8;
            disk.material.opacity = (0.4 + 0.5 * (Math.sin(phase) * 0.5 + 0.5)) * v;
            // ディスク位置も推力で後方へ広がる
            disk.position.x = disk.userData.baseX * (0.5 + v * 0.9);
            disk.visible = v > 0.05;
        }

        // --- コア発光 ---
        const core = this.meshes.find((m) => m.name.endsWith('afterburnerCore'));
        if (core && core.material.emissiveIntensity !== undefined) {
            core.material.emissiveIntensity = (0.5 + v * 1.3) * flicker;
        }

        // --- ポイントライト ---
        if (this.abLight) {
            this.abLight.intensity = (0.3 + v * 7.0) * flicker;
            // 推力でわずかに色温度を上げる (高推力ほど明るいオレンジ)
            this.abLight.color.setHSL(0.05, 1.0, 0.45 + v * 0.1);
        }
    }

    /**
     * アフターバーナーのアニメーション (script.js のループから呼ぶ)
     * @param {number} time 経過秒
     */
    update(time) {
        // 目標値: ON なら推力レベル、OFF なら 0
        const target = this.afterburnerOn ? this._abLevel : 0;
        // なめらかに点火/消炎
        this._abCurrent += (target - this._abCurrent) * 0.08;
        this._applyAfterburnerVisual(this._abCurrent, time);
    }
}
