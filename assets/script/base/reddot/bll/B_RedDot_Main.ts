import type { Node } from 'cc';
import { isValid } from 'cc';
import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { EM_RedDotType } from '../model/enum/EM_RedDot';
import type { IM_RedDot_Node } from '../model/interface/IM_RedDot_Node';
import type { RedDot } from '../RedDot';
import { V_RedDot_View } from '../view/V_RedDot_View';

/** 分隔符号 */
const Separator = '/';

/**
 * 红点逻辑代码
 * 1、实现功能的业务逻辑代码
 * 2、实现功能逻辑代码分离（如果业务复杂可选用 ecs.ComblockSystem 分离逻辑代码)
 */
export class B_RedDot_Main extends CCBusiness<RedDot> {
    /** 初始化红点数据结构 */
    protected init() {
        const model = this.ent.M_RedDot_Model;
        model.config = { Root: 'Root' };

        if (this.repeat(model.config)) {
            console.warn('【红点】配置数据重复，请检查');
        }

        // 重复配置检查
        const keys = Object.keys(model.config);
        for (const key of keys) {
            const name = model.config[key];
            const info: IM_RedDot_Node = { path: name, count: 0, type: 0, node: null! };
            model.rdns.set(name, info);
        }
    }

    /**
     * 注册红点显示对象
     * @param path 配置名称，例如 root/bag
     * @param node 红点所在节点
     * @param type 显示方式
     */
    bind(path: string, node: Node, type: EM_RedDotType = EM_RedDotType.Default) {
        const rdn = this.find(path);
        if (!rdn) {
            console.warn(`【红点】找不到名为【${path}】的信息`);
            return;
        }
        rdn.node = node;
        rdn.type = type;

        // 设置时先主动触发一次
        this.update(path, rdn.count, true);
    }

    /**
     * 更新红点数量
     * @param path    更新红点配置名称
     * @param count   红点数量 / 红点数量变化量
     * @param assign  是否直接赋值，默认true; false:变化量，true:直接赋值
     */
    update(path: string, count = 0, assign = true) {
        let rdn = this.find(path);
        if (!rdn) {
            console.warn(`【红点】找不到名为【${path}】的信息`);
            return;
        }

        if (assign) count -= rdn.count;
        if (count < 0 && rdn.count + count < 0) count = -rdn.count;

        // 更新红点树
        const names = this.split(path);
        names.forEach((name) => {
            rdn = this.find(name);
            if (rdn) {
                rdn.count += count;
                if (!isValid(rdn.node, true)) {
                    rdn.node = null!;
                }
                else {
                    const rdv = rdn.node.getComponent(V_RedDot_View)!;
                    rdv.setState(rdn);
                }
            }
            else {
                console.warn(`【红点】树结构名称错误，请检查节点命名【${name}】`);
            }
        });
    }

    /** 查找指定路径红点数据 */
    find(path: string): IM_RedDot_Node | undefined {
        if (!path) {
            console.warn(`【红点】查询【${path}】节点无效`);
            return undefined;
        }

        const model = this.ent.M_RedDot_Model;
        const info = model.rdns.get(path);
        if (!info) {
            console.warn(`【红点】未找到【${path}】的节点`);
            return undefined;
        }
        return info;
    }

    /** 判断对象中是否存在重复的值 */
    repeat(obj: any): boolean {
        const values = new Set();
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key];
                if (values.has(value)) {
                    console.warn(`【红点】配置项重复【${value}】`);
                    return true;
                }
                values.add(value);
            }
        }
        return false;
    }

    /** 组合路径 */
    split(path: string): string[] {
        const result: string[] = [];
        const segments = path.split(Separator);
        let accumulated = '';
        for (let i = 0; i < segments.length; i++) {
            accumulated += segments[i];
            result.push(accumulated);
            if (i < segments.length - 1) {
                accumulated += Separator;
            }
        }
        return result;
    }
}
