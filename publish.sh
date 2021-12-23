#!/bin/bash

## Synopsis
## ./deploy.sh [major|minor|patch]

echo "This script will increment the package version and publish it publicly"
echo "Please review the packlist before publishing..."
echo ""
npx npm-packlist
echo ""
read -p "Confirm packlist? (y/N) " yn
case $yn in
  [Yy]* ) echo "packlist confirmed";;
  * ) echo "packlist rejected"; exit;;
esac

v="${1:-patch}"
# rm -rf node_modules
# npm install
echo "building..."
npm run build
echo "testing..."
npm test
tag=`npm version $v`
echo "publishing ($tag)..."
git push && git push --tags
npm publish --access=public
echo "published $tag"
