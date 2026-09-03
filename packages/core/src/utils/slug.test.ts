import { describe, expect, it } from 'vitest';

import { slugify } from './slug.ts';

describe('slugify', () => {
  it('folds an accented character to its base letter', () => {
    expect(slugify('Açaí Manutenção')).toBe('acai-manutencao');
    expect(slugify('Eletrônica São Paulo')).toBe('eletronica-sao-paulo');
  });

  it('lowercases and joins words with a hyphen', () => {
    expect(slugify('My_Shop')).toBe('my-shop');
  });

  it('drops surrounding whitespace', () => {
    expect(slugify('  Reparação Já  ')).toBe('reparacao-ja');
  });

  it('leaves a value that is already a slug alone', () => {
    expect(slugify('acai-manutencao')).toBe('acai-manutencao');
  });

  it('returns an empty string when nothing survives the transform', () => {
    expect(slugify('!!!')).toBe('');
    expect(slugify('日本語')).toBe('');
    expect(slugify('')).toBe('');
  });
});
