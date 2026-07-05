# Last Cloud Build Inspection

Source zip:

`pwabuilder-output/2026-07-03-cloud-build/RES Scholar - Google Play package.zip`

Contents:

- `RES Scholar.apk`
- `RES Scholar.aab`
- `assetlinks.json`
- `signing.keystore`
- `signing-key-info.txt`

Result:

- Build status: successful
- Package ID: `io.github.ambijat.twa`
- Version: `1 / 1.0.0.0`
- Signing certificate SHA-256: `0B:45:12:01:0A:F1:29:14:FA:C0:B7:0E:F7:22:E4:2E:5F:82:EB:82:A8:79:44:D4:D3:6A:69:5A:D4:BF:F0:00`
- AAB SHA-256: `a97111bac0be6420d4561a82f26927e4766d16ffac2a850d6debf475834ab21b`
- APK SHA-256: `a8aafa63ed4442b3c1c69ae0fb0627dd9724756b3572a861eed43b4b23d9b0a5`

Decision:

Do not upload this AAB to the existing Play app. It does not match the existing app package ID `com.resscholar.tracker`, and it uses a new signing key.
