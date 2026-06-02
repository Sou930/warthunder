import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Fuselage — MiG-21 の胴体。
 *
 * 特徴を再現:
 *   - 機首の円形エアインテーク (機首先端に大きな丸い開口)
 *   - 中央のショックコーン (レドーム円錐) ※インテーク中央
 *   - 細長く、後方に向かってやや絞られる葉巻型の胴体
 *
 * 座標系: +X = 前方(機首), +Y = 上, +Z = 右
 * 機首先端を +X 側に置く。
 */
export class Fuselage extends AircraftPart {
    constructor(options = {}) {
        super('fuselage', { critical: true, health: 300, ...options });
    }

    buildGeometry() {
        // ----------------------------------------------------------
        //  胴体本体: LatheGeometry で回転体として滑らかな葉巻型を生成。
        //  プロファイル (半径) を機首→機尾に沿って定義する。
        //  X 軸方向に伸ばすため、生成後に回転させる。
        // ----------------------------------------------------------
        // points: (along, radius) — along は 0(機尾) → length(機首)
        const length = 12.0;       // 胴体長 (見た目スケール)
        const profile = [
            // [x(前後位置), r(半径)]   ※ x: 後端=-6 〜 前端=+6
            [-6.0, 0.05],  // テールコーン端
            [-5.6, 0.42],
            [-5.0, 0.62],
            [-4.0, 0.78],
            [-2.5, 0.86],
            [-1.0, 0.90],  // 最大径 (主翼付け根あたり)
            [ 0.5, 0.88],
            [ 2.0, 0.82],
            [ 3.5, 0.74],
            [ 4.6, 0.66],
            [ 5.2, 0.60],  // インテークリップ手前
            [ 5.6, 0.58],
            [ 5.9, 0.56],  // インテークリップ
        ];

        // セグメント数は外周分割。32 で十分滑らかに見え、頂点数を約 1/3 削減。
        const points = profile.map(([x, r]) => new THREE.Vector2(r, x));
        const bodyGeo = new THREE.LatheGeometry(points, 32);
        // Lathe は Y 軸回転体 → X 軸方向(前後)へ向ける
        bodyGeo.rotateZ(-Math.PI / 2);
        bodyGeo.computeVertexNormals();
        this.addMesh(bodyGeo, Materials.body, 'body');

        // ----------------------------------------------------------
        //  インテークリップ (機首先端の円環) — 円形インテークを強調
        // ----------------------------------------------------------
        const lipGeo = new THREE.TorusGeometry(0.56, 0.07, 10, 32);
        lipGeo.rotateY(Math.PI / 2);
        const lip = this.addMesh(lipGeo, Materials.bodyDark, 'intakeLip');
        lip.position.set(5.9, 0, 0);

        // ----------------------------------------------------------
        //  インテーク内壁 (黒い円筒) — 奥に伸びるダクト
        // ----------------------------------------------------------
        const ductGeo = new THREE.CylinderGeometry(0.5, 0.45, 1.6, 24, 1, true);
        ductGeo.rotateZ(-Math.PI / 2);
        const duct = this.addMesh(ductGeo, Materials.intake, 'intakeDuct');
        duct.position.set(5.2, 0, 0);

        // ----------------------------------------------------------
        //  ショックコーン (レドーム) — インテーク中央の円錐
        //  MiG-21 の象徴的な中央可動コーン。レーダーを格納する。
        //
        //  実機ではマッハ数に応じて前後にスライドし、衝撃波の位置を
        //  最適化する。ここでは可動部を 1 つの Group にまとめ、
        //  update() で X 方向に前後スライドさせる (可動ショックコーン)。
        // ----------------------------------------------------------
        const coneGroup = new THREE.Group();
        coneGroup.name = 'shockConeAssembly';

        // 円錐本体 (背面は見えないので底面なし: openEnded で削減)
        const coneGeo = new THREE.ConeGeometry(0.34, 1.3, 28, 1, true);
        coneGeo.rotateZ(-Math.PI / 2);
        const cone = this.addMesh(coneGeo, Materials.radome, 'shockCone');
        cone.position.set(0.65, 0, 0); // グループ内ローカル: 先端側

        // コーン基部の丸み (半球) — グループ内に取り込む
        const coneBaseGeo = new THREE.SphereGeometry(0.34, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2);
        coneBaseGeo.rotateZ(Math.PI / 2);
        const coneBase = this.addMesh(coneBaseGeo, Materials.radome, 'shockConeBase');
        coneBase.position.set(0, 0, 0);

        // メッシュをグループへ移し替え (addMesh は this.group に入れているので外す)
        this.group.remove(cone);
        this.group.remove(coneBase);
        coneGroup.add(cone);
        coneGroup.add(coneBase);

        // グループ基準位置 (コーン基部がインテーク内に来る位置)
        coneGroup.position.set(5.4, 0, 0);
        this.group.add(coneGroup);

        // 可動制御用に保持
        this.shockCone = coneGroup;
        this._shockConeBaseX = 5.4;     // 基準位置
        this._shockConeTravel = 0.55;   // 最大ストローク (前方へ)
        this._shockConeExtend = 0;      // 0(格納) 〜 1(最前進) 目標値
        this._shockConeCurrent = 0;     // 現在の補間値

        // ----------------------------------------------------------
        //  背部スパイン (キャノピー後方からテールへ続く背びれ状の盛り上がり)
        //  MiG-21MF の特徴的な太い背中ラインを表現。
        // ----------------------------------------------------------
        const spineGeo = new THREE.CapsuleGeometry(0.32, 5.0, 4, 12);
        spineGeo.rotateZ(Math.PI / 2);
        const spine = this.addMesh(spineGeo, Materials.body, 'dorsalSpine');
        spine.scale.set(1.0, 0.7, 0.8);
        spine.position.set(-1.8, 0.62, 0);

        // ----------------------------------------------------------
        //  テールコーン端 (エンジンノズルへ繋がる絞り)
        // ----------------------------------------------------------
        const tailRingGeo = new THREE.CylinderGeometry(0.42, 0.40, 0.4, 24, 1, true);
        tailRingGeo.rotateZ(-Math.PI / 2);
        const tailRing = this.addMesh(tailRingGeo, Materials.bodyDark, 'tailRing');
        tailRing.position.set(-5.9, 0, 0);

        // ----------------------------------------------------------
        //  実機ディテール群 — より実機 (MiG-21MF) に近づける追加要素
        // ----------------------------------------------------------
        this._buildUnderside();      // 下面の明色塗り分け
        this._buildIntakeLipMetal(); // インテーク前縁の磨き金属リング
        this._buildPanelLines();     // 胴体パネルライン (スジ彫り)
        this._buildPitotAndProbes(); // ピトー管 / アンテナ / ピトーブーム
        this._buildDorsalDetails();  // 背部アンテナ / ブレードアンテナ
        this._buildNationalMarkings(); // 機首側面の赤星マーキング
        this._buildAirbrakes();      // 胴体下面エアブレーキ板
    }

