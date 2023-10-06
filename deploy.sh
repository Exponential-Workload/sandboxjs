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
git checkout pages

# get all commits
git fetch;
git pull --set-upstream origin pages

# go to most recent commit
git reset --hard HEAD
# remove everything
git rm -rf .
# get back README.md
git checkout HEAD -- README.md

# copy
cp -r $DIR/out/* /tmp/build/

# commit
git add --all
git add .

# Push to codeberg
git cb || 1; # custom alias for configuring for codeberg
cp $DIR/README.pages.md README.md
git commit -m "deploy: $COMMIT_ID$(echo -e "\nCommit $COMMIT_MESSAGE")" --allow-empty
git remote set-url origin git@codeberg.org:Expo/sbjs.git
git push origin pages --force

# Push to github
git gh || 1; # custom alias for configuring for github
git reset --soft HEAD~1
cp $DIR/README.gh.md README.md
git commit -m "deploy: $COMMIT_ID$(echo -e "\nCommit $COMMIT_MESSAGE")" --allow-empty
git remote set-url origin git@github.com:Exponential-Workload/sandboxjs.git
git push origin pages --force

# clean
cd -;
rm -rf /tmp/build;

# push github mirror
cp -r $DIR /tmp/mirror

# push
cd /tmp/mirror
git gh || 1; # custom alias for configuring for github
git commit -m "mirror: Push to $COMMIT_ID$(echo -e "\nCommit $COMMIT_MESSAGE")" --allow-empty
git reset --soft HEAD~1
git remote set-url origin git@github.com:Exponential-Workload/sandboxjs.git
git push origin senpai --force

# clean
rm -rf /tmp/mirror;
cd -;
git fetch origin;