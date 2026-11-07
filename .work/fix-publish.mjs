/** One-off: keep the repo empty on creation (we push our own LICENSE) and retag. */
import fs from 'node:fs';

let script = fs.readFileSync('scripts/publish.mjs', 'utf8');
script = script.replace(
  `        has_issues: true,
        has_wiki: false,
        license_template: 'mit'`,
  `        has_issues: true,
        has_wiki: false`
);
fs.writeFileSync('scripts/publish.mjs', script);
console.log('publish script: no license template (we push our own LICENSE)');
