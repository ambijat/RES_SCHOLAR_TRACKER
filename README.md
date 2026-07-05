# RES Scholar Tracker

RES Scholar Tracker is a local-first web app and Android WebView shell for tracking research scholar meetings, documents, publications, and signature readiness.

## Web Loader

Use `index.html` at the repository root as the browser entry point. For local testing, serve the repository root with a static server:

```bash
python3 -m http.server 8080
```

Then open `http://127.0.0.1:8080/`.

The Android wrapper loads the mirrored web assets from `app/src/main/assets/index.html`.
