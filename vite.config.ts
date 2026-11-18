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

export default defineConfig({
  base: './',
  plugins: [ink(), svelte()],
  server: { host: true },
  build: { target: 'es2020' },
  test: { include: ['tests/**/*.test.ts'] },
});
