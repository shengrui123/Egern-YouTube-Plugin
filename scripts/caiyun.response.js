const VIP_EXPIRES_AT = 1892260800;
const VIP_INFO_EXPIRES_AT = '4092599349';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export default async function(ctx) {
  const url = ctx.request?.url ?? '';

  // These endpoints are replaced wholesale and do not need their original body.
  if (url.includes('/activity')) {
    const isAiTabRequest = new URL(url).searchParams.get('type_id') === 'A03';
    return {
      body: isAiTabRequest
        ? {status: 'ok', activities: [{type: 'tabbar', name: 'aichat', feature: false}]}
        : {status: 'ok', activities: [{items: [{}]}]},
    };
  }
  if (url.includes('/operation/homefeatures')) return {body: {data: []}};
  if (url.includes('/operation/banners')) {
    return {
      body: {
        data: [{
          avatar: 'https://cdn-w.caiyunapp.com/p/app/operation/prod/banner/668502d5c3a2362582a2a5da/d9f198473e7f387d13ea892719959ddb.jpg',
          url: 'https://cdn-w.caiyunapp.com/p/app/operation/prod/article/66850143c3a2362582a2a5d9/index.html',
          title: '暴雨来袭，这些避险“秘籍”你学会了吗？',
          banner_type: 'article',
        }],
      },
    };
  }
  if (url.includes('/campaigns')) {
    return {
      body: {
        campaigns: [{
          name: 'driveweather',
          title: '驾驶天气新功能',
          url: 'cy://page_driving_weather',
          cover: 'https://cdn-w.caiyunapp.com/p/banner/test/668d442c4fe75aca7251c161.png',
        }],
      },
    };
  }
  if (url.includes('/notification/message_center')) return {body: {messages: []}};
  if (url.includes('/config/cypage')) return {body: {popups: [], actions: []}};

  // Read as text so malformed or changed responses can be returned byte-for-byte.
  const originalBody = await ctx.response.text();
  let data;
  try {
    data = JSON.parse(originalBody);
  } catch {
    return {body: originalBody};
  }

  // Check user_detail first: /api/v2/user_detail also contains "/v2/user".
  if (url.includes('/user_detail')) {
    if (!isObject(data.vip_info)) return {body: originalBody};
    for (const level of ['svip', 'vip']) {
      if (isObject(data.vip_info[level])) {
        data.vip_info[level] = {expires_time: String(VIP_EXPIRES_AT), is_auto_renewal: true};
      }
    }
  } else if (/\/v2\/user(?:[/?]|$)/.test(url)) {
    if (!isObject(data.result)) return {body: originalBody};
    data.result.is_vip = 1;
    data.result.svip_expired_at = VIP_EXPIRES_AT;
    data.result.svip_take_effect = 1;
    data.result.vip_type = 's';
    if (isObject(data.result.wt?.vip)) data.result.wt.vip.expired_at = VIP_EXPIRES_AT;
  } else if (/\/p\/v\d+\/vip_info(?:[/?]|$)/.test(url)) {
    if (isObject(data.vip)) data.vip.expires_time = VIP_INFO_EXPIRES_AT;
    if (isObject(data.svip)) data.svip.expires_time = VIP_INFO_EXPIRES_AT;
  } else if (url.includes('/operation/feeds')) {
    if (!Array.isArray(data.data)) return {body: originalBody};
    data.data = data.data.filter((item) =>
      typeof item?.category_times_text === 'string' && item.category_times_text.includes('人查看'));
  } else if (url.includes('/operation/features')) {
    if (!Array.isArray(data.data)) return {body: originalBody};
    data.data = data.data.filter((item) =>
      typeof item?.url === 'string' && item.url.includes('cy://'));
  } else {
    return {body: originalBody};
  }

  return {body: data};
}
