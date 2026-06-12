import { ecs } from 'db://oops-framework/libs/ecs/ECS';

import { DemoEcsUtil } from './DemoEcsUtil';

import { DemoEntity, DemoPosComp, DemoVelComp, ensureDemoTypesRegistered } from './DemoEcsTypes';



const BATTLE_WORLD = 'demo_battle_sys';



/** 多世界系统隔离：每世界伴生 RootSystem + 在对应世界上下文中 add 的系统 */

export function runDemoMultiWorldSystem(): void {

    DemoEcsUtil.section('多世界系统隔离');

    ensureDemoTypesRegistered();

    ecs.world.clear();

    ecs.world.remove(BATTLE_WORLD);



    const mainWorld = ecs.world.default();

    const battle = ecs.world.get(BATTLE_WORLD);



    let mainUpdateCount = 0;

    let battleUpdateCount = 0;

    class MoveSystem extends ecs.ComblockSystem implements ecs.ISystemUpdate {

        constructor(private readonly onTick: () => void) { super(); }

        filter() { return ecs.allOf(DemoPosComp, DemoVelComp); }

        update(e: ecs.Entity): void {

            const p = e.get(DemoPosComp)!;

            const v = e.get(DemoVelComp)!;

            p.x += v.dx;

            this.onTick();

        }

    }



    // 系统须在所属世界的上下文中 new，group 才会跟踪该世界的实体

    mainWorld.root.add(new MoveSystem(() => mainUpdateCount++));

    ecs.world.inWorld(battle, () => {

        battle.root.add(new MoveSystem(() => battleUpdateCount++));

    });



    // 默认世界实体（dx=10）

    const mainHero = ecs.getEntity(DemoEntity);

    mainHero.add(DemoPosComp).x = 0;

    mainHero.add(DemoVelComp).dx = 10;



    // battle 世界实体（dx=100）

    const battleHero = ecs.getEntity(DemoEntity, battle);

    battleHero.add(DemoPosComp).x = 0;

    battleHero.add(DemoVelComp).dx = 100;



    mainWorld.root.init(false);

    battle.root.init(false);



    const mainXBefore = mainHero.get(DemoPosComp)!.x;

    const battleXBefore = battleHero.get(DemoPosComp)!.x;



    mainWorld.root.execute(0.016);

    battle.root.execute(0.016);



    DemoEcsUtil.ok(`默认世界 update=${mainUpdateCount} 次，x: ${mainXBefore} → ${mainHero.get(DemoPosComp)!.x}`);

    DemoEcsUtil.ok(`battle 世界 update=${battleUpdateCount} 次，x: ${battleXBefore} → ${battleHero.get(DemoPosComp)!.x}`);

    DemoEcsUtil.ok('各世界只驱动本世界实体，互不干扰');



    // 反例：默认世界再执行也不会改动 battle 实体

    const battleXAfterFirst = battleHero.get(DemoPosComp)!.x;

    mainWorld.root.execute(0.016);

    DemoEcsUtil.ok(

        `mainWorld 再次 execute 后 battle.x 仍为 ${battleHero.get(DemoPosComp)!.x}（=${battleXAfterFirst}，未变化）`

    );



    mainWorld.root.clear();

    battle.root.clear();

    ecs.world.clear(battle);

    ecs.world.remove(BATTLE_WORLD);



    // —— 便捷写法：用 createSystems 一行装配某世界的系统（适配动态房间）——

    DemoEcsUtil.section('多世界系统隔离（工厂装配）');

    const ROOM = 'demo_room_1001';

    ecs.world.remove(ROOM);



    let roomTick = 0;

    class RoomMoveSystem extends ecs.ComblockSystem implements ecs.ISystemUpdate {

        filter() { return ecs.allOf(DemoPosComp, DemoVelComp); }

        update(e: ecs.Entity): void {

            e.get(DemoPosComp)!.x += e.get(DemoVelComp)!.dx;

            roomTick++;

        }

    }



    // 一行完成：建世界（伴生根）+ addSystem + init

    const roomRoot = ecs.world.createSystems(ROOM, RoomMoveSystem);

    const room = ecs.world.get(ROOM);



    const roomHero = ecs.getEntity(DemoEntity, room);

    roomHero.add(DemoPosComp).x = 0;

    roomHero.add(DemoVelComp).dx = 7;



    roomRoot.execute(0.016);

    DemoEcsUtil.ok(`createSystems 装配后 room update=${roomTick} 次，x → ${roomHero.get(DemoPosComp)!.x}`);



    roomRoot.clear();

    ecs.world.clear(room);

    ecs.world.remove(ROOM);

}


