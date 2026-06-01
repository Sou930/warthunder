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

    /** アフターバーナー内部の発光 */
    afterburner: new THREE.MeshStandardMaterial({
        color: 0xff6622,
        emissive: 0xff4400,
        emissiveIntensity: 1.2,
        metalness: 0.2,
        roughness: 0.7,
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
