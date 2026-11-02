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
for f in guide privacy terms support contact local-setup \
         he/guide he/privacy he/terms he/support he/contact he/local-setup; do
  for shape in "$f.html" "$f/index.html"; do
    if [ -f "dist/$shape" ]; then
      echo "  ok       $shape"
    else
      echo "::error::dist/$shape is missing - this URL is referenced by the"
      echo "::error::published extension or the store listing and cannot move."
      missing=1
    fi
  done
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
