import * as THREE from 'three';

import { Fuselage } from './parts/fuselage.js';
import { Cockpit } from './parts/cockpit.js';
import { Engine } from './parts/engine.js';
import { LeftWing } from './parts/leftWing.js';
import { RightWing } from './parts/rightWing.js';
import { Tail } from './parts/tail.js';
import { LandingGear } from './parts/landingGear.js';
import { Weapons } from './parts/weapons.js';
import { makeHitboxMaterial, setCamoScheme } from './parts/materials.js';

/**
 * F4PhantomModel — 全パーツを組み立てて 1 機の F-4E Phantom II を構成する。
 *
 * MiG-21 と同じ設計方針 (パーツ独立クラス + データ駆動 + 共通 IF) に従う。
 * 各パーツは AircraftPart を継承し、ここで 1 つの THREE.Group (this.root)
 * にまとめる。将来の各システム (Damage/Flight/Weapon/...) が参照しやすいよう
 * パーツを名前付き辞書 (this.parts) でも保持する。
 *
 * MiG-21 との主な違い:
 *   - 単発 → 双発エンジン (Engine が左右 2 ノズルを内包)
 *   - 単座 → タンデム複座 (Cockpit が 2 席分を内包)
 *   - 可動ショックコーンなし (固定レドーム) → setShockCone は no-op
 *
 * 使い方:
 *   const f4 = new F4PhantomModel(config);
 *   await f4.loadData(basePath);
 *   scene.add(f4.root);
 */
export class F4PhantomModel {
    /**
     * @param {object} [config]  aircraft.json の内容 (任意)
     */
    constructor(config = {}) {
        this.config = config;

        /** @type {THREE.Group} 機体ルート */
        this.root = new THREE.Group();
        this.root.name = 'F-4E Phantom II';

        /** @type {Object.<string, import('./parts/AircraftPart.js').AircraftPart>} */
        this.parts = {};

        /** ヒットボックス可視化用グループ */
        this.hitboxGroup = new THREE.Group();
        this.hitboxGroup.name = 'hitboxes';
        this.hitboxGroup.visible = false;
        this.root.add(this.hitboxGroup);

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
     * JSON データ群を読み込み (hitboxes / fuel / armor)。
     * fetch 失敗時も致命的にしない。
     * @param {string} basePath  例: "./models/f4phantom/"
     */
    async loadData(basePath) {
        const tryFetch = async (rel) => {
            try {
                const res = await fetch(basePath + rel);
                if (!res.ok) throw new Error(res.statusText);
                return await res.json();
            } catch (e) {
                console.warn(`[F4PhantomModel] ${rel} 読み込み失敗:`, e.message);
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
            // 関連パーツへ逆参照 (複座/双発はパーツ名が分割されているため
            // 直接対応しないキーは null となるが可視化には支障なし)
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

    /**
     * SEA迷彩塗装の ON/OFF を切り替える。
     *   true  → USAF SEA 3色迷彩 (ベトナム迷彩)
     *   false → 迷彩オフ (無塗装メタル基調の単色)
     * 共有マテリアルの色を差し替えるだけで全パーツに反映される。
     */
    setCamo(enabled) {
        setCamoScheme(enabled ? 'sea' : 'bare');
    }

    setHitboxVisible(visible) {
        this.hitboxGroup.visible = visible;
    }

    setWireframe(enabled) {
        Object.values(this.parts).forEach((p) => p.setWireframe(enabled));
    }

    /** アフターバーナー ON/OFF (双発 engine へ委譲) */
    setAfterburner(on) {
        this.parts.engine?.setAfterburner(on);
    }

    /** アフターバーナー推力レベル (0..1) */
    setAfterburnerLevel(level) {
        this.parts.engine?.setAfterburnerLevel(level);
    }

    /**
     * F-4 は固定レドームのため可動ショックコーンを持たない。
     * MiG-21 とインターフェイスを揃えるための no-op スタブ。
     */
    setShockCone(_amount) {
        // no-op (F-4 にショックコーンは存在しない)
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
