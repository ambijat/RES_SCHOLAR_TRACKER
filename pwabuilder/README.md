# PWABuilder Studio Integration

Use PWABuilder Studio from VS Code against the deployed PWA:

- App URL: `https://ambijat.github.io/RES_SCHOLAR_TRACKER/`
- Manifest URL: `https://ambijat.github.io/RES_SCHOLAR_TRACKER/manifest.json`
- Package ID for the existing Play app: `com.resscholar.tracker`
- Next version target: version code `5`, version name `1.4`

The first downloaded Studio package was moved to the ignored local folder:

`pwabuilder-output/2026-07-03-cloud-build/`

That package is useful for inspection, but it is not uploadable to the existing Play app because it was generated as `io.github.ambijat.twa` with a new signing key.

For future Studio builds, choose advanced Android settings and start from `pwabuilder/android-settings.template.json`. Save your real edited copy as `android-settings.json`; it is ignored by git. Keep all generated `signing.keystore`, `signing-key-info.txt`, APK, AAB, and package zip files out of git.

Before uploading any PWABuilder AAB to Play, verify:

```bash
/home/ambijat/Android/Sdk/build-tools/35.0.0/aapt dump badging "path/to/RES Scholar.apk" | sed -n '1,5p'
/home/ambijat/Android/Sdk/build-tools/35.0.0/apksigner verify --print-certs "path/to/RES Scholar.apk" | sed -n '1,8p'
.tools/jdk-21/bin/jarsigner -verify "path/to/RES Scholar.aab"
```

The existing Play app must show package `com.resscholar.tracker`. If updating the current app, the signing certificate must match the accepted Play upload key unless Play Console has reset the upload key.
