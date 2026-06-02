import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Fuselage — F-4E Phantom II の胴体。
 *
 * MiG-21 (機首円形インテーク + 可動ショックコーン) とは対照的に、
 * F-4 は以下を再現する:
 *   - 機首先端のソリッドなレーダーレドーム (尖った円錐) ※可動コーンなし
 *   - 機首がやや下を向く「ドループノーズ」のシルエット
 *   - 胴体側面の大型エアインテーク (左右、スプリッタープレート付き)
 *   - 太く扁平な葉巻型胴体 (双発エンジンを収める幅広の後部胴体)
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
        //  F-4 は MiG-21 より一回り太く、後部が幅広 (双発)。
        //  断面を後で楕円 (扁平) にスケールして「太く平たい」印象に。
        // ----------------------------------------------------------
        const profile = [
            // [x(前後位置), r(半径)]   ※ 後端 -7 〜 前端 +8
            [-7.0, 0.05],   // テールコーン端 (ノズル付近の絞り)
            [-6.4, 0.55],
            [-5.6, 0.82],
            [-4.5, 1.0],
            [-3.0, 1.12],
            [-1.5, 1.18],   // 最大径 (主翼付け根 / エンジン部)
            [ 0.0, 1.14],
            [ 1.5, 1.04],
            [ 3.0, 0.9],
            [ 4.2, 0.74],
            [ 5.2, 0.58],   // 機首が細くなる
            [ 6.0, 0.44],
            [ 6.8, 0.32],   // レドーム付け根
        ];

        const points = profile.map(([x, r]) => new THREE.Vector2(r, x));
        const bodyGeo = new THREE.LatheGeometry(points, 32);
        bodyGeo.rotateZ(-Math.PI / 2);  // Y軸回転体 → X軸(前後)方向へ
        // 扁平化: 上下(Y)をやや潰し、左右(Z)を広げて F-4 の太い断面に
        bodyGeo.scale(1.0, 0.92, 1.12);
        bodyGeo.computeVertexNormals();
        this.addMesh(bodyGeo, Materials.body, 'body');

        // ----------------------------------------------------------
        //  機首レーダーレドーム (ソリッドな尖った円錐) — F-4 の象徴
        //  MiG-21 のような可動コーンではなく固定の長い円錐。
        //  わずかに下向き (ドループノーズ) に取り付ける。
        // ----------------------------------------------------------
        const radomeGeo = new THREE.ConeGeometry(0.34, 2.2, 28, 1, true);
        radomeGeo.rotateZ(-Math.PI / 2); // 頂点を +X (前方) へ
        const radome = this.addMesh(radomeGeo, Materials.radome, 'radome');
        radome.position.set(7.9, -0.12, 0);
        radome.rotation.z = THREE.MathUtils.degToRad(-3); // ドループ (機首下げ)

        // レドーム先端のピトー管
        const pitotGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6);
        pitotGeo.rotateZ(-Math.PI / 2);
        const pitot = this.addMesh(pitotGeo, Materials.strut, 'pitot');
        pitot.position.set(9.2, -0.18, 0);

        // ----------------------------------------------------------
        //  胴体側面のエアインテーク (左右) — F-4 の大きな箱型インテーク。
        //  各インテークは胴体側面から張り出し、内側に黒いダクト開口、
        //  外側にスプリッタープレート (境界層板) を備える。
        // ----------------------------------------------------------
        for (const dir of [1, -1]) {
            this._buildIntake(dir);
        }

        // ----------------------------------------------------------
        //  背部スパイン (キャノピー後方からテールへ続く背中ライン)
        // ----------------------------------------------------------
        const spineGeo = new THREE.CapsuleGeometry(0.42, 5.4, 4, 12);
        spineGeo.rotateZ(Math.PI / 2);
        const spine = this.addMesh(spineGeo, Materials.body, 'dorsalSpine');
        spine.scale.set(1.0, 0.62, 0.85);
        spine.position.set(-2.4, 0.85, 0);

        // ----------------------------------------------------------
        //  テールコーン端 (双発ノズルへ繋がる幅広の絞り)
        // ----------------------------------------------------------
        const tailRingGeo = new THREE.CylinderGeometry(0.78, 0.72, 0.5, 28, 1, true);
        tailRingGeo.rotateZ(-Math.PI / 2);
        tailRingGeo.scale(1.0, 0.9, 1.25); // 横長 (左右ノズルを収める)
        const tailRing = this.addMesh(tailRingGeo, Materials.bodyDark, 'tailRing');
        tailRing.position.set(-6.7, -0.05, 0);
    }

    /**
     * 片側のエアインテークを構築する。
     * @param {number} dir +1 = 右, -1 = 左
     */
    _buildIntake(dir) {
        const side = dir === 1 ? 'R' : 'L';
        // インテークは胴体中央やや前方、側面に位置
        const baseX = 1.8;
        const baseZ = dir * 1.15;
        const baseY = -0.1;

        // --- インテークハウジング (外側に張り出す箱型) ---
        const housingGeo = new THREE.BoxGeometry(3.4, 1.1, 0.95);
        const housing = this.addMesh(housingGeo, Materials.body, `intakeHousing${side}`);
        housing.position.set(baseX, baseY, baseZ + dir * 0.35);
        // 前方が外に開く台形感を出すためわずかに回転
        housing.rotation.y = dir * THREE.MathUtils.degToRad(-4);

        // --- インテーク開口部 (黒いダクト) — 前面 ---
        const ductGeo = new THREE.BoxGeometry(0.6, 0.85, 0.7);
        const duct = this.addMesh(ductGeo, Materials.intake, `intakeDuct${side}`);
        duct.position.set(baseX + 1.6, baseY, baseZ + dir * 0.35);

        // --- スプリッタープレート (境界層板) — 胴体とインテークの隙間板 ---
        const splitterGeo = new THREE.BoxGeometry(2.2, 1.0, 0.06);
        const splitter = this.addMesh(splitterGeo, Materials.bodyDark, `splitter${side}`);
        splitter.position.set(baseX + 0.5, baseY, baseZ - dir * 0.12);

        // --- インテークリップ (前縁の縁取り) ---
        const lipGeo = new THREE.TorusGeometry(0.42, 0.05, 8, 16);
        lipGeo.rotateY(Math.PI / 2);
        lipGeo.scale(1.0, 1.15, 0.85);
        const lip = this.addMesh(lipGeo, Materials.bodyDark, `intakeLip${side}`);
        lip.position.set(baseX + 1.95, baseY, baseZ + dir * 0.35);
    }
}
