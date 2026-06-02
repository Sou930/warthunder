import * as THREE from 'three';

/**
 * materials.js — F-4E Phantom II で共有するマテリアル定義。
 *
 * パーツ間で見た目を統一するために共通マテリアルを集約。
 * 将来テクスチャを textures/ に追加した際は、ここで
 * map / normalMap を差し替えるだけで全パーツに反映できる。
 *
 * F-4 は USAF SEA (South-East Asia) 迷彩を想定し、上面は 2 色の
 * グリーン + タン、下面はライトグレーという「ベトナム迷彩」基調で
 * 各パーツを塗り分け、より実機らしいリアリティを与える。
 */

export const Materials = {
    /** 機体本体・上面 (SEA迷彩 ダークグリーン) */
    body: new THREE.MeshStandardMaterial({
        color: 0x3d4a35,
        metalness: 0.25,
        roughness: 0.62,
    }),

    /** 上面 迷彩 ミディアムグリーン (パネル/翼面の塗り分け) */
    camoGreen: new THREE.MeshStandardMaterial({
        color: 0x556140,
        metalness: 0.22,
        roughness: 0.65,
    }),

    /** 上面 迷彩 タン (ブラウン系) */
    camoTan: new THREE.MeshStandardMaterial({
        color: 0x7a6a45,
        metalness: 0.2,
        roughness: 0.68,
    }),

    /** 機体下面 (ライトガルグレー) */
    underside: new THREE.MeshStandardMaterial({
        color: 0xb9bcc0,
        metalness: 0.3,
        roughness: 0.55,
    }),

    /** より暗いグレー (パネルシェーディング・ダーク部・補強板) */
    bodyDark: new THREE.MeshStandardMaterial({
        color: 0x2c322a,
        metalness: 0.35,
        roughness: 0.6,
    }),

    /** パネルライン / スジ彫りの陰影 (細い溝の色) */
    panelLine: new THREE.MeshStandardMaterial({
        color: 0x1c211a,
        metalness: 0.3,
        roughness: 0.7,
    }),

    /** 無塗装金属パネル (エンジン周り・排気付近の焼け) */
    bareMetal: new THREE.MeshStandardMaterial({
        color: 0x8a8d92,
        metalness: 0.9,
        roughness: 0.35,
    }),

    /** インテークの内壁 (黒) */
    intake: new THREE.MeshStandardMaterial({
        color: 0x0e0f12,
        metalness: 0.5,
        roughness: 0.7,
        side: THREE.DoubleSide,
    }),

    /** インテーク内部の白 (実機は内壁が白塗装) */
    intakeWhite: new THREE.MeshStandardMaterial({
        color: 0xd8dadc,
        metalness: 0.1,
        roughness: 0.5,
        side: THREE.DoubleSide,
    }),

    /** レドーム (ノーズレドーム — 黒に近いダークグレー樹脂) */
    radome: new THREE.MeshStandardMaterial({
        color: 0x222428,
        metalness: 0.1,
        roughness: 0.55,
    }),

    /** キャノピーガラス (半透明・薄い青み) */
    canopy: new THREE.MeshPhysicalMaterial({
        color: 0x9fc6d6,
        metalness: 0.0,
        roughness: 0.04,
        transmission: 0.85,
        transparent: true,
        opacity: 0.5,
        ior: 1.46,
        thickness: 0.3,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        side: THREE.DoubleSide,
    }),

    /** キャノピーフレーム */
    frame: new THREE.MeshStandardMaterial({
        color: 0x23262a,
        metalness: 0.55,
        roughness: 0.5,
    }),

    /** コックピット内装 (黒に近いグレー) */
    cockpitInterior: new THREE.MeshStandardMaterial({
        color: 0x16181b,
        metalness: 0.2,
        roughness: 0.85,
    }),

    /** エンジンノズル (焼けた金属・チタン色) */
    nozzle: new THREE.MeshStandardMaterial({
        color: 0x4a4640,
        metalness: 0.92,
        roughness: 0.4,
    }),

    /** ノズル後部の焼け (青〜紫がかった熱処理色) */
    nozzleBurnt: new THREE.MeshStandardMaterial({
        color: 0x6b5560,
        metalness: 0.85,
        roughness: 0.5,
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
        color: 0x141517,
        metalness: 0.05,
        roughness: 0.92,
    }),

    /** ホイールハブ (塗装メタル) */
    wheelHub: new THREE.MeshStandardMaterial({
        color: 0x6e7378,
        metalness: 0.7,
        roughness: 0.4,
    }),

    /** 脚 / メタル部 (オレオ・無塗装スチール) */
    strut: new THREE.MeshStandardMaterial({
        color: 0xaeb2b6,
        metalness: 0.9,
        roughness: 0.3,
    }),

    /** 降着装置ベイ内部 (白塗装) */
    gearBayWhite: new THREE.MeshStandardMaterial({
        color: 0xe2e4e6,
        metalness: 0.15,
        roughness: 0.55,
        side: THREE.DoubleSide,
    }),

    /** パイロットのフライトスーツ (オリーブ〜グレー布地) */
    pilotSuit: new THREE.MeshStandardMaterial({
        color: 0x46503f,
        metalness: 0.05,
        roughness: 0.9,
    }),

    /** パイロットの Gスーツ/ハーネス (濃い色) */
    pilotHarness: new THREE.MeshStandardMaterial({
        color: 0x2a2c24,
        metalness: 0.1,
        roughness: 0.85,
    }),

    /** パイロットのヘルメット (白〜ライトグレーの硬質シェル) */
    helmet: new THREE.MeshStandardMaterial({
        color: 0xdfe2e4,
        metalness: 0.25,
        roughness: 0.4,
    }),

    /** ヘルメットバイザー (暗いスモークガラス・反射) */
    visor: new THREE.MeshStandardMaterial({
        color: 0x101418,
        metalness: 0.7,
        roughness: 0.12,
    }),

    /** ミサイル本体 (白) */
    missileBody: new THREE.MeshStandardMaterial({
        color: 0xdadcde,
        metalness: 0.3,
        roughness: 0.5,
    }),

    /** ミサイル フィン/シーカー (ダークグレー) */
    missileFin: new THREE.MeshStandardMaterial({
        color: 0x44484c,
        metalness: 0.5,
        roughness: 0.45,
    }),

    /** 増槽 (ドロップタンク) — 機体下面色に合わせたグレー */
    fuelTank: new THREE.MeshStandardMaterial({
        color: 0xaeb1b6,
        metalness: 0.35,
        roughness: 0.5,
    }),

    /** 翼端・尾翼の航法灯/フォーメーションライト (発光) */
    navLightRed: new THREE.MeshStandardMaterial({
        color: 0xff2a2a,
        emissive: 0xff0000,
        emissiveIntensity: 0.8,
        roughness: 0.4,
    }),
    navLightGreen: new THREE.MeshStandardMaterial({
        color: 0x2aff5a,
        emissive: 0x00ff33,
        emissiveIntensity: 0.8,
        roughness: 0.4,
    }),
};

