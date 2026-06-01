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

const MODEL_BASE = './models/mig21/';

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
    async loadAircraft() {
        // aircraft.json (スペック) を取得
        let config = {};
        try {
            const res = await fetch(MODEL_BASE + 'aircraft.json');
            if (res.ok) config = await res.json();
        } catch (e) {
            console.warn('[Viewer] aircraft.json 読み込み失敗:', e.message);
        }

        // モデル組み立て
        this.model = new Mig21Model(config);
        await this.model.loadData(MODEL_BASE);
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
function bindUI(viewer, config) {
    // スペック表示
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    set('spec-name', config.name ?? 'Unknown Aircraft');
    set('spec-engine', config.engine ?? '—');
    set('spec-length', config.length != null ? `${config.length} m` : '—');
    set('spec-wingspan', config.wingspan != null ? `${config.wingspan} m` : '—');
    set('spec-mass', config.mass != null ? `${config.mass.toLocaleString()} kg` : '—');

    // トグル
    const gear = document.getElementById('toggle-gear');
    const hitbox = document.getElementById('toggle-hitbox');
    const wire = document.getElementById('toggle-wireframe');
    const rotate = document.getElementById('toggle-rotate');

    gear?.addEventListener('change', (e) => viewer.model.setGearVisible(e.target.checked));
    hitbox?.addEventListener('change', (e) => viewer.model.setHitboxVisible(e.target.checked));
    wire?.addEventListener('change', (e) => viewer.model.setWireframe(e.target.checked));
    rotate?.addEventListener('change', (e) => { viewer.autoRotate = e.target.checked; });

    // パネルを表示
    document.getElementById('hud')?.classList.remove('hidden');
    document.getElementById('control-panel')?.classList.remove('hidden');
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
        const config = await viewer.loadAircraft();
        bindUI(viewer, config);
        viewer.start();
        hideLoading();
    } catch (err) {
        console.error(err);
        showError(err.message || String(err));
    }
}

main();
