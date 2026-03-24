/**
 * Manual / CI-friendly checks for lib/eventCheckInUrlToken.ts
 * Run: npx tsx scripts/verify-eventCheckInUrlToken.ts
 */
import assert from 'node:assert/strict';

import {
  createEventCheckInUrlPayload,
  parseEventCheckInUrlToken,
  serializeEventCheckInUrlToken,
  signEventCheckInUrlToken,
  verifyEventCheckInUrlPayload,
  verifySerializedEventCheckInUrlToken,
} from '../lib/eventCheckInUrlToken';

const secret = 'test-secret-at-least-16b';
const eventId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const chapterId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

function testRoundTrip() {
  const payload = createEventCheckInUrlPayload(eventId, chapterId, secret);
  assert.equal(payload.e, eventId);
  assert.equal(payload.c, chapterId);
  const token = serializeEventCheckInUrlToken(payload);
  assert.ok(!token.includes('+'), 'base64url should not use +');
  assert.ok(!token.includes('/'), 'base64url should not use /');
  const parsed = verifySerializedEventCheckInUrlToken(token, secret);
  assert.ok(parsed);
  assert.deepEqual(parsed, payload);
}

function testTamperedSignature() {
  const payload = createEventCheckInUrlPayload(eventId, chapterId, secret);
  payload.s = '0'.repeat(64);
  assert.equal(verifyEventCheckInUrlPayload(payload, secret), false);
  const badToken = serializeEventCheckInUrlToken(payload);
  assert.equal(verifySerializedEventCheckInUrlToken(badToken, secret), null);
}

function testWrongSecret() {
  const payload = createEventCheckInUrlPayload(eventId, chapterId, secret);
  assert.equal(verifyEventCheckInUrlPayload(payload, 'other-secret-at-least-16b'), false);
}

function testExpiredToken() {
  const i = Math.floor(Date.now() / 1000) - 3600;
  const s = signEventCheckInUrlToken(eventId, chapterId, i, secret);
  const payload = { e: eventId, c: chapterId, i, s };
  assert.equal(verifyEventCheckInUrlPayload(payload, secret, 300), false);
  assert.equal(verifyEventCheckInUrlPayload(payload, secret, 7200), true);
}

function testSwappedEventIdFailsSignature() {
  const payload = createEventCheckInUrlPayload(eventId, chapterId, secret);
  const swapped = { ...payload, e: 'cccccccc-cccc-cccc-cccc-cccccccccccc' };
  const token = serializeEventCheckInUrlToken(swapped);
  assert.equal(verifySerializedEventCheckInUrlToken(token, secret), null);
}

function testSwappedChapterIdFailsSignature() {
  const payload = createEventCheckInUrlPayload(eventId, chapterId, secret);
  const swapped = { ...payload, c: 'dddddddd-dddd-dddd-dddd-dddddddddddd' };
  const token = serializeEventCheckInUrlToken(swapped);
  assert.equal(verifySerializedEventCheckInUrlToken(token, secret), null);
}

function testInvalidInput() {
  assert.equal(parseEventCheckInUrlToken(''), null);
  assert.equal(parseEventCheckInUrlToken('not-base64url!!!'), null);
  assert.equal(verifySerializedEventCheckInUrlToken('e30=', secret), null);
}

testRoundTrip();
testTamperedSignature();
testWrongSecret();
testExpiredToken();
testSwappedEventIdFailsSignature();
testSwappedChapterIdFailsSignature();
testInvalidInput();

console.log('eventCheckInUrlToken: all checks passed');
