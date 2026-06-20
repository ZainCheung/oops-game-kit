import { _decorator, Node, Sprite, UITransform, Label, Color, assetManager, ImageAsset, Texture2D, SpriteFrame } from 'cc';
import { gui } from 'db://oops-framework/core/gui/Gui';
import { LayerType } from 'db://oops-framework/core/gui/layer/LayerEnum';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
import { CCView } from 'db://oops-framework/module/common/CCView';
import { Account } from '../Account';

const { ccclass } = _decorator;

/** VC_Account_Login 界面视图组件 */
@ccclass('VC_Account_Login')
@ecs.register('VC_Account_Login', false)
@gui.register('VC_Account_Login', { layer: LayerType.UI, prefab: 'gui/account/prefab/VC_Account_Login' })
export class VC_Account_Login extends CCView<Account> {
    private avatarSprite: Sprite | null = null;
    private nickLabel: Label | null = null;
    private tipLabel: Label | null = null;

    /**
     * 显示获取到的用户头像和昵称
     * @param avatarUrl 头像地址（可能为空）
     * @param nickName  昵称
     */
    showUserInfo(avatarUrl: string, nickName: string) {
        // 头像节点（按钮上方）
        if (!this.avatarSprite) {
            const node = new Node('Avatar');
            const uit = node.addComponent(UITransform);
            uit.setContentSize(120, 120);
            this.avatarSprite = node.addComponent(Sprite);
            node.setPosition(0, 200, 0);
            this.node.addChild(node);
        }

        // 昵称节点
        if (!this.nickLabel) {
            const node = new Node('NickName');
            const uit = node.addComponent(UITransform);
            uit.setContentSize(400, 50);
            this.nickLabel = node.addComponent(Label);
            this.nickLabel.fontSize = 32;
            this.nickLabel.lineHeight = 40;
            this.nickLabel.color = new Color(255, 255, 255, 255);
            node.setPosition(0, 100, 0);
            this.node.addChild(node);
        }

        // 提示节点（按钮下方）
        if (!this.tipLabel) {
            const node = new Node('Tip');
            const uit = node.addComponent(UITransform);
            uit.setContentSize(400, 40);
            this.tipLabel = node.addComponent(Label);
            this.tipLabel.fontSize = 24;
            this.tipLabel.lineHeight = 30;
            this.tipLabel.color = new Color(200, 200, 200, 255);
            node.setPosition(0, -100, 0);
            this.node.addChild(node);
        }

        this.nickLabel.string = nickName;
        this.tipLabel.string = '点击任意位置继续';

        if (avatarUrl) {
            this.loadAvatar(avatarUrl);
        }
    }

    /** 加载远程头像图片并显示到头像 Sprite */
    private loadAvatar(url: string) {
        // 微信头像 URL 无扩展名，需指定 ext
        assetManager.loadRemote<ImageAsset>(url, { ext: '.png' }, (err, imageAsset) => {
            if (err || !imageAsset || !this.avatarSprite || !this.isValid) return;
            const texture = new Texture2D();
            texture.image = imageAsset;
            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;
            this.avatarSprite.spriteFrame = spriteFrame;
        });
    }

    /** 释放内存 */
    reset() {
        this.avatarSprite = null;
        this.nickLabel = null;
        this.tipLabel = null;
    }
}
