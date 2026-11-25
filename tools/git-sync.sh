#!/bin/bash
# Keeps this checkout in step with GitHub while Claude chat also edits the repo.
# Used by the Claude Code hooks in .claude/settings.json:
#   git-sync.sh pull  - session start and every new message: bring in what Claude chat pushed
#   git-sync.sh push  - end of every Claude Code turn: commit anything left and push to main
# Pushing to main updates the live GitHub Pages site.
cd "$(dirname "$0")/.." || exit 0
mode="$1"

say() { printf '{"systemMessage": "%s"}\n' "$1"; }

pull() {
  if ! git pull --rebase --autostash -q origin main 2>/tmp/shpc-sync.err; then
    git rebase --abort 2>/dev/null
    say "Git sync: could not pull from GitHub (conflict or offline). Ask Claude to sort it out."
    return 1
  fi
}

case "$mode" in
  pull)
    pull
    ;;
  push)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A
      git commit -q -m "Auto-sync from Claude Code" || exit 0
    fi
    # Nothing to send? Stop here.
    [ -z "$(git log origin/main..HEAD --oneline 2>/dev/null)" ] && exit 0
    pull || exit 0
    if git push -q origin HEAD:main 2>/tmp/shpc-sync.err; then
      say "Git sync: pushed to GitHub."
    else
      say "Git sync: push to GitHub failed. Ask Claude to check."
    fi
    ;;
esac
exit 0