    /**
     * 下面の塗り分け — 胴体下半分に明色シェルを重ねる。
     * 実機 MiG-21 は上面シルバー、下面が明るいブルーグレー基調。
     */
    _buildUnderside() {
        const profile = [
            [-5.6, 0.42], [-5.0, 0.62], [-4.0, 0.78], [-2.5, 0.86],
            [-1.0, 0.90], [0.5, 0.88], [2.0, 0.82], [3.5, 0.74],
            [4.6, 0.66], [5.2, 0.60],
        ];
        const pts = profile.map(([x, r]) => new THREE.Vector2(r * 0.995, x));
        // 下半分だけ (φ を下側に制限)
        const geo = new THREE.LatheGeometry(pts, 28, Math.PI * 0.86, Math.PI * 1.28);
        geo.rotateZ(-Math.PI / 2);
        geo.computeVertexNormals();
        const belly = this.addMesh(geo, Materials.underside, 'belly');
        belly.renderOrder = 1;
    }

    /** インテーク前縁の磨き金属リング (実機の無塗装金属リップ) */
    _buildIntakeLipMetal() {
        const ringGeo = new THREE.TorusGeometry(0.57, 0.03, 8, 36);
        ringGeo.rotateY(Math.PI / 2);
        const ring = this.addMesh(ringGeo, Materials.bareMetal, 'intakeLipMetal');
        ring.position.set(5.95, 0, 0);
    }

