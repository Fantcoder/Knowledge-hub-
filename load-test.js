/**
 * KnowledgeHub — Load Test Suite
 * Tests the backend API for 500 concurrent users.
 *
 * Usage:
 *   k6 run load-test.js
 *   k6 run --vus 500 --duration 60s load-test.js   (override users/duration)
 *
 * Set your backend URL below or via env var:
 *   $env:BASE_URL = "https://your-render-app.onrender.com"
 *   k6 run load-test.js
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// ── Config ──────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'https://your-render-app.onrender.com/api'

// Replace this with a real JWT token from your app
// Log in once manually, copy the token from localStorage -> accessToken
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'REPLACE_WITH_YOUR_JWT_TOKEN'

// ── Custom Metrics ───────────────────────────────────────────
const errorRate      = new Rate('error_rate')
const notesListTime  = new Trend('notes_list_duration', true)
const noteCreateTime = new Trend('note_create_duration', true)
const searchTime     = new Trend('search_duration', true)
const authTime       = new Trend('auth_duration', true)

// ── Load Profile ─────────────────────────────────────────────
export const options = {
    scenarios: {
        // Phase 1: Ramp up to 100 users (realistic warm-up)
        ramp_up: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 50 },   // ramp to 50 users in 30s
                { duration: '30s', target: 100 },  // ramp to 100 users
                { duration: '1m',  target: 100 },  // hold 100 users for 1min
                { duration: '30s', target: 200 },  // stress: ramp to 200
                { duration: '30s', target: 500 },  // spike: 500 concurrent
                { duration: '1m',  target: 500 },  // hold 500 for 1min
                { duration: '30s', target: 0 },    // ramp down
            ],
            gracefulRampDown: '10s',
        },
    },

    // ── Pass/Fail Thresholds ─────────────────────────────────
    thresholds: {
        // 95% of requests must complete under 2 seconds
        http_req_duration: ['p(95)<2000'],
        // 99% under 5 seconds
        'http_req_duration{percentile:99}': ['p(99)<5000'],
        // Error rate must stay below 5%
        error_rate: ['rate<0.05'],
        // Notes list: 95% under 1.5s (cached endpoint)
        notes_list_duration: ['p(95)<1500'],
        // Note create: 95% under 3s
        note_create_duration: ['p(95)<3000'],
        // Search: 95% under 2s
        search_duration: ['p(95)<2000'],
    },
}

const HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
}

// ── Main Test Scenario ────────────────────────────────────────
export default function () {
    // Simulate realistic user behavior with think time between actions

    group('Health Check', () => {
        const res = http.get(`${BASE_URL}/health`)
        check(res, {
            'health: status 200': (r) => r.status === 200,
        })
        errorRate.add(res.status !== 200)
    })

    sleep(0.5) // think time

    group('List Notes (most common operation)', () => {
        const start = Date.now()
        const res = http.get(`${BASE_URL}/notes?page=0&size=20`, { headers: HEADERS })
        notesListTime.add(Date.now() - start)

        const ok = check(res, {
            'list notes: status 200': (r) => r.status === 200,
            'list notes: has data':   (r) => r.json('data') !== null,
        })
        errorRate.add(!ok)
    })

    sleep(Math.random() * 2 + 0.5) // 0.5–2.5s think time

    group('Search Notes', () => {
        const queries = ['java', 'project', 'meeting', 'idea', 'todo', 'notes']
        const q = queries[Math.floor(Math.random() * queries.length)]

        const start = Date.now()
        const res = http.get(`${BASE_URL}/notes/search?q=${q}&page=0&size=10`, { headers: HEADERS })
        searchTime.add(Date.now() - start)

        check(res, {
            'search: status 200': (r) => r.status === 200,
        })
        errorRate.add(res.status !== 200)
    })

    sleep(Math.random() * 1 + 0.5)

    // Only 20% of users create a note in each iteration (realistic ratio)
    if (Math.random() < 0.2) {
        group('Create Note', () => {
            const payload = JSON.stringify({
                title: `Load Test Note ${Date.now()}`,
                content: '<p>This is a load test note created during stress testing.</p>',
                tags: ['load-test'],
            })

            const start = Date.now()
            const res = http.post(`${BASE_URL}/notes`, payload, { headers: HEADERS })
            noteCreateTime.add(Date.now() - start)

            check(res, {
                'create note: status 200 or 201': (r) => r.status === 200 || r.status === 201,
                'create note: has id': (r) => r.json('data.id') > 0,
            })
            errorRate.add(res.status >= 400)
        })
    }

    sleep(Math.random() * 2)
}

// ── Setup: Warm up the backend before test (optional) ────────
export function setup() {
    console.log(`🚀 Starting load test against: ${BASE_URL}`)
    console.log(`🔑 Auth token: ${AUTH_TOKEN.substring(0, 20)}...`)

    // Wake up Render (it may be sleeping - free tier spins down)
    const warmup = http.get(`${BASE_URL}/health`)
    console.log(`⚡ Warmup response: ${warmup.status}`)

    // Give it a few seconds to fully wake up
    sleep(3)
}

// ── Teardown: Print summary ───────────────────────────────────
export function teardown() {
    console.log('✅ Load test complete. Check thresholds above.')
}
