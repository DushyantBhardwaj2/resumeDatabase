#!/usr/bin/env node

/**
 * Smoke test script for ResumeMint deployment.
 * Usage: node scripts/smoke-test.mjs [frontend_url] [backend_url]
 * Default URLs: http://localhost:3000 / http://localhost:8080
 *
 * Tests:
 *   1. /api/health
 *   2. / landing page
 *   3. /api/protected/* returns 401 without auth
 *   4. /tailor page does not 500
 */

const BASE = process.argv[2] || 'http://localhost:3000'
const BACKEND_BASE = process.argv[3] || 'http://localhost:8080'
const passed = []
const failed = []

async function check(label, fn) {
  try {
    await fn()
    passed.push(label)
    console.log(`  [PASS] ${label}`)
  } catch (err) {
    failed.push({ label, reason: err.message })
    console.log(`  [FAIL] ${label}: ${err.message}`)
  }
}

async function main() {
  console.log(`\nSmoke tests against ${BASE}\n`)

  await check('Health endpoint responds', async () => {
    const res = await fetch(`${BACKEND_BASE}/api/health`)
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
    const body = await res.json()
    if (body.status !== 'ok') throw new Error(`Expected status=ok, got ${JSON.stringify(body)}`)
  })

  await check('Frontend landing page loads', async () => {
    const res = await fetch(BASE, { redirect: 'manual' })
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  })

  await check('Protected endpoint returns 401 without session', async () => {
    const res = await fetch(`${BACKEND_BASE}/api/protected/profile`)
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`)
  })

  await check('Tailor page does not 500', async () => {
    const res = await fetch(`${BASE}/tailor`, { redirect: 'manual' })
    if (res.status >= 500) throw new Error(`Expected <500, got ${res.status}`)
  })

  console.log(`\n-- Results --`)
  console.log(`  Passed: ${passed.length}/${passed.length + failed.length}`)
  if (failed.length > 0) {
    console.log(`  Failed:`)
    for (const f of failed) {
      console.log(`    - ${f.label}: ${f.reason}`)
    }
    process.exit(1)
  } else {
    console.log('  All smoke tests passed.')
  }
}

main().catch((err) => {
  console.error('Smoke test runner error:', err)
  process.exit(1)
})
