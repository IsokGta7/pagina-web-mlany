// Tests for the curated profanity lists and matchers.
// Each test asserts INTENDED behavior — what the filter SHOULD do for a
// Spanish science blog — so a future change that breaks the contract
// (e.g. someone adds "drogas" to the list) fails loudly with a clear message
// instead of silently shipping a bad filter.

import { describe, it, expect } from 'vitest';
import {
  tokenize,
  findProfanity,
  findHardBlock,
  ES_PROFANITY,
  EN_PROFANITY,
  HARD_BLOCK_SLURS,
} from '../netlify/functions/_profanity.js';

describe('tokenize', () => {
  it('lowercases everything', () => {
    expect(tokenize('Hello WORLD')).toEqual(['hello', 'world']);
  });

  it('splits on whitespace and punctuation', () => {
    expect(tokenize('hello, world! foo.bar?baz')).toEqual([
      'hello',
      'world',
      'foo',
      'bar',
      'baz',
    ]);
  });

  it('preserves Spanish accented characters within words', () => {
    expect(tokenize('cabrón pendejo')).toEqual(['cabrón', 'pendejo']);
  });

  it('drops empty fragments from doubled punctuation', () => {
    expect(tokenize('hello...world')).toEqual(['hello', 'world']);
  });
});

describe('findHardBlock', () => {
  it('catches the n-word in either spelling', () => {
    expect(findHardBlock('you are a nigger')).toBe('nigger');
    expect(findHardBlock('what a nigga')).toBe('nigga');
  });

  it('catches kike, chink, spic, wetback, gook, faggot, paki, raghead', () => {
    for (const slur of ['kike', 'chink', 'spic', 'wetback', 'gook', 'faggot', 'paki', 'raghead']) {
      expect(findHardBlock(`some text with ${slur} included`), `should block "${slur}"`).toBe(slur);
    }
  });

  it('is case-insensitive', () => {
    expect(findHardBlock('NIGGER')).toBe('nigger');
    expect(findHardBlock('Kike')).toBe('kike');
  });

  it('returns null for clean text', () => {
    expect(findHardBlock('A thoughtful, polite comment about quantum physics.')).toBeNull();
  });

  it('returns null for casual profanity that is not a slur', () => {
    expect(findHardBlock('this comment has fuck and shit in it')).toBeNull();
    expect(findHardBlock('eres un pendejo amigo')).toBeNull();
  });

  it('does NOT trigger on partial substrings within innocent words', () => {
    // Words like "Spica" (a star) should not match "spic"
    expect(findHardBlock('La estrella Spica brilla en Virgo.')).toBeNull();
    // "kikero" is not a real word, but the matcher must use word boundaries
    expect(findHardBlock('analyze the value of pi')).toBeNull();
  });
});

describe('findProfanity — language coverage', () => {
  it('finds common Spanish profanity', () => {
    for (const word of ['pendejo', 'puta', 'mierda', 'cabrón', 'gilipollas', 'joder']) {
      expect(
        findProfanity(`one ${word} two`),
        `should flag Spanish word "${word}"`
      ).toContain(word);
    }
  });

  it('finds common English profanity', () => {
    for (const word of ['fuck', 'shit', 'bitch', 'asshole', 'cunt']) {
      expect(
        findProfanity(`one ${word} two`),
        `should flag English word "${word}"`
      ).toContain(word);
    }
  });

  it('finds Mexican / regional Spanish variants', () => {
    expect(findProfanity('eres un boludo')).toContain('boludo');
    expect(findProfanity('chinga tu madre')).toContain('chinga');
    expect(findProfanity('qué pinche pesadilla')).toContain('pinche');
  });

  it('finds multi-word Spanish phrases', () => {
    expect(findProfanity('eres un hijo de puta')).toContain('hijo de puta');
    expect(findProfanity('vete a la mierda ya')).toContain('vete a la mierda');
    expect(findProfanity('chinga tu madre')).toContain('chinga tu madre');
  });

  it('is case-insensitive', () => {
    expect(findProfanity('PENDEJO!')).toContain('pendejo');
    expect(findProfanity('FUCK')).toContain('fuck');
  });

  it('deduplicates repeated hits', () => {
    const hits = findProfanity('puto puto puto puto');
    expect(hits.filter((h) => h === 'puto')).toHaveLength(1);
  });
});

