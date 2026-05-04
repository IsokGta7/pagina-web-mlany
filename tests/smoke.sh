#!/usr/bin/env bash
# Smoke test the built site. Boots a static server against ./dist, hits the
# main URLs, and asserts that key DOM markers show up. Designed to fail loudly
# when a template stops rendering or a content collection breaks.
#
# Each `check` line tests an INVARIANT: the rendered output should contain
# the named pattern. If the test fails, the pattern is what to look for in
# the broken output.

set -uo pipefail

BASE="${SMOKE_BASE_URL:-http://localhost:4321}"
PASS=0
FAIL=0

check() {
  local url="$1"
  local pattern="$2"
  local desc="$3"

  local body status
  body="$(curl -sf "$BASE$url" 2>/dev/null)"
  status=$?
  if [[ $status -ne 0 || -z "$body" ]]; then
    echo "✗ $desc — fetch failed for $url"
    FAIL=$((FAIL + 1))
    return
  fi
  if echo "$body" | grep -qE "$pattern"; then
    echo "✓ $desc"
    PASS=$((PASS + 1))
  else
    echo "✗ $desc — pattern not found in $url"
    echo "    pattern: $pattern"
    FAIL=$((FAIL + 1))
  fi
}

check_absent() {
  local url="$1"
  local pattern="$2"
  local desc="$3"

  local body
  body="$(curl -sf "$BASE$url" 2>/dev/null)"
  if [[ -z "$body" ]]; then
    echo "✗ $desc — fetch failed for $url"
    FAIL=$((FAIL + 1))
    return
  fi
  if echo "$body" | grep -qE "$pattern"; then
    echo "✗ $desc — found unwanted pattern '$pattern' in $url"
    FAIL=$((FAIL + 1))
  else
    echo "✓ $desc"
    PASS=$((PASS + 1))
  fi
}

echo "=== Page render checks ==="
check "/" "<title>" "Homepage has a title tag"
check "/" "Ciensite|<h1" "Homepage has site name or h1"
check "/articulos/" "Artículos" "Articles index renders heading"
check "/equipo/" "<article" "Team page renders cards"
check "/contacto/" "<form" "Contact page has the contact form"
check "/contacto/" "data-netlify" "Contact form is Netlify-Forms tagged"
check "/privacidad/" "Política" "Privacy policy renders"
check "/terminos/" "Términos|términos" "Terms page renders"
check "/404.html" "404" "404 page reachable"

echo
echo "=== Generated routes ==="
check "/rss.xml" "<rss" "RSS feed is valid XML"
check "/rss.xml" "<channel>" "RSS feed has a channel"
check "/robots.txt" "User-agent" "robots.txt is served"
check "/sitemap-index.xml" "sitemapindex|<sitemap" "Sitemap index is generated"

echo
echo "=== Per-article rendering ==="
# Iterate over actual article files so the test scales as articles are added.
shopt -s nullglob
for f in src/content/articulos/*.mdx; do
  slug=$(basename "$f" .mdx)
  url="/articulos/${slug}/"
  check "$url" "<article" "Article '$slug' renders"
  check "$url" "id=\"comment-form\"|comment-form" "Article '$slug' has the comments form"
done

echo
echo "=== Pages must not contain placeholder leakage ==="
for path in / /articulos/ /equipo/ /contacto/ /privacidad/ /terminos/; do
  check_absent "$path" "\[object Object\]" "No '[object Object]' in $path"
  # Quotes aren't rendered as &lt; conflict markers but if they were they'd surface
  check_absent "$path" "<<<<<<<|=======|>>>>>>>" "No git conflict markers in $path"
  check_absent "$path" "Lorem ipsum" "No leftover lorem ipsum in $path"
done

echo
echo "=== Theme infrastructure ==="
check "/" "color-teal:" "CMS color overrides emitted on homepage"
check "/" "noscript|skip-to-content|Saltar al contenido" "Skip-to-content link present"
check "/articulos/" 'id="main"' "Main landmark exists for skip link"

echo
echo "=== Accessibility / SEO basics ==="
check "/" '<html lang="es"' "html lang attribute set to es"
check "/" 'rel="canonical"' "canonical link tag present"
check "/" 'property="og:title"' "Open Graph title meta"
check "/articulos/" '<meta name="description"' "Article list has meta description"

echo
echo "=== Result ==="
echo "Passed: $PASS"
echo "Failed: $FAIL"

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
