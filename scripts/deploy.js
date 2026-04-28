import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8')
);
const version = `v${pkg.version}`;

// Parse owner/repo from git remote
const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
const match  = remote.match(/github\.com[:/](.+?)(?:\.git)?$/);
if (!match) { console.error('Could not parse GitHub remote URL'); process.exit(1); }
const [owner, repo] = match[1].split('/');

let token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!token) {
  try {
    const ghBin = execSync('which -a gh', { encoding: 'utf8' })
      .split('\n')
      .find(p => p.trim() && !p.includes('node_modules'))
      ?.trim();
    if (ghBin) token = execSync(`${ghBin} auth token`, { encoding: 'utf8' }).trim();
  } catch { /* gh not installed or not authenticated */ }
}
if (!token) {
  console.error('No GitHub token found. Set GH_TOKEN, or install and authenticate the GitHub CLI (https://cli.github.com/).');
  process.exit(1);
}

console.log(`Triggering release ${version} for ${owner}/${repo}...`);

const res = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/actions/workflows/release.yml/dispatches`,
  {
    method: 'POST',
    headers: {
      Authorization:          `Bearer ${token}`,
      Accept:                 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type':         'application/json',
    },
    body: JSON.stringify({ ref: 'main', inputs: { version } }),
  }
);

if (!res.ok) {
  console.error(`GitHub API error ${res.status}: ${await res.text()}`);
  process.exit(1);
}

console.log(`Done. Watch progress: https://github.com/${owner}/${repo}/actions`);
