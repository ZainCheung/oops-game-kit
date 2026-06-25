import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { DemoEcsUtil } from './DemoEcsUtil';
import { DemoEntity, DemoPosComp, ensureDemoTypesRegistered } from './DemoEcsTypes';

/** 间隔执行：ComblockSystem.interval 按固定时间间隔触发，不必每帧 */
export function runDemoIntervalSystem(): void {
    DemoEcsUtil.section('间隔执行 interval');
    ensureDemoTypesRegistered();
    ecs.world.clear();

    let runCount = 0;
    let lastDt = 0;
    class TickSystem extends ecs.ComblockSystem implements ecs.ISystemUpdate {
        constructor() {
            super(); this.interval = 0.5;
        }
        filter() {
            return ecs.allOf(DemoPosComp);
        }
        update(): void {
            runCount++;
            lastDt = (this as { dt: number }).dt;
        }
    }

    const world = ecs.world.default();
    world.root.add(new TickSystem());
    const e = ecs.getEntity(DemoEntity);
    e.add(DemoPosComp);
    world.root.init();

    world.root.execute(0.2);
    world.root.execute(0.2);
    DemoEcsUtil.ok(`累计 0.4s < 0.5s，未触发 runCount=${runCount}`);

    world.root.execute(0.2);
    DemoEcsUtil.ok(`累计 0.6s 触发一次 runCount=${runCount}, dt≈${lastDt.toFixed(2)}`);
    world.root.clear();
}
