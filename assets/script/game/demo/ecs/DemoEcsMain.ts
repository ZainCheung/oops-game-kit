import { ensureDemoTypesRegistered } from './DemoEcsTypes';
import { runDemoEntityComponent } from './DemoEntityComponent';
import { runDemoQuery } from './DemoQuery';
import { runDemoComblockSystem } from './DemoComblockSystem';
import { runDemoEpoch } from './DemoEpoch';
import { runDemoCommandBuffer } from './DemoCommandBuffer';
import { runDemoSoA } from './DemoSoA';
import { runDemoNetworkSync } from './DemoNetworkSync';
import { runDemoSerialization } from './DemoSerialization';
import { runDemoIncrementalSerialization } from './DemoIncrementalSerialization';
import { runDemoEidHandle } from './DemoEidHandle';
import { runDemoMultiWorld } from './DemoMultiWorld';
import { runDemoMultiWorldSystem } from './DemoMultiWorldSystem';
import { runDemoIntervalSystem } from './DemoIntervalSystem';
import { runDemoSystemScheduling } from './DemoSystemScheduling';
import { runDemoEntityRef } from './DemoEntityRef';
import { runDemoPassiveSystem } from './DemoPassiveSystem';
import { runDemoRegression } from './DemoRegression';

/** 按技术分类依次运行全部 ECS Demo（控制台输出） */
export function runAllEcsDemos(): void {
    console.log('\n========================================');
    console.log('  ECS 功能演示 — 开始');
    console.log('========================================');

    ensureDemoTypesRegistered();

    // 基础
    runDemoEntityComponent();
    runDemoQuery();
    runDemoComblockSystem();

    // 运行时机制
    runDemoEpoch();
    runDemoCommandBuffer();
    runDemoEidHandle();
    runDemoMultiWorld();
    runDemoMultiWorldSystem();

    // 存储与同步
    runDemoSoA();
    runDemoNetworkSync();
    runDemoSerialization();
    runDemoIncrementalSerialization();

    // 系统扩展
    runDemoIntervalSystem();
    runDemoSystemScheduling();
    runDemoPassiveSystem();
    runDemoEntityRef();

    // 回归校验（断言式，验证关键隐患修复）
    runDemoRegression();

    console.log('\n========================================');
    console.log('  ECS 功能演示 — 全部完成');
    console.log('========================================\n');
}
