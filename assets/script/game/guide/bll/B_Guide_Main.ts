import { Node } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import type { Guide } from '../Guide';
import { GuideEventName } from '../GuideEvent';

/** 引导主业务逻辑 */
export class B_Guide_Main extends CCBusiness<Guide> {
    //#region 对外 API（供 View 层直接调用）
    /** 注册引导项 */
    register(step: number, node: Node): void {
        this.ent.M_Guide_Main.guides.set(step, node);
    }

    /** 检查指定引导是否触发 */
    check(step?: number): void {
        if (step !== undefined) {
            this.ent.M_Guide_Main.step = step;
        }
        this.checkInternal();
    }

    /** 下一个引导 */
    next(): void {
        this.ent.M_Guide_Main.step++;
        oops.log.logBusiness(`验证下一个引导【${this.ent.M_Guide_Main.step}】`, 'Guide');

        if (this.ent.M_Guide_Main.step > this.ent.M_Guide_Main.last) {
            this.event.emit(GuideEventName.UIHide, {});
            this.ent.destroy();
            oops.log.logBusiness(`全部结束`, 'Guide');
        } 
        else {
            this.checkInternal();
        }
    }

    /** 刷新引导位置 */
    refresh(): void {
        const btn = this.ent.M_Guide_Main.current;
        if (btn) {
            this.event.emit(GuideEventName.UIDraw, { node: btn });
            this.event.emit(GuideEventName.UIShowPrompt, { node: btn });
        }
    }
    //#endregion

    //#region 内部逻辑
    /** 验证当前引导 */
    private checkInternal(): void {
        const model = this.ent.M_Guide_Main;
        // 延时处理是为了避免与cc.Widget组件冲突
        setTimeout(() => {
            const btn = model.guides.get(model.step);
            if (btn == null) {
                this.event.emit(GuideEventName.UIHide, {});
                oops.log.logBusiness(`暂无引导`, 'Guide');
            } 
            else {
                this.event.emit(GuideEventName.UIDraw, { node: btn });
                this.event.emit(GuideEventName.UIShowPrompt, { node: btn });
            }
        });
    }
    //#endregion
}
