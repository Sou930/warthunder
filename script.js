/**
 * ============================================================
 *  script.js — War Thunder Style Aircraft Viewer (entry point)
 * ============================================================
 *
 *  役割:
 *    - Scene / Camera / Renderer / Light のセットアップ
 *    - OrbitControls によるマウス操作 (回転・ズーム・パン)
 *    - MiG-21 モデルの読み込みと表示
 *    - アニメーションループ
 *    - UI トグルの配線
 *
 *  将来の拡張 (DamageSystem / FlightModel / WeaponSystem /
 *  RadarSystem / MissileSystem / Multiplayer) は、
 *  ここで生成する Viewer クラスにシステムを差し込む形で追加する。
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Mig21Model } from './models/mig21/model.js';
import { F4PhantomModel } from './models/f4phantom/model.js';

/**
 * 機体カタログ — id → { base, ModelClass, hasShockCone, label }
 * 新機体を追加する場合はここに 1 エントリ足すだけでよい。
 */
const AIRCRAFT = {
    mig21: {
        label: 'MiG-21MF',
        base: './models/mig21/',
        ModelClass: Mig21Model,
        hasShockCone: true,
    },
    f4phantom: {
        label: 'F-4E Phantom II',
        base: './models/f4phantom/',
        ModelClass: F4PhantomModel,
        hasShockCone: false,
    },
};

const DEFAULT_AIRCRAFT = 'mig21';

/**
 * Viewer — ビューワー全体を統括するクラス。
 */
class Viewer {
    constructor(container) {
        this.container = container;
        this.clock = new THREE.Clock();
        this.autoRotate = true;

        this._initRenderer();
        this._initScene();
        this._initCamera();
        this._initLights();
        this._initControls();
        this._initEnvironment();

        window.addEventListener('resize', () => this._onResize());
    }

