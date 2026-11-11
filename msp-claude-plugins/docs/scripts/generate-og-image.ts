/**
 * Generates docs/public/og-image.png with current plugin stats from
 * docs/src/data/plugins.ts. Runs as part of `prebuild` so social previews
 * always reflect the live counts (plugins, skills, subagents, commands).
 *
 * Usage: npx tsx scripts/generate-og-image.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

import { plugins } from '../src/data/plugins.js';

// ── Paths ──────────────────────────────────────────────────────────────
const DOCS_DIR = path.resolve(import.meta.dirname, '..');
const OUTPUT_PATH = path.join(DOCS_DIR, 'public', 'og-image.png');
// Use the woff files shipped by @fontsource/inter (already a dev dep).
// Satori supports TTF, OTF, and WOFF — woff is what fontsource bundles.
const INTER_BOLD_PATH = path.join(
  DOCS_DIR,
  'node_modules/@fontsource/inter/files/inter-latin-700-normal.woff'
);
const INTER_REGULAR_PATH = path.join(
  DOCS_DIR,
  'node_modules/@fontsource/inter/files/inter-latin-400-normal.woff'
);

// ── Counts ─────────────────────────────────────────────────────────────
const pluginCount = plugins.length;
const skillCount = plugins.flatMap((p) => p.skills).length;
const subagentCount = plugins.flatMap((p) => p.agents).length;
const commandCount = plugins.flatMap((p) => p.commands).length;

function loadFont(p: string): Uint8Array {
  if (!fs.existsSync(p)) {
    throw new Error(
      `Font not found at ${p}. Run \`npm install\` to fetch @fontsource/inter.`
    );
  }
  return new Uint8Array(fs.readFileSync(p));
}

// ── Element tree (satori takes plain object trees, no JSX compile needed) ──
function buildOgTree() {
  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)',
        padding: '64px',
        fontFamily: 'Inter',
        color: '#ffffff',
      },
      children: [
        // Top — brand
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '12px' },
            children: [
              {
                type: 'div',
                props: {
                  style: { fontSize: '32px', fontWeight: 400, color: '#7dd3fc', letterSpacing: '4px' },
                  children: 'WYRE MCP FOR MSPs',
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: '64px', fontWeight: 700, lineHeight: 1.1, marginTop: '8px' },
                  children: 'AI-Powered MCP Gateway',
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: '28px', fontWeight: 400, color: '#cbd5e1', maxWidth: '900px', marginTop: '16px' },
                  children: 'Connect every tool in your MSP stack to Claude through one secure gateway.',
                },
              },
            ],
          },
        },
        // Bottom — stats grid
        {
          type: 'div',
          props: {
            style: { display: 'flex', gap: '48px', alignItems: 'flex-end', justifyContent: 'space-between' },
            children: [
              statBlock(pluginCount, 'plugins'),
              statBlock(skillCount, 'skills'),
              statBlock(subagentCount, 'subagents'),
              statBlock(commandCount, 'commands'),
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end' },
                  children: [
                    { type: 'div', props: { style: { fontSize: '24px', color: '#7dd3fc', fontWeight: 500 }, children: 'conduit.wyre.ai' } },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function statBlock(value: number, label: string) {
  return {
    type: 'div',
    props: {
      style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
      children: [
        { type: 'div', props: { style: { fontSize: '72px', fontWeight: 700, color: '#7dd3fc', lineHeight: 1 }, children: String(value) } },
        { type: 'div', props: { style: { fontSize: '22px', fontWeight: 400, color: '#cbd5e1', marginTop: '4px' }, children: label } },
      ],
    },
  };
}

// ── Generate ───────────────────────────────────────────────────────────
async function main() {
  console.log(`Generating OG image with ${pluginCount} plugins / ${skillCount} skills / ${subagentCount} subagents / ${commandCount} commands…`);

  let fontBold: Uint8Array;
  let fontRegular: Uint8Array;
  try {
    fontBold = loadFont(INTER_BOLD_PATH);
    fontRegular = loadFont(INTER_REGULAR_PATH);
  } catch (err) {
    console.error(`Font load failed: ${err instanceof Error ? err.message : String(err)}`);
    console.error('Skipping OG image generation. The build will use the existing public/og-image.png if present.');
    process.exit(0); // non-fatal — keep build alive
  }

  const svg = await satori(buildOgTree() as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
      { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
    ],
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, png);
  console.log(`Wrote ${OUTPUT_PATH} (${(png.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
