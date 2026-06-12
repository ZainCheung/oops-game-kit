import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { DemoEcsUtil } from './DemoEcsUtil';
import { DemoEntity, DemoPosComp, DemoRefComp, ensureDemoTypesRegistered } from './DemoEcsTypes';

/** EntityRef：组件安全持有实体引用，目标销毁自动置空 */
export function runDemoEntityRef(): void {
    DemoEcsUtil.section('EntityRef 实体引用');
    ensureDemoTypesRegistered();
    ecs.world.clear();

    const holder = ecs.getEntity(DemoEntity);
    const ref = holder.add(DemoRefComp);
    const target = ecs.getEntity(DemoEntity);
    target.add(DemoPosComp);

    ref.target = target;
    DemoEcsUtil.ok(`设置引用 target.eid=${target.eid}，追踪数=${holder.world.refs.trackedCount}`);

    target.destroy();
    DemoEcsUtil.ok(`目标销毁后 ref.target=${ref.target}（自动置空，杜绝悬空引用）`);
}