    // ---------------- Renderer ----------------
    _initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);
    }

    // ---------------- Scene ----------------
    _initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0b1018);
        this.scene.fog = new THREE.Fog(0x0b1018, 30, 90);
    }

    // ---------------- Camera ----------------
    _initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        // 機体を斜め前上から見るデフォルト視点
        this.camera.position.set(14, 7, 14);
        this.camera.lookAt(0, 0, 0);
    }

    // ---------------- Lights ----------------
    _initLights() {
        // 環境光 (全体の底上げ)
        const ambient = new THREE.AmbientLight(0xffffff, 0.45);
        this.scene.add(ambient);

        // 主光源 (太陽) — 影を落とす
        const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
        sun.position.set(12, 18, 8);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 60;
        sun.shadow.camera.left = -20;
        sun.shadow.camera.right = 20;
        sun.shadow.camera.top = 20;
        sun.shadow.camera.bottom = -20;
        sun.shadow.bias = -0.0004;
        this.scene.add(sun);

        // フィルライト (反対側からの弱い光で陰影を補正)
        const fill = new THREE.DirectionalLight(0x88aaff, 0.6);
        fill.position.set(-10, 6, -8);
        this.scene.add(fill);

        // 半球光 (空と地面の色を反映)
        const hemi = new THREE.HemisphereLight(0x668bbf, 0x33302a, 0.5);
        this.scene.add(hemi);

        // --- 明るさ調整用に各ライトと「基準強度」を保持 ---
        // setBrightness(factor) で base * factor を各ライトに反映する。
        this.lights = [
            { light: ambient, base: ambient.intensity },
            { light: sun, base: sun.intensity },
            { light: fill, base: fill.intensity },
            { light: hemi, base: hemi.intensity },
        ];
        this.brightness = 1.0;
    }

    /**
     * シーン全体の光の明るさを一括調整する。
     * @param {number} factor 倍率 (0=暗, 1=標準, 2=明)
     */
    setBrightness(factor) {
        this.brightness = factor;
        for (const { light, base } of this.lights) {
            light.intensity = base * factor;
        }
        // トーンマッピング露出も軽く連動させ、明暗の体感を強める
        this.renderer.toneMappingExposure = 1.05 * (0.6 + 0.4 * factor);
    }

    // ---------------- Controls ----------------
    _initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;     // 慣性
        this.controls.dampingFactor = 0.08;
        this.controls.minDistance = 6;
        this.controls.maxDistance = 60;
        this.controls.maxPolarAngle = Math.PI * 0.92; // 地面下に潜りすぎない
        this.controls.target.set(0, 0.5, 0);
        // 左:回転 / 右:パン / ホイール:ズーム (デフォルト)
        this.controls.update();
    }

    // ---------------- Environment (地面/グリッド) ----------------
    _initEnvironment() {
        // 地面 (影の受け手)
        const groundGeo = new THREE.CircleGeometry(60, 64);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x1a2129,
            roughness: 0.95,
            metalness: 0.0,
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2.0;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // グリッド (滑走路の目盛り風)
        const grid = new THREE.GridHelper(80, 40, 0x3a4654, 0x222b34);
        grid.position.y = -1.99;
        grid.material.opacity = 0.5;
        grid.material.transparent = true;
        this.scene.add(grid);
    }

    // ---------------- Model loading ----------------
    /**
     * 指定した機体を読み込んでシーンに表示する。
     * 既存モデルがあれば破棄して入れ替える (機体切替に対応)。
     * @param {string} aircraftId  AIRCRAFT のキー
     * @returns {Promise<object>}   aircraft.json の内容
     */
    async loadAircraft(aircraftId = DEFAULT_AIRCRAFT) {
        const entry = AIRCRAFT[aircraftId] || AIRCRAFT[DEFAULT_AIRCRAFT];
        this.currentAircraftId = aircraftId;
        this.currentEntry = entry;

        // 既存モデルがあれば取り除いて破棄
        if (this.model) {
            this.scene.remove(this.model.root);
            this.model.dispose?.();
            this.model = null;
        }

        // aircraft.json (スペック) を取得
        let config = {};
        try {
            const res = await fetch(entry.base + 'aircraft.json');
            if (res.ok) config = await res.json();
        } catch (e) {
            console.warn('[Viewer] aircraft.json 読み込み失敗:', e.message);
        }

        // モデル組み立て
        this.model = new entry.ModelClass(config);
        await this.model.loadData(entry.base);
        this.scene.add(this.model.root);

        // 接地: ホイール下端がだいたい地面 (y=-2) に来るよう微調整済みのため
        // ルートはそのまま。視点ターゲットを機体中心に。
        this.controls.target.set(0, 0.3, 0);
        this.controls.update();

        return config;
    }

    // ---------------- Resize ----------------
    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // ---------------- Animation loop ----------------
    start() {
        const loop = () => {
            requestAnimationFrame(loop);
            const t = this.clock.getElapsedTime();

            // 自動回転 (機体をゆっくり回す)
            if (this.autoRotate && this.model) {
                this.model.root.rotation.y = t * 0.25;
            }

            // パーツ側のアニメーション (アフターバーナー等)
            this.model?.update(t);

            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        loop();
    }
}

// ============================================================
//  UI 配線
// ============================================================
function updateSpecPanel(config) {
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    set('spec-name', config.name ?? 'Unknown Aircraft');
    set('spec-engine', config.engine ?? '—');
    set('spec-length', config.length != null ? `${config.length} m` : '—');
    set('spec-wingspan', config.wingspan != null ? `${config.wingspan} m` : '—');
    set('spec-mass', config.mass != null ? `${config.mass.toLocaleString()} kg` : '—');
}

/**
 * ショックコーン UI 行の有効/無効を機体に応じて切り替える。
 * F-4 のようにショックコーンを持たない機体では行を無効化する。
 */
