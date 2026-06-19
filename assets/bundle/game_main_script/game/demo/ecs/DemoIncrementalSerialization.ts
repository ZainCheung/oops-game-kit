import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { DemoEcsUtil } from './DemoEcsUtil';
import { DemoEntity, DemoPosComp, DemoVelComp, ensureDemoTypesRegistered } from './DemoEcsTypes';

/** 增量序列化：snapshot / computeDelta / applyDelta */
export function runDemoIncrementalSerialization(): void {
    DemoEcsUtil.section('增量序列化');
    ensureDemoTypesRegistered();
    ecs.world.clear();

    const hero = ecs.getEntity(DemoEntity);
    hero.add(DemoPosComp).x = 1;
    const mob = ecs.getEntity(DemoEntity);
    mob.add(DemoPosComp);

    const snap0 = ecs.serialize.snapshot();
    const idle = ecs.serialize.computeDelta(snap0);
    DemoEcsUtil.ok(`无变更时 added=${idle.delta.added.length}, changed=${idle.delta.changed.length}`);

    hero.get(DemoPosComp)!.x = 99;
    hero.add(DemoVelComp);
    const boss = ecs.getEntity(DemoEntity);
    boss.add(DemoPosComp).x = 5;
    const mobEid = mob.eid;
    mob.destroy();

    const { delta } = ecs.serialize.computeDelta(snap0);
    DemoEcsUtil.ok(`变更后 added=${delta.added.length}, removed=${delta.removed.length}, changed=${delta.changed.length}`);
    DemoEcsUtil.logData('删除的 eid', mobEid);

    ecs.serialize.applyDelta({
        version: 1,
        added: [],
        removed: [],
        changed: [{ eid: hero.eid, upserted: [{ type: 'DemoPos', data: { x: 123, y: 0 } }] }]
    });
    DemoEcsUtil.ok(`applyDelta changed 后 hero.x=${hero.get(DemoPosComp)!.x}`);
}
