import type { APIRoute } from 'astro';
import settings from '../data/settings.json';

const HEX = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
const safe = (v: string | undefined, fallback: string) => (v && HEX.test(v) ? v : fallback);

export const GET: APIRoute = () => {
  const c = settings.colors || ({} as Record<string, string>);
  const primary = safe(c.primary, '#00C2A8');
  const primaryDark = safe(c.primaryDark, '#00A38D');
  const navy = safe(c.darkBg, '#0A1628');
  const navyLight = safe(c.darkBgLight, '#122240');

  const css = `main {
  --color-prettylights-syntax-comment: #8b949e;
  --color-prettylights-syntax-constant: #79c0ff;
  --color-prettylights-syntax-entity: #d2a8ff;
  --color-prettylights-syntax-storage-modifier-import: #c9d1d9;
  --color-prettylights-syntax-entity-tag: #7ee787;
  --color-prettylights-syntax-keyword: #ff7b72;
  --color-prettylights-syntax-string: #a5d6ff;
  --color-prettylights-syntax-variable: #ffa657;
  --color-prettylights-syntax-brackethighlighter-unmatched: #f85149;
  --color-prettylights-syntax-invalid-illegal-text: #f0f6fc;
  --color-prettylights-syntax-invalid-illegal-bg: #8e1519;
  --color-prettylights-syntax-carriage-return-text: #f0f6fc;
  --color-prettylights-syntax-carriage-return-bg: #b62324;
  --color-prettylights-syntax-string-regexp: #7ee787;
  --color-prettylights-syntax-markup-list: #f2cc60;
  --color-prettylights-syntax-markup-heading: #1f6feb;
  --color-prettylights-syntax-markup-italic: #c9d1d9;
  --color-prettylights-syntax-markup-bold: #c9d1d9;
  --color-prettylights-syntax-markup-deleted-text: #ffdcd7;
  --color-prettylights-syntax-markup-deleted-bg: #67060c;
  --color-prettylights-syntax-markup-inserted-text: #aff5b4;
  --color-prettylights-syntax-markup-inserted-bg: #033a16;
  --color-prettylights-syntax-markup-changed-text: #ffdfb6;
  --color-prettylights-syntax-markup-changed-bg: #5a1e02;
  --color-prettylights-syntax-markup-ignored-text: #c9d1d9;
  --color-prettylights-syntax-markup-ignored-bg: #1158c7;
  --color-prettylights-syntax-meta-diff-range: #d2a8ff;
  --color-prettylights-syntax-brackethighlighter-angle: #8b949e;
  --color-prettylights-syntax-sublimelinter-gutter-mark: #484f58;
  --color-prettylights-syntax-constant-other-reference-link: #a5d6ff;

  --color-btn-text: #E2E1DE;
  --color-btn-bg: ${navyLight};
  --color-btn-border: rgba(240, 246, 252, 0.1);
  --color-btn-shadow: 0 0 transparent;
  --color-btn-inset-shadow: 0 0 transparent;
  --color-btn-hover-bg: #1f2937;
  --color-btn-hover-border: #6e7681;
  --color-btn-active-bg: hsla(212, 12%, 18%, 1);
  --color-btn-active-border: #6e7681;
  --color-btn-selected-bg: #161b22;
  --color-btn-counter-bg: #30363d;

  --color-btn-primary-text: ${navy};
  --color-btn-primary-bg: ${primary};
  --color-btn-primary-border: rgba(240, 246, 252, 0.1);
  --color-btn-primary-shadow: 0 0 transparent;
  --color-btn-primary-inset-shadow: 0 0 transparent;
  --color-btn-primary-hover-bg: ${primaryDark};
  --color-btn-primary-hover-border: rgba(240, 246, 252, 0.1);
  --color-btn-primary-selected-bg: ${primaryDark};
  --color-btn-primary-selected-shadow: 0 0 transparent;
  --color-btn-primary-disabled-text: rgba(255, 255, 255, 0.5);
  --color-btn-primary-disabled-bg: ${primary}66;
  --color-btn-primary-disabled-border: rgba(240, 246, 252, 0.1);
  --color-btn-primary-icon: ${navy};
  --color-btn-primary-counter-bg: rgba(0, 0, 0, 0.2);

  --color-action-list-item-default-hover-bg: rgba(177, 186, 196, 0.12);

  --color-segmented-control-bg: rgba(110, 118, 129, 0.1);
  --color-segmented-control-button-bg: ${navyLight};
  --color-segmented-control-button-selected-border: #6e7681;

  --color-fg-default: #E2E1DE;
  --color-fg-muted: #9E9D9A;
  --color-fg-subtle: #6B6A67;
  --color-fg-on-emphasis: ${navy};
  --color-canvas-default: ${navy};
  --color-canvas-overlay: ${navyLight};
  --color-canvas-inset: #010409;
  --color-canvas-subtle: ${navyLight};
  --color-border-default: #333230;
  --color-border-muted: #1F1E1C;
  --color-neutral-muted: rgba(110, 118, 129, 0.4);
  --color-accent-fg: ${primary};
  --color-accent-emphasis: ${primary};
  --color-accent-muted: ${primary}66;
  --color-accent-subtle: ${primary}26;
  --color-success-fg: #3fb950;
  --color-success-emphasis: #238636;
  --color-attention-fg: #d29922;
  --color-attention-muted: rgba(187, 128, 9, 0.4);
  --color-attention-subtle: rgba(187, 128, 9, 0.15);
  --color-danger-fg: #f85149;
  --color-danger-muted: rgba(248, 81, 73, 0.4);
  --color-danger-subtle: rgba(248, 81, 73, 0.15);
  --color-primer-shadow-inset: 0 0 transparent;
  --color-scale-gray-7: #161b22;
  --color-scale-blue-1: #388bfd;
}

main .pagination-loader-container {
  background-image: url("https://github.com/images/modules/pulls/progressive-disclosure-line-dark.svg");
}

main .gsc-loading-image {
  background-image: url("https://github.githubassets.com/images/mona-loading-dark.gif");
}
`;

  return new Response(css, {
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'public, max-age=300, must-revalidate',
    },
  });
};
