# Acceptance and regression tests

## Execution record

2026-10-17: 14/14 synthetic logic groups passed using an isolated JavaScript test harness with an EventTarget capture fixture and storage stub. All five JavaScript files passed syntax checks. The development harness is not an application dependency. `tests/run.html` runs the same tests directly in a browser with no installation.

Automated UI preview of `file://` was blocked by the environment browser URL policy. No visual browser, Windows, physical USB device, audio playback, file download, clipboard or Japanese Excel acceptance is claimed. Run the manual checklist below in Windows 10/11 Chrome and Edge, record browser/device/Excel versions, and repeat with the network disconnected.

Synthetic tests cover EAN/leading zeros/alphanumeric/one-character/whitespace, 20 rapid scans, repeated values, empty suffix/repeat, Enter/Tab/timeout, shortcut pass-through, no double completion, interrupted input retention, composition, URL/special/100,000-character QR text, unsupported keys, CSV escaping/BOM/formula-prefix and storage failure reporting. They do not verify browser default text insertion, physical scan timing or rendering.

## Required manual acceptance

Use a fresh copy of the folder or disposable browser profile. These tests create history. Enter mode is the initial default. To test actual scans, keep the capture field focused; matching suffix is required.

| # | Procedure | Expected result | Execution |
|---|---|---|---|
| 1 | Unzip, double-click index.html offline in Chrome and Edge. | Dashboard loads with local CSS/JS; no network/server/install; capture focused if allowed. Ready reflects actual focus. | Pending Windows |
| 2 | Scan `4549292144567` with Enter suffix. | One exact string, timestamp, success, history row; capture clears and remains focused. | Logic pass; hardware pending |
| 3 | Scan `000123456`. | All leading zeros remain in latest/history/copy. | Logic pass; UI pending |
| 4 | Scan `ABC-123`. | Exact alphanumeric content. | Logic pass; hardware pending |
| 5 | Scan the same value twice into empty history. | Total 2, unique 1, duplicates 1; newest row marked Duplicate. Disable highlighting: status remains, color disappears. | Repetition logic pass; UI pending |
| 6 | Scan 20 distinct barcodes back-to-back with Enter. | Exactly 20 new records, correct strings, latest first, no merge. | Logic pass; hardware pending |
| 7 | Select Enter, send `A` + Enter. Send an empty Enter and held/repeating Enter. | One record `A`; no empty records or repeated completion. | Logic pass; hardware pending |
| 8 | Select Tab, send `B` + Tab. Tab through search/settings separately. | One B record; focus stays in capture only for capture Tab. Other controls retain normal navigation. | Logic pass; UI pending |
| 9 | Select Timeout, use 150 ms; type/scan faster than 150 ms per character; wait >150 ms between codes. Repeat at 50 and 1000. | One record per separated burst; suffix cancels timer; no second completion. Invalid timeout rejected. No claim for gapless unsuffixed codes. | Timer logic pass at 50; hardware/UI pending |
| 10 | Scan `000123`, Japanese text, quotes, comma, multiline text and `=1+1`; export; import in Japanese Excel as README describes. | BOM/UTF-8 Japanese; columns/quotes/newlines intact; barcode protective apostrophe; zeros preserved; no formulas execute. Import as Text and remove exactly one prefix for original value. | CSV logic pass; download/Excel pending |
| 11 | Enable persistence, scan, reload. Change settings and reload. Disable persistence and reload. | Where file storage works, history/settings restore. Disabling removes stored history but retains current session until reload. Unavailable storage shows error. | Pending browser |
| 12 | Disconnect USB scanner; manually enter a code and submit. | Manual input works; readiness does not claim connection or disconnection. | Pending hardware/UI |
| 13 | Scan `https://example.com/?a=1&b=2`. | Exact plain text; browser does not navigate or request the URL. | String logic pass; UI pending |
| 14 | Enter `<script>alert(1)</script>`, `日本語,"quote"`, spaces, emoji, multiline content using Manual entry. | Literal text, no execution; original string retained subject to textarea newline normalization. | String logic pass; rendering pending |
| 15 | Ctrl+C/Ctrl+V in capture; Ctrl+L/Ctrl+F in browser; Alt+Tab. Type in Search/settings/manual field. | Shortcuts still work. Scanner handler does not submit from other fields or take focus back. Paste is input, including timeout behavior. | Handler logic pass; UI pending |

## Additional reliability checks

- Enter a partial value then click Search or switch apps. In timeout mode, wait longer than timeout. Expect no automatic record, retained input and visible notice. Click Complete input to recover. In Enter/Tab modes, incomplete values remain until suffix/manual completion; the app cannot infer barcode completeness.
- Copy latest and a row using Chrome and Edge on `file://`. If automatic clipboard access fails, selected fallback text is available for Ctrl+C. Verify leading/trailing spaces.
- Search by substring, clear search, Show 100 more; check latest-first ordering. CSV includes all history, regardless of filter.
- Delete first occurrence of a duplicate: remaining first occurrence becomes Unique. Clear history: cancel preserves it; confirm clears it and persisted copy when enabled.
- Toggle sound and scan. Verify short beep after interaction, no beep when disabled. Check system volume and autoplay restrictions separately.
- Restore defaults after changing every setting; verify Enter, 150 ms, three enabled toggles and retained history.
- Use blocked storage or exhausted quota in a disposable browser profile. Scan still appears, warning persists, export remains available. Reload is not guaranteed to recover unsaved scans. Never use production history for quota testing.
- Load malformed JSON or malformed records in a disposable profile using browser developer tools. Expect clear warning and usable dashboard. Invalid records are excluded from the in-memory history; subsequent history edits may overwrite the stored invalid entries.
- Paste 100,000 characters; no arbitrary truncation. Long values wrap/scroll and export intact. Excel has its own cell-size limit.
- IME composition: no timeout completion while composing. Check actual scanner keyboard layout for punctuation, Unicode and Caps Lock.
- Check 360 px and desktop widths, keyboard-only navigation, visible focus rings, table horizontal scrolling, live notices and labels.
- Moving the folder or changing profile may produce separate storage. Do not assume persistence across paths. Avoid simultaneous application tabs.
