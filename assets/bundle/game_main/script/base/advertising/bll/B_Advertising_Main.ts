import { CCBusiness } from 'db://oops-framework/module/common/CCBusiness';
import { classname } from 'db://oops-framework/module/decorator/ClassNameDecorator';
import { Advertising } from '../Advertising';

/** Main业务逻辑组件 */
@classname('B_Advertising_Main')
export class B_Advertising_Main extends CCBusiness<Advertising> {
    /** 业务逻辑初始化 */
    protected init() {

    }

    /** 业务内存释放 */
    destroy() {
        super.destroy();
    }
}
