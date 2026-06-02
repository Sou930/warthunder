import * as THREE from 'three';

import { Fuselage } from './parts/fuselage.js';
import { Cockpit } from './parts/cockpit.js';
import { Engine } from './parts/engine.js';
import { LeftWing } from './parts/leftWing.js';
import { RightWing } from './parts/rightWing.js';
import { Tail } from './parts/tail.js';
import { LandingGear } from './parts/landingGear.js';
import { Weapons } from './parts/weapons.js';
import { makeHitboxMaterial } from './parts/materials.js';

/**
 * Mig21Model — 全パーツを組み立てて 1 機の MiG-21 を構成する。
 *
 * 各パーツは独立したクラス/モジュールであり、ここで集約して
 * 1 つの THREE.Group (this.root) にぶら下げる。
 *
 * 将来の拡張で各システムが参照しやすいよう、
 * パーツを名前付きの辞書 (this.parts) でも保持する。
 *
 * 使い方:
 *   const mig = new Mig21Model();
 *   await mig.loadData(basePath);     // JSON 群を読み込み (任意)
 *   scene.add(mig.root);
 */
export class Mig21Model {
    /**
     * @param {object} [config]  aircraft.json の内容 (任意)
     */
    constructor(config = {}) {
        this.config = config;

        /** @type {THREE.Group} 機体ルート */
        this.root = new THREE.Group();
        this.root.name = 'MiG-21';

        /** @type {Object.<string, import('./parts/AircraftPart.js').AircraftPart>} */
        this.parts = {};

        /** ヒットボックス可視化用グループ */
        this.hitboxGroup = new THREE.Group();
        this.hitboxGroup.name = 'hitboxes';
        this.hitboxGroup.visible = false;
        this.root.add(this.hitboxGroup);

        // データ (script 側から loadData で注入)
        this.hitboxData = null;
        this.fuelData = null;
        this.armorData = null;

        this._assemble();
    }

    /** 全パーツを生成して root に追加 */
    _assemble() {
        const partInstances = [
            new Fuselage(),
            new Cockpit(),
            new Engine(),
            new LeftWing(),
            new RightWing(),
            new Tail(),
            new LandingGear(),
            new Weapons(),
        ];

        for (const part of partInstances) {
            this.parts[part.name] = part;
            this.root.add(part.group);
        }
    }

    /**
     * JSON データ群を読み込み (aircraft / hitboxes / fuel / armor)。
     * fetch 失敗時も致命的にしない (ビューワー自体は動く)。
     * @param {string} basePath  例: "./models/mig21/"
     */
    async loadData(basePath) {
        const tryFetch = async (rel) => {
            try {
                const res = await fetch(basePath + rel);
                if (!res.ok) throw new Error(res.statusText);
                return await res.json();
            } catch (e) {
                console.warn(`[Mig21Model] ${rel} 読み込み失敗:`, e.message);
                return null;
            }
        };

        const [hitboxes, fuel, armor] = await Promise.all([
            tryFetch('data/hitboxes.json'),
            tryFetch('data/fuel.json'),
            tryFetch('data/armor.json'),
        ]);

        this.hitboxData = hitboxes;
        this.fuelData = fuel;
        this.armorData = armor;

        if (hitboxes) this._buildHitboxes(hitboxes);
    }

    /**
     * hitboxes.json からヒットボックス可視化メッシュを生成。
     * 将来 DamageSystem がここのボックスとレイキャストして
     * 被弾部位を判定する想定。
     */
    _buildHitboxes(data) {
        const mat = makeHitboxMaterial();
        const boxes = data.boxes || [];
        for (const box of boxes) {
            const [sx, sy, sz] = box.size;
            const geo = new THREE.BoxGeometry(sx, sy, sz);
            const mesh = new THREE.Mesh(geo, mat);
            const [px, py, pz] = box.position;
            mesh.position.set(px, py, pz);
            mesh.name = `hitbox:${box.part}`;
            // 関連パーツへ逆参照
            mesh.userData.part = this.parts[box.part] || null;
            this.hitboxGroup.add(mesh);
        }
    }

    // ============================================================
    //  表示制御 API (script.js の UI から呼ぶ)
    // ============================================================

    setGearVisible(visible) {
        this.parts.landingGear?.setVisible(visible);
    }

    /** 兵装 (ミサイル/増槽) の表示切替 */
    setWeaponsVisible(visible) {
        this.parts.weapons?.setVisible(visible);
    }

    setHitboxVisible(visible) {
        this.hitboxGroup.visible = visible;
    }

    setWireframe(enabled) {
        Object.values(this.parts).forEach((p) => p.setWireframe(enabled));
    }

    /** アフターバーナー ON/OFF (engine へ委譲) */
    setAfterburner(on) {
        this.parts.engine?.setAfterburner(on);
    }

    /** アフターバーナー推力レベル (0..1) */
    setAfterburnerLevel(level) {
        this.parts.engine?.setAfterburnerLevel(level);
    }

    /**
     * 可動ショックコーンの突出量 (0..1)。
     * null を渡すとデモ自動往復に戻す。
     */
    setShockCone(amount) {
        const fus = this.parts.fuselage;
        if (!fus) return;
        if (amount == null) {
            fus.setShockConeAuto(true);
            fus.setShockConeExtend(0);
        } else {
            fus.setShockConeAuto(false);
            fus.setShockConeExtend(amount);
        }
    }

    /**
     * アニメーション更新 (毎フレーム呼ぶ)。
     * パーツが update() を持っていれば伝播する。
     * @param {number} time 経過秒
     */
    update(time) {
        for (const part of Object.values(this.parts)) {
            if (typeof part.update === 'function') {
                part.update(time);
            }
        }
    }

    /** メモリ解放 */
    dispose() {
        Object.values(this.parts).forEach((p) => p.dispose());
        this.hitboxGroup.children.forEach((m) => m.geometry?.dispose());
    }
}
