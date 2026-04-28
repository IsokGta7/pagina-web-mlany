import type { APIRoute } from 'astro';
import settings from '../data/settings.json';

const HEX = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
const safe = (v: string | undefined, fallback: string) => (v && HEX.test(v) ? v : fallback);

export const GET: APIRoute = () => {
  const c = settings.colors || ({} as Record<string, string>);
  const primary = safe(c.primary, '#00C2A8');
  const primaryDark = safe(c.primaryDark, '#00A38D');
  const navy = safe(c.darkBg, '#0A1628');
  const lightBg = safe(c.lightBg, '#F8F7F4');

  const css = `main {
  --color-prettylights-syntax-comment: #6e7781;
  --color-prettylights-syntax-constant: #0550ae;
  --color-prettylights-syntax-entity: #8250df;
  --color-prettylights-syntax-storage-modifier-import: #24292f;
  --color-prettylights-syntax-entity-tag: #116329;
  --color-prettylights-syntax-keyword: #cf222e;
  --color-prettylights-syntax-string: #0a3069;
  --color-prettylights-syntax-variable: #953800;
  --color-prettylights-syntax-brackethighlighter-unmatched: #82071e;
  --color-prettylights-syntax-invalid-illegal-text: #f6f8fa;
  --color-prettylights-syntax-invalid-illegal-bg: #82071e;
  --color-prettylights-syntax-carriage-return-text: #f6f8fa;
  --color-prettylights-syntax-carriage-return-bg: #cf222e;
  --color-prettylights-syntax-string-regexp: #116329;
  --color-prettylights-syntax-markup-list: #3b2300;
  --color-prettylights-syntax-markup-heading: #0550ae;
  --color-prettylights-syntax-markup-italic: #24292f;
  --color-prettylights-syntax-markup-bold: #24292f;
  --color-prettylights-syntax-markup-deleted-text: #82071e;
  --color-prettylights-syntax-markup-deleted-bg: #FFEBE9;
  --color-prettylights-syntax-markup-inserted-text: #116329;
  --color-prettylights-syntax-markup-inserted-bg: #dafbe1;
  --color-prettylights-syntax-markup-changed-text: #953800;
  --color-prettylights-syntax-markup-changed-bg: #ffd8b5;
  --color-prettylights-syntax-markup-ignored-text: #eaeef2;
  --color-prettylights-syntax-markup-ignored-bg: #0550ae;
  --color-prettylights-syntax-meta-diff-range: #8250df;
  --color-prettylights-syntax-brackethighlighter-angle: #57606a;
  --color-prettylights-syntax-sublimelinter-gutter-mark: #818b98;
  --color-prettylights-syntax-constant-other-reference-link: #0a3069;

  --color-btn-text: #333230;
  --color-btn-bg: #FFFFFF;
  --color-btn-border: rgba(31, 35, 40, 0.15);
  --color-btn-shadow: 0 1px 0 rgba(31, 35, 40, 0.04);
  --color-btn-inset-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
  --color-btn-hover-bg: #F1F0ED;
  --color-btn-hover-border: rgba(31, 35, 40, 0.15);
  --color-btn-active-bg: hsla(35, 13%, 92%, 1);
  --color-btn-active-border: rgba(31, 35, 40, 0.15);
  --color-btn-selected-bg: hsla(35, 13%, 90%, 1);
  --color-btn-counter-bg: rgba(31, 35, 40, 0.08);

  --color-btn-primary-text: ${navy};
  --color-btn-primary-bg: ${primary};
  --color-btn-primary-border: rgba(31, 35, 40, 0.15);
  --color-btn-primary-shadow: 0 1px 0 rgba(31, 35, 40, 0.1);
  --color-btn-primary-inset-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
  --color-btn-primary-hover-bg: ${primaryDark};
  --color-btn-primary-hover-border: rgba(31, 35, 40, 0.15);
  --color-btn-primary-selected-bg: ${primaryDark};
  --color-btn-primary-selected-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.2);
  --color-btn-primary-disabled-text: rgba(31, 35, 40, 0.5);
  --color-btn-primary-disabled-bg: ${primary}80;
  --color-btn-primary-disabled-border: rgba(31, 35, 40, 0.1);
  --color-btn-primary-icon: ${navy};
  --color-btn-primary-counter-bg: rgba(31, 35, 40, 0.18);

  --color-action-list-item-default-hover-bg: rgba(208, 215, 222, 0.32);

  --color-segmented-control-bg: rgba(175, 184, 193, 0.2);
  --color-segmented-control-button-bg: #FFFFFF;
  --color-segmented-control-button-selected-border: #afb8c1;

  --color-fg-default: #333230;
  --color-fg-muted: #6B6A67;
  --color-fg-subtle: #9E9D9A;
  --color-fg-on-emphasis: ${navy};
  --color-canvas-default: ${lightBg};
  --color-canvas-overlay: #FFFFFF;
  --color-canvas-inset: #F1F0ED;
  --color-canvas-subtle: #F1F0ED;
  --color-border-default: #E2E1DE;
  --color-border-muted: #F1F0ED;
  --color-neutral-muted: rgba(175, 184, 193, 0.2);
  --color-accent-fg: ${primary};
  --color-accent-emphasis: ${primary};
  --color-accent-muted: ${primary}66;
  --color-accent-subtle: ${primary}1A;
  --color-success-fg: #1a7f37;
  --color-success-emphasis: #1f883d;
  --color-attention-fg: #9a6700;
  --color-attention-muted: rgba(212, 167, 44, 0.4);
  --color-attention-subtle: #fff8c5;
  --color-danger-fg: #d1242f;
  --color-danger-muted: rgba(255, 129, 130, 0.4);
  --color-danger-subtle: #FFEBE9;
  --color-primer-shadow-inset: 0 1px 0 rgba(208, 215, 222, 0.2);
  --color-scale-gray-7: #424a53;
  --color-scale-blue-1: #b6e3ff;
}

main .pagination-loader-container {
  background-image: url("https://github.com/images/modules/pulls/progressive-disclosure-line.svg");
}

main .gsc-loading-image {
  background-image: url("https://github.githubassets.com/images/mona-loading-default.gif");
}
`;

  return new Response(css, {
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'public, max-age=300, must-revalidate',
    },
  });
};
