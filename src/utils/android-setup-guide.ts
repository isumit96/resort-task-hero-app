
/**
 * This file contains the Android WebView setup guide.
 * 
 * HOW TO USE:
 * 1. Create a new Android project or open your existing one
 * 2. Implement the code below in your MainActivity or WebView activity
 * 3. Make sure to add the necessary permissions in your AndroidManifest.xml
 * 
 * Note: This file is for reference only and is not used in the actual web app.
 */

/**
 * MainActivity.java
 * 
 * This is the main activity that hosts the WebView.
 */

/*
package com.yourapp.package;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "WebViewApp";
    private static final int CAMERA_PERMISSION_REQUEST = 1001;
    
    private WebView webView;
    private String currentPhotoPath;
    private ValueCallback<Uri[]> filePathCallback;
    private boolean isCapturingImage = false;
    
    // Use the new ActivityResultLauncher for camera
    private final ActivityResultLauncher<Intent> cameraLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == RESULT_OK) {
                    // Camera capture was successful
                    if (currentPhotoPath != null && filePathCallback != null) {
                        // Process the captured image
                        File photoFile = new File(currentPhotoPath);
                        Uri photoUri = FileProvider.getUriForFile(
                                MainActivity.this,
                                "com.yourapp.package.fileprovider",
                                photoFile);
                        
                        // Return the URI to the WebView
                        filePathCallback.onReceiveValue(new Uri[]{photoUri});
                        filePathCallback = null;
                        
                        // Also send the image directly to our JavaScript interface
                        processAndSendImageToJs(photoFile);
                    } else {
                        // Something went wrong
                        if (filePathCallback != null) {
                            filePathCallback.onReceiveValue(null);
                            filePathCallback = null;
                        }
                        // Send error to JavaScript
                        webView.evaluateJavascript(
                                "window.receiveAndroidCameraError('0', 'CAMERA_ERROR', 'Failed to process camera result')",
                                null);
                    }
                } else {
                    // User cancelled or failed
                    if (filePathCallback != null) {
                        filePathCallback.onReceiveValue(null);
                        filePathCallback = null;
                    }
                    // Send error to JavaScript
                    webView.evaluateJavascript(
                            "window.receiveAndroidCameraError('0', 'CAMERA_CANCELED', 'Camera operation was canceled')",
                            null);
                }
                isCapturingImage = false;
            });
    
    // Permission request launcher
    private final ActivityResultLauncher<String[]> requestPermissionLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestMultiplePermissions(),
            permissions -> {
                boolean allGranted = true;
                for (Boolean isGranted : permissions.values()) {
                    if (!isGranted) {
                        allGranted = false;
                        break;
                    }
                }
                
                if (allGranted) {
                    // Permissions granted, proceed with camera
                    startCameraCapture();
                } else {
                    // Permission denied
                    if (filePathCallback != null) {
                        filePathCallback.onReceiveValue(null);
                        filePathCallback = null;
                    }
                    // Send error to JavaScript
                    webView.evaluateJavascript(
                            "window.receiveAndroidCameraError('0', 'PERMISSION_DENIED', 'Camera permission denied')",
                            null);
                }
            });
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Initialize WebView
        webView = findViewById(R.id.webview);
        setupWebView();
    }
    
    private void setupWebView() {
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        
        // Add JavaScript interface for direct camera access
        webView.addJavascriptInterface(new WebAppInterface(this, webView), "AndroidCamera");
        webView.addJavascriptInterface(new DebugInterface(), "AndroidDebug");
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "Page loaded: " + url);
            }
        });
        
        // Set custom WebChromeClient to handle file input
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                
                // Check if there's an ongoing upload
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                    MainActivity.this.filePathCallback = null;
                }
                
                MainActivity.this.filePathCallback = filePathCallback;
                
                // Check if we're explicitly requesting camera
                String[] acceptTypes = fileChooserParams.getAcceptTypes();
                boolean isCameraRequest = false;
                
                // If accept types contains "image/*" and the capture attribute is set
                if (acceptTypes != null && acceptTypes.length > 0) {
                    for (String acceptType : acceptTypes) {
                        if ((acceptType.equals("image/*") || acceptType.equals("video/*")) 
                                && fileChooserParams.isCaptureEnabled()) {
                            isCameraRequest = true;
                            break;
                        }
                    }
                }
                
                if (isCameraRequest) {
                    // Handle camera request
                    checkCameraPermissionAndStart();
                    return true;
                } else {
                    // Handle regular file chooser
                    Intent intent = fileChooserParams.createIntent();
                    try {
                        startActivityForResult(intent, 100);
                    } catch (Exception e) {
                        filePathCallback.onReceiveValue(null);
                        MainActivity.this.filePathCallback = null;
                        return false;
                    }
                    return true;
                }
            }
        });
        
        // Load your web app URL
        webView.loadUrl("https://yourapp.com");
    }
    
    private void checkCameraPermissionAndStart() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            List<String> permissions = new ArrayList<>();
            
            if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.CAMERA);
            }
            
            if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
            }
            
            if (!permissions.isEmpty()) {
                // Request permissions
                requestPermissionLauncher.launch(permissions.toArray(new String[0]));
            } else {
                // Already have permission, start camera
                startCameraCapture();
            }
        } else {
            // Permission is automatically granted on pre-M devices
            startCameraCapture();
        }
    }
    
    private void startCameraCapture() {
        Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        
        // Create the File where the photo should go
        File photoFile = null;
        try {
            photoFile = createImageFile();
        } catch (IOException ex) {
            Log.e(TAG, "Error creating image file", ex);
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(null);
                filePathCallback = null;
            }
            webView.evaluateJavascript(
                    "window.receiveAndroidCameraError('0', 'FILE_ERROR', 'Could not create image file')",
                    null);
            return;
        }
        
        // Continue only if the File was successfully created
        if (photoFile != null) {
            Uri photoURI = FileProvider.getUriForFile(
                    this,
                    "com.yourapp.package.fileprovider",
                    photoFile);
            takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
            isCapturingImage = true;
            
            try {
                cameraLauncher.launch(takePictureIntent);
            } catch (Exception e) {
                Log.e(TAG, "Error launching camera", e);
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                    filePathCallback = null;
                }
                webView.evaluateJavascript(
                        "window.receiveAndroidCameraError('0', 'CAMERA_UNAVAILABLE', 'Camera is not available')",
                        null);
                isCapturingImage = false;
            }
        }
    }
    
    private File createImageFile() throws IOException {
        // Create an image file name
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
        String imageFileName = "JPEG_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        File image = File.createTempFile(
                imageFileName,
                ".jpg",
                storageDir
        );
        
        // Save a file path for use with ACTION_VIEW intents
        currentPhotoPath = image.getAbsolutePath();
        return image;
    }
    
    private void processAndSendImageToJs(File imageFile) {
        // This would normally be done in a background thread
        // For simplicity, we're showing the direct approach
        try {
            // Convert the image to Base64
            byte[] fileBytes = new byte[(int) imageFile.length()];
            java.io.FileInputStream fis = new java.io.FileInputStream(imageFile);
            fis.read(fileBytes);
            fis.close();
            
            String base64Image = android.util.Base64.encodeToString(fileBytes, android.util.Base64.DEFAULT);
            String fileName = imageFile.getName();
            
            // Send to JavaScript
            String jsCall = String.format(
                    "window.receiveImageFromAndroid('0', '%s', '%s', 'image/jpeg')",
                    base64Image.replace("'", "\\'"),
                    fileName.replace("'", "\\'")
            );
            
            webView.evaluateJavascript(jsCall, null);
            
        } catch (Exception e) {
            Log.e(TAG, "Error processing image", e);
            webView.evaluateJavascript(
                    "window.receiveAndroidCameraError('0', 'PROCESSING_ERROR', 'Failed to process image')",
                    null);
        }
    }
    
    // Legacy onActivityResult for handling regular file chooser
    // This can be replaced with ActivityResultLauncher in newer code
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == 100) {
            if (filePathCallback != null) {
                Uri[] results = null;
                
                // Check result
                if (resultCode == RESULT_OK) {
                    if (data != null && data.getData() != null) {
                        results = new Uri[]{data.getData()};
                    }
                }
                
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
        }
        
        super.onActivityResult(requestCode, resultCode, data);
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
    
    // JavaScript interface for direct camera access
    public class WebAppInterface {
        private MainActivity activity;
        private WebView webView;
        
        WebAppInterface(MainActivity activity, WebView webView) {
            this.activity = activity;
            this.webView = webView;
        }
        
        @android.webkit.JavascriptInterface
        public void takePhoto(String requestId) {
            Log.d(TAG, "takePhoto called with requestId: " + requestId);
            runOnUiThread(() -> {
                if (!isCapturingImage) {
                    // Store the request ID
                    final String currentRequestId = requestId;
                    
                    // Start camera directly
                    checkCameraPermissionAndStart();
                    
                    // Update the JavaScript bridge with the correct request ID
                    webView.evaluateJavascript(
                            "if (window.androidBridge && window.androidBridge.currentRequestId) { " +
                                    "window.androidBridge.currentRequestId = '" + currentRequestId + "'; }",
                            null);
                }
            });
        }
    }
    
    // Debug interface for sending logs from JavaScript to Android
    public class DebugInterface {
        @android.webkit.JavascriptInterface
        public void log(String tag, String message) {
            Log.d("JS_" + tag, message);
        }
    }
}
*/

/**
 * AndroidManifest.xml
 * 
 * Required permissions and file provider configuration.
 */

/*
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.yourapp.package">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
        android:maxSdkVersion="28" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- File Provider for camera photos -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="com.yourapp.package.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
*/

/**
 * res/xml/file_paths.xml
 * 
 * Define the paths that FileProvider can share.
 */

/*
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <external-files-path name="my_images" path="Pictures" />
    <external-path name="my_external_images" path="Android/data/com.yourapp.package/files/Pictures" />
    <external-path name="external_files" path="." />
    <cache-path name="shared_images" path="images/" />
</paths>
*/
