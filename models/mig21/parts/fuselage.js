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

        const points = profile.map(([x, r]) => new THREE.Vector2(r, x));
        const bodyGeo = new THREE.LatheGeometry(points, 48);
        // Lathe は Y 軸回転体 → X 軸方向(前後)へ向ける
        bodyGeo.rotateZ(-Math.PI / 2);
        bodyGeo.computeVertexNormals();
        this.addMesh(bodyGeo, Materials.body, 'body');

        // ----------------------------------------------------------
        //  インテークリップ (機首先端の円環) — 円形インテークを強調
        // ----------------------------------------------------------
        const lipGeo = new THREE.TorusGeometry(0.56, 0.07, 16, 48);
        lipGeo.rotateY(Math.PI / 2);
        const lip = this.addMesh(lipGeo, Materials.bodyDark, 'intakeLip');
        lip.position.set(5.9, 0, 0);

        // ----------------------------------------------------------
        //  インテーク内壁 (黒い円筒) — 奥に伸びるダクト
        // ----------------------------------------------------------
        const ductGeo = new THREE.CylinderGeometry(0.5, 0.45, 1.6, 32, 1, true);
        ductGeo.rotateZ(-Math.PI / 2);
        const duct = this.addMesh(ductGeo, Materials.intake, 'intakeDuct');
        duct.position.set(5.2, 0, 0);

        // ----------------------------------------------------------
        //  ショックコーン (レドーム) — インテーク中央の円錐
        //  MiG-21 の象徴的な中央コーン。レーダーを格納する。
        // ----------------------------------------------------------
        const coneGeo = new THREE.ConeGeometry(0.34, 1.3, 32);
        coneGeo.rotateZ(-Math.PI / 2);
        const cone = this.addMesh(coneGeo, Materials.radome, 'shockCone');
        cone.position.set(6.05, 0, 0); // インテークから少し突出

        // コーン基部の丸み
        const coneBaseGeo = new THREE.SphereGeometry(0.34, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        coneBaseGeo.rotateZ(Math.PI / 2);
        const coneBase = this.addMesh(coneBaseGeo, Materials.radome, 'shockConeBase');
        coneBase.position.set(5.4, 0, 0);

        // ----------------------------------------------------------
        //  背部スパイン (キャノピー後方からテールへ続く背びれ状の盛り上がり)
        //  MiG-21MF の特徴的な太い背中ラインを表現。
        // ----------------------------------------------------------
        const spineGeo = new THREE.CapsuleGeometry(0.32, 5.0, 8, 16);
        spineGeo.rotateZ(Math.PI / 2);
        const spine = this.addMesh(spineGeo, Materials.body, 'dorsalSpine');
        spine.scale.set(1.0, 0.7, 0.8);
        spine.position.set(-1.8, 0.62, 0);

        // ----------------------------------------------------------
        //  テールコーン端 (エンジンノズルへ繋がる絞り)
        // ----------------------------------------------------------
        const tailRingGeo = new THREE.CylinderGeometry(0.42, 0.40, 0.4, 32);
        tailRingGeo.rotateZ(-Math.PI / 2);
        const tailRing = this.addMesh(tailRingGeo, Materials.bodyDark, 'tailRing');
        tailRing.position.set(-5.9, 0, 0);
    }
}
