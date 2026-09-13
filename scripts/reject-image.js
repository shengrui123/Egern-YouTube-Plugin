export default async function(ctx) {
  // Transparent 1 x 1 GIF, equivalent to the original reject_img(200).
  return ctx.respond({status:200, headers:{'Content-Type':'image/gif'},
    body:new Uint8Array([71,73,70,56,57,97,1,0,1,0,128,0,0,0,0,0,255,255,255,
      33,249,4,1,0,0,0,0,44,0,0,0,0,1,0,1,0,0,2,2,68,1,0,59])});
}
