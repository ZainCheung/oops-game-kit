import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { DemoEcsUtil } from './DemoEcsUtil';
import { DemoEntity, DemoPosComp, ensureDemoTypesRegistered } from './DemoEcsTypes';

/** Epoch 变更追踪：markDirty / isChangedSince */
export function runDemoEpoch(): void {
    DemoEcsUtil.section('Epoch 变更追踪');
    ensureDemoTypesRegistered();
    ecs.world.clear();

    const e = ecs.getEntity(DemoEntity);
    const pos = e.add(DemoPosComp);
    pos.markDirty(100);

    DemoEcsUtil.ok(`markDirty(100) → lastWriteEpoch=${pos.lastWriteEpoch}`);
    DemoEcsUtil.ok(`isChangedSince(50)=${pos.isChangedSince(50)}（有变更）`);
    DemoEcsUtil.ok(`isChangedSince(150)=${pos.isChangedSince(150)}（无变更）`);
    DemoEcsUtil.log('用于增量同步/序列化时判断组件是否在本帧发生变化');
}
