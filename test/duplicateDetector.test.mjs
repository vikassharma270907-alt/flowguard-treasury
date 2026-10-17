import test from 'node:test';
import assert from 'node:assert/strict';
import duplicateDetector from '../server/duplicateDetector.js';

const { calculateLevenshtein } = duplicateDetector;

test('calculateLevenshtein - exact match', () => {
  assert.equal(calculateLevenshtein('test', 'test'), 0);
  assert.equal(calculateLevenshtein('12345', '12345'), 0);
});

test('calculateLevenshtein - empty strings', () => {
  assert.equal(calculateLevenshtein('', ''), 0);
  assert.equal(calculateLevenshtein('test', ''), 4);
  assert.equal(calculateLevenshtein('', 'test'), 4);
});

test('calculateLevenshtein - null and undefined', () => {
  assert.equal(calculateLevenshtein(null, 'test'), 4);
  assert.equal(calculateLevenshtein('test', undefined), 4);
  assert.equal(calculateLevenshtein(null, undefined), 0);
  assert.equal(calculateLevenshtein(undefined, null), 0);
});

test('calculateLevenshtein - insertions', () => {
  assert.equal(calculateLevenshtein('test', 'tests'), 1);
  assert.equal(calculateLevenshtein('test', 'atest'), 1);
  assert.equal(calculateLevenshtein('test', 'teast'), 1);
});

test('calculateLevenshtein - deletions', () => {
  assert.equal(calculateLevenshtein('tests', 'test'), 1);
  assert.equal(calculateLevenshtein('atest', 'test'), 1);
  assert.equal(calculateLevenshtein('teast', 'test'), 1);
});

test('calculateLevenshtein - substitutions', () => {
  assert.equal(calculateLevenshtein('test', 'tost'), 1);
  assert.equal(calculateLevenshtein('test', 'tent'), 1);
  assert.equal(calculateLevenshtein('abc', 'xyz'), 3);
});

test('calculateLevenshtein - complex changes', () => {
  assert.equal(calculateLevenshtein('kitten', 'sitting'), 3);
  assert.equal(calculateLevenshtein('flaw', 'lawn'), 2);
  assert.equal(calculateLevenshtein('intention', 'execution'), 5);
});

test('calculateLevenshtein - case sensitivity', () => {
  assert.equal(calculateLevenshtein('Test', 'test'), 1);
  assert.equal(calculateLevenshtein('TEST', 'test'), 4);
});
