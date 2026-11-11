@echo off
rem Rebuilds the final video from its parts (GitHub file-size limit). Double-click inside promo-video\output.
cd /d "%~dp0"
copy /b TraceBack_Promo_55s_1080p.mp4.part-aa+TraceBack_Promo_55s_1080p.mp4.part-ab+TraceBack_Promo_55s_1080p.mp4.part-ac TraceBack_Promo_55s_1080p.mp4
certutil -hashfile TraceBack_Promo_55s_1080p.mp4 SHA256
pause
