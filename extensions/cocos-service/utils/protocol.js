const _0x4770=['./request','service/get_tcb_envs','game/create','log/add','service/group','defineProperty','secret_key','SERVICE','use\x20strict','game/detail','service/get_tcb_quota_data','user/info','service/get_service_contact_url','default','__esModule','service/tcb_create_env','service/open','secret_id','apiRequest','then','store/get_custom_plugin','shift','game/associate_project_id','service/lists','service/get_version_desc','secretId','game/lists'];(function(_0x405e8c,_0x554887){const _0x477024=function(_0x3e4352){while(--_0x3e4352){_0x405e8c['push'](_0x405e8c['shift']());}};_0x477024(++_0x554887);}(_0x4770,0x173));const _0x3e43=function(_0x405e8c,_0x554887){_0x405e8c=_0x405e8c-0x150;let _0x477024=_0x4770[_0x405e8c];return _0x477024;};const _0x49afa9=_0x3e43,_0x4c63=['catch',_0x49afa9(0x169),_0x49afa9(0x155),_0x49afa9(0x150),'redirect_url',_0x49afa9(0x15b),_0x49afa9(0x166),_0x49afa9(0x154),_0x49afa9(0x159),_0x49afa9(0x16a),_0x49afa9(0x15c),'service/urls',_0x49afa9(0x160),'service/get_service_user_info','secret_id'];(function(_0x196045,_0x34a26c){const _0x257be0=function(_0x426476){const _0x3ae47a=_0x3e43;while(--_0x426476){_0x196045['push'](_0x196045[_0x3ae47a(0x151)]());}};_0x257be0(++_0x34a26c);}(_0x4c63,0xed));const _0x1552=function(_0x3a3456,_0x3e123f){_0x3a3456=_0x3a3456-0x142;let _0x5ad799=_0x4c63[_0x3a3456];return _0x5ad799;},_0x5ac8e4=_0x1552;_0x49afa9(0x15f),Object[_0x5ac8e4(0x14f)](exports,_0x49afa9(0x165),{'value':!0x0});const request_1=require(_0x49afa9(0x157));exports[_0x49afa9(0x164)]={'getServiceList':async function(){const _0x296324=_0x49afa9,_0x1e706f=_0x5ac8e4;return await request_1[_0x1e706f(0x146)](_0x296324(0x153));},'getVersionDesc':async function(_0x35028d,_0x1d7947){const _0x81725a=_0x49afa9,_0x3b1802=_0x5ac8e4;return await request_1[_0x81725a(0x169)](_0x3b1802(0x14c),{'service_id':_0x35028d,'version':_0x1d7947});},'getCustomPlugin':async function(_0x356095=_0x49afa9(0x15e)){const _0x276937=_0x5ac8e4;return await request_1[_0x276937(0x146)](_0x276937(0x148),{'type':_0x356095});},'getGroupList':async function(){const _0xa5b1bf=_0x5ac8e4;return await request_1[_0xa5b1bf(0x146)](_0xa5b1bf(0x14a));},'getGameList':async function(){const _0x3c05b2=_0x49afa9,_0x28d7ff=_0x5ac8e4;return await request_1[_0x28d7ff(0x146)](_0x3c05b2(0x156));},'submitLog':async function(_0x2e6bcf){const _0x2e48c3=_0x49afa9;return await request_1[_0x2e48c3(0x169)](_0x2e48c3(0x15a),_0x2e6bcf);},'getGameDetail':async function(_0xd5f5e5){const _0x1fc52a=_0x5ac8e4;return await request_1[_0x1fc52a(0x146)](_0x1fc52a(0x142),{'app_id':_0xd5f5e5});},'getUserInfo':async function(){const _0x57a522=_0x49afa9,_0x47e8bb=_0x5ac8e4;return await request_1[_0x47e8bb(0x146)](_0x57a522(0x162));},'getServiceUserInfo':async function(_0x1c7fb2){const _0x299b95=_0x5ac8e4;return await request_1[_0x299b95(0x146)](_0x299b95(0x143),{'service_id':_0x1c7fb2});},'getServiceContactUrl':async function(_0x507e0c){const _0x5a7a50=_0x49afa9,_0x9292d8=_0x5ac8e4;return await request_1[_0x9292d8(0x146)](_0x5a7a50(0x163),{'service_id':_0x507e0c});},'getServiceUrls':async function(){const _0x3a067e=_0x5ac8e4;return await request_1[_0x3a067e(0x146)](_0x3a067e(0x150));},'createGame':async function(_0xa70219){const _0x22c5cf=_0x5ac8e4;return await request_1[_0x22c5cf(0x146)](_0x22c5cf(0x14d),{'game_name':_0xa70219});},'openService':async function(_0x5426f4,_0x4bdaba){const _0x1a58ee=_0x49afa9;return await request_1['apiRequest'](_0x1a58ee(0x167),{'app_id':_0x5426f4,'service_id':_0x4bdaba});},'associateProjectID':async function(_0x25b8ab,_0x240fcd,_0x4c0f3f){const _0x1cb950=_0x49afa9;return await request_1[_0x1cb950(0x169)](_0x1cb950(0x152),{'app_id':_0x25b8ab,'project_id':_0x240fcd,'action':_0x4c0f3f});},'getRedirectUrl':async function(_0x1b449d){const _0x416e39=_0x5ac8e4;return await request_1['apiRequest'](_0x416e39(0x149),{'redirect_url':_0x1b449d});},'getTencentTmpKey':async function(_0x220817,_0x55c207){return new Promise((_0x1f32e8,_0x3d4f14)=>{const _0x4f15bf=_0x1552;request_1[_0x4f15bf(0x146)]('service/tcb_tmp_role',{'service_id':_0x220817,'app_id':_0x55c207})[_0x4f15bf(0x14e)](_0x2d6335=>{const _0x2e0f2c=_0x3e43,_0x1b3b25=_0x4f15bf;_0x2d6335[_0x1b3b25(0x147)]=_0x2d6335[_0x1b3b25(0x144)],_0x2d6335['secretKey']=_0x2d6335[_0x2e0f2c(0x15d)],delete _0x2d6335[_0x2e0f2c(0x168)],delete _0x2d6335[_0x2e0f2c(0x15d)],_0x1f32e8(_0x2d6335);})[_0x4f15bf(0x145)](_0x3d4f14);});},'createTCBEnv':async function(_0x4ea33e,_0x4e703b,_0x36b640,_0x14f55e=''){const _0x262fce=_0x5ac8e4;return await request_1[_0x262fce(0x146)](_0x262fce(0x14b),{'service_id':_0x4ea33e,'app_id':_0x4e703b,'env_id':_0x14f55e,'alias':_0x36b640});},'getTCBEnvs':async function(_0x3cae11,_0x278ee9){const _0x148dc3=_0x49afa9;return await request_1[_0x148dc3(0x169)](_0x148dc3(0x158),{'service_id':_0x3cae11,'app_id':_0x278ee9});},'getTCBQuotaData':async function(_0x3fe5b3,_0xb80d53,_0x266409){const _0x53ca6e=_0x49afa9,_0x3bc865=_0x5ac8e4;return await request_1[_0x3bc865(0x146)](_0x53ca6e(0x161),{'service_id':_0x3fe5b3,'app_id':_0xb80d53,'env_id':_0x266409});}};