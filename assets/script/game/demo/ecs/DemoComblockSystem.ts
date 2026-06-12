import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { ecsWorldManager } from 'db://oops-framework/libs/ecs/world/ECSWorldManager';
import { DemoEcsUtil } from './DemoEcsUtil';
import { DemoEntity, DemoPosComp, DemoVelComp, ensureDemoTypesRegistered } from './DemoEcsTypes';

/** 组合系统 + 根系统驱动 */
export function runDemoComblockSystem(): void {
    DemoEcsUtil.section('组合系统 ComblockSystem');
    ensureDemoTypesRegistered();
    ecs.world.clear();

    let updateCount = 0;
    class MoveSystem extends ecs.ComblockSystem implements ecs.ISystemUpdate {
        filter() { return ecs.allOf(DemoPosComp, DemoVelComp); }
        update(e: ecs.Entity): void {
            const p = e.get(DemoPosComp)!;
            const v = e.get(DemoVelComp)!;
            p.x += v.dx;
            p.y += v.dy;
            updateCount++;
        }
    }

    const e = ecs.getEntity(DemoEntity);
    e.add(DemoPosComp);
    const vel = e.add(DemoVelComp);
    vel.dx = 5;
    vel.dy = 2;

    const sys = new MoveSystem();
    e.remove(DemoVelComp);
    e.add(DemoVelComp).dx = 5;
    e.get(DemoVelComp)!.dy = 2;

    const world = ecs.world.default();
    world.root.add(sys);
    const epochBefore = ecsWorldManager.current.epoch;
    world.root.execute(0.016);

    DemoEcsUtil.ok(`RootSystem.execute 推进 epoch: ${epochBefore} → ${ecsWorldManager.current.epoch}`);
    DemoEcsUtil.ok(`update 执行 ${updateCount} 次，位置 (${e.get(DemoPosComp)!.x}, ${e.get(DemoPosComp)!.y})`);
    world.root.clear();
}
