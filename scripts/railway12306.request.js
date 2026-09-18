const BLOCKED_OPERATIONS = new Set([
  'com.cars.otsmobile.integration.activityBanner',
  'com.cars.otsmobile.memberInfo.getMemberQa',
  'com.cars.otsmobile.newHomePage.initData',
  'com.cars.otsmobile.newHomePageBussData',
  'com.cars.otsmobile.paySuccBuss.bussEntryShow',
]);

export default async function(ctx) {
  const url = ctx.request?.url ?? '';
  if (!/^https:\/\/mobile\.12306\.cn\/otsmobile\/app\/mgs\/mgw\.htm(?:\?|$)/.test(url)) return;

  const operationType = ctx.request?.headers?.get?.('operation-type') ??
    ctx.request?.headers?.['operation-type'] ??
    ctx.request?.headers?.['Operation-Type'];

  if (BLOCKED_OPERATIONS.has(operationType)) return ctx.abort();
}
