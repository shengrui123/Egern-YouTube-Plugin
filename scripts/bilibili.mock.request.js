const RESPONSES = {
  '/bilibili.app.interface.v1.Teenagers/ModeStatus':
    'AAAAABMKEQgCEgl0ZWVuYWdlcnMgAioA',
  '/bilibili.app.interface.v1.Search/DefaultWords':
    'AAAAACEaHeaQnOe0ouinhumikeOAgeeVquWJp+aIlnVw5Li7KAE=',
};

function decodeBase64(value) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = value.replace(/=+$/, '');
  const bytes = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const index = chars.indexOf(char);
    if (index < 0) continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

export default async function(ctx) {
  const path = new URL(ctx.request.url).pathname;
  const encoded = RESPONSES[path];
  if (!encoded) return;
  return ctx.respond({
    status: 200,
    headers: {
      'Content-Type': 'application/grpc',
      'grpc-status': '0',
    },
    body: decodeBase64(encoded),
  });
}
