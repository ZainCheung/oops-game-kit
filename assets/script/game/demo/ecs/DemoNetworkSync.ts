import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { SyncCodec } from 'db://oops-framework/libs/ecs/network/SyncCodec';
import { SyncOp } from 'db://oops-framework/libs/ecs/network/SyncTypes';
import { ensureTracker, getTracker } from 'db://oops-framework/libs/ecs/network/SyncDecorators';
import { ByteWriter, ByteReader } from 'db://oops-framework/libs/ecs/network/ByteBuffer';
import { NetworkSync } from 'db://oops-framework/libs/ecs/network/NetworkSync';
import { DemoEcsUtil } from './DemoEcsUtil';
import { DemoEntity, DemoNetComp, ensureDemoTypesRegistered } from './DemoEcsTypes';

/** 网络同步：@sync 字段标记 + 组件/世界级编解码 */
export function runDemoNetworkSync(): void {
    DemoEcsUtil.section('网络同步 @sync');
    ensureDemoTypesRegistered();
    ecs.world.clear();

    const src = new DemoNetComp();
    ensureTracker(src);
    src.hp = 42;
    src.ready = true;
    src.label = '勇者';
    DemoEcsUtil.ok(`写入后组件变脏 hasChanges=${getTracker(src)!.hasChanges}`);

    const w = new ByteWriter();
    SyncCodec.encodeComponent(w, src, SyncOp.Delta);
    const dst = new DemoNetComp();
    ensureTracker(dst);
    SyncCodec.decodeComponentInto(new ByteReader(w.toUint8Array()), dst);
    DemoEcsUtil.ok(`组件增量同步 hp=${dst.hp}, ready=${dst.ready}, label=${dst.label}`);

    const e = ecs.getEntity(DemoEntity);
    const c = e.add(DemoNetComp);
    NetworkSync.trackComponent(c);
    c.hp = 100;
    c.label = 'boss';
    const packet = NetworkSync.encodeWorld(SyncOp.Full);
    DemoEcsUtil.ok(`世界级编码包长度 ${packet.length} 字节`);

    ecs.world.clear();
    NetworkSync.applyToWorld(packet, () => ecs.getEntity(DemoEntity));
    const remote = ecs.query(ecs.allOf(DemoNetComp))[0]?.get(DemoNetComp);
    DemoEcsUtil.ok(`applyToWorld 后远端 hp=${remote?.hp}, label=${remote?.label}`);
}
