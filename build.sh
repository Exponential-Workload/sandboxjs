#!/bin/bash
rm -rf out;
cd front;
pnpm build;
cp -r dist ../out;
cd ..;
cd lib;
pnpm build;
cp -r dist ../out/lib;
cd ..;
cd docs;
mkdocs build;
cp -r site ../out/docs;
cd ..;
