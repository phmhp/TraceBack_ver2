#!/bin/sh
# Rebuilds the final video from its parts (GitHub file-size limit). Run inside promo-video/output.
cd "$(dirname "$0")" && cat TraceBack_Promo_55s_1080p.mp4.part-* > TraceBack_Promo_55s_1080p.mp4 && shasum -a 256 -c TraceBack_Promo_55s_1080p.mp4.sha256
