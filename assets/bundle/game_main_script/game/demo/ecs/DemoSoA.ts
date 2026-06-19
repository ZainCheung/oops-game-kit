import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { DemoEcsUtil } from './DemoEcsUtil';
import { DemoEntity, DemoParticleComp, DemoPosComp, ensureDemoTypesRegistered } from './DemoEcsTypes';

/** SoA 列存储：可选启用，Proxy 视图 + TypedArray 批处理 */
export function runDemoSoA(): void {
    DemoEcsUtil.section('SoA 列存储');
    ensureDemoTypesRegistered();
    ecs.world.clear();

    const aos = ecs.getEntity(DemoEntity);
    aos.add(DemoPosComp);
    DemoEcsUtil.ok(`DemoPosComp 默认 AoS，getSoAStorage=${ecs.storage.getSoAStorage(DemoPosComp as never) === undefined}`);

    const e = ecs.getEntity(DemoEntity);
    const part = e.add(DemoParticleComp);
    part.vx = 1.5;
    part.vy = -2;
    part.life = 10;

    const storage = ecs.storage.getSoAStorage(DemoParticleComp)!;
    const slot = storage.getSlot(e.eid)!;
    const vxArr = storage.getFieldArray('vx')!;
    DemoEcsUtil.ok(`Proxy 读写 vx=${part.vx}，底层 TypedArray[${slot}]=${vxArr[slot]}`);

    vxArr[slot] = 9;
    DemoEcsUtil.ok(`直接写 TypedArray 后 Proxy 可见 vx=${part.vx}`);

    e.remove(DemoParticleComp);
    DemoEcsUtil.ok(`移除后 SoA 槽位释放，size=${storage.size}`);
}
