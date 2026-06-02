import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Fuselage — F-4E Phantom II の胴体。
 *
 * 実機の F-4 らしいシルエットを高精度で再現する:
 *   - 機首先端のソリッドなレーダーレドーム (やや下を向く「ドループノーズ」)
 *   - 機首下面の IRST/赤外線シーカー風フェアリング
 *   - エリアルール由来の「コークボトル」気味な胴体くびれ
 *   - 太く扁平な葉巻型胴体 (双発エンジンを収める幅広の後部胴体)
 *   - 胴体側面の大型エアインテーク (左右、可変ランプ + スプリッタープレート)
 *   - 背部スパイン + 各所のパネルライン/アクセスパネル風ディテール
 *
 * 座標系: +X = 前方(機首), +Y = 上, +Z = 右
 */
export class Fuselage extends AircraftPart {
    constructor(options = {}) {
        super('fuselage', { critical: true, health: 320, ...options });
    }

    buildGeometry() {
        // ----------------------------------------------------------
        //  胴体本体: LatheGeometry で回転体ベースの太い葉巻型を生成。
        //  実機の F-4 はエリアルールで主翼付近がわずかにくびれる。
        //  断面を後で楕円 (扁平) にスケールして「太く平たい」印象に。
        //  分割数を 48 に上げて滑らかに。
        // ----------------------------------------------------------
        const profile = [
            // [x(前後位置), r(半径)]   ※ 後端 -7 〜 前端 +8
            [-7.05, 0.04],
            [-6.9, 0.40],
            [-6.4, 0.62],
            [-5.6, 0.86],
            [-4.6, 1.02],
            [-3.2, 1.13],
            [-2.0, 1.18],   // 後部胴体 (エンジン部) 最大径付近
            [-1.0, 1.15],
            [-0.2, 1.10],   // 主翼付け根 — エリアルールで僅かに絞る
            [ 0.6, 1.12],
            [ 1.6, 1.06],
            [ 2.6, 0.96],
            [ 3.6, 0.83],
            [ 4.5, 0.70],
            [ 5.3, 0.57],   // 機首が細くなる
            [ 6.1, 0.44],
            [ 6.8, 0.33],   // レドーム付け根
            [ 7.1, 0.28],
        ];

        const points = profile.map(([x, r]) => new THREE.Vector2(r, x));
        const bodyGeo = new THREE.LatheGeometry(points, 48);
        bodyGeo.rotateZ(-Math.PI / 2);  // Y軸回転体 → X軸(前後)方向へ
        // 扁平化: 上下(Y)をやや潰し、左右(Z)を広げて F-4 の太い断面に
        bodyGeo.scale(1.0, 0.90, 1.14);
        bodyGeo.computeVertexNormals();
        this.addMesh(bodyGeo, Materials.body, 'body');

        // ----------------------------------------------------------
        //  下面パネル (ライトグレー塗り分け) — 胴体下半分を薄い殻で覆う。
        //  迷彩の上面/下面の塗り分けを表現。
        // ----------------------------------------------------------
        const bellyProfile = profile.map(([x, r]) => [x, r * 0.99]);
        const bellyPoints = bellyProfile.map(([x, r]) => new THREE.Vector2(r, x));
        // 下半分だけのラスを作るため φ を π..2π 制限
        const bellyGeo = new THREE.LatheGeometry(bellyPoints, 32, Math.PI * 0.92, Math.PI * 1.16);
        bellyGeo.rotateZ(-Math.PI / 2);
        bellyGeo.scale(1.0, 0.90, 1.14);
        bellyGeo.computeVertexNormals();
        const belly = this.addMesh(bellyGeo, Materials.underside, 'belly');
        belly.renderOrder = 1;

        // ----------------------------------------------------------
        //  迷彩上面パネル分け (ミディアムグリーン/タンの帯) — 胴体上部に
        //  薄いシェルを重ねて 2 色目・3 色目の迷彩帯を表現。
        // ----------------------------------------------------------
        this._buildCamoPatch(-3.5, 2.4, 1.16, Materials.camoGreen, 'camoMidGreen', Math.PI * 0.20);
        this._buildCamoPatch(1.0, 2.2, 1.02, Materials.camoTan, 'camoTan', -Math.PI * 0.18);

        // ----------------------------------------------------------
        //  機首レーダーレドーム (ソリッドな尖った円錐) — F-4 の象徴
        //  固定の長い円錐。わずかに下向き (ドループノーズ)。
        //  先端を丸めてより実機に近い形状に。
        // ----------------------------------------------------------
        const radomeProfile = [
            [0.0, 0.30],
            [0.5, 0.27],
            [1.0, 0.22],
            [1.5, 0.16],
            [1.9, 0.09],
            [2.15, 0.03],  // 丸めた先端
            [2.2, 0.0],
        ];
        const radomePts = radomeProfile.map(([x, r]) => new THREE.Vector2(r, x));
        const radomeGeo = new THREE.LatheGeometry(radomePts, 28);
        radomeGeo.rotateZ(-Math.PI / 2); // 先端を +X (前方) へ
        radomeGeo.computeVertexNormals();
        const radome = this.addMesh(radomeGeo, Materials.radome, 'radome');
        radome.position.set(7.0, -0.12, 0);
        radome.rotation.z = THREE.MathUtils.degToRad(-4); // ドループ (機首下げ)

        // レドーム先端のピトー管
        const pitotGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.7, 8);
        pitotGeo.rotateZ(-Math.PI / 2);
        const pitot = this.addMesh(pitotGeo, Materials.strut, 'pitot');
        pitot.position.set(9.45, -0.27, 0);

