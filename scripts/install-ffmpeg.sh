#!/usr/bin/env bash
set -euo pipefail

mkdir -p ./.bin

# Download a static ffmpeg binary (Linux x64)
# Source: johnvansickle.com (static builds)
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ffmpeg.tar.xz

tar -xJf /tmp/ffmpeg.tar.xz -C /tmp
FFDIR=$(find /tmp -maxdepth 1 -type d -name "ffmpeg-*-amd64-static" | head -n 1)

cp "$FFDIR/ffmpeg" ./.bin/ffmpeg
cp "$FFDIR/ffprobe" ./.bin/ffprobe
chmod +x ./.bin/ffmpeg ./.bin/ffprobe

echo "✅ ffmpeg installed to ./.bin/ffmpeg"
./.bin/ffmpeg -version | head -n 1
