import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCEntity } from 'db://oops-framework/module/common/CCEntity';
import { B_RedDot_Event } from './bll/B_RedDot_Event';
import { B_RedDot_Main } from './bll/B_RedDot_Main';
import { M_RedDot_Model } from './model/M_RedDot_Model';

/**
 * 红点模块
 * 1、动态设置点红树结构
 * 2、注册红点显示对象
 * 3、更新红点数据
 * 4、红点节点更新
 * 5、获取指定节点红点数量
 *
 * 注：
 * 1、红点目录节点 count 设置为 0，子节点 count 设置为 1
 *
 * 红点数据结构
   {
       root: 'root',
       backpack: 'root/backpack',
       prop1: 'root/backpack/prop1'
   }
 */
/**
 * 红点模块
 * 1、动态设置点红树结构
 * 2、注册红点显示对象
 * 3、更新红点数据
 * 4、红点节点更新
 * 5、获取指定节点红点数量
 *
 * 注：
 * 1、红点目录节点 count 设置为 0，子节点 count 设置为 1
 *
 * 红点数据结构
   {
       root: 'root',
       backpack: 'root/backpack',
       prop1: 'root/backpack/prop1'
   }
 */
@ecs.register('RedDot')
export class RedDot extends CCEntity {
    M_RedDot_Model!: M_RedDot_Model;
    B_RedDot_Main!: B_RedDot_Main;

    /** 初始添加的数据层组件 */
    protected init() {
        this.addComponents(M_RedDot_Model);
        this.addBusinesss(B_RedDot_Main, B_RedDot_Event);
    }

    /**
     * 获取红点节点数量值
     * @param path  红点节点关系，例 'root/backpack'
     * @returns     节点总数量
     */
    getCount(path: string): number {
        return this.B_RedDot_Main.find(path)?.count ?? 0;
    }
}
