/**
 * ArmorIQ Authentication Test Suite
 * Validates endpoints adhering to https://docs.armoriq.ai/platform/authentication
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import authService from '../server/authService.js';

test('1. ArmorIQ Sign In - Password Authentication', () => {
  const result = authService.authenticateWithPassword('beyond_nothing@flowguard.io', 'ArmorIQ#2026');
  assert.equal(result.success, true);
  assert.equal(result.authenticated, true);
  assert.equal(result.user.email, 'beyond_nothing@flowguard.io');
  assert.equal(result.user.role, 'SUPER_ADMIN');
  assert.ok(result.accessToken, 'Access token must be returned');
  assert.ok(result.refreshToken, 'Refresh token must be returned');
  assert.equal(result.expiresIn, 900, 'Access token must have 15-minute lifetime (900s)');

  // Verify JWT structure (Header.Payload.Signature)
  const parts = result.accessToken.split('.');
  assert.equal(parts.length, 3, 'JWT must have 3 segments');

  // Verify token
  const verified = authService.verifyAccessToken(result.accessToken);
  assert.equal(verified.valid, true);
  assert.equal(verified.payload.email, 'beyond_nothing@flowguard.io');
});

test('2. ArmorIQ Sign In - Rejection on invalid credentials', () => {
  const result = authService.authenticateWithPassword('beyond_nothing@flowguard.io', 'WrongPassword123');
  assert.equal(result.success, false);
  assert.match(result.error, /Invalid email or password/);
});

test('3. ArmorIQ Sessions & Tokens - Automatic Token Refresh', () => {
  const loginRes = authService.authenticateWithPassword('beyond_nothing@flowguard.io', 'ArmorIQ#2026');
  assert.ok(loginRes.refreshToken);

  const refreshRes = authService.refreshSession(loginRes.refreshToken);
  assert.equal(refreshRes.success, true);
  assert.ok(refreshRes.accessToken);
  assert.equal(refreshRes.expiresIn, 900);

  const verified = authService.verifyAccessToken(refreshRes.accessToken);
  assert.equal(verified.valid, true);
  assert.equal(verified.payload.email, 'beyond_nothing@flowguard.io');
});

test('4. ArmorIQ Sign Up & 6-Digit OTP Verification', () => {
  const testEmail = `new_officer_${Date.now()}@flowguard.io`;
  const signUpRes = authService.initiateSignUp(testEmail, 'Test Officer', 'SecurePass#2026', 'FlowGuard Org');
  assert.equal(signUpRes.success, true);
  assert.equal(signUpRes.requiresVerification, true);
  assert.ok(signUpRes.otpHint, 'OTP must be generated');
  assert.equal(signUpRes.otpHint.length, 6, 'OTP must be 6 digits per ArmorIQ spec');

  // Verify with OTP
  const verifyRes = authService.verifyOtp(testEmail, signUpRes.otpHint);
  assert.equal(verifyRes.success, true);
  assert.equal(verifyRes.authenticated, true);
  assert.equal(verifyRes.user.email, testEmail);
  assert.ok(verifyRes.accessToken);
  assert.ok(verifyRes.refreshToken);
});

test('5. ArmorIQ Device Approval Flow', () => {
  const req = authService.createDeviceCodeRequest('ArmorIQ CLI (armoriq login)');
  assert.ok(req.userCode, 'User code must be generated');
  assert.ok(req.deviceCode, 'Device code must be generated');
  assert.equal(req.verificationUrl, '/auth/device');

  const approveRes = authService.approveDeviceCode(req.userCode, 'ak_live_b4f92a10c83d4e7f');
  assert.equal(approveRes.success, true);
  assert.equal(approveRes.status, 'approved');
  assert.equal(approveRes.entry.approvedApiKey, 'ak_live_b4f92a10c83d4e7f');
});
