const SUPPORTED_CLIENTS = new Set(["tg", "sg"]);

function querySuffix(url) {
  return url.search ? `&${url.search.slice(1)}` : "";
}

function buildDeepLink(url, client) {
  const scheme = SUPPORTED_CLIENTS.has(client) ? client : "tg";
  let parts = url.pathname.split("/").filter(Boolean);
  const suffix = querySuffix(url);

  // Private invite links: t.me/+hash and the legacy t.me/joinchat/hash form.
  if (parts.length === 1 && parts[0].startsWith("+") && parts[0].length > 1) {
    return `${scheme}://join?invite=${parts[0].slice(1)}`;
  }
  if (parts.length === 2 && parts[0] === "joinchat") {
    return `${scheme}://join?invite=${parts[1]}${suffix}`;
  }

  // Private message links: t.me/c/channel/message or /c/channel/thread/message.
  if (parts[0] === "c" && (parts.length === 3 || parts.length === 4)) {
    const [, channel, second, third] = parts;
    if (!/^\d+$/.test(channel) || !/^\d+$/.test(second)) return null;
    if (third !== undefined) {
      if (!/^\d+$/.test(third)) return null;
      return `${scheme}://privatepost?channel=${channel}&thread=${second}&post=${third}${suffix}`;
    }
    return `${scheme}://privatepost?channel=${channel}&post=${second}${suffix}`;
  }

  // Telegram web-preview links use /s/<username>/... but open the same peer.
  if (parts[0] === "s") parts = parts.slice(1);
  if (parts.length === 0) return null;

  const username = parts[0];
  if (!/^[A-Za-z0-9_]{5,32}$/.test(username)) return null;
  if (parts.length === 1) return `${scheme}://resolve?domain=${username}${suffix}`;
  if (parts.length === 2 && /^\d+$/.test(parts[1])) {
    return `${scheme}://resolve?domain=${username}&post=${parts[1]}${suffix}`;
  }
  if (parts.length === 3 && /^\d+$/.test(parts[1]) && /^\d+$/.test(parts[2])) {
    return `${scheme}://resolve?domain=${username}&thread=${parts[1]}&post=${parts[2]}${suffix}`;
  }
  return null;
}

export default async function(ctx) {
  let url;
  try {
    url = new URL(ctx.request.url);
  } catch {
    return;
  }

  if (!["t.me", "www.t.me", "telegram.me", "www.telegram.me", "telegram.dog", "www.telegram.dog"].includes(url.hostname)) {
    return;
  }

  const deepLink = buildDeepLink(url, ctx.env.CLIENT || "tg");
  if (!deepLink) return;

  return ctx.respond({
    status: 302,
    headers: {
      Location: deepLink,
      "Cache-Control": "no-store",
    },
  });
}
