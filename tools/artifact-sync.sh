#!/bin/bash
# Keeps the claude.ai artifact "SmartHomePros Connect" (https://claude.ai/artifact/Te4syByxZ1wBLsGHmGYf63) in step with the repo.
# A hook cannot publish an artifact (only Claude can), so the Stop hook runs `check`: if anything that goes into the artifact
# changed since the last publish, it blocks the end of the turn and tells Claude to republish.
#   artifact-sync.sh check   - Stop hook: block with instructions when the artifact is out of date
#   artifact-sync.sh build   - build the packed copy in _artifact/ and list the files that differ from the last publish
#   artifact-sync.sh mark    - after publishing: remember what is now live
cd "$(dirname "$0")/.." || exit 0
OUT=_artifact; STAMP=.claude/artifact-stamp; MAN=.claude/artifact-manifest.txt
URL=https://claude.ai/artifact/Te4syByxZ1wBLsGHmGYf63

fingerprint() {   # content of everything tools/art.py packs (the Connect home, its assets, both apps, the dock, the screen preview)
  { git ls-files -co --exclude-standard -- index.html dock.js manifest.webmanifest '*.png' connect pitch recruit 2>/dev/null | sort | while read -r f; do [ -f "$f" ] && echo "$f"; done | tee /dev/fd/3 | git hash-object --stdin-paths
    [ -f screens.html ] && git hash-object screens.html; } 3>/dev/null | shasum | cut -c1-40
}

case "$1" in
  check)
    input=$(cat); echo "$input" | grep -q '"stop_hook_active": *true' && exit 0   # never loop: one reminder per turn
    [ "$(fingerprint)" = "$(cat $STAMP 2>/dev/null)" ] && exit 0
    printf '{"decision":"block","reason":"The SmartHomePros Connect artifact is out of date with the repo. Before finishing: run `bash tools/artifact-sync.sh build`, publish the files it lists (page _artifact/index.html, root _artifact, files = the listed paths) to %s with the Artifact tool (read the artifact first), then run `bash tools/artifact-sync.sh mark`."}\n' "$URL"
    ;;
  build)
    SHPC_ART="$PWD/$OUT" python3 tools/art.py >/dev/null || exit 1
    (cd $OUT && find . -type f ! -name .DS_Store | sed 's|^\./||' | sort | while read -r f; do echo "$(shasum -a 256 "$f" | cut -c1-64) $f"; done) > $OUT.manifest
    if [ -f $MAN ]; then
      echo "changed or new (publish these):"; comm -13 <(sort $MAN) <(sort $OUT.manifest) | cut -d' ' -f2-
      echo "removed (map to null):"; comm -23 <(cut -d' ' -f2- $MAN | sort) <(cut -d' ' -f2- $OUT.manifest | sort)
    else echo "no record of the last publish: compare with the live file listing"; cut -d' ' -f2- $OUT.manifest; fi
    ;;
  mark)
    [ -f $OUT.manifest ] && cp $OUT.manifest $MAN; fingerprint > $STAMP; echo "artifact marked up to date"
    ;;
esac
exit 0