/**
 * 塗装スキーム定義 — SEA迷彩 (ベトナム) と 無塗装メタル/エアスペリオリティ
 * の 2 種を切り替えられるよう、対象マテリアルごとの色を保持する。
 *
 * setCamoScheme() がこのテーブルを参照して Materials の color を上書きする。
 *   - sea  : USAF SEA 3色迷彩 (ダーク/ミディアムグリーン + タン + ライトグレー下面)
 *   - bare : 迷彩オフ (無塗装ジュラルミン / ガルグレー基調の単色)
 */
export const CamoSchemes = {
    sea: {
        body:      0x3d4a35, // ダークグリーン (上面主色)
        camoGreen: 0x556140, // ミディアムグリーン
        camoTan:   0x7a6a45, // タン
        underside: 0xb9bcc0, // ライトガルグレー (下面)
    },
    bare: {
        // 迷彩オフ: 無塗装ジュラルミン風シルバー基調の単色塗装
        body:      0xb4bac0,
        camoGreen: 0xa9b0b6,
        camoTan:   0x9ea6ad,
        underside: 0xc6cace,
    },
};

/**
 * 指定スキームの色を Materials の該当マテリアルへ適用する。
 * @param {"sea"|"bare"} schemeName
 */
export function setCamoScheme(schemeName) {
    const scheme = CamoSchemes[schemeName] || CamoSchemes.sea;
    for (const key of Object.keys(scheme)) {
        if (Materials[key]) Materials[key].color.setHex(scheme[key]);
    }
}

/** ヒットボックス可視化用の半透明ワイヤーマテリアル */
export function makeHitboxMaterial() {
    return new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        wireframe: true,
        transparent: true,
        opacity: 0.6,
    });
}
