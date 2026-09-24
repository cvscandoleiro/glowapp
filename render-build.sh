#!/usr/bin/env bash
# exit on error
set -o errexit

cd portal
npm install
npx puppeteer browsers install chrome
