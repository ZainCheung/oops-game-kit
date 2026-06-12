import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { DemoEcsUtil } from './DemoEcsUtil';
import { DemoEntity, DemoPosComp, ensureDemoTypesRegistered } from './DemoEcsTypes';

/** 多世界隔离：world / inWorld / 独立实体表与 eid */
export function runDemoMultiWorld(): void {
    DemoEcsUtil.section('多世界隔离');
    ensureDemoTypesRegistered();
    ecs.world.clear();
    ecs.world.remove('demo_battle');

    const mainHero = ecs.getEntity(DemoEntity);
    mainHero.add(DemoPosComp).x = 1;

    const battle = ecs.world.get('demo_battle');
    const battleHero = ecs.getEntity(DemoEntity, battle);
    battleHero.add(DemoPosComp).x = 99;

    DemoEcsUtil.ok(`默认世界实体数=${ecs.world.default().activeEntityCount}，battle 世界=${battle.activeEntityCount}`);
    DemoEcsUtil.ok(`battle 查询 x=${ecs.query(ecs.allOf(DemoPosComp), battle)[0].get(DemoPosComp)!.x}`);

    ecs.world.inWorld('demo_battle', () => {
        DemoEcsUtil.log(`inWorld 内当前世界=${ecs.world.current.name}`);
        ecs.getEntity(DemoEntity);
    });
    DemoEcsUtil.ok(`inWorld 结束后还原默认世界 name=${ecs.world.current.name}`);

    ecs.world.clear(battle);
    ecs.world.remove('demo_battle');
    DemoEcsUtil.ok('清理并移除 battle 世界，默认世界不受影响');
}
