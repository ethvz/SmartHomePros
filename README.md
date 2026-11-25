# SmartHomePros Connect

One home-screen app for Fast Pitch (`pitch/`) and Fast Recruit (`recruit/`). The root page is the app picker; it reopens the last app used, and each app's menu has a Switch app button back to the picker.

- `python3 tools/build.py` refreshes `recruit/` from the Fast Recruit working copy and re-applies the Connect patches. `pitch/` is Fast Pitch's home now: edit it in place.
- `python3 tools/art.py` builds the claude.ai artifact copy (images bundled, since an artifact version holds at most 512 files).
