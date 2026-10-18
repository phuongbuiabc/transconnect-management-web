import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Load real source modules without Vite/browser globals or a second build tree.
async function moduleUrl(url) {
  const source = await readFile(url, 'utf8');
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const imports = [...outputText.matchAll(/from\s+['"](\.[^'"]+)['"]/g)];
  for (const match of imports) {
    const dependency = await moduleUrl(new URL(match[1] + '.ts', url));
    outputText = outputText.replace(match[0], `from '${dependency}'`);
  }
  return 'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64');
}

export async function loadTypeScript(url) {
  return import(await moduleUrl(url));
}
