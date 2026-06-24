import { _decorator } from 'cc';
import { gui } from 'db://oops-framework/core/gui/Gui';
import { LayerType } from 'db://oops-framework/core/gui/layer/LayerEnum';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCView } from 'db://oops-framework/module/common/CCView';
import { World } from '../World';

const { ccclass, property } = _decorator;

/** VC_World_Main 界面视图组件 */
@ccclass('VC_World_Main')
@ecs.register('VC_World_Main', false)
@gui.register('VC_World_Main', { layer: LayerType.UI, prefab: 'gui/world/prefab/VC_World_Main' })
export class VC_World_Main extends CCView<World> {
    start() {

    }

    /** 释放内存 */
    reset() {

    }
}
