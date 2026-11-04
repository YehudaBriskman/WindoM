#!/usr/bin/env bash
# Push the gate's image to a registry and resolve the digest a machine will run.
#
#   push-image.sh <local image> <remote ref>
#
# Writes ref=, pushed= (what `docker push` reported - an OCI index under the
# containerd image store) and digest= (the linux/amd64 image manifest inside it,
# which is what Fly records per machine) to $GITHUB_OUTPUT.
#
# One script for two callers, so the code that runs on release day is the code
# that is rehearsed every week:
#   - release.yml deploy job: registry.fly.io, after `flyctl auth docker`;
#   - release-rehearsal.yml: a throwaway local registry, same image, same steps.
# v1.6.0 (2026-11-04) shipped a push step that had never once run before the
# release, and it compared the wrong one of these two digests.
set -euo pipefail

LOCAL="${1:?local image}"
REF="${2:?remote ref}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

docker tag "$LOCAL" "$REF"
docker push "$REF" | tee push.log
PUSHED=$(grep -oE 'digest: sha256:[0-9a-f]{64}' push.log | tail -1 | cut -d' ' -f2 || true)
# Read the whole output before parsing it. `imagetools inspect ... | awk '...; exit'`
# under pipefail raced: awk stopped reading at the Digest line while buildx was still
# writing the platform manifests below it, and buildx exits 255 on the closed pipe -
# silently, failing the step (15 of 20 local tries; it failed PR #483's rehearsal).
if ! INSPECT=$(docker buildx imagetools inspect "$REF"); then
  echo "::error::docker buildx imagetools inspect $REF failed. Nothing has been changed."
  exit 1
fi
REMOTE=$(awk '/^Digest:/ {print $2; exit}' <<<"$INSPECT")
echo "pushed ${PUSHED:-?} / registry resolves $REF to ${REMOTE:-?}"
if [ -z "$PUSHED" ] || [ "$PUSHED" != "$REMOTE" ]; then
  echo "::error::Could not confirm the pushed image in the registry. Nothing has been changed."
  exit 1
fi

docker buildx imagetools inspect --raw "$REF" > pushed-manifest.json
if ! RUNTIME=$(PUSHED_DIGEST="$PUSHED" node "$HERE/runtime-digest.mjs" pushed-manifest.json); then
  echo "$RUNTIME"
  echo "::error::Could not resolve the image a machine will run from $PUSHED. Nothing has been changed."
  exit 1
fi
echo "pushed $PUSHED / machines will run $RUNTIME"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  {
    echo "ref=$REF"
    echo "pushed=$PUSHED"
    echo "digest=$RUNTIME"
  } >> "$GITHUB_OUTPUT"
fi