    /** 胴体の代表的なパネルライン (細いリング状のスジ彫り) */
    _buildPanelLines() {
        const ringDefs = [
            [-4.6, 0.78], [-3.2, 0.84], [-1.6, 0.90],
            [0.2, 0.88], [1.8, 0.83], [3.2, 0.76], [4.4, 0.67],
        ];
        for (const [x, r] of ringDefs) {
            const g = new THREE.TorusGeometry(r + 0.005, 0.008, 6, 40);
            g.rotateY(Math.PI / 2);
            const ring = this.addMesh(g, Materials.panelLine, `panelRing${x}`);
            ring.position.set(x, 0, 0);
            ring.renderOrder = 2;
        }
    }

    /**
     * ピトー管 / 迎角センサー / 機首ブームを構築。
     * 実機 MiG-21 はショックコーン前方に長いピトーブームを持つ。
     */
    _buildPitotAndProbes() {
        // 機首ピトーブーム (ショックコーン先端から前方へ長く突き出る)
        const boomGeo = new THREE.CylinderGeometry(0.028, 0.018, 1.6, 10);
        boomGeo.rotateZ(-Math.PI / 2);
        const boom = this.addMesh(boomGeo, Materials.bareMetal, 'pitotBoom');
        boom.position.set(6.9, 0.0, 0);

        // ブーム先端の細いプローブ
        const tipGeo = new THREE.CylinderGeometry(0.012, 0.006, 0.5, 8);
        tipGeo.rotateZ(-Math.PI / 2);
        const tip = this.addMesh(tipGeo, Materials.strut, 'pitotTip');
        tip.position.set(7.9, 0.0, 0);

        // 迎角(AoA)ベーン — 機首側面の小さな風見
        for (const dir of [1, -1]) {
            const vaneGeo = new THREE.BoxGeometry(0.14, 0.03, 0.1);
            const vane = this.addMesh(vaneGeo, Materials.bodyDark, `aoaVane${dir}`);
            vane.position.set(5.5, 0.1, dir * 0.5);
        }
    }

