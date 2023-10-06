#!/bin/bash
set -e
DIR=$(pwd)

# get last commit message
COMMIT_MESSAGE=$(git log -1 --pretty=%B)
COMMIT_ID=$(git rev-parse HEAD)

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

# get last commit id on this branch
LAST_DEPLOY_COMMIT_ID=$(git rev-parse HEAD)

# commit
git add --all
git add . .domains
git commit -m "deploy: $COMMIT_ID (Last Deployment: $LAST_DEPLOY_COMMIT_ID)$(echo -e "\n$COMMIT_MESSAGE"))"
git push origin deploy --force

# clean
cd -;
rm -rf /tmp/build;
