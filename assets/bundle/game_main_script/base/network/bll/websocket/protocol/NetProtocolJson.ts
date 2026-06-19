import type { HeartbeatSender, IRequestProtocol, IResponseProtocol } from '../core/NetInterface';
import { IProtocolHelper } from '../core/NetInterface';

/** JSON 数据协议编解码 */
export class NetProtocolJson extends IProtocolHelper {
    constructor(private readonly heartbeatSender?: HeartbeatSender) {
        super();
    }

    encode(ireqp: IRequestProtocol): void {
        const cmdType = ireqp.cmdType ?? 0;
        const cmd = ireqp.cmd;

        if (cmdType === 1) {
            ireqp.msgId = this.getRequestId();
        }

        const data: Record<string, unknown> = {
            msgId: ireqp.msgId ?? 0,
            cmd,
            cmdType,
            params: ireqp.params ?? null,
        };

        const jsonString = JSON.stringify(data);
        const msgBuffer = new TextEncoder().encode(jsonString);

        const packLength = 4 + msgBuffer.length;
        const buffer = new ArrayBuffer(packLength);
        const dataView = new DataView(buffer);

        dataView.setInt32(0, msgBuffer.length, false);

        const uint8Array = new Uint8Array(buffer);
        uint8Array.set(msgBuffer, 4);

        ireqp.buffer = buffer;
    }

    decodeCommon(msg: ArrayBuffer): IResponseProtocol {
        const dataView = new DataView(msg);
        const length = dataView.getInt32(0, false);

        const jsonBytes = new Uint8Array(msg, 4, length);
        const jsonString = new TextDecoder().decode(jsonBytes);
        const json = JSON.parse(jsonString);

        return {
            msgId: json.msgId ?? 0,
            cmd: json.cmd ?? 0,
            cmdType: json.cmdType ?? 0,
            code: json.code ?? 0,
            data: json.data ?? json.params ?? null,
        };
    }

    onHearbeat(): void {
        this.heartbeatSender?.();
    }
}
