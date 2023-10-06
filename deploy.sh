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

# get all commits
git fetch;
git pull --set-upstream origin deploy

# go to most recent commit
git reset --hard HEAD
# remove everything
git rm -rf .
# get back README.md
git checkout HEAD -- README.md

# copy
cp -r $DIR/out/* /tmp/build/
cp $DIR/_domains /tmp/build/.domains
cp $DIR/_domains /tmp/build/_domains

# commit
git add --all
git add . .domains
git commit -m "deploy: $COMMIT_ID$(echo -e "\nCommit $COMMIT_MESSAGE")" --allow-empty
git push origin deploy --force

# clean
cd -;
rm -rf /tmp/build;
git fetch origin;
