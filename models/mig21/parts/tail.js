import * as THREE from 'three';
import { AircraftPart } from './AircraftPart.js';
import { Materials } from './materials.js';

/**
 * Tail — 尾翼アセンブリ。
 *
 * MiG-21 の尾部:
 *   - 大きく後退した垂直尾翼 (1 枚)
 *   - 全遊動式の水平尾翼 (スタビレーター) 左右
 *   - 腹びれ (ベントラルフィン)
 *
 * 機尾 (-X 側) に配置。
 */
export class Tail extends AircraftPart {
    constructor(options = {}) {
        super('tail', { health: 90, ...options });
    }

    buildGeometry() {
        // ----------------------------------------------------------
        //  垂直尾翼 (Vertical Stabilizer)
        //  XY 平面の後退翼シェイプを Z 方向へ薄く押し出す。
        // ----------------------------------------------------------
        // 修正: 高さを約15%増加 (2.1 → 2.42) し、上端をさらに後方へ
        //       オフセットして前縁後退角を強調した形状へ。
        const finTop = 2.42;        // 高さ (旧 2.1 × 1.15)
        const vShape = new THREE.Shape();
        vShape.moveTo(-3.8, 0);        // 付け根後端
        vShape.lineTo(-1.4, 0);        // 付け根前端
        vShape.lineTo(-3.05, finTop);  // 上端前 (後退角を強調し後方へ)
        vShape.lineTo(-3.85, finTop);  // 上端後
        vShape.closePath();

        const vGeo = new THREE.ExtrudeGeometry(vShape, {
            depth: 0.14,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.04,
            bevelSegments: 2,
        });
        vGeo.translate(0, 0, -0.07); // Z 中心揃え
        vGeo.computeVertexNormals();
        const vfin = this.addMesh(vGeo, Materials.body, 'verticalStabilizer');
        vfin.position.set(-2.0, 0.6, 0);

        // ラダー分割ライン
        //  ※ 垂直尾翼はワールドで X≈-3.4〜-5.8 に位置するため、ディテールも
        //    その範囲内に配置する (旧値は前方すぎて宙に浮いていた)。
        const rudderLineGeo = new THREE.BoxGeometry(0.05, 1.95, 0.16);
        const rudderLine = this.addMesh(rudderLineGeo, Materials.panelLine, 'rudderLine');
        rudderLine.position.set(-5.55, 1.7, 0); // 後縁(ラダー)寄り

        // ----------------------------------------------------------
        //  垂直尾翼上端の航法灯 (白) + 頂部の RWR/ESM フェアリング
        // ----------------------------------------------------------
        //  ※垂直尾翼を +0.6 だけ持ち上げて配置しているため、頂部座標は finTop+0.6。
        const finTipGeo = new THREE.SphereGeometry(0.07, 10, 8);
        const finTip = this.addMesh(finTipGeo, Materials.navLightWhite, 'finTopLight');
        finTip.position.set(-5.7, 2.98, 0); // 頂部後端の角に埋め込む

        // 頂部 ESM/RWR フェアリング — 翼頂稜線に沿わせる
        const esmGeo = new THREE.BoxGeometry(0.45, 0.16, 0.15);
        const esm = this.addMesh(esmGeo, Materials.dielectric, 'finEsmFairing');
        esm.position.set(-5.3, 2.92, 0);

        // 垂直尾翼のパネルライン (前縁付近のスジ彫り)
        const finPanelGeo = new THREE.BoxGeometry(0.04, 1.7, 0.18);
        const finPanel = this.addMesh(finPanelGeo, Materials.panelLine, 'finPanelLine');
        finPanel.position.set(-4.1, 1.55, 0); // 前縁寄り (翼内に収める)

        // ----------------------------------------------------------
        //  ブレーキパラシュート格納筒 — テールコーン基部の円筒フェアリング。
        //  実機 MiG-21 は垂直尾翼付け根後方にドラッグシュート筒を持つ。
        // ----------------------------------------------------------
        const chuteGeo = new THREE.CylinderGeometry(0.22, 0.2, 0.8, 16);
        chuteGeo.rotateZ(-Math.PI / 2);
        const chute = this.addMesh(chuteGeo, Materials.bodyDark, 'brakeChuteHousing');
        chute.position.set(-5.55, 0.55, 0);
        // 筒後端のキャップ
        const capGeo = new THREE.CylinderGeometry(0.21, 0.16, 0.1, 16);
        capGeo.rotateZ(-Math.PI / 2);
        const cap = this.addMesh(capGeo, Materials.bareMetal, 'brakeChuteCap');
        cap.position.set(-5.98, 0.55, 0);

        // ----------------------------------------------------------
        //  水平尾翼 (スタビレーター) — 左右
        //  小さな後退デルタ。
        // ----------------------------------------------------------
        for (const dir of [1, -1]) {
            const hShape = new THREE.Shape();
            hShape.moveTo(0.6, 0);     // 付け根前
            hShape.lineTo(-1.0, 0);    // 付け根後
            hShape.lineTo(-1.3, 1.5);  // 翼端後
            hShape.lineTo(-0.4, 1.5);  // 翼端前 (後退角)
            hShape.closePath();

            const hGeo = new THREE.ExtrudeGeometry(hShape, {
                depth: 0.08,
                bevelEnabled: true,
                bevelThickness: 0.02,
                bevelSize: 0.03,
                bevelSegments: 1,
            });
            hGeo.rotateX(-Math.PI / 2); // スパンを Z 方向へ
            hGeo.computeVertexNormals();
            const stab = this.addMesh(hGeo, Materials.body, dir === 1 ? 'stabRight' : 'stabLeft');
            stab.scale.set(1, 1, dir);
            stab.position.set(-4.4, 0.0, dir * 0.45);
        }

        // ----------------------------------------------------------
        //  腹びれ (Ventral Fin) — 胴体下面の安定板
        // ----------------------------------------------------------
        const vfShape = new THREE.Shape();
        vfShape.moveTo(-3.6, 0);
        vfShape.lineTo(-1.8, 0);
        vfShape.lineTo(-2.6, -0.9);
        vfShape.lineTo(-3.5, -0.9);
        vfShape.closePath();

        const vfGeo = new THREE.ExtrudeGeometry(vfShape, {
            depth: 0.1,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.03,
            bevelSegments: 1,
        });
        vfGeo.translate(0, 0, -0.05);
        vfGeo.computeVertexNormals();
        const ventral = this.addMesh(vfGeo, Materials.bodyDark, 'ventralFin');
        ventral.position.set(-2.0, -0.7, 0);

        // ----------------------------------------------------------
        //  垂直尾翼の赤星マーキング (左右)
        //  星は XY 平面の薄板 (法線 ±Z)。垂直尾翼の側面 (ワールド X≈-4.3,
        //  Y≈1.5) に貼り付ける。フィン厚 (±0.07) のすぐ外側に置く。
        // ----------------------------------------------------------
        for (const dir of [1, -1]) {
            const star = this._makeRedStar(0.4);
            star.position.set(-4.5, 1.4, dir * 0.085);
            // 右(+Z)面は手前向き、左(-Z)面は反転して外を向かせる
            star.rotation.y = dir === 1 ? 0 : Math.PI;
            this.group.add(star);
        }
    }

    /**
     * 白縁取り付きの赤い 5 芒星メッシュを生成 (垂直尾翼用)。
     * @param {number} size 外接半径
     * @returns {THREE.Group}
     */
    _makeRedStar(size) {
        const g = new THREE.Group();
        g.name = 'tailRedStar';

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

        const outlineGeo = new THREE.ExtrudeGeometry(starShape(size), {
            depth: 0.012, bevelEnabled: false,
        });
        const outline = new THREE.Mesh(outlineGeo, Materials.starOutline);
        outline.name = 'tailRedStar:outline';
        outline.userData.part = this;
        this.meshes.push(outline);
        g.add(outline);

        const redGeo = new THREE.ExtrudeGeometry(starShape(size * 0.82), {
            depth: 0.014, bevelEnabled: false,
        });
        const red = new THREE.Mesh(redGeo, Materials.redStar);
        red.name = 'tailRedStar:fill';
        red.userData.part = this;
        red.position.z = 0.004;
        this.meshes.push(red);
        g.add(red);

        return g;
    }
}
