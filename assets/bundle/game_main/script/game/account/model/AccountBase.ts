/** 账号基础数据 */
export class AccountBase {
    /** 账号编号*/
    userId: string = null!;
    /** 账号名称 */
    username: string = null!;
    /** SDK 登录凭证 */
    token: string = null!;

    reset() {
        this.userId = null!;
        this.username = null!;
        this.token = null!;
    }
}
