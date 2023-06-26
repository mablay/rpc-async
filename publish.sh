#!/bin/bash

## Synopsis
## ./deploy.sh [major|minor|patch]

# exit when any command fails
set -e

echo "This script will increment the package version and publish it publicly"

v="${1:-patch}"
# rm -rf node_modules
# npm install
echo "cleaning..."
npm run clean
echo "building..."
npm run build
echo "testing..."
npm run test:js

echo "Please review the packlist before publishing..."
echo ""
npx npm-packlist-cli
echo ""
read -p "Confirm packlist? (y/N) " yn
case $yn in
  [Yy]* ) echo "packlist confirmed";;
  * ) echo "packlist rejected"; exit;;
esac

tag=`npm version $v`
echo "publishing ($tag)..."
git push && git push --tags
npm publish --access=public
echo "published $tag"
