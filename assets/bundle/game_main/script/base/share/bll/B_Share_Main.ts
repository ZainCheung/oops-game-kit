import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import { Share } from '../Share';

/** Main业务逻辑组件 */
@classname('B_Share_Main')
export class B_Share_Main extends CCBusiness<Share> {
    /** 业务逻辑初始化 */
    protected init() {

    }

    /** 业务内存释放 */
    destroy() {
        super.destroy();
    }
}
