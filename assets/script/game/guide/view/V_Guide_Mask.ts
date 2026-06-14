import { Component, EventTouch, instantiate, Node, Prefab, UITransform, v2, Widget, _decorator } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { ViewUtil } from 'db://oops-framework/core/utils/ViewUtil';
import type { M_Guide_Main } from '../model/M_Guide_Main';
import { PolygonMask } from './PolygonMask';

const { ccclass } = _decorator;

/** 新手引导遮罩逻辑 */
@ccclass('V_Guide_Mask')
export class V_Guide_Mask extends Component {
    private model: M_Guide_Main = null!;
    private bg: Node = null!;
    private mask: Node = null!;
    private maskPm: PolygonMask = null!;
    private maskWidget: Widget = null!;

    /** 初始化 */
    init(model: M_Guide_Main) {
        this.model = model;
    }

    start() {
        const prefab: Prefab = oops.res.get(this.model.resMask, Prefab)!;
        this.mask = instantiate(prefab);
        this.mask.parent = this.node;
        this.bg = this.mask.getChildByName('bg')!;
        this.maskPm = this.mask.getComponent(PolygonMask)!;
        this.maskWidget = this.bg.getComponent(Widget)!;
        this.node.active = false;
    }

    /** 显示引导 */
    show() {
        this.node.active = true;
        this.maskWidget.target = this.node;
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.maskPm.draw();
    }

    /** 隐藏引导 */
    hide() {
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.active = false;
    }

    /** 绘制遮罩 */
    draw(btn: Node) {
        // 定义规制区域的位置
        const leftTop = this.maskPm.polygon.points[0];
        const leftBottom = this.maskPm.polygon.points[3];
        const rightTop = this.maskPm.polygon.points[2];
        const rightBottom = this.maskPm.polygon.points[1];

        // 绘制引导可点击区域
        const uit = btn.getComponent(UITransform)!;
        const size = this.node.getComponent(UITransform)!.contentSize;
        const widthHalf = size.width / 2;
        const heightHalf = size.height / 2;

        const leftX = uit.contentSize.width * uit.anchorX;
        const rightX = uit.contentSize.width * (1 - uit.anchorX);
        const leftY = uit.contentSize.height * uit.anchorY;
        const rightY = uit.contentSize.height * (1 - uit.anchorY);

        leftTop.x = btn.worldPosition.x - widthHalf - leftX;
        leftTop.y = btn.worldPosition.y - heightHalf - leftY;
        leftBottom.x = btn.worldPosition.x - widthHalf - leftX;
        leftBottom.y = btn.worldPosition.y - heightHalf + rightY;
        rightTop.x = btn.worldPosition.x - widthHalf + rightX;
        rightTop.y = btn.worldPosition.y - heightHalf + rightY;
        rightBottom.x = btn.worldPosition.x - widthHalf + rightX;
        rightBottom.y = btn.worldPosition.y - heightHalf - leftY;

        this.show();
    }

    /** 事件模拟触发目标按钮触摸事件 */
    private onTouchEnd(event: EventTouch) {
        const btn = this.model.current;
        if (btn) {
            let touchPos = ViewUtil.calculateScreenPosToSpacePos(event, this.node);
            touchPos = ViewUtil.calculateASpaceToBSpacePos(this.node, btn.parent!, touchPos);
            const uiPos = v2(touchPos.x, touchPos.y);

            // 判断触摸点是否在按钮上
            const rect = btn.getComponent(UITransform)!.getBoundingBox();
            if (rect.contains(uiPos)) {
                btn.dispatchEvent(event);
            }
        }
    }
}
