import type { HeartbeatSender, IRequestProtocol, IResponseProtocol } from '../core/NetInterface';
import { IProtocolHelper } from '../core/NetInterface';

/** Protobuf 数据协议编解码 */
export class NetProtocolProtobuf extends IProtocolHelper {
    constructor(private readonly heartbeatSender?: HeartbeatSender) {
        super();
    }

    encode(ireqp: IRequestProtocol): void {
        const cmdType = ireqp.cmdType ?? 0;
        const cmd = ireqp.cmd;

        if (cmdType === 1) {
            ireqp.msgId = this.getRequestId();
        }

        let msgBuffer: Uint8Array | null = null;
        if (ireqp.params) {
            //@ts-ignore
            const pb = proto[ireqp.reqName].encode(ireqp.params);
            msgBuffer = pb.finish();
        }

        const msgLength = msgBuffer ? msgBuffer.length : 0;
        const packLength = 4 + 2 + 4 + msgLength;
        const bufferWithCmd = new ArrayBuffer(4 + packLength);
        const dataView = new DataView(bufferWithCmd);

        dataView.setInt32(0, packLength, false);
        dataView.setInt32(4, ireqp.msgId ?? 0, false);
        dataView.setInt16(8, cmdType, false);
        dataView.setInt32(10, cmd, false);

        const targetOffset = 14;

        if (msgBuffer && msgBuffer.length > 0) {
            const uint8Array = new Uint8Array(bufferWithCmd);
            uint8Array.set(msgBuffer, targetOffset);
        }

        ireqp.buffer = bufferWithCmd;
    }

    decodeCommon(msg: ArrayBuffer): IResponseProtocol {
        let offset = 0;
        const dataView = new DataView(msg);

        const msgId = dataView.getInt32(offset, false);
        offset += 4;

        const cmdType = dataView.getInt16(offset, false);
        offset += 2;

        const cmd = dataView.getInt32(offset, false);
        offset += 4;

        const cmdCode = dataView.getInt16(offset, false);
        offset += 2;

        const body = new Uint8Array(msg, offset);
        let bodyData: unknown = null;
        if (body.length > 0) {
            bodyData = body;
        }

        return {
            msgId,
            cmd,
            cmdType,
            code: cmdCode,
            data: bodyData,
        };
    }

    decodeCustom(ireqp: IRequestProtocol, iresp: IResponseProtocol): void {
        if (iresp.data) {
            //@ts-ignore
            iresp.data = proto[ireqp.respName].decode(iresp.data);
        }
    }

    onHearbeat(): void {
        this.heartbeatSender?.();
    }
}