describe('findProfanity — false-positive guards', () => {
  // This is the most important suite for a science blog. It encodes the
  // editorial decision that anatomical, pharmacological, and biological
  // terms must NOT trigger the filter. If a future commit adds any of these
  // to the lists, the test fails with a message naming the offending word.

  const SCIENCE_TOPIC_WORDS = [
    'heroína',  // opioide
    'drogas',   // farmacología
    'sexo',     // biología
    'semen',    // biología reproductiva
    'esperma',  // biología reproductiva
    'vulva',    // anatomía
    'pezón',    // anatomía
    'pene',     // anatomía
    'anatomía',
    'orina',    // fisiología
    'heroismo', // not profanity
    'caca',     // childish, not profane
    'pedo',     // childish
  ];

  it.each(SCIENCE_TOPIC_WORDS)(
    'allows "%s" in legitimate scientific context',
    (word) => {
      expect(
        findProfanity(`Article about ${word} in human biology.`),
        `"${word}" must not be flagged on a science blog`
      ).toEqual([]);
    }
  );

  it('returns empty array for thoughtful clean text', () => {
    const text = 'Excellent article about quantum entanglement and Bell inequalities.';
    expect(findProfanity(text)).toEqual([]);
  });

  it('does not flag short, common Spanish words that share substrings with profanity', () => {
    // "putrefacto" contains "puto"-like fragment but is a different word
    expect(findProfanity('La materia putrefacta es estudiada por la microbiología.')).toEqual([]);
    // "asno" (donkey) was in the LDNOOBW list but we excluded it as too mild
    expect(findProfanity('El asno es un equino doméstico.')).toEqual([]);
  });
});

describe('curated list invariants', () => {
  // Lock-in tests: the whole point of the curation effort is that certain
  // words are present and certain others are absent. These tests guard those
  // editorial decisions so they survive future refactors.

  it('hard-block list contains only true slurs, never casual profanity', () => {
    const casualProfanity = ['fuck', 'shit', 'bitch', 'pendejo', 'puta', 'mierda'];
    for (const word of casualProfanity) {
      expect(
        HARD_BLOCK_SLURS.has(word),
        `casual profanity "${word}" must NOT be in the hard-block list (would over-reject)`
      ).toBe(false);
    }
  });

  it('Spanish profanity list contains the core insults but not science terms', () => {
    expect(ES_PROFANITY.has('pendejo')).toBe(true);
    expect(ES_PROFANITY.has('mierda')).toBe(true);
    expect(ES_PROFANITY.has('puta')).toBe(true);

    expect(ES_PROFANITY.has('heroína')).toBe(false);
    expect(ES_PROFANITY.has('drogas')).toBe(false);
    expect(ES_PROFANITY.has('sexo')).toBe(false);
    expect(ES_PROFANITY.has('semen')).toBe(false);
  });

  it('English list does not contain plain anatomy terms', () => {
    // For a SCIENCE blog, anatomy/medical terms must pass the filter so
    // articles about reproductive biology, urology, etc. don't trigger
    // moderation queues. Sexual/explicit terms remain blocked.
    const anatomy = [
      'semen', 'sex', 'sexo', 'sexual', 'sexually', 'sexuality',
      'vulva', 'penis', 'rectum', 'vagina', 'nipple', 'nipples',
      'genitals', 'ejaculation', 'orgasm',
    ];
    for (const word of anatomy) {
      expect(
        EN_PROFANITY.has(word),
        `anatomy/medical term "${word}" must NOT be in EN_PROFANITY (would block science articles)`
      ).toBe(false);
    }
  });
});
