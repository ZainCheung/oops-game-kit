import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { DemoEcsUtil } from './DemoEcsUtil';
import { DemoEntity, DemoPosComp, ensureDemoTypesRegistered } from './DemoEcsTypes';

/** 系统依赖调度：executeBefore / executeAfter 拓扑排序 */
export function runDemoSystemScheduling(): void {
    DemoEcsUtil.section('系统依赖调度');
    ensureDemoTypesRegistered();
    ecs.world.clear();

    const order: string[] = [];
    class DemoInputSys extends ecs.ComblockSystem implements ecs.ISystemUpdate {
        filter() { return ecs.allOf(DemoPosComp); }
        update() { order.push('input'); }
    }
    @ecs.system.executeAfter(DemoInputSys)
    @ecs.system.executeBefore('DemoCollisionSys')
    class DemoMoveSys extends ecs.ComblockSystem implements ecs.ISystemUpdate {
        filter() { return ecs.allOf(DemoPosComp); }
        update() { order.push('move'); }
    }
    class DemoCollisionSys extends ecs.ComblockSystem implements ecs.ISystemUpdate {
        filter() { return ecs.allOf(DemoPosComp); }
        update() { order.push('collision'); }
    }

    const world = ecs.world.default();
    world.root.add(new DemoCollisionSys());
    world.root.add(new DemoMoveSys());
    world.root.add(new DemoInputSys());
    const e = ecs.getEntity(DemoEntity);
    e.add(DemoPosComp);
    world.root.init();
    world.root.execute(0.016);

    DemoEcsUtil.ok(`乱序添加后执行顺序: ${order.join(' → ')}`);
    world.root.clear();
}
