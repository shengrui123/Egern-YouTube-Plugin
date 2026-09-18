export default async function(ctx) {
  if (ctx.response?.status !== 200) return;

  let payload;
  try {
    payload = await ctx.response.json();
  } catch {
    return;
  }

  const data = payload?.data;
  if (!data || typeof data !== 'object') return;

  const pathname = new URL(ctx.request.url).pathname;
  if (/\/comic\.v\d+\.Comic\/GetClassPageAllTabs$/.test(pathname)) {
    if (Array.isArray(data.home_type)) {
      data.home_type = data.home_type.filter((item) => !['新人', '新作'].includes(item?.name));
    }
    if (Array.isArray(data.home_feed)) {
      data.home_feed = data.home_feed.filter((item) => item?.name !== '商城');
    }
  } else if (/\/user\.v\d+\.User\/UCenterConf$/.test(pathname)) {
    if (Array.isArray(data.confs)) {
      const removed = new Set(['漫画商城', '超漫俱乐部', '看漫免流量']);
      data.confs = data.confs.filter((item) => !removed.has(item?.title));
    }
  }

  return {body: payload};
}