function updateShockConeUI(viewer) {
    const hasShockCone = !!viewer.currentEntry?.hasShockCone;
    const coneRow = document.getElementById('cone-control-group');
    const coneAuto = document.getElementById('toggle-cone-auto');
    const coneSlider = document.getElementById('slider-cone');
    if (coneRow) {
        coneRow.classList.toggle('disabled-group', !hasShockCone);
        coneRow.title = hasShockCone ? '' : 'この機体は可動ショックコーンを持ちません';
    }
    if (coneAuto) coneAuto.disabled = !hasShockCone;
    if (coneSlider) {
        // ショックコーンなし機体ではスライダーも無効
        coneSlider.disabled = !hasShockCone || (coneAuto && coneAuto.checked);
    }
}

/**
 * 兵装トグル UI を機体に応じて有効/無効化する。
 * setWeaponsVisible を実装する機体 (F-4) でのみ有効。
 */
function updateWeaponsUI(viewer) {
    const supported = typeof viewer.model?.setWeaponsVisible === 'function';
    const row = document.getElementById('toggle-weapons')?.closest('.toggle');
    const cb = document.getElementById('toggle-weapons');
    if (cb) cb.disabled = !supported;
    if (row) {
        row.classList.toggle('disabled-group', !supported);
        row.title = supported ? '' : 'この機体は兵装データを持ちません';
    }
}

/**
 * SEA迷彩塗装トグル UI を機体に応じて有効/無効化する。
 * setCamo を実装する機体 (F-4) でのみ有効。
 */
function updateCamoUI(viewer) {
    const supported = typeof viewer.model?.setCamo === 'function';
    const row = document.getElementById('toggle-camo')?.closest('.toggle');
    const cb = document.getElementById('toggle-camo');
    if (cb) cb.disabled = !supported;
    if (row) {
        row.classList.toggle('disabled-group', !supported);
        row.title = supported ? '' : 'この機体は迷彩塗装の切替に対応していません';
    }
}

function bindUI(viewer, config) {
    // スペック表示
    updateSpecPanel(config);

    // --- 機体選択ドロップダウン ---
    const selector = document.getElementById('aircraft-select');
    if (selector) {
        selector.value = viewer.currentAircraftId;
        selector.addEventListener('change', async (e) => {
            const id = e.target.value;
            selector.disabled = true;
            try {
                const newConfig = await viewer.loadAircraft(id);
                updateSpecPanel(newConfig);
                updateShockConeUI(viewer);
                updateWeaponsUI(viewer);
                updateCamoUI(viewer);
                syncControlsToModel(viewer);
                updateFooter(viewer);
            } catch (err) {
                console.error('[Viewer] 機体切替に失敗:', err);
            } finally {
                selector.disabled = false;
            }
        });
    }

    // トグル
    const gear = document.getElementById('toggle-gear');
    const hitbox = document.getElementById('toggle-hitbox');
    const wire = document.getElementById('toggle-wireframe');
    const rotate = document.getElementById('toggle-rotate');

    const weapons = document.getElementById('toggle-weapons');

    const camo = document.getElementById('toggle-camo');
    const brightness = document.getElementById('slider-brightness');

    gear?.addEventListener('change', (e) => viewer.model.setGearVisible(e.target.checked));
    hitbox?.addEventListener('change', (e) => viewer.model.setHitboxVisible(e.target.checked));
    wire?.addEventListener('change', (e) => viewer.model.setWireframe(e.target.checked));
    rotate?.addEventListener('change', (e) => { viewer.autoRotate = e.target.checked; });
    weapons?.addEventListener('change', (e) => viewer.model.setWeaponsVisible?.(e.target.checked));
    camo?.addEventListener('change', (e) => viewer.model.setCamo?.(e.target.checked));

    // --- ライティング (明るさ) 制御 ---
    brightness?.addEventListener('input', (e) => {
        viewer.setBrightness(Number(e.target.value) / 100);
    });

    // --- アフターバーナー制御 ---
    const ab = document.getElementById('toggle-afterburner');
    const thrust = document.getElementById('slider-thrust');
    ab?.addEventListener('change', (e) => {
        viewer.model.setAfterburner(e.target.checked);
        if (thrust) thrust.disabled = !e.target.checked;
    });
    thrust?.addEventListener('input', (e) => {
        viewer.model.setAfterburnerLevel(Number(e.target.value) / 100);
    });

    // --- 可動ショックコーン制御 (ショックコーンを持つ機体のみ有効) ---
    const coneAuto = document.getElementById('toggle-cone-auto');
    const coneSlider = document.getElementById('slider-cone');
    coneAuto?.addEventListener('change', (e) => {
        if (!viewer.currentEntry?.hasShockCone) return;
        if (e.target.checked) {
            // 自動往復モード
            viewer.model.setShockCone(null);
            if (coneSlider) coneSlider.disabled = true;
        } else {
            // 手動モード: 現在のスライダー値を反映
            if (coneSlider) coneSlider.disabled = false;
            viewer.model.setShockCone(coneSlider ? Number(coneSlider.value) / 100 : 0);
        }
    });
    coneSlider?.addEventListener('input', (e) => {
        if (!viewer.currentEntry?.hasShockCone) return;
        viewer.model.setShockCone(Number(e.target.value) / 100);
    });

    // 初期状態を機体に合わせて整える
    updateShockConeUI(viewer);
    updateWeaponsUI(viewer);
    updateCamoUI(viewer);
    // 明るさスライダーの初期値を反映
    if (brightness) viewer.setBrightness(Number(brightness.value) / 100);
    updateFooter(viewer);

    // パネルを表示
    document.getElementById('hud')?.classList.remove('hidden');
    document.getElementById('control-panel')?.classList.remove('hidden');
}

