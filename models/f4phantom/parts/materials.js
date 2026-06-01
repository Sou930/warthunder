import * as THREE from 'three';

/**
 * materials.js — F-4E Phantom II で共有するマテリアル定義。
 *
 * パーツ間で見た目を統一するために共通マテリアルを集約。
 * 将来テクスチャを textures/ に追加した際は、ここで
 * map / normalMap を差し替えるだけで全パーツに反映できる。
 *
 * F-4 は USN/USAF 運用機を想定し、ライトガル・グレー基調の
 * 迷彩塗装をマテリアルで表現する (MiG-21 の無塗装シルバーとは対照的)。
 */

export const Materials = {
    /** 機体本体 (USN/USAF 迷彩グレー) */
    body: new THREE.MeshStandardMaterial({
        color: 0x7d8691,
        metalness: 0.65,
        roughness: 0.5,
    }),

    /** より暗いグレー (機体下面・パネルシェーディング・迷彩のダーク部) */
    bodyDark: new THREE.MeshStandardMaterial({
        color: 0x5a6068,
        metalness: 0.6,
        roughness: 0.55,
    }),

    /** インテークの内壁 (黒) */
    intake: new THREE.MeshStandardMaterial({
        color: 0x141619,
        metalness: 0.55,
        roughness: 0.65,
        side: THREE.DoubleSide,
    }),

    /** レドーム (ノーズレドーム — やや暗いグレー樹脂) */
    radome: new THREE.MeshStandardMaterial({
        color: 0x4f555c,
        metalness: 0.2,
        roughness: 0.6,
    }),

    /** キャノピーガラス (半透明・薄い青み) */
    canopy: new THREE.MeshPhysicalMaterial({
        color: 0xa7d2e0,
        metalness: 0.0,
        roughness: 0.06,
        transmission: 0.8,
        transparent: true,
        opacity: 0.55,
        ior: 1.45,
        thickness: 0.3,
        side: THREE.DoubleSide,
    }),

    /** キャノピーフレーム */
    frame: new THREE.MeshStandardMaterial({
        color: 0x2e3236,
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
