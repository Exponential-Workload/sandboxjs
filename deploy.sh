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

# checkout
cd /tmp/build
git checkout deploy

# go to last commit on deploy branch
git fetch;
git pull --set-upstream origin deploy
git reset --hard HEAD

# copy
cp -r $DIR/out/* /tmp/build/
cp $DIR/.domains /tmp/build/

# commit
git add --all
git add . .domains
git commit -m "deploy: $COMMIT_ID$(echo -e "\nCommit:\n$COMMIT_MESSAGE")" --allow-empty
git push origin deploy --force

# clean
cd -;
rm -rf /tmp/build;
git fetch origin;
