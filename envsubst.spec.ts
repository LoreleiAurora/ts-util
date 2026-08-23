/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: Tests for variable substitution */
import { describe, expect, it } from 'vitest';
import { EnvsubstError, envsubst, envsubstDeep } from './envsubst.js';

describe('envsubst', () => {
  describe('basic substitution', () => {
    it('replaces a single variable', () => {
      expect(envsubst('${GREETING}', { env: { GREETING: 'Hello' } })).toBe(
        'Hello',
      );
    });

    it('replaces multiple variables', () => {
      expect(
        envsubst('${GREETING}, ${NAME}!', {
          env: { GREETING: 'Hello', NAME: 'Alice' },
        }),
      ).toBe('Hello, Alice!');
    });

    it('leaves non-variable text unchanged', () => {
      expect(envsubst('plain text', { env: {} })).toBe('plain text');
    });

    it('ignores bare $VAR references (no braces)', () => {
      expect(envsubst('$GREETING', { env: { GREETING: 'x' } })).toBe(
        '$GREETING',
      );
    });

    it('uses process.env by default', () => {
      process.env.__ENVSUBST_TEST__ = 'from-process';
      expect(envsubst('${__ENVSUBST_TEST__}')).toBe('from-process');
      delete process.env.__ENVSUBST_TEST__;
    });

    it('uses the provided custom env map', () => {
      expect(envsubst('${X}', { env: { X: 'custom' } })).toBe('custom');
    });
  });

  describe('inline defaults', () => {
    it('uses the inline default when the var is missing', () => {
      expect(envsubst('${MISSING:stranger}', { env: {} })).toBe('stranger');
    });

    it('uses the env value when the var is present, ignores the default', () => {
      expect(envsubst('${NAME:Bob}', { env: { NAME: 'Alice' } })).toBe('Alice');
    });

    it('supports an empty inline default', () => {
      expect(envsubst('${MISSING:}', { env: {} })).toBe('');
    });

    it('supports colons inside the default value (e.g. a URL)', () => {
      expect(envsubst('${URL:http://localhost:3000}', { env: {} })).toBe(
        'http://localhost:3000',
      );
    });

    it('supports spaces in the default value', () => {
      expect(envsubst('${MSG:hello world}', { env: {} })).toBe('hello world');
    });
  });

  describe('onMissing option', () => {
    it('substitutes empty string by default ("empty")', () => {
      expect(envsubst('${MISSING}', { env: {} })).toBe('');
    });

    it('keeps the original expression when onMissing is "keep"', () => {
      expect(envsubst('${MISSING}', { env: {}, onMissing: 'keep' })).toBe(
        '${MISSING}',
      );
    });

    it('throws an EnvsubstError when onMissing is "throw"', () => {
      expect(() =>
        envsubst('${MISSING}', { env: {}, onMissing: 'throw' }),
      ).toThrow(EnvsubstError);
    });

    it('includes the variable name in the thrown error message', () => {
      expect(() =>
        envsubst('${MISSING}', { env: {}, onMissing: 'throw' }),
      ).toThrow('"MISSING"');
    });

    it('inline default beats onMissing: throw', () => {
      expect(envsubst('${MISSING:safe}', { env: {}, onMissing: 'throw' })).toBe(
        'safe',
      );
    });

    it('inline default beats onMissing: keep', () => {
      expect(envsubst('${MISSING:val}', { env: {}, onMissing: 'keep' })).toBe(
        'val',
      );
    });
  });

  describe('empty / trivial inputs', () => {
    it('returns an empty string unchanged', () => {
      expect(envsubst('', { env: {} })).toBe('');
    });

    it('returns a whitespace-only string unchanged', () => {
      expect(envsubst('   \t\n  ', { env: {} })).toBe('   \t\n  ');
    });

    it('returns plain text with no placeholders unchanged', () => {
      expect(envsubst('no vars here', { env: {} })).toBe('no vars here');
    });

    it('handles a template that is only a single variable', () => {
      expect(envsubst('${X}', { env: { X: 'hi' } })).toBe('hi');
    });
  });

  describe('variable name edge cases', () => {
    it('accepts a single-letter name', () => {
      expect(envsubst('${A}', { env: { A: 'a' } })).toBe('a');
    });

    it('accepts a single underscore as a name', () => {
      expect(envsubst('${_}', { env: { _: 'under' } })).toBe('under');
    });

    it('accepts names with leading underscores', () => {
      expect(envsubst('${__PRIVATE}', { env: { __PRIVATE: 'secret' } })).toBe(
        'secret',
      );
    });

    it('accepts names with trailing underscores', () => {
      expect(envsubst('${VAR_}', { env: { VAR_: 'val' } })).toBe('val');
    });

    it('accepts names containing digits (not at start)', () => {
      expect(envsubst('${VAR123}', { env: { VAR123: 'num' } })).toBe('num');
    });

    it('does NOT match a name that starts with a digit', () => {
      expect(envsubst('${1VAR}', { env: { '1VAR': 'bad' } })).toBe('${1VAR}');
    });

    it('does NOT match an empty brace expression ${}', () => {
      expect(envsubst('${}', { env: {} })).toBe('${}');
    });

    it('does NOT match braces containing only a colon ${:}', () => {
      expect(envsubst('${:}', { env: {} })).toBe('${:}');
    });

    it('does NOT match braces with spaces around the name', () => {
      expect(envsubst('${ VAR }', { env: { VAR: 'x' } })).toBe('${ VAR }');
    });

    it('does NOT match a bare $VAR reference (no braces)', () => {
      expect(envsubst('$VAR', { env: { VAR: 'x' } })).toBe('$VAR');
    });

    it('does NOT match a lone $ sign', () => {
      expect(envsubst('$', { env: {} })).toBe('$');
    });

    it('does NOT match an unclosed brace ${VAR', () => {
      expect(envsubst('${VAR', { env: { VAR: 'x' } })).toBe('${VAR');
    });

    it('handles very long variable names', () => {
      const name = 'A'.repeat(200);
      expect(envsubst(`\${${name}}`, { env: { [name]: 'long' } })).toBe('long');
    });
  });

  describe('defined-but-empty env values', () => {
    it("substitutes empty string when var is set to '' - default does NOT kick in", () => {
      expect(envsubst('${VAR:fallback}', { env: { VAR: '' } })).toBe('');
    });

    it("substitutes '0' correctly (falsy but defined)", () => {
      expect(envsubst('${COUNT:99}', { env: { COUNT: '0' } })).toBe('0');
    });

    it("substitutes 'false' correctly (falsy but defined)", () => {
      expect(envsubst('${FLAG:true}', { env: { FLAG: 'false' } })).toBe(
        'false',
      );
    });

    it('treats explicit undefined in env map as missing', () => {
      expect(envsubst('${VAR:default}', { env: { VAR: undefined } })).toBe(
        'default',
      );
    });
  });

  describe('inline default edge cases', () => {
    it('uses an empty default ${VAR:}', () => {
      expect(envsubst('${MISSING:}', { env: {} })).toBe('');
    });

    it('uses a default containing multiple colons', () => {
      expect(envsubst('${URL:http://host:8080/path}', { env: {} })).toBe(
        'http://host:8080/path',
      );
    });

    it('uses a default containing a $ sign', () => {
      expect(envsubst('${PRICE:$9.99}', { env: {} })).toBe('$9.99');
    });

    it('uses a default containing special regex characters', () => {
      expect(envsubst('${RE:^(foo|bar).*$}', { env: {} })).toBe(
        '^(foo|bar).*$',
      );
    });

    it('uses a default containing a newline', () => {
      expect(envsubst('${NL:line1\nline2}', { env: {} })).toBe('line1\nline2');
    });

    it('uses a default containing unicode', () => {
      expect(envsubst('${UNI:こんにちは}', { env: {} })).toBe('こんにちは');
    });

    it('uses a very long default value (10 000 chars)', () => {
      const longDefault = 'x'.repeat(10_000);
      expect(envsubst(`\${MISSING:${longDefault}}`, { env: {} })).toBe(
        longDefault,
      );
    });

    it('does NOT recursively substitute placeholders inside a default', () => {
      expect(
        envsubst('${OUTER:${INNER}}', {
          env: { INNER: 'should-not-appear' },
        }),
      ).toBe('${INNER}');
    });
  });

  describe('env values containing JS replace() special patterns', () => {
    // String.replace(regex, string) gives special meaning to $&, $`, $', $1
    // in the replacement string. Using a function replacer avoids this entirely.
    // These tests verify values are returned verbatim.

    it('handles a value containing $& (full match pattern)', () => {
      expect(envsubst('${V}', { env: { V: '$&' } })).toBe('$&');
    });

    it('handles a value containing $` (pre-match pattern)', () => {
      expect(envsubst('${V}', { env: { V: '$`' } })).toBe('$`');
    });

    it("handles a value containing $' (post-match pattern)", () => {
      expect(envsubst('${V}', { env: { V: "$'" } })).toBe("$'");
    });

    it('handles a value containing $$ (escaped dollar)', () => {
      expect(envsubst('${V}', { env: { V: '$$' } })).toBe('$$');
    });

    it('handles a value containing $1 (capture group pattern)', () => {
      expect(envsubst('${V}', { env: { V: '$1' } })).toBe('$1');
    });

    it('handles a value that is a combination of all special patterns', () => {
      expect(envsubst('Result: ${V}', { env: { V: "$& $` $' $$ $1" } })).toBe(
        "Result: $& $` $' $$ $1",
      );
    });
  });

  describe('no recursive expansion of substituted values', () => {
    it('does not expand placeholders embedded in a substituted value', () => {
      expect(
        envsubst('${OUTER}', {
          env: { OUTER: '${INNER}', INNER: 'should-not-appear' },
        }),
      ).toBe('${INNER}');
    });

    it('does not re-scan the string after substitution', () => {
      expect(
        envsubst('${A}${B}', {
          env: { A: '${B}', B: 'b' },
        }),
      ).toBe('${B}b');
    });
  });

  describe('adjacent and repeated variables', () => {
    it('handles two variables with no separator', () => {
      expect(envsubst('${A}${B}', { env: { A: 'foo', B: 'bar' } })).toBe(
        'foobar',
      );
    });

    it('handles the same variable referenced multiple times', () => {
      expect(envsubst('${X}-${X}-${X}', { env: { X: 'dup' } })).toBe(
        'dup-dup-dup',
      );
    });

    it('handles many consecutive variables', () => {
      const template = '${A}${B}${C}${D}${E}';
      const env = { A: '1', B: '2', C: '3', D: '4', E: '5' };
      expect(envsubst(template, { env })).toBe('12345');
    });

    it('handles variables at the very start and end of the string', () => {
      expect(envsubst('${S}middle${E}', { env: { S: '>>', E: '<<' } })).toBe(
        '>>middle<<',
      );
    });
  });

  describe('multiline templates', () => {
    it('substitutes variables across multiple lines', () => {
      const template = `Host: \${HOST}\nPort: \${PORT}\nPath: \${PATH_}`;
      const env = { HOST: 'localhost', PORT: '5432', PATH_: '/db' };
      expect(envsubst(template, { env })).toBe(
        'Host: localhost\nPort: 5432\nPath: /db',
      );
    });

    it('handles a newline inside a variable value', () => {
      expect(envsubst('[${MULTI}]', { env: { MULTI: 'a\nb' } })).toBe('[a\nb]');
    });
  });

  describe('onMissing – further edge cases', () => {
    it('"keep" preserves the full original expression including braces', () => {
      expect(envsubst('${MISSING}', { env: {}, onMissing: 'keep' })).toBe(
        '${MISSING}',
      );
    });

    it('throw names the first missing variable encountered', () => {
      expect(() =>
        envsubst('${A} ${NOPE}', {
          env: { A: 'present' },
          onMissing: 'throw',
        }),
      ).toThrow(new EnvsubstError('NOPE'));
    });

    it('throw fires on the first of multiple missing variables', () => {
      try {
        envsubst('${X} ${Y}', { env: {}, onMissing: 'throw' });
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(EnvsubstError);
        expect((err as EnvsubstError).variableName).toBe('X');
      }
    });

    it('EnvsubstError.variableName reflects the exact variable name', () => {
      try {
        envsubst('${MY_SECRET_VAR}', { env: {}, onMissing: 'throw' });
        expect.fail('should have thrown');
      } catch (err) {
        expect((err as EnvsubstError).variableName).toBe('MY_SECRET_VAR');
      }
    });

    it('EnvsubstError is an instanceof Error', () => {
      expect(new EnvsubstError('X')).toBeInstanceOf(Error);
    });

    it('EnvsubstError has the correct .name property', () => {
      expect(new EnvsubstError('X').name).toBe('EnvsubstError');
    });

    it('throw propagates even when a prior variable resolved fine', () => {
      expect(() =>
        envsubst('${GOOD}${BAD}', {
          env: { GOOD: 'ok' },
          onMissing: 'throw',
        }),
      ).toThrow(EnvsubstError);
    });
  });

  describe('near-miss / look-alike syntax', () => {
    it('treats $${VAR} as a literal $ followed by a substituted ${VAR}', () => {
      // The first $ is a literal character; the second starts a valid ${VAR}
      expect(envsubst('$${VAR}', { env: { VAR: 'x' } })).toBe('$x');
    });

    it('treats \\${VAR} as a literal backslash followed by a substituted value (no escape support)', () => {
      // There is no escape mechanism; \\ is just a literal character
      expect(envsubst('\\${VAR}', { env: { VAR: 'x' } })).toBe('\\x');
    });

    it('handles a } without a preceding ${ correctly', () => {
      expect(envsubst('no open } brace', { env: {} })).toBe('no open } brace');
    });

    it('handles text that has { but no $', () => {
      expect(envsubst('{VAR}', { env: { VAR: 'x' } })).toBe('{VAR}');
    });

    it('handles nested-looking syntax ${OUTER_${INNER}}', () => {
      // The outer ${OUTER_ is not valid (the $ inside breaks the name).
      // ${INNER} IS matched and substituted, resulting in ${OUTER_inner}.
      expect(
        envsubst('${OUTER_${INNER}}', {
          env: { OUTER_: 'no', INNER: 'inner' },
        }),
      ).toBe('${OUTER_inner}');
    });

    it('handles a string of just dollar signs', () => {
      expect(envsubst('$$$$$', { env: {} })).toBe('$$$$$');
    });

    it('handles a string of just braces', () => {
      expect(envsubst('{{{}}}', { env: {} })).toBe('{{{}}}');
    });
  });

  describe('unicode and exotic content', () => {
    it('handles unicode in the surrounding template text', () => {
      expect(envsubst('こんにちは ${NAME}！', { env: { NAME: '世界' } })).toBe(
        'こんにちは 世界！',
      );
    });

    it('handles emoji in the surrounding template text', () => {
      expect(envsubst('Hello 👋 ${NAME}', { env: { NAME: 'World 🌍' } })).toBe(
        'Hello 👋 World 🌍',
      );
    });

    it('handles right-to-left text in a value', () => {
      expect(envsubst('[${RTL}]', { env: { RTL: 'مرحبا' } })).toBe('[مرحبا]');
    });

    it('handles a null byte (\\x00) in a value', () => {
      expect(envsubst('${V}', { env: { V: '\x00' } })).toBe('\x00');
    });
  });

  describe('large / stress inputs', () => {
    it('handles a template with 1 000 distinct variables', () => {
      const keys = Array.from({ length: 1_000 }, (_, i) => `VAR${i}`);
      const env = Object.fromEntries(keys.map((k) => [k, k.toLowerCase()]));
      const template = keys.map((k) => `\${${k}}`).join(',');
      const expected = keys.map((k) => k.toLowerCase()).join(',');
      expect(envsubst(template, { env: env })).toBe(expected);
    });

    it('handles a very long template string with no variables (100 000 chars)', () => {
      const big = 'a'.repeat(100_000);
      expect(envsubst(big, { env: {} })).toBe(big);
    });

    it('handles a template where every character is part of a variable (10 000 reps)', () => {
      const template = '${A}'.repeat(10_000);
      const expected = 'z'.repeat(10_000);
      expect(envsubst(template, { env: { A: 'z' } })).toBe(expected);
    });
  });
});

