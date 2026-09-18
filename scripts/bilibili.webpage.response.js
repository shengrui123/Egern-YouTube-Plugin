function clientCleanup() {
  'use strict';
  const hidden = new Set();
  const containers = new Set(['EvaLayoutContainerPrerender', 'EvaLayoutContainer', 'EvaLinkButton', 'H5Slider']);
  const external = (item) => {
    if (item.name === 'H5Slider') return true;
    const links = [item.props?.jumpAddress, ...(item.props?.list?.map((entry) => entry.link) || [])];
    return links.some((link) => {
      if (!link || link.startsWith('bilibili')) return false;
      try { return !new URL(link).hostname.includes('bilibili'); } catch { return false; }
    });
  };
  const walk = (items, path = []) => {
    for (const item of items || []) {
      const tracked = containers.has(item.name);
      if (tracked) path.push(item.uuid);
      if (external(item)) path.forEach((id) => hidden.add(id));
      for (const slot of item.slots || []) walk(slot.children, path);
      if (tracked) path.pop();
    }
  };
  const tree = window.__BILIACT_EVAPAGEDATA__?.layerTree;
  if (!tree) return;
  walk(tree);
  if (!hidden.size) return;
  const style = document.createElement('style');
  style.textContent = Array.from(hidden, (id) => `#${id}{display:none!important}`).join('');
  document.head.appendChild(style);
}

function enabled(env, key, fallback) {
  const value = env?.[key];
  return value == null ? fallback : String(value).toLowerCase() === 'true';
}

export default async function(ctx) {
  if (!enabled(ctx.env, 'purifyWebpage', true) || ctx.response?.status !== 200) return;
  const html = await ctx.response.text();
  const injection = `<script>(${clientCleanup.toString()})();</script>`;
  const body = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${injection}</head>`) : `${injection}${html}`;
  return {body};
}
