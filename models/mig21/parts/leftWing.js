import { Wing } from './wing.js';

/**
 * LeftWing — 左デルタ翼。
 * Wing 基底クラスを "left" でインスタンス化するだけのラッパー。
 * 独立モジュールにしておくことで、将来左翼だけ被弾欠損させる等の
 * 個別拡張がしやすい (DamageSystem)。
 */
export class LeftWing extends Wing {
    constructor(options = {}) {
        super('left', options);
    }
}
