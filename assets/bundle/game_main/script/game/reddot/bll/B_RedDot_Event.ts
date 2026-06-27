import { oops } from 'db://oops-framework/core/Oops';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import { EM_RedDotType } from '../model/enum/EM_RedDot';
import type { RedDot } from '../RedDot';
import { RedDotEventName, type IRedDotEventDataMap } from '../RedDotEvent';
import { B_RedDot_Main } from './B_RedDot_Main';

/** 红点功能事件驱动类 */
@classname('B_RedDot_Event')
export class B_RedDot_Event extends CCBusiness<RedDot> {
    /** 初始化红点数据结构 */
    protected init() {
        this.event.setEvent(
            RedDotEventName.Add,
            RedDotEventName.Remove,
            RedDotEventName.Update,
            RedDotEventName.Bind,
            RedDotEventName.Confirm);

        // 恢复红点存储状态
        this.ent.M_RedDot_Model.confirm = oops.storage.getJson('RedDot', {});
    }

    //#region 全局事件处理
    /**
    * 添加红点配置数值
    * @param event   事件名称
    * @param data    红点添加事件数据
    * @returns       true添加配置成功,false配置已存在
    */
    private onRedDotAdd<K extends RedDotEventName.Add>(event: K, data: IRedDotEventDataMap[K]): void {
        const { key, path } = data;
        if (this.ent.M_RedDot_Model.config[key] == null) {
            this.ent.M_RedDot_Model.config[key] = path;
            this.ent.M_RedDot_Model.rdns.set(path, { path: path, count: 0, type: EM_RedDotType.Default, node: null! });
        }
        else {
            console.error(`RedDot 重复添加配置【${key}】模块红点路径【${path}】`);
        }
    }

    /**
     * 移除红点配置数值
     * @param event   事件名称
     * @param data    红点移除事件数据
     */
    private onRedDotRemove<K extends RedDotEventName.Remove>(event: K, data: IRedDotEventDataMap[K]): void {
        const { key } = data;
        const path = this.ent.M_RedDot_Model.config[key];
        this.ent.M_RedDot_Model.rdns.delete(path);
        delete this.ent.M_RedDot_Model.config[key];
    }

    /**
     * 更新红点数量
     * @param event   事件名称
     * @param data    红点更新事件数据
     */
    private onRedDotUpdate<K extends RedDotEventName.Update>(event: K, data: IRedDotEventDataMap[K]): void {
        const { key, count = 0, assign = true } = data;
        if (this.ent.M_RedDot_Model.confirm[key]) return;

        const path = this.ent.M_RedDot_Model.config[key];
        this.ent.getBusiness<B_RedDot_Main>(B_RedDot_Main).update(path, count, assign);
    }

    /**
     * 绑定红点显示对象
     * @param event  事件名称
     * @param data   红点绑定事件数据
     */
    private onRedDotBind<K extends RedDotEventName.Bind>(event: K, data: IRedDotEventDataMap[K]): void {
        const { key, node, type = EM_RedDotType.Default } = data;
        const path = this.ent.M_RedDot_Model.config[key];
        this.ent.getBusiness<B_RedDot_Main>(B_RedDot_Main).bind(path, node, type);
    }

    /**
     * 红点确认逻辑
     * @param event  事件名称
     * @param data   红点确认事件数据
     */
    private onRedDotConfirm<K extends RedDotEventName.Confirm>(event: K, data: IRedDotEventDataMap[K]): void {
        const { key, save } = data;

        // 更新红点数量（count=0, assign=true，即重置为0）
        if (!this.ent.M_RedDot_Model.confirm[key]) {
            const path = this.ent.M_RedDot_Model.config[key];
            this.ent.getBusiness<B_RedDot_Main>(B_RedDot_Main).update(path, 0, true);
        }

        // 本地红点存储状态
        if (save) {
            this.ent.M_RedDot_Model.confirm[key] = 1;
            const confirm = JSON.stringify(this.ent.M_RedDot_Model.confirm);
            oops.storage.set('RedDot', confirm);
        }
    }
    //#endregion
}
