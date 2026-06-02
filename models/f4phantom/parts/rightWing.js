import { Wing } from './wing.js';

/**
 * RightWing — 右主翼。
 * Wing 基底クラスを "right" でインスタンス化するラッパー。
 */
export class RightWing extends Wing {
    constructor(options = {}) {
        super('right', options);
    }
}
