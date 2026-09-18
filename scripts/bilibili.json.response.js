const TAB = [
  {pos: 1, id: 731, name: '直播', tab_id: '直播tab', uri: 'bilibili://live/home'},
  {pos: 2, id: 477, name: '推荐', tab_id: '推荐tab', uri: 'bilibili://pegasus/promo', default_selected: 1},
  {pos: 3, id: 478, name: '热门', tab_id: '热门tab', uri: 'bilibili://pegasus/hottopic'},
  {pos: 4, id: 3502, name: '动画', tab_id: 'bangumi', uri: 'bilibili://pgc/bangumi_v2'},
  {pos: 5, id: 3503, name: '影视', tab_id: 'film', uri: 'bilibili://pgc/cinema_v2'},
];

const TOP = [
  {pos: 1, id: 176, name: '消息', tab_id: '消息Top', uri: 'bilibili://link/im_home', icon: 'http://i0.hdslb.com/bfs/archive/d43047538e72c9ed8fd8e4e34415fbe3a4f632cb.png'},
];

const BOTTOM = [
  {pos: 1, id: 177, name: '首页', tab_id: 'home', uri: 'bilibili://main/home/', icon: 'http://i0.hdslb.com/bfs/archive/63d7ee88d471786c1af45af86e8cb7f607edf91b.png', icon_selected: 'http://i0.hdslb.com/bfs/archive/e5106aa688dc729e7f0eafcbb80317feb54a43bd.png'},
  {pos: 2, id: 179, name: '动态', tab_id: 'dynamic', uri: 'bilibili://following/home/', icon: 'http://i0.hdslb.com/bfs/archive/86dfbe5fa32f11a8588b9ae0fccb77d3c27cedf6.png', icon_selected: 'http://i0.hdslb.com/bfs/archive/25b658e1f6b6da57eecba328556101dbdcb4b53f.png'},
  {pos: 5, id: 181, name: '我的', tab_id: '我的Bottom', uri: 'bilibili://user_center/', icon: 'http://i0.hdslb.com/bfs/archive/4b0b2c49ffeb4f0c2e6a4cceebeef0aab1c53fe1.png', icon_selected: 'http://i0.hdslb.com/bfs/archive/a54a8009116cb896e64ef14dcf50e5cade401e00.png'},
];

function nullValues(value) {
  if (!value || typeof value !== 'object') return;
  for (const key of Object.keys(value)) value[key] = null;
}

function cleanLive(data, path) {
  if (!data || typeof data !== 'object') return;
  if (path.endsWith('/index/feed') && Array.isArray(data.card_list)) {
    data.card_list = data.card_list.filter((item) => !['banner_v2', 'activity_card_v1'].includes(item?.card_type));
  }
  if (path.endsWith('/getInfoByRoom')) {
    data.big_card_info = null;
    data.show_reserve_status = false;
    if (data.reserve_info) data.reserve_info.show_reserve_status = false;
    if (data.shopping_info) data.shopping_info.is_show = 0;
    nullValues(data.activity_banner_info);
    nullValues(data.function_card);
    const tabs = data.new_tab_info;
    if (Array.isArray(tabs?.outer_list)) tabs.outer_list = tabs.outer_list.filter((item) => item?.biz_id !== 33);
    if (Array.isArray(tabs?.candidate_list)) {
      const blocked = new Set([33, 36, 162, 186]);
      tabs.candidate_list = tabs.candidate_list.filter((item) => !blocked.has(item?.biz_id));
      if (Array.isArray(tabs.v2_outer_list)) {
        for (const item of tabs.v2_outer_list) {
          if (Array.isArray(item?.indices)) item.indices = item.indices.filter((id) => !blocked.has(id));
        }
      }
    }
  }
  if (path.endsWith('/getInfoByUser')) {
    delete data.play_together_info;
    delete data.play_together_info_v2;
    nullValues(data.function_card);
  }
}

export default async function(ctx) {
  if (ctx.response?.status !== 200) return;
  let payload;
  try {
    payload = await ctx.response.json();
  } catch {
    return;
  }

  const path = new URL(ctx.request.url).pathname;
  const data = payload?.data;
  if (!data || typeof data !== 'object') return;

  if (path.endsWith('/show/tab/v2')) {
    data.tab = TAB;
    data.top = TOP;
    data.bottom = BOTTOM;
  } else if (path.includes('/splash/')) {
    data.show = [];
    data.event_list = [];
    delete data.account;
    delete data.preload;
    data.max_time = 0;
    data.min_interval = 31536000;
    data.pull_interval = 31536000;
  } else if (path.endsWith('/feed/index')) {
    const allowed = new Set(['small_cover_v2', 'large_cover_single_v9', 'large_cover_v1']);
    if (Array.isArray(data.items)) {
      data.items = data.items.filter((item) => !item?.banner_item && !item?.ad_info && item?.card_goto === 'av' && allowed.has(item?.card_type));
    }
  } else if (path.endsWith('/feed/index/story')) {
    const ads = new Set(['vertical_ad_av', 'vertical_ad_live', 'vertical_ad_picture']);
    if (Array.isArray(data.items)) {
      data.items = data.items.filter((item) => !item?.ad_info && item?.card_goto && !ads.has(item.card_goto));
      for (const item of data.items) {
        delete item.story_cart_icon;
        delete item.free_flow_toast;
        delete item.image_infos;
        delete item.course_info;
        delete item.game_info;
      }
    }
  } else if (path.endsWith('/show/skin')) {
    delete data.common_equip;
  } else if (path.endsWith('/tracker/conf')) {
    data.domains = ['wss://tracker.chat.bilibili.com'];
  } else if (path.endsWith('/pd-proxy/tracker')) {
    for (const value of Object.values(data)) {
      if (!Array.isArray(value)) continue;
      for (let index = 0; index < value.length; index += 1) value[index] = 'stun.chat.bilibili.com:3478';
    }
  } else if (path.endsWith('/app/season')) {
    delete data.payment;
  } else if (path.endsWith('/page/channel')) {
    if (Array.isArray(data.modules)) {
      data.modules = data.modules.filter((module) => module?.type !== 'TIP');
      for (const module of data.modules) {
        if (module?.type === 'BANNER' && Array.isArray(module.module_data?.items)) {
          module.module_data.items = module.module_data.items.filter((item) => !String(item?.url ?? '').startsWith('https://www.bilibili.com/blackboard/era/'));
        }
      }
    }
  } else if (path.includes('/xlive/')) {
    cleanLive(data, path);
  }

  return {body: payload};
}
