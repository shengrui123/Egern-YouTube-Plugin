function enabled(env, key, fallback) {
  const value = env?.[key];
  return value == null ? fallback : String(value).toLowerCase() === 'true';
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export default async function(ctx) {
  if (ctx.response?.status !== 200) return;

  const url = ctx.request?.url ?? '';
  const originalBody = await ctx.response.text();
  let data;
  try {
    data = JSON.parse(originalBody);
  } catch {
    return {body: originalBody};
  }
  if (!isObject(data)) return {body: originalBody};

  let changed = false;

  if (url.includes('/search_service/search/searchScrollWord')) {
    if (enabled(ctx.env, 'cleanSearch', true) && Array.isArray(data['113000004'])) {
      data['113000004'] = [];
      changed = true;
    }
  } else if (url.includes('/clientIndex/homefusion/fuInter')) {
    if (enabled(ctx.env, 'cleanHome', true)) {
      if (hasOwn(data, 'HomeFusion.backGroundQuery')) {
        delete data['HomeFusion.backGroundQuery'];
        changed = true;
      }
      const bottomLabel = data['HomeFusion.bottomLabel'];
      if (isObject(bottomLabel) && hasOwn(bottomLabel, 'bottomMallKey')) {
        delete bottomLabel.bottomMallKey;
        changed = true;
      }
    }
    if (enabled(ctx.env, 'cleanBottomConfig', true)) {
      const bottomLabel = data['HomeFusion.bottomLabel'];
      if (isObject(bottomLabel)) {
        for (const key of ['bottomMallKey', 'bottomWealthKey']) {
          if (hasOwn(bottomLabel, key)) {
            delete bottomLabel[key];
            changed = true;
          }
        }
      }
    }
  } else if (/\/clientMyPage\/v\d+\/api\/(?:newUserInfo|getDeviceInfo)(?:\?|$)/.test(url)) {
    if (enabled(ctx.env, 'cleanProfile', true) && isObject(data.data)) {
      data.data = {};
      changed = true;
    }
  } else {
    const optionalModules = [
      ['myWallet', 'hideWallet'],
      ['myPoints', 'hidePoints'],
      ['myColorfulRingtone', 'hideRingtone'],
    ];
    for (const [endpoint, setting] of optionalModules) {
      if (url.includes(`/api/${endpoint}`) && enabled(ctx.env, setting, false) && isObject(data.data)) {
        data.data = {};
        changed = true;
        break;
      }
    }
  }

  return {body: changed ? data : originalBody};
}
