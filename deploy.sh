#!/bin/bash
set -e
DIR=$(pwd)

# build
./build.sh

# copy the git dir
rm -rf /tmp/build
mkdir -p /tmp/build
cp -r .git /tmp/build/.git
cp -r .domains /tmp/build/.domains

# checkout
cd /tmp/build
git checkout deploy

# go to first commit
git reset --hard $(git rev-list --max-parents=0 HEAD)

# copy
cp -r $DIR/out/* /tmp/build/

# get last commit message
COMMIT_MESSAGE=$(git log -1 --pretty=%B)

# commit
git add --all
git add .
git commit -m "deploy: $COMMIT_MESSAGE"
git push origin deploy --force

# clean
cd -;
rm -rf /tmp/build;