        // ----------------------------------------------------------
        //  機首下面 IRST / AAA-4 赤外線シーカー風フェアリング
        //  (E型以前の象徴。レドーム下の小さな涙滴型フェアリング)
        // ----------------------------------------------------------
        const irstGeo = new THREE.SphereGeometry(0.22, 16, 12);
        irstGeo.scale(2.0, 0.85, 0.9);
        const irst = this.addMesh(irstGeo, Materials.bodyDark, 'irstFairing');
        irst.position.set(6.7, -0.5, 0);

        // ----------------------------------------------------------
        //  胴体側面のエアインテーク (左右) — F-4 の大きな箱型インテーク。
        // ----------------------------------------------------------
        for (const dir of [1, -1]) {
            this._buildIntake(dir);
        }

        // ----------------------------------------------------------
        //  背部スパイン (キャノピー後方からテールへ続く背中ライン)
        //  CapsuleGeometry を細長くして滑らかな背びれに。
        // ----------------------------------------------------------
        const spineGeo = new THREE.CapsuleGeometry(0.46, 5.0, 6, 16);
        spineGeo.rotateZ(Math.PI / 2);
        const spine = this.addMesh(spineGeo, Materials.body, 'dorsalSpine');
        spine.scale.set(1.0, 0.66, 0.82);
        spine.position.set(-2.6, 0.86, 0);

        // 背部スパイン上の燃料ベント/アンテナ
        const ventGeo = new THREE.BoxGeometry(0.5, 0.16, 0.06);
        const vent = this.addMesh(ventGeo, Materials.bodyDark, 'dorsalAntenna');
        vent.position.set(-4.4, 1.15, 0);
        vent.rotation.z = THREE.MathUtils.degToRad(-18);

        // ----------------------------------------------------------
        //  テールコーン端 (双発ノズルへ繋がる幅広の絞り) — 無塗装金属感
        // ----------------------------------------------------------
        const tailRingGeo = new THREE.CylinderGeometry(0.82, 0.74, 0.6, 32, 1, true);
        tailRingGeo.rotateZ(-Math.PI / 2);
        tailRingGeo.scale(1.0, 0.9, 1.28); // 横長 (左右ノズルを収める)
        const tailRing = this.addMesh(tailRingGeo, Materials.bareMetal, 'tailRing');
        tailRing.position.set(-6.7, -0.05, 0);

