import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { DemoEcsUtil } from './DemoEcsUtil';
import { DemoEntity, DemoPosComp, DemoTagComp, DemoVelComp, ensureDemoTypesRegistered } from './DemoEcsTypes';

/** 响应式查询：allOf / anyOf / excludeOf */
export function runDemoQuery(): void {
    DemoEcsUtil.section('响应式查询');
    ensureDemoTypesRegistered();
    ecs.world.clear();

    const mover = ecs.getEntity(DemoEntity);
    mover.add(DemoPosComp);
    mover.add(DemoVelComp);

    const tagged = ecs.getEntity(DemoEntity);
    tagged.add(DemoPosComp);
    tagged.add(DemoTagComp);

    const staticOne = ecs.getEntity(DemoEntity);
    staticOne.add(DemoPosComp);

    const allMoving = ecs.query(ecs.allOf(DemoPosComp, DemoVelComp));
    DemoEcsUtil.ok(`allOf(Pos, Vel) 命中 ${allMoving.length} 个实体`);

    const anyTagged = ecs.query(ecs.anyOf(DemoTagComp));
    DemoEcsUtil.ok(`anyOf(Tag) 命中 ${anyTagged.length} 个实体`);

    const noVel = ecs.query(ecs.allOf(DemoPosComp).excludeOf(DemoVelComp));
    DemoEcsUtil.ok(`allOf(Pos).excludeOf(Vel) 命中 ${noVel.length} 个实体（静止物体）`);
}
