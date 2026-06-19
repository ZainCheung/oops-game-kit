import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { DemoEcsUtil } from './DemoEcsUtil';
import {
    DemoEntity,
    DemoPosComp,
    DemoVelComp,
    DemoTagComp,
    ensureDemoTypesRegistered
} from './DemoEcsTypes';

/** 隔离测试用世界名（手动装配路径） */
const ISO_WORLD = 'reg_iso_world';
/** 装饰器路由测试用世界名（@ecs.register 指定 world 路径） */
const DEC_WORLD = 'reg_decorator_world';

/** 仅每帧推进 x 的系统（手动装配路径用，构造位置不影响其归属世界） */
class IsoMoveSystem extends ecs.ComblockSystem implements ecs.ISystemUpdate {
    filter(): ecs.IMatcher {
        return ecs.allOf(DemoPosComp, DemoVelComp);
    }
    update(e: ecs.Entity): void {
        e.get(DemoPosComp)!.x += e.get(DemoVelComp)!.dx;
    }
}

/** 通过 @ecs.register('name', world) 仅注册到 DEC_WORLD 的系统 */
class DecoratorWorldMoveSystem extends ecs.ComblockSystem implements ecs.ISystemUpdate {
    filter(): ecs.IMatcher {
        return ecs.allOf(DemoPosComp, DemoVelComp);
    }
    update(e: ecs.Entity): void {
        e.get(DemoPosComp)!.x += e.get(DemoVelComp)!.dx;
    }
}

/** 装饰器世界注册只能执行一次，避免重复运行 demo 时累积 */
let decoratorRegistered = false;
function ensureDecoratorRegistered(): void {
    if (decoratorRegistered) return;
    decoratorRegistered = true;
    ecs.register('DecoratorWorldMoveSystem', DEC_WORLD)(
        DecoratorWorldMoveSystem as unknown as new () => DecoratorWorldMoveSystem
    );
}

/**
 * 回归校验：针对前述修复的关键隐患做断言式验证（控制台输出 ✓ / ✗）。
 *
 * 覆盖：
 * 1. 多世界系统隔离（手动装配）——每世界伴生根；系统在默认世界上下文中 new，仍只驱动 addSystem 所属世界。
 * 2. 装饰器世界路由——@ecs.register('Sys', world) 注册的系统在该世界 initSystems 时生效且隔离。
 * 3. 单例驱逐精确性——无关实体增删同类型组件不再误驱逐单例；销毁单例宿主才真正重建。
 */
export function runDemoRegression(): void {
    DemoEcsUtil.section('回归校验（多世界系统隔离 / 单例驱逐）');
    ensureDemoTypesRegistered();

    runMultiWorldIsolation();
    runDecoratorWorldRouting();
    runSingletonEviction();
}

/** 1. 多世界系统隔离（手动装配，验证 group 绑定到 addSystem 所属世界而非系统构造位置） */
function runMultiWorldIsolation(): void {
    ecs.world.clear();
    ecs.world.remove(ISO_WORLD);
    const iso = ecs.world.get(ISO_WORLD);

    // 默认世界实体（dx=10）与 ISO 世界实体（dx=100）
    const mainHero = ecs.getEntity(DemoEntity);
    mainHero.add(DemoPosComp).x = 0;
    mainHero.add(DemoVelComp).dx = 10;

    const isoHero = ecs.getEntity(DemoEntity, iso);
    isoHero.add(DemoPosComp).x = 0;
    isoHero.add(DemoVelComp).dx = 100;

    // 关键点：两个系统实例都在“当前=默认世界”上下文中 new（不包 inWorld）
    const mainSys = new IsoMoveSystem();
    const isoSys = new IsoMoveSystem();

    const mainWorld = ecs.world.default();
    mainWorld.root.add(mainSys);
    iso.root.add(isoSys);

    // 实体先于 init 创建，验证 bindWorld 回填
    mainWorld.root.init(false);
    iso.root.init(false);

    iso.root.execute(0.016);
    DemoEcsUtil.assert(
        isoHero.get(DemoPosComp)!.x === 100,
        `iso 世界只驱动本世界实体：iso.x=${isoHero.get(DemoPosComp)!.x}（期望 100）`
    );
    DemoEcsUtil.assert(
        mainHero.get(DemoPosComp)!.x === 0,
        `iso 世界不影响默认世界实体：main.x=${mainHero.get(DemoPosComp)!.x}（期望 0）`
    );

    mainWorld.root.execute(0.016);
    DemoEcsUtil.assert(
        mainHero.get(DemoPosComp)!.x === 10,
        `默认世界只驱动本世界实体：main.x=${mainHero.get(DemoPosComp)!.x}（期望 10）`
    );
    DemoEcsUtil.assert(
        isoHero.get(DemoPosComp)!.x === 100,
        `默认世界不影响 ISO 世界实体：iso.x=${isoHero.get(DemoPosComp)!.x}（仍为 100）`
    );

    mainWorld.root.clear();
    iso.root.clear();
    ecs.world.clear();
    ecs.world.remove(ISO_WORLD);
}

/** 2. 装饰器世界路由（@ecs.register('Sys', world) 注册的系统仅在该世界生效） */
function runDecoratorWorldRouting(): void {
    ensureDecoratorRegistered();

    // 复用持久世界（系统类列表挂在世界对象上），仅清空其实体
    const dec = ecs.world.get(DEC_WORLD);
    ecs.world.clear(dec);
    ecs.world.clear();

    const decHero = ecs.getEntity(DemoEntity, DEC_WORLD);
    decHero.add(DemoPosComp).x = 0;
    decHero.add(DemoVelComp).dx = 5;

    const mainHero = ecs.getEntity(DemoEntity);
    mainHero.add(DemoPosComp).x = 0;
    mainHero.add(DemoVelComp).dx = 5;

    // init(true) 应自动实例化该世界 @ecs.register 注册的系统
    dec.root.init();

    dec.root.execute(0.016);
    DemoEcsUtil.assert(
        decHero.get(DemoPosComp)!.x === 5,
        `装饰器注册的系统在 DEC_WORLD 生效：dec.x=${decHero.get(DemoPosComp)!.x}（期望 5）`
    );
    DemoEcsUtil.assert(
        mainHero.get(DemoPosComp)!.x === 0,
        `该系统未泄漏到默认世界：main.x=${mainHero.get(DemoPosComp)!.x}（期望 0）`
    );

    dec.root.clear();
    ecs.world.clear(dec);
    ecs.world.clear();
}

/** 3. 单例驱逐精确性 */
function runSingletonEviction(): void {
    ecs.world.clear();

    const s1 = ecs.getSingleton(DemoTagComp);
    const eid1 = s1.ent.eid;

    // 无关实体增删同类型组件：旧实现会误删单例，修复后应保持同一实例
    const other = ecs.getEntity(DemoEntity);
    other.add(DemoTagComp);
    other.remove(DemoTagComp);

    const s2 = ecs.getSingleton(DemoTagComp);
    DemoEcsUtil.assert(
        s1 === s2,
        '无关实体增删同类型组件后，单例实例未被误驱逐（s1 === s2）'
    );

    // 销毁单例宿主：应真正驱逐并在下次 getSingleton 时重建（用世代式 eid 判定，规避对象池复用干扰）
    s1.ent.destroy();
    const s3 = ecs.getSingleton(DemoTagComp);
    DemoEcsUtil.assert(
        s3.ent.eid !== eid1,
        `销毁单例宿主后会重建：新 eid=${s3.ent.eid} ≠ 旧 eid=${eid1}`
    );

    ecs.world.clear();
}
