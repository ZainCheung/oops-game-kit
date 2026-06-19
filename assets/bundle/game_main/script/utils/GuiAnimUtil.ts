import type { Node } from 'cc';
import { tween, Vec3 } from 'cc';
import type { UIParam } from 'db://oops-framework/core/gui/layer/LayerUIElement';

export class GuiAnimUtil {
    /** 获取通用窗口动画界面参数 */
    static getAnimUIParam(): UIParam {
        return {
            onAdded: this.onAddedAnim,
            onBeforeRemove: this.onBeforeRemoveAnim
        };
    }

    /** 打开窗口动画 */
    private static onAddedAnim(node: Node) {
        node.setScale(0.1, 0.1, 0.1);
        tween(node)
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    /** 关闭窗口动画 */
    private static onBeforeRemoveAnim(node: Node, next: Function) {
        tween(node)
            .to(0.2, { scale: new Vec3(0.1, 0.1, 0.1) })
            .call((target, data) => {
                next();
            })
            .start();
    }
}
