import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { DemoEcsUtil } from './DemoEcsUtil';
import { DemoEntity, DemoPosComp, ensureDemoTypesRegistered } from './DemoEcsTypes';

/** 世代式 eid 数字句柄：悬空检测 + 句柄式组件访问 */
export function runDemoEidHandle(): void {
    DemoEcsUtil.section('世代式 eid 句柄');
    ensureDemoTypesRegistered();
    ecs.world.clear();

    const e = ecs.getEntity(DemoEntity);
    const id = e.eid;
    e.add(DemoPosComp).x = 42;

    const world = ecs.world.default();
    DemoEcsUtil.ok(`存活 eid=${id}, isEidValid=${world.isEidValid(id)}`);
    DemoEcsUtil.ok(`getComponent 句柄访问 x=${world.getComponent(id, DemoPosComp)!.x}`);

    e.destroy();
    DemoEcsUtil.ok(`销毁后 isEidValid=${world.isEidValid(id)}（悬空引用检测）`);
    DemoEcsUtil.ok(`getComponent 悬空返回 ${world.getComponent(id, DemoPosComp)}`);

    const e2 = ecs.getEntity(DemoEntity);
    DemoEcsUtil.ok(`索引复用后新 eid=${e2.eid}，与旧 eid 不同: ${e2.eid !== id}`);

    world.assignEid(e2, 888888);
    DemoEcsUtil.ok(`assignEid 恢复编号 eid=${e2.eid}`);
}