describe('envsubstDeep', () => {
  const env = { HOST: 'localhost', PORT: '5432' };

  describe('primitive passthrough', () => {
    it('returns a positive integer unchanged', () => {
      expect(envsubstDeep(42, { env })).toBe(42);
    });

    it('returns zero unchanged', () => {
      expect(envsubstDeep(0, { env })).toBe(0);
    });

    it('returns a float unchanged', () => {
      expect(envsubstDeep(3.14, { env })).toBe(3.14);
    });

    it('returns true unchanged', () => {
      expect(envsubstDeep(true, { env })).toBe(true);
    });

    it('returns false unchanged', () => {
      expect(envsubstDeep(false, { env })).toBe(false);
    });

    it('returns null unchanged', () => {
      expect(envsubstDeep(null, { env })).toBeNull();
    });

    it('returns undefined unchanged', () => {
      expect(envsubstDeep(undefined, { env })).toBeUndefined();
    });
  });

  describe('string substitution', () => {
    it('substitutes a single variable', () => {
      expect(envsubstDeep('${HOST}', { env })).toBe('localhost');
    });

    it('substitutes multiple variables in one string', () => {
      expect(envsubstDeep('${HOST}:${PORT}', { env })).toBe('localhost:5432');
    });

    it('leaves a plain string with no placeholders unchanged', () => {
      expect(envsubstDeep('just text', { env })).toBe('just text');
    });

    it('returns an empty string unchanged', () => {
      expect(envsubstDeep('', { env })).toBe('');
    });
  });

  describe('object traversal', () => {
    it('substitutes in a flat object', () => {
      expect(
        envsubstDeep({ host: '${HOST}', port: '${PORT}' }, { env }),
      ).toEqual({ host: 'localhost', port: '5432' });
    });

    it('leaves non-string values in an object unchanged', () => {
      expect(
        envsubstDeep({ port: 5432, debug: true, meta: null }, { env }),
      ).toEqual({ port: 5432, debug: true, meta: null });
    });

    it('handles a mixed object (strings and non-strings)', () => {
      expect(
        envsubstDeep({ host: '${HOST}', port: 5432, tls: true }, { env }),
      ).toEqual({ host: 'localhost', port: 5432, tls: true });
    });

    it('recursively substitutes in a nested object', () => {
      expect(
        envsubstDeep({ db: { host: '${HOST}', port: '${PORT}' } }, { env }),
      ).toEqual({ db: { host: 'localhost', port: '5432' } });
    });

    it('handles a deeply nested object (5 levels)', () => {
      const input = { a: { b: { c: { d: { e: '${HOST}' } } } } };
      expect(envsubstDeep(input, { env })).toEqual({
        a: { b: { c: { d: { e: 'localhost' } } } },
      });
    });

    it('handles an empty object', () => {
      expect(envsubstDeep({}, { env })).toEqual({});
    });

    it('preserves all original keys, including those with no substitution', () => {
      const input = { x: 1, y: '${HOST}', z: true };
      expect(envsubstDeep(input, { env })).toEqual({
        x: 1,
        y: 'localhost',
        z: true,
      });
    });
  });

  describe('array traversal', () => {
    it('substitutes in a flat array of strings', () => {
      expect(envsubstDeep(['${HOST}', '${PORT}'], { env })).toEqual([
        'localhost',
        '5432',
      ]);
    });

    it('handles an empty array', () => {
      expect(envsubstDeep([], { env })).toEqual([]);
    });

    it('leaves non-string array items unchanged', () => {
      expect(envsubstDeep([1, true, null], { env })).toEqual([1, true, null]);
    });

    it('substitutes in an array of objects', () => {
      expect(
        envsubstDeep([{ host: '${HOST}' }, { port: '${PORT}' }], { env }),
      ).toEqual([{ host: 'localhost' }, { port: '5432' }]);
    });

    it('handles nested arrays', () => {
      expect(envsubstDeep([['${HOST}', '${PORT}']], { env })).toEqual([
        ['localhost', '5432'],
      ]);
    });

    it('handles an array of mixed types', () => {
      expect(envsubstDeep(['${HOST}', 42, true, null], { env })).toEqual([
        'localhost',
        42,
        true,
        null,
      ]);
    });
  });

  describe('EnvsubstOptions forwarding', () => {
    it('uses a custom env map', () => {
      expect(envsubstDeep('${X}', { env: { X: 'custom' } })).toBe('custom');
    });

    it('applies onMissing: "empty" (default) to strings in objects', () => {
      expect(envsubstDeep({ key: '${MISSING}' }, { env: {} })).toEqual({
        key: '',
      });
    });

    it('applies onMissing: "keep" to strings in objects', () => {
      expect(
        envsubstDeep({ key: '${MISSING}' }, { env: {}, onMissing: 'keep' }),
      ).toEqual({ key: '${MISSING}' });
    });

    it('applies onMissing: "keep" to strings in arrays', () => {
      expect(
        envsubstDeep(['${MISSING}'], { env: {}, onMissing: 'keep' }),
      ).toEqual(['${MISSING}']);
    });

    it('throws EnvsubstError for onMissing: "throw" on a string value', () => {
      expect(() =>
        envsubstDeep('${MISSING}', { env: {}, onMissing: 'throw' }),
      ).toThrow(EnvsubstError);
    });

    it('throws EnvsubstError for onMissing: "throw" on a nested object value', () => {
      expect(() =>
        envsubstDeep({ key: '${MISSING}' }, { env: {}, onMissing: 'throw' }),
      ).toThrow(EnvsubstError);
    });

    it('throws EnvsubstError for onMissing: "throw" on an array item', () => {
      expect(() =>
        envsubstDeep(['${MISSING}'], { env: {}, onMissing: 'throw' }),
      ).toThrow(EnvsubstError);
    });

    it('uses inline defaults from string values', () => {
      expect(envsubstDeep({ url: '${HOST:fallback}' }, { env: {} })).toEqual({
        url: 'fallback',
      });
    });

    it('inline default beats onMissing: "throw" inside a nested value', () => {
      expect(
        envsubstDeep(
          { key: '${MISSING:safe}' },
          { env: {}, onMissing: 'throw' },
        ),
      ).toEqual({ key: 'safe' });
    });
  });
});
