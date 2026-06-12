import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { DemoEcsUtil } from './DemoEcsUtil';
import { DemoEntity, DemoPosComp, ensureDemoTypesRegistered } from './DemoEcsTypes';

/** 世界序列化：serializeWorld / deserializeWorld 往返 */
export function runDemoSerialization(): void {
    DemoEcsUtil.section('世界序列化');
    ensureDemoTypesRegistered();
    ecs.world.clear();

    const e = ecs.getEntity(DemoEntity);
    e.add(DemoPosComp).x = 99;
    e.get(DemoPosComp)!.y = 1;

    const json = ecs.serialize.serializeWorld();
    DemoEcsUtil.logData('序列化 JSON 片段', json.slice(0, 80) + '...');

    ecs.world.clear();
    ecs.serialize.deserializeWorld(json);

    const list = ecs.query(ecs.allOf(DemoPosComp));
    DemoEcsUtil.ok(`反序列化恢复 ${list.length} 个实体，x=${list[0]?.get(DemoPosComp)?.x}`);
}
