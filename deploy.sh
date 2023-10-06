#!/bin/bash
set -e

# build
./build.sh

# move out to temp
rm -rf /tmp/out.sbjs
mv out /tmp/out.sbjs

# hard reset deploy branch to first commit
git checkout deploy
git reset --hard $(git rev-list --max-parents=0 HEAD)

# move out back
mv /tmp/out.sbjs/* ./

# commit
git add out
git commit -m "feat: deploy @ $(date '+%Y-%m-%d %H:%M:%S')"

# push
git push origin deploy --force
