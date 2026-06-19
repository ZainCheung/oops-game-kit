import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { DemoEcsUtil } from './DemoEcsUtil';
import { DemoEntity, DemoPosComp, DemoTagComp, ensureDemoTypesRegistered } from './DemoEcsTypes';

/** 被动模式：只实现 entityEnter/entityRemove，不每帧 update */
export function runDemoPassiveSystem(): void {
    DemoEcsUtil.section('被动模式（仅 entityEnter/entityRemove）');
    ensureDemoTypesRegistered();
    ecs.world.clear();

    let enterCount = 0;
    let removeCount = 0;
    class IndexSystem extends ecs.ComblockSystem
        implements ecs.IEntityEnterSystem, ecs.IEntityRemoveSystem {
        filter() { return ecs.allOf(DemoPosComp, DemoTagComp); }
        entityEnter(): void { enterCount++; }
        entityRemove(): void { removeCount++; }
    }

    const world = ecs.world.default();
    world.root.add(new IndexSystem());
    const e = ecs.getEntity(DemoEntity);
    e.add(DemoPosComp);
    e.add(DemoTagComp);
    world.root.init();

    world.root.execute(0.016);
    DemoEcsUtil.ok(`entityEnter=${enterCount}（未实现 update，不每帧遍历）`);

    e.remove(DemoTagComp);
    world.root.execute(0.016);
    DemoEcsUtil.ok(`entityRemove=${removeCount}`);
    world.root.clear();
}