        // アレスティングフック (尾部下面の格納フック — 海軍機由来の名残)
        const hookGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8);
        const hook = this.addMesh(hookGeo, Materials.bodyDark, 'arrestingHook');
        hook.position.set(-6.4, -0.7, 0);
        hook.rotation.z = THREE.MathUtils.degToRad(60);

        // ----------------------------------------------------------
        //  胴体パネルライン (スジ彫り風) — 細い溝メッシュを巻く。
        // ----------------------------------------------------------
        this._buildPanelLines();

        // ----------------------------------------------------------
        //  国籍マーキング (USAF スター&バー) — 後部胴体側面 左右。
        // ----------------------------------------------------------
        this._buildNationalMarkings();

        // ----------------------------------------------------------
        //  フォーメーションライト / 衝突防止灯 — 胴体背部の小型灯火。
        // ----------------------------------------------------------
        this._buildFormationLights();
    }

    /**
     * USAF スター&バー (insignia) を後部胴体側面の左右に配置する。
     * 迷彩切替の影響を受けない独立マテリアルで描く。
     */
    _buildNationalMarkings() {
        for (const dir of [1, -1]) {
            const insignia = this._makeStarAndBar(0.5);
            insignia.position.set(-3.6, 0.15, dir * 1.14);
            insignia.rotation.y = dir === 1 ? 0 : Math.PI;
            insignia.rotation.x = Math.PI / 2;
            this.group.add(insignia);
        }
    }

    /**
     * USAF スター&バー記章メッシュを生成して返す。
     *   - 紺の円盤 + 白い5芒星 + 左右の白バー(赤縁) の簡略版。
     * @param {number} size 星の外接半径
     * @returns {THREE.Group}
     */
    _makeStarAndBar(size) {
        const g = new THREE.Group();
        g.name = 'starAndBar';

        // 紺の円盤 (星の背景)
        const discGeo = new THREE.CircleGeometry(size, 24);
        const disc = new THREE.Mesh(discGeo, Materials.insigniaBlue);
        disc.name = 'insignia:disc';
        disc.userData.part = this;
        this.meshes.push(disc);
        g.add(disc);

        // 白い5芒星
        const starShape = new THREE.Shape();
        const spikes = 5;
        const rOuter = size * 0.92;
        const rInner = rOuter * 0.4;
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? rOuter : rInner;
            const a = (i / (spikes * 2)) * Math.PI * 2 + Math.PI / 2;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0) starShape.moveTo(x, y);
            else starShape.lineTo(x, y);
        }
        starShape.closePath();
        const starGeo = new THREE.ShapeGeometry(starShape);
        const star = new THREE.Mesh(starGeo, Materials.insigniaWhite);
        star.name = 'insignia:star';
        star.userData.part = this;
        star.position.z = 0.01;
        this.meshes.push(star);
        g.add(star);

        // 左右の白バー (赤縁) — 円盤の両脇に水平に伸びる
        const barLen = size * 1.0;
        const barH = size * 0.78;
        for (const s of [1, -1]) {
            // 赤縁 (バーよりわずかに大)
            const redGeo = new THREE.PlaneGeometry(barLen + 0.04, barH + 0.04);
            const red = new THREE.Mesh(redGeo, Materials.insigniaRed);
            red.name = 'insignia:barRed';
            red.userData.part = this;
            red.position.set(s * (size + barLen / 2), 0, 0.006);
            this.meshes.push(red);
            g.add(red);

            // 白バー
            const whiteGeo = new THREE.PlaneGeometry(barLen, barH);
            const white = new THREE.Mesh(whiteGeo, Materials.insigniaWhite);
            white.name = 'insignia:barWhite';
            white.userData.part = this;
            white.position.set(s * (size + barLen / 2), 0, 0.012);
            this.meshes.push(white);
            g.add(white);
        }

        return g;
    }

    /**
     * フォーメーションライト / 衝突防止灯 (アンチコリジョンビーコン)。
     * 背部スパイン頂部の赤灯 + 機首下面の白灯など。
     */
    _buildFormationLights() {
        // 背部の赤い衝突防止灯
        const beaconGeo = new THREE.SphereGeometry(0.08, 10, 8);
        const beacon = this.addMesh(beaconGeo, Materials.navLightRed, 'antiCollisionBeacon');
        beacon.position.set(-1.2, 1.18, 0);

        // 機首下面の白い識別灯
        const idGeo = new THREE.SphereGeometry(0.06, 8, 6);
        const id = this.addMesh(idGeo, Materials.navLightWhite, 'idLight');
        id.position.set(4.0, -0.7, 0);
    }

    /**
     * 胴体上面に薄い迷彩パッチ(殻)を重ねる。
     * @param {number} cx     中心 X
     * @param {number} length X方向の長さ
     * @param {number} rScale 半径スケール (本体より僅かに大)
     * @param {THREE.Material} mat
     * @param {string} name
     * @param {number} phiStart φ 開始角
     */
    _buildCamoPatch(cx, length, rScale, mat, name, phiStart) {
        const r = 1.12 * rScale;
        const patchGeo = new THREE.CylinderGeometry(r, r, length, 24, 1, true, phiStart, Math.PI * 0.7);
        patchGeo.rotateZ(-Math.PI / 2);
        patchGeo.scale(1.0, 0.90, 1.14);
        const patch = this.addMesh(patchGeo, mat, name);
        patch.position.set(cx, 0, 0);
        patch.renderOrder = 2;
    }

    /**
     * 胴体の代表的なパネルライン(スジ彫り)を細いリングで表現する。
     */
    _buildPanelLines() {
        const ringX = [-4.8, -3.2, -1.4, 0.4, 2.2, 3.8];
        for (const x of ringX) {
            // 半径は profile からおおよそ補間 (簡易に固定値で十分)
            const r = 1.16 - Math.abs(x) * 0.05;
            const rr = THREE.MathUtils.clamp(r, 0.45, 1.18);
            const ringGeo = new THREE.TorusGeometry(rr, 0.012, 6, 40);
            ringGeo.rotateY(Math.PI / 2);
            ringGeo.scale(1.0, 0.90, 1.14);
            const ring = this.addMesh(ringGeo, Materials.panelLine, `panelRing${x}`);
            ring.position.set(x, 0, 0);
            ring.renderOrder = 3;
        }
    }

    /**
     * 片側のエアインテークを構築する。
     * @param {number} dir +1 = 右, -1 = 左
     */
    _buildIntake(dir) {
        const side = dir === 1 ? 'R' : 'L';
        // インテークは胴体中央やや前方、側面に位置
        const baseX = 1.9;
        const baseZ = dir * 1.18;
        const baseY = -0.08;

        // --- インテークハウジング (外側に張り出す箱型・面取り風) ---
        const housingGeo = new THREE.BoxGeometry(3.6, 1.18, 1.0, 2, 1, 2);
        const housing = this.addMesh(housingGeo, Materials.body, `intakeHousing${side}`);
        housing.position.set(baseX, baseY, baseZ + dir * 0.36);
        // 前方が外に開く台形感を出すためわずかに回転
        housing.rotation.y = dir * THREE.MathUtils.degToRad(-5);

        // --- インテークハウジング下面 (グレー塗り分け) ---
        const housingBottomGeo = new THREE.BoxGeometry(3.5, 0.2, 0.96);
        const housingBottom = this.addMesh(housingBottomGeo, Materials.underside, `intakeHousingBottom${side}`);
        housingBottom.position.set(baseX, baseY - 0.5, baseZ + dir * 0.36);
        housingBottom.rotation.y = dir * THREE.MathUtils.degToRad(-5);

        // --- インテーク開口部 (黒いダクト) — 前面 ---
        const ductGeo = new THREE.BoxGeometry(0.7, 0.92, 0.78);
        const duct = this.addMesh(ductGeo, Materials.intake, `intakeDuct${side}`);
        duct.position.set(baseX + 1.65, baseY, baseZ + dir * 0.36);

        // --- インテーク内壁 (白塗装の見える部分) ---
        const innerGeo = new THREE.BoxGeometry(0.4, 0.78, 0.64);
        const inner = this.addMesh(innerGeo, Materials.intakeWhite, `intakeInner${side}`);
        inner.position.set(baseX + 1.5, baseY, baseZ + dir * 0.36);

        // --- 可変ランプ (intake のラムプ板・F-4 の特徴的な傾斜板) ---
        const rampGeo = new THREE.BoxGeometry(1.4, 0.9, 0.05);
        const ramp = this.addMesh(rampGeo, Materials.bodyDark, `intakeRamp${side}`);
        ramp.position.set(baseX + 0.9, baseY, baseZ - dir * 0.06);
        ramp.rotation.y = dir * THREE.MathUtils.degToRad(-14);

        // --- スプリッタープレート (境界層板) — 胴体とインテークの隙間板 ---
        const splitterGeo = new THREE.BoxGeometry(2.4, 1.05, 0.05);
        const splitter = this.addMesh(splitterGeo, Materials.bodyDark, `splitter${side}`);
        splitter.position.set(baseX + 0.5, baseY, baseZ - dir * 0.16);

        // --- 境界層排出スリット (perforated bleed) ---
        const bleedGeo = new THREE.BoxGeometry(1.4, 0.7, 0.02);
        const bleed = this.addMesh(bleedGeo, Materials.panelLine, `intakeBleed${side}`);
        bleed.position.set(baseX + 0.2, baseY, baseZ - dir * 0.2);

        // --- インテークリップ (前縁の縁取り) ---
        const lipGeo = new THREE.TorusGeometry(0.46, 0.055, 10, 20);
        lipGeo.rotateY(Math.PI / 2);
        lipGeo.scale(1.0, 1.18, 0.86);
        const lip = this.addMesh(lipGeo, Materials.bareMetal, `intakeLip${side}`);
        lip.position.set(baseX + 2.0, baseY, baseZ + dir * 0.36);
    }
}
