import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { DemoEcsUtil } from './DemoEcsUtil';
import { DemoEntity, DemoPosComp, DemoVelComp, ensureDemoTypesRegistered } from './DemoEcsTypes';

/** 实体与组件：注册、增删查、软移除缓存 */
export function runDemoEntityComponent(): void {
    DemoEcsUtil.section('实体与组件');
    ensureDemoTypesRegistered();
    ecs.world.clear();

    const e = ecs.getEntity(DemoEntity);
    DemoEcsUtil.log(`创建实体 eid=${e.eid}, name=${e.name}`);

    const pos = e.add(DemoPosComp);
    pos.x = 10;
    pos.y = 20;
    DemoEcsUtil.ok(`add(DemoPosComp) → x=${e.get(DemoPosComp)!.x}, y=${e.get(DemoPosComp)!.y}`);
    DemoEcsUtil.ok(`has(DemoPosComp)=${e.has(DemoPosComp)}`);

    e.remove(DemoPosComp);
    DemoEcsUtil.ok(`remove 后 has(DemoPosComp)=${e.has(DemoPosComp)}`);

    const vel = e.add(DemoVelComp);
    vel.dx = 3;
    e.remove(DemoVelComp, false);
    DemoEcsUtil.log('软移除 DemoVelComp（isRecycle=false，数据缓存在实体上）');

    const vel2 = e.add(DemoVelComp);
    DemoEcsUtil.ok(`再次 add 恢复缓存 dx=${vel2.dx}`);

    e.destroy();
    DemoEcsUtil.ok('实体 destroy 完成');
}
