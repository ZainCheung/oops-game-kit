import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { DemoEcsUtil } from './DemoEcsUtil';
import { DemoEntity, DemoPosComp, DemoVelComp, ensureDemoTypesRegistered } from './DemoEcsTypes';

/** 命令缓冲：defer 延迟结构变更，帧末 flush */
export function runDemoCommandBuffer(): void {
    DemoEcsUtil.section('命令缓冲 CommandBuffer');
    ensureDemoTypesRegistered();
    ecs.world.clear();

    const e = ecs.getEntity(DemoEntity);
    e.add(DemoPosComp);

    ecs.world.defer(() => {
        e.add(DemoVelComp);
        DemoEcsUtil.log('defer 回调执行：添加 DemoVelComp');
    });

    DemoEcsUtil.ok(`defer 后尚未执行，has(DemoVelComp)=${e.has(DemoVelComp)}`);
    ecs.world.flushCommands();
    DemoEcsUtil.ok(`flush 后 has(DemoVelComp)=${e.has(DemoVelComp)}`);
    DemoEcsUtil.log('避免在系统遍历实体过程中直接增删组件破坏迭代');
}
