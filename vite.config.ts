import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { Compiler } from 'inkjs/full';

/** .ink 파일을 import 하면 컴파일된 JSON 문자열을 돌려주는 플러그인 (런타임 컴파일러 불필요). */
function ink(): Plugin {
  return {
    name: 'ink-loader',
    transform(src, id) {
      if (!id.endsWith('.ink')) return null;
      const errors: string[] = [];
      const compiler = new Compiler(src, {
        errorHandler: (message: string, type: number) => {
          // type 2 = ERROR, 1 = WARNING, 0 = AUTHOR
          if (type === 2) errors.push(message);
          else console.warn(`[ink] ${id}: ${message}`);
        },
      });
      let json = '';
      try {
        json = compiler.Compile().ToJson() ?? '';
      } catch (e) {
        errors.push(String(e));
      }
      if (errors.length) this.error(`[ink] ${id}\n${errors.join('\n')}`);
      this.addWatchFile(id);
      return { code: `export default ${JSON.stringify(json)};`, map: null };
    },
  };
}

function listPublic(dir: string, prefix = ''): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listPublic(path.join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`],
  );
}

/** 빌드 결과 파일 목록을 넣은 서비스 워커(sw.js)를 만든다. 한 번 열면 오프라인에서도 실행된다. */
function pwa(): Plugin {
  return {
    name: 'pwa-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = [...Object.keys(bundle), ...listPublic(path.resolve('public'))].filter((f) => f !== 'sw.js');
      const version = crypto.createHash('sha1').update(files.join('|') + Object.values(bundle).map((b) => ('code' in b ? b.code : '')).join('')).digest('hex').slice(0, 10);
      const urls = ['./', ...files.map((f) => `./${f}`)];
      const source = fs.readFileSync(path.resolve('scripts/sw.template.js'), 'utf8').replaceAll('__VERSION__', version).replaceAll('__URLS__', JSON.stringify(urls));
      if (/__[A-Z]+__/.test(source)) this.error('sw.js 자리 표시자가 남아 있습니다');
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [ink(), svelte(), pwa()],
  server: { host: true },
  build: { target: 'es2020' },
  test: { include: ['tests/**/*.test.ts'] },
});
