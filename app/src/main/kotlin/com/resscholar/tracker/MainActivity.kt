package com.resscholar.tracker

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import java.io.File

class MainActivity : Activity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            setBackgroundColor(0xFF0C0E0D.toInt())
            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.mediaPlaybackRequiresUserGesture = false
            addJavascriptInterface(WebAppBridge(this@MainActivity), "AndroidBridge")
            loadUrl("file:///android_asset/index.html")
        }

        setContentView(webView)
    }

    @Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}

/**
 * Bridges the export modal's Download/Share actions to real Android APIs.
 * A plain WebView has no download manager for blob: URIs and no Web Share
 * API, so app.js calls into this when `AndroidBridge` is present and falls
 * back to browser APIs otherwise (browser tab / installed PWA).
 */
private class WebAppBridge(private val activity: MainActivity) {

    @JavascriptInterface
    fun readAsset(filename: String): String? {
        if (filename.contains("/") || filename.contains("\\")) return null
        return try {
            activity.assets.open(filename).bufferedReader(Charsets.UTF_8).use { it.readText() }
        } catch (e: Exception) {
            null
        }
    }

    @JavascriptInterface
    fun saveExport(base64Data: String, filename: String, mimeType: String): Boolean {
        return try {
            val bytes = Base64.decode(base64Data, Base64.DEFAULT)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val resolver = activity.contentResolver
                val values = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, filename)
                    put(MediaStore.Downloads.MIME_TYPE, mimeType)
                    put(MediaStore.Downloads.IS_PENDING, 1)
                }
                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                    ?: return false
                resolver.openOutputStream(uri)?.use { it.write(bytes) }
                values.clear()
                values.put(MediaStore.Downloads.IS_PENDING, 0)
                resolver.update(uri, values, null, null)
            } else {
                // Pre-Q: skip the WRITE_EXTERNAL_STORAGE runtime-permission dance
                // and use the app-specific external directory, which needs no
                // permission on any API level.
                val dir = activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
                    ?: return false
                if (!dir.exists()) dir.mkdirs()
                File(dir, filename).writeBytes(bytes)
            }
            activity.runOnUiThread {
                Toast.makeText(activity, "Saved $filename", Toast.LENGTH_SHORT).show()
            }
            true
        } catch (e: Exception) {
            false
        }
    }

    @JavascriptInterface
    fun shareText(text: String, subject: String): Boolean {
        return try {
            val sendIntent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_SUBJECT, subject)
                putExtra(Intent.EXTRA_TEXT, text)
            }
            val chooser = Intent.createChooser(sendIntent, subject).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            activity.runOnUiThread { activity.startActivity(chooser) }
            true
        } catch (e: Exception) {
            false
        }
    }
}