/**
 * 機体切替後、現在の UI コントロール状態を新しいモデルへ反映させる。
 * (チェックボックス/スライダーの値はそのまま引き継ぐ)
 */
function syncControlsToModel(viewer) {
    const model = viewer.model;
    if (!model) return;
    const checked = (id) => !!document.getElementById(id)?.checked;
    const val = (id) => Number(document.getElementById(id)?.value ?? 0);

    model.setGearVisible(checked('toggle-gear'));
    model.setHitboxVisible(checked('toggle-hitbox'));
    model.setWireframe(checked('toggle-wireframe'));
    model.setWeaponsVisible?.(checked('toggle-weapons'));
    model.setCamo?.(checked('toggle-camo'));
    viewer.autoRotate = checked('toggle-rotate');
    model.setAfterburner(checked('toggle-afterburner'));
    model.setAfterburnerLevel(val('slider-thrust') / 100);

    if (viewer.currentEntry?.hasShockCone) {
        if (checked('toggle-cone-auto')) {
            model.setShockCone(null);
        } else {
            model.setShockCone(val('slider-cone') / 100);
        }
    }
}

/** フッターのクレジット表記を現在の機体名で更新 */
function updateFooter(viewer) {
    const footer = document.getElementById('footer-credit');
    if (footer && viewer.currentEntry) {
        footer.textContent = `Three.js Procedural Aircraft Viewer · ${viewer.currentEntry.label}`;
    }
}

function hideLoading() {
    const el = document.getElementById('loading');
    if (!el) return;
    el.classList.add('fade-out');
    setTimeout(() => el.classList.add('hidden'), 500);
}

function showError(message) {
    const el = document.getElementById('loading');
    if (!el) return;
    el.innerHTML = `<div class="error-box"><b>読み込みエラー</b><br>${message}<br><br>
        ※ file:// で直接開くと ES Modules / fetch が動きません。<br>
        ローカルサーバー (例: <code>python3 -m http.server</code>) 経由で開いてください。</div>`;
}

// ============================================================
//  起動
// ============================================================
async function main() {
    try {
        const container = document.getElementById('viewer');
        const viewer = new Viewer(container);
        // URL パラメータ ?aircraft=f4phantom などで初期機体を選択可能に
        const params = new URLSearchParams(window.location.search);
        const initialId = params.get('aircraft');
        const startId = (initialId && AIRCRAFT[initialId]) ? initialId : DEFAULT_AIRCRAFT;
        const config = await viewer.loadAircraft(startId);
        bindUI(viewer, config);
        viewer.start();
        hideLoading();
    } catch (err) {
        console.error(err);
        showError(err.message || String(err));
    }
}

main();
