#!/bin/bash
set -e

# build
./build.sh

# copy the git dir
rm -rf /tmp/build
mkdir -p /tmp/build
cp -r .git /tmp/build/.git

# checkout
cd /tmp/build
git checkout deploy

# go to first commit
git reset --hard $(git rev-list --max-parents=0 HEAD)

# copy
cp -r out/* /tmp/build/

# commit
git add --all
git add .
git commit -m "deploy"
git push origin deploy --force

# clean
cd -;
rm -rf /tmp/build;
