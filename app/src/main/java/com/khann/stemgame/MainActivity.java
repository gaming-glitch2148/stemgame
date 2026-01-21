package com.khann.stemgame;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.OnUserEarnedRewardListener;
import com.google.android.gms.ads.RequestConfiguration;
import com.google.android.gms.ads.rewarded.RewardItem;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";
    private WebView mWebView;
    private AdView mAdView;
    private RewardedAd mRewardedAd;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mWebView = findViewById(R.id.webview);
        mAdView = findViewById(R.id.adView);
        
        WebSettings webSettings = mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        mWebView.addJavascriptInterface(new WebAppInterface(), "AndroidBridge");
        mWebView.setWebViewClient(new WebViewClient());
        mWebView.loadUrl("https://stemgame-w1af.vercel.app/");

        // Initial check: if we already have a preference, apply it.
        // If not, we wait for the Web app to potentially provide it after login,
        // or show the dialog as a fallback.
        checkAgeAndInitAds();
    }

    private void checkAgeAndInitAds() {
        SharedPreferences prefs = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        if (prefs.contains("isChild")) {
            boolean isChild = prefs.getBoolean("isChild", true);
            applyAdMobConfig(isChild);
            initializeAds();
        } else {
            // We'll wait for the web app to call setUserAgeStatus after login.
            // If the user isn't logged in, the Web app should trigger showAgeGate().
        }
    }

    private void showAgeGate() {
        runOnUiThread(() -> {
            new AlertDialog.Builder(this)
                .setTitle("Welcome to Stem Blast")
                .setMessage("Are you 13 years old or older?")
                .setPositiveButton("Yes, I am 13+", (dialog, which) -> {
                    saveAgePreference(false);
                })
                .setNegativeButton("No, I am under 13", (dialog, which) -> {
                    saveAgePreference(true);
                })
                .setCancelable(false)
                .show();
        });
    }

    private void saveAgePreference(boolean isChild) {
        getSharedPreferences("AppPrefs", MODE_PRIVATE)
            .edit()
            .putBoolean("isChild", isChild)
            .apply();
        
        applyAdMobConfig(isChild);
        initializeAds();
    }

    private void applyAdMobConfig(boolean isChild) {
        RequestConfiguration.Builder builder = MobileAds.getRequestConfiguration().toBuilder();
        if (isChild) {
            builder.setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE)
                   .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G);
        } else {
            builder.setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE)
                   .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_PG);
        }
        MobileAds.setRequestConfiguration(builder.build());
    }

    private void initializeAds() {
        MobileAds.initialize(this, status -> {
            loadRewardedAd();
            mAdView.loadAd(new AdRequest.Builder().build());
        });
    }

    private void loadRewardedAd() {
        AdRequest adRequest = new AdRequest.Builder().build();
        RewardedAd.load(this, "ca-app-pub-9141375569651908/4464601338",
            adRequest, new RewardedAdLoadCallback() {
                @Override
                public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                    mRewardedAd = null;
                }

                @Override
                public void onAdLoaded(@NonNull RewardedAd rewardedAd) {
                    mRewardedAd = rewardedAd;
                }
            });
    }

    public class WebAppInterface {
        @JavascriptInterface
        public void showRewardedAd() {
            runOnUiThread(() -> {
                if (mRewardedAd != null) {
                    mRewardedAd.show(MainActivity.this, new OnUserEarnedRewardListener() {
                        @Override
                        public void onUserEarnedReward(@NonNull RewardItem rewardItem) {
                            mWebView.loadUrl("javascript:onRewardEarned()");
                            loadRewardedAd();
                        }
                    });
                } else {
                    loadRewardedAd();
                }
            });
        }

        @JavascriptInterface
        public void setUserAgeStatus(boolean isChild) {
            Log.d(TAG, "setUserAgeStatus called: " + isChild);
            saveAgePreference(isChild);
        }

        @JavascriptInterface
        public void triggerAgeGate() {
            Log.d(TAG, "triggerAgeGate called");
            showAgeGate();
        }
    }

    @Override
    public void onBackPressed() {
        if (mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
