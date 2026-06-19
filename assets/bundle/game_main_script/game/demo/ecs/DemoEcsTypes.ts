import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { ECSComp } from 'db://oops-framework/libs/ecs/component/ECSComp';
import { ECSEntity } from 'db://oops-framework/libs/ecs/entity/ECSEntity';
import { sync } from 'db://oops-framework/libs/ecs/network/SyncDecorators';
import { SyncType } from 'db://oops-framework/libs/ecs/network/SyncTypes';
import { serialize } from 'db://oops-framework/libs/ecs/serialize/Serialization';

/** Demo 位置组件 */
export class DemoPosComp extends ECSComp {
    x = 0;
    y = 0;
    reset(): void { this.x = 0; this.y = 0; }
}

/** Demo 速度组件 */
export class DemoVelComp extends ECSComp {
    dx = 0;
    dy = 0;
    reset(): void { this.dx = 0; this.dy = 0; }
}

/** Demo 标签组件 */
export class DemoTagComp extends ECSComp {
    reset(): void {}
}

/** Demo SoA 粒子组件 */
export class DemoParticleComp extends ECSComp {
    vx = 0;
    vy = 0;
    life = 0;
    reset(): void { this.vx = 0; this.vy = 0; this.life = 0; }
}

/** Demo 网络同步组件（字段经 @sync 原型访问器实现） */
export class DemoNetComp extends ECSComp {
    reset(): void {}
}
export interface DemoNetComp {
    hp: number;
    ready: boolean;
    label: string;
}

/** Demo 实体引用组件 */
export class DemoRefComp extends ECSComp {
    reset(): void { this.target = null; }
}
export interface DemoRefComp {
    target: ecs.Entity | null;
}

/** Demo 实体 */
export class DemoEntity extends ECSEntity {}

let registered = false;

/** 注册 Demo 用到的实体/组件类型（全局仅执行一次） */
export function ensureDemoTypesRegistered(): void {
    if (registered) return;
    registered = true;

    const ser = serialize();
    ser(DemoPosComp.prototype, 'x');
    ser(DemoPosComp.prototype, 'y');
    ser(DemoVelComp.prototype, 'dx');
    ser(DemoVelComp.prototype, 'dy');

    ecs.storage.enableSoA(DemoParticleComp as unknown as new () => DemoParticleComp);
    ecs.storage.float32(DemoParticleComp.prototype, 'vx');
    ecs.storage.float32(DemoParticleComp.prototype, 'vy');
    ser(DemoParticleComp.prototype, 'vx');
    ser(DemoParticleComp.prototype, 'vy');
    ser(DemoParticleComp.prototype, 'life');

    sync(SyncType.Int32)(DemoNetComp.prototype, 'hp');
    sync(SyncType.Bool)(DemoNetComp.prototype, 'ready');
    sync(SyncType.String)(DemoNetComp.prototype, 'label');

    ecs.entityRef()(DemoRefComp.prototype, 'target');

    ecs.register('DemoPos')(DemoPosComp);
    ecs.register('DemoVel')(DemoVelComp);
    ecs.register('DemoTag')(DemoTagComp);
    ecs.register('DemoParticle')(DemoParticleComp);
    ecs.register('DemoNet')(DemoNetComp);
    ecs.register('DemoRef')(DemoRefComp);
    ecs.register('DemoEntity')(DemoEntity as unknown as new () => DemoEntity);
}