    /** 背部のブレードアンテナ / IFF アンテナ (背びれ上の突起) */
    _buildDorsalDetails() {
        // キャノピー後方のブレードアンテナ (三角の薄板)
        const bladeShape = new THREE.Shape();
        bladeShape.moveTo(0, 0);
        bladeShape.lineTo(-0.45, 0);
        bladeShape.lineTo(-0.35, 0.42);
        bladeShape.closePath();
        const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
            depth: 0.03, bevelEnabled: false,
        });
        bladeGeo.translate(0, 0, -0.015);
        const blade = this.addMesh(bladeGeo, Materials.dielectric, 'bladeAntenna');
        blade.position.set(0.6, 0.95, 0);

        // テール寄りの小型ホイップ/IFFアンテナ
        const whipGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.34, 6);
        const whip = this.addMesh(whipGeo, Materials.strut, 'whipAntenna');
        whip.position.set(-3.4, 0.95, 0);
        whip.rotation.z = THREE.MathUtils.degToRad(-12);
    }

    /**
     * 国籍マーキング (ソ連赤星) を機首側面の左右に配置。
     * 白縁取り付きの 5 芒星を薄板で表現する。
     */
    _buildNationalMarkings() {
        // 星は XY 平面の薄板で、押し出し方向(法線)は ±Z。
        // よって胴体の「側面」に貼るには回転不要 (左面のみ反転)。
        // x=3.6 付近の胴体半径 ≒ 0.73 なので、その表面に沿わせる。
        for (const dir of [1, -1]) {
            const star = this._makeRedStar(0.3);
            // 側面 (胴体半径ぶん外側) のやや下寄りに配置
            star.position.set(3.4, 0.05, dir * 0.72);
            // 右(+Z)面はそのまま、左(-Z)面は反転して外向きに
            star.rotation.y = dir === 1 ? 0 : Math.PI;
            this.group.add(star);
        }
    }

    /**
     * 白縁取り付きの赤い 5 芒星メッシュを生成して返す。
     * @param {number} size 外接半径
     * @returns {THREE.Group}
     */
    _makeRedStar(size) {
        const g = new THREE.Group();
        g.name = 'redStar';

        const starShape = (radius) => {
            const s = new THREE.Shape();
            const spikes = 5;
            const inner = radius * 0.42;
            for (let i = 0; i < spikes * 2; i++) {
                const r = i % 2 === 0 ? radius : inner;
                const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
                const x = Math.cos(a) * r;
                const y = Math.sin(a) * r;
                if (i === 0) s.moveTo(x, y);
                else s.lineTo(x, y);
            }
            s.closePath();
            return s;
        };

        // 白縁 (やや大きい星)
        const outlineGeo = new THREE.ExtrudeGeometry(starShape(size), {
            depth: 0.012, bevelEnabled: false,
        });
        const outline = new THREE.Mesh(outlineGeo, Materials.starOutline);
        outline.name = 'redStar:outline';
        outline.userData.part = this;
        this.meshes.push(outline);
        g.add(outline);

        // 赤星本体 (少し小さく、白縁の上に重ねる)
        const redGeo = new THREE.ExtrudeGeometry(starShape(size * 0.82), {
            depth: 0.014, bevelEnabled: false,
        });
        const red = new THREE.Mesh(redGeo, Materials.redStar);
        red.name = 'redStar:fill';
        red.userData.part = this;
        red.position.z = 0.004;
        this.meshes.push(red);
        g.add(red);

        return g;
    }

    /**
     * 胴体下面のエアブレーキ板 (実機 MiG-21 の前部/後部エアブレーキ)。
     * 閉じた状態の薄いパネルとして表現。
     */
    _buildAirbrakes() {
        const brakeGeo = new THREE.BoxGeometry(1.1, 0.05, 0.7);
        const brake = this.addMesh(brakeGeo, Materials.bodyDark, 'ventralAirbrake');
        brake.position.set(-0.6, -0.84, 0);
    }

    // ============================================================
    //  可動ショックコーン 制御 API
    // ============================================================

    /**
     * ショックコーンの突出量を設定する (0=格納, 1=最前進)。
     * FlightModel が将来マッハ数から自動制御する想定。
     * @param {number} amount 0..1
     */
    setShockConeExtend(amount) {
        this._shockConeExtend = THREE.MathUtils.clamp(amount, 0, 1);
    }

    /** 現在の目標突出量を取得 */
    getShockConeExtend() {
        return this._shockConeExtend;
    }

    /**
     * 毎フレーム更新。ショックコーンを目標位置へ滑らかに補間し、
     * デモ用にゆっくり前後へオシレートさせる。
     * @param {number} time 経過秒
     */
    update(time) {
        if (!this.shockCone) return;

        // 目標値が未指定 (=0) のときはデモとして緩やかに前後動。
        // 明示的に setShockConeExtend(>0) された場合はその目標へ追従。
        let target = this._shockConeExtend;
        if (target <= 0.001 && this._shockConeAuto !== false) {
            // 0〜1 をゆっくり往復 (周期 ~10 秒)
            target = (Math.sin(time * 0.6) * 0.5 + 0.5);
        }

        // なめらかに追従
        this._shockConeCurrent += (target - this._shockConeCurrent) * 0.06;
        this.shockCone.position.x =
            this._shockConeBaseX + this._shockConeCurrent * this._shockConeTravel;
    }

    /** デモ自動往復の ON/OFF */
    setShockConeAuto(enabled) {
        this._shockConeAuto = enabled;
    }
}
