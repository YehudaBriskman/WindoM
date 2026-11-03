#!/usr/bin/env bash
# Every public URL the built site must still serve. Run from site/ after a build.
#
# One copy, used by CI on pull requests and by deploy-site.yml before it uploads
# to Pages. There used to be two lists: CI's checked six .html files, the deploy
# checked thirteen routes at both addresses plus the search index - so a PR could
# go green and then fail the deploy on main.
#
# Every route is emitted at two addresses: the clean URL we want, and the
# .html one already registered somewhere we do not control - the store listing,
# and the guide link compiled into the extension, which would need a store
# release to repair. Both shapes are asserted, because the way a generated pair
# regresses is one half of it quietly going missing.
set -u
missing=0

# The pages come from the built sitemap, not a hand-kept list. The list used to
# be typed out here, and #435 added /install and /he/install without adding them
# to it - so nothing checked them, the build shipped them without their flat
# .html file, and the live check after every deploy failed until it was found.
# A page in the sitemap is a page we publish; every one gets both files.
pages=$(grep -o '<loc>[^<]*</loc>' dist/sitemap.xml 2>/dev/null \
          | sed -e 's#<loc>https://[^/]*##' -e 's#</loc>##' -e 's#/$##')
count=$(printf '%s\n' $pages | grep -c . || true)
echo "  sitemap: $count pages"
if [ "$count" -lt 10 ]; then
  echo "::error::dist/sitemap.xml lists $count pages - expected every route, en and he."
  missing=1
fi

for f in $pages; do
  [ -z "$f" ] && continue   # the home page: index.html, checked below
  f=${f#/}
  # Both files are load-bearing on GitHub Pages:
  #   $f.html        makes the clean URL /$f answer 200. Without it Pages answers
  #                  /$f with a 301 to /$f/, which the deploy's live check (and
  #                  any client that does not follow redirects) treats as broken.
  #                  It is also the .html URL the store listing and the published
  #                  extension link to, which cannot move without a store release.
  #   $f/index.html  serves /$f/ with a trailing slash.
  for shape in "$f.html" "$f/index.html"; do
    if [ -f "dist/$shape" ]; then
      echo "  ok       $shape"
    else
      echo "::error::dist/$shape is missing. Every page in the sitemap needs both"
      echo "::error::$f.html and $f/index.html - see emittedPaths() in src/routes.tsx."
      missing=1
    fi
  done
done

# Pages the published extension or the store listing link to by their .html
# address. They are in the sitemap today; this keeps them required even if one
# is ever dropped from it.
for f in guide privacy terms support contact local-setup \
         he/guide he/privacy he/terms he/support he/contact he/local-setup; do
  test -f "dist/$f.html" || { echo "::error::dist/$f.html is missing - it is linked from the published extension or the store listing."; missing=1; }
done
for f in index.html 404.html sitemap.xml CNAME; do
  test -f "dist/$f" || { echo "::error::dist/$f is missing."; missing=1; }
done
# The search index is generated from the rendered pages, so an empty or absent
# one means the extraction stopped matching the markup - which the prerender
# itself would not notice.
sections=$(grep -o '"id"' dist/search-index.json 2>/dev/null | wc -l)
echo "  search index: $sections sections"
if [ "$sections" -lt 50 ]; then
  echo "::error::dist/search-index.json has $sections sections - expected well over 50."
  missing=1
fi
exit $missing
