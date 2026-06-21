
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TablePromptWindow {
    static get(id: number): ITablePromptWindow {
        const table = JsonUtil.get("PromptWindow");
        return table[id] as ITablePromptWindow;
    }
}

export interface ITablePromptWindow {
    /** 提示类型 */
    type: number;
    /** 标题 */
    title: string;
    /** 提示内容 */
    content: string;
}
