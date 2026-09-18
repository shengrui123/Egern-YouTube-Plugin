function enabled(env, key, fallback) {
  const value = env?.[key];
  return value == null ? fallback : String(value).toLowerCase() === 'true';
}

export default async function(ctx) {
  const url = ctx.request?.url ?? '';
  const isPromotion = /^https?:\/\/m\.client\.10010\.com\/(?:mobileserviceimportant\/customer\/querySmartServicekhd\.htm|clientIndex\/api\/v1\/index\/queryIndexExclusiveOffers)(?:\?|$)/.test(url);
  const isFeed = /^https?:\/\/img\.client\.10010\.com\/homejingxuan12\/js\/(?:pubuliu|1homeView)[^/?]*(?:\?|$)/.test(url);

  if ((isPromotion && enabled(ctx.env, 'blockPromotion', true)) ||
      (isFeed && enabled(ctx.env, 'cleanFeed', true))) {
    return ctx.respond({status: 200, body: ''});
  }
}
