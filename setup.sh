#!/bin/sh
# Forge – setup. Uses Expo SDK 57 (same as the MedExam app / your Expo Go).
set -e
cd "$(dirname "$0")"

echo "▶ Removing old install…"
rm -rf node_modules package-lock.json .expo

echo "▶ Installing packages (Expo SDK 57)…"
npm install

echo "▶ Checking versions against SDK 57…"
npx expo install --fix || true

echo ""
echo "✅ Done. Start the app with:  npx expo start"
