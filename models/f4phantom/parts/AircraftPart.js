import * as THREE from 'three';

/**
 * AircraftPart — すべての機体パーツの基底クラス。
 *
 * 各パーツ (fuselage, cockpit, engine, wings, tail, gear...) は
 * このクラスを継承し、`buildGeometry()` を実装する。
 *
 * 共通インターフェイスを統一することで、将来的に
 *   - DamageSystem  : part.applyDamage(), part.health
 *   - WeaponSystem  : ハードポイント参照
 *   - FlightModel   : 各パーツの空力寄与
 * を横断的に扱えるようにする。
 *
 * すべてのパーツは内部に THREE.Group (`this.group`) を持ち、
 * model.js がこの group をシーングラフへ追加する。
 */
export class AircraftPart {
    /**
     * @param {string} name        パーツ識別名 (例: "fuselage")
     * @param {object} [options]   パーツ固有オプション
     */
    constructor(name, options = {}) {
        this.name = name;
        this.options = options;

        /** @type {THREE.Group} このパーツのルートノード */
        this.group = new THREE.Group();
        this.group.name = `part:${name}`;

        /** メッシュの配列 (ヒットボックス・ダメージ計算用に保持) */
        this.meshes = [];

        // --- 将来拡張用フィールド (DamageSystem 等) -----------------
        this.maxHealth = options.health ?? 100;
        this.health = this.maxHealth;
        this.destroyed = false;
        this.critical = options.critical ?? false; // 致命部位フラグ
        // ----------------------------------------------------------

        // サブクラスでジオメトリを構築
        this.buildGeometry();
    }

    /**
     * ジオメトリ構築。サブクラスで必ずオーバーライドする。
     * @abstract
     */
    buildGeometry() {
        throw new Error(`${this.name}: buildGeometry() must be implemented`);
    }

    /**
     * メッシュを生成しつつ this.meshes / this.group に登録するヘルパー。
     * @param {THREE.BufferGeometry} geometry
     * @param {THREE.Material} material
     * @param {string} [subName]
     * @returns {THREE.Mesh}
     */
    addMesh(geometry, material, subName = '') {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = subName ? `${this.name}:${subName}` : this.name;
        // パーツ参照を userData に持たせる → レイキャストでヒット元を逆引き可能
        mesh.userData.part = this;
        this.meshes.push(mesh);
        this.group.add(mesh);
        return mesh;
    }

    /** ワイヤーフレーム表示の切替 (全メッシュ一括) */
    setWireframe(enabled) {
        this.meshes.forEach((m) => {
            if (Array.isArray(m.material)) {
                m.material.forEach((mat) => (mat.wireframe = enabled));
            } else {
                m.material.wireframe = enabled;
            }
        });
    }

    /** パーツ全体の表示/非表示 */
    setVisible(visible) {
        this.group.visible = visible;
    }

    // ============================================================
    //  以下、将来の各システム向けスタブ (現時点では最小実装)
    // ============================================================

    /**
     * ダメージ適用 (DamageSystem 用スタブ)
     * @param {number} amount
     * @returns {boolean} このダメージで破壊されたか
     */
    applyDamage(amount) {
        if (this.destroyed) return false;
        this.health = Math.max(0, this.health - amount);
        if (this.health === 0) {
            this.destroyed = true;
            return true;
        }
        return false;
    }

    /** リソース破棄 (シーン入替時のメモリ解放) */
    dispose() {
        this.meshes.forEach((m) => {
            m.geometry?.dispose();
            if (Array.isArray(m.material)) {
                m.material.forEach((mat) => mat.dispose());
            } else {
                m.material?.dispose();
            }
        });
        this.meshes = [];
    }
}
