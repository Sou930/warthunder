import * as THREE from 'three';

/**
 * materials.js — MiG-21 で共有するマテリアル定義。
 *
 * パーツ間で見た目を統一するために共通マテリアルを集約。
 * 将来テクスチャを textures/ に追加した際は、ここで
 * map / normalMap を差し替えるだけで全パーツに反映できる。
 */

export const Materials = {
    /** 機体本体 (ソ連空軍の無塗装ジュラルミン風シルバー) */
    body: new THREE.MeshStandardMaterial({
        color: 0xb7bcc2,
        metalness: 0.75,
        roughness: 0.42,
    }),

    /** 機首・インテークまわりのややダークな金属 */
    bodyDark: new THREE.MeshStandardMaterial({
        color: 0x8b9097,
        metalness: 0.8,
        roughness: 0.4,
    }),

    /** インテークの内壁 (黒) */
    intake: new THREE.MeshStandardMaterial({
        color: 0x15181c,
        metalness: 0.6,
        roughness: 0.6,
        side: THREE.DoubleSide,
    }),

    /** レドーム (ショックコーン) — ややグレー樹脂 */
    radome: new THREE.MeshStandardMaterial({
        color: 0x6e7479,
        metalness: 0.3,
        roughness: 0.55,
    }),

    /** キャノピーガラス (半透明・青みがかった) */
    canopy: new THREE.MeshPhysicalMaterial({
        color: 0x9fd4e6,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.85,
        transparent: true,
        opacity: 0.55,
        ior: 1.45,
        thickness: 0.3,
        side: THREE.DoubleSide,
    }),

    /** キャノピーフレーム */
    frame: new THREE.MeshStandardMaterial({
        color: 0x33373b,
        metalness: 0.6,
        roughness: 0.5,
    }),

    /** エンジンノズル (焼けた金属) */
    nozzle: new THREE.MeshStandardMaterial({
        color: 0x3a3d40,
        metalness: 0.9,
        roughness: 0.35,
    }),

    /** アフターバーナー内部の発光 (ノズル直後の高温コア) */
    afterburner: new THREE.MeshStandardMaterial({
        color: 0xff6622,
        emissive: 0xff4400,
        emissiveIntensity: 1.2,
        metalness: 0.2,
        roughness: 0.7,
    }),

    /** アフターバーナー炎プルーム内側 (最も高温=白〜青) — 加算合成で発光 */
    flameCore: new THREE.MeshBasicMaterial({
        color: 0xbfe0ff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    }),

    /** アフターバーナー炎プルーム中間 (オレンジ) */
    flameMid: new THREE.MeshBasicMaterial({
        color: 0xff8a2a,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    }),

    /** アフターバーナー炎プルーム外側 (赤/煙) */
    flameOuter: new THREE.MeshBasicMaterial({
        color: 0xff3a10,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    }),

    /** ショックダイヤモンド (マッハディスク) — 周期的な明点 */
    machDisk: new THREE.MeshBasicMaterial({
        color: 0xfff2c8,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }),

    /** タイヤ (ゴム) */
    tire: new THREE.MeshStandardMaterial({
        color: 0x18191b,
        metalness: 0.1,
        roughness: 0.9,
    }),

    /** 脚 / メタル部 */
    strut: new THREE.MeshStandardMaterial({
        color: 0x9aa0a6,
        metalness: 0.85,
        roughness: 0.35,
    }),

    /** 国籍マーク用の赤 (ソ連赤星) */
    redStar: new THREE.MeshStandardMaterial({
        color: 0xcc2222,
        metalness: 0.2,
        roughness: 0.6,
    }),

    /** パイロットのフライトスーツ (オリーブ〜グレー布地) */
    pilotSuit: new THREE.MeshStandardMaterial({
        color: 0x4a5447,
        metalness: 0.05,
        roughness: 0.9,
    }),

    /** パイロットのヘルメット (白〜ライトグレーの硬質シェル) */
    helmet: new THREE.MeshStandardMaterial({
        color: 0xd8dcdf,
        metalness: 0.2,
        roughness: 0.5,
    }),

    /** ヘルメットバイザー (暗いスモークガラス) */
    visor: new THREE.MeshStandardMaterial({
        color: 0x14181c,
        metalness: 0.6,
        roughness: 0.2,
    }),

    /** ミサイル本体 (ソ連空対空ミサイルのライトグレー) */
    missileBody: new THREE.MeshStandardMaterial({
        color: 0xc9ccd0,
        metalness: 0.35,
        roughness: 0.5,
    }),

    /** ミサイル フィン/シーカー (ダークグレー) */
    missileFin: new THREE.MeshStandardMaterial({
        color: 0x40444a,
        metalness: 0.55,
        roughness: 0.45,
    }),

    /** 赤外線シーカー窓 (R-3S/R-60 のガラスシーカー — 半透明の暗色) */
    seekerGlass: new THREE.MeshStandardMaterial({
        color: 0x2a3038,
        metalness: 0.4,
        roughness: 0.15,
        emissive: 0x101418,
        emissiveIntensity: 0.4,
    }),

    /** パイロン (兵装架) — 機体下面色に近いメタル */
    pylon: new THREE.MeshStandardMaterial({
        color: 0x7a8086,
        metalness: 0.6,
        roughness: 0.45,
    }),

    /** 増槽 (ドロップタンク) — 機体色に合わせたシルバー */
    fuelTank: new THREE.MeshStandardMaterial({
        color: 0xaeb3b8,
        metalness: 0.55,
        roughness: 0.45,
    }),
};

/** ヒットボックス可視化用の半透明ワイヤーマテリアル */
export function makeHitboxMaterial() {
    return new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        wireframe: true,
        transparent: true,
        opacity: 0.6,
    });
}
