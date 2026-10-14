const { test } = require('node:test')
const assert = require('node:assert/strict')
const { isAllowedOrigin } = require('../dist/config/origins')

test('allows the bundled APK, Electron and configured web clients', () => {
  const allowed = 'https://store.example, https://admin.example'
  for (const origin of [undefined, 'null', 'https://appassets.androidplatform.net', 'https://store.example', 'https://admin.example']) {
    assert.equal(isAllowedOrigin(origin, allowed), true, String(origin))
  }
})

test('rejects other origins, lookalike hosts, HTTP and wildcard configuration', () => {
  for (const origin of ['https://untrusted.example', 'https://appassets.androidplatform.net.evil.example', 'http://appassets.androidplatform.net', 'https://store.example.evil.example']) {
    assert.equal(isAllowedOrigin(origin, 'https://store.example'), false, origin)
  }
  assert.equal(isAllowedOrigin('https://untrusted.example', '*'), false)
})
