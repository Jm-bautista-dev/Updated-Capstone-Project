import 'dart:async';
import 'dart:developer' as developer;
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:flutter/foundation.dart';

/// App Check Attestation Status metadata
@immutable
class AppCheckStatus {
  final bool isInitialized;
  final bool isSupportedPlatform;
  final String providerName;
  final bool isReleaseMode;
  final String? error;

  const AppCheckStatus({
    required this.isInitialized,
    required this.isSupportedPlatform,
    required this.providerName,
    required this.isReleaseMode,
    this.error,
  });

  bool get isSuccess => isInitialized && error == null;

  @override
  String toString() =>
      'AppCheckStatus(initialized: $isInitialized, supported: $isSupportedPlatform, provider: $providerName, release: $isReleaseMode, error: $error)';
}

/// Firebase App Check Service for Lambac Coffee Roastery.
///
/// Ensures strong device attestation across all platforms:
/// - Android: Play Integrity in release; AndroidDebugProvider in debug.
/// - iOS/macOS: App Attest with DeviceCheck fallback in release; AppleDebugProvider in debug.
/// - Web: ReCaptchaV3Provider in release & development.
/// - Desktop (Windows/Linux): Gracefully bypassed (unsupported by Firebase App Check SDK).
///
/// CRITICAL SECURITY GUARANTEE:
/// In release mode ([kReleaseMode] or `isRelease == true`), debug providers and debug tokens
/// are NEVER used under any circumstances.
class AppCheckService {
  static final AppCheckService _instance = AppCheckService._internal();
  factory AppCheckService() => _instance;
  AppCheckService._internal();

  static AppCheckService get instance => _instance;

  FirebaseAppCheck? _appCheck;
  AppCheckStatus _status = const AppCheckStatus(
    isInitialized: false,
    isSupportedPlatform: false,
    providerName: 'None',
    isReleaseMode: kReleaseMode,
  );

  AppCheckStatus get status => _status;
  bool get isInitialized => _status.isInitialized;

  /// Default reCAPTCHA v3 site key for web deployment.
  /// Configurable via: flutter run -d chrome --dart-define=RECAPTCHA_SITE_KEY=<YOUR_KEY>
  static const String defaultWebRecaptchaSiteKey =
      String.fromEnvironment('RECAPTCHA_SITE_KEY', defaultValue: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI');

  /// Initialize Firebase App Check early during application startup.
  ///
  /// Must be invoked immediately following [Firebase.initializeApp] and before
  /// any Firestore, Storage, or Firebase Auth operations are initiated.
  static Future<AppCheckStatus> initialize({
    FirebaseAppCheck? appCheck,
    String? webRecaptchaSiteKey,
    bool? isRelease,
    TargetPlatform? platform,
    bool? isWeb,
  }) async {
    return _instance._initializeInternal(
      appCheck: appCheck,
      webRecaptchaSiteKey: webRecaptchaSiteKey,
      isRelease: isRelease ?? kReleaseMode,
      platform: platform ?? defaultTargetPlatform,
      isWeb: isWeb ?? kIsWeb,
    );
  }

  Future<AppCheckStatus> _initializeInternal({
    FirebaseAppCheck? appCheck,
    String? webRecaptchaSiteKey,
    required bool isRelease,
    required TargetPlatform platform,
    required bool isWeb,
  }) async {
    // Check platform compatibility first to avoid accessing FirebaseAppCheck on unsupported platforms
    final isSupported = isPlatformSupported(
      isWeb: isWeb,
      platform: platform,
    );

    if (!isSupported) {
      _status = AppCheckStatus(
        isInitialized: true,
        isSupportedPlatform: false,
        providerName: 'Unsupported (${platform.name})',
        isReleaseMode: isRelease,
      );
      _log(
        'Firebase App Check is not natively supported on ${platform.name}. '
        'Bypassing device attestation for local desktop/testing environment.',
      );
      return _status;
    }

    final providerName = resolveProviderName(
      isWeb: isWeb,
      platform: platform,
      isRelease: isRelease,
    );

    final FirebaseAppCheck customAppCheck;
    if (appCheck != null) {
      customAppCheck = appCheck;
    } else {
      try {
        customAppCheck = FirebaseAppCheck.instance;
      } catch (e, stackTrace) {
        final errorMsg = 'Firebase App Check instance unavailable: $e';
        _status = AppCheckStatus(
          isInitialized: false,
          isSupportedPlatform: true,
          providerName: providerName,
          isReleaseMode: isRelease,
          error: errorMsg,
        );
        _log(errorMsg, error: e, stackTrace: stackTrace);
        return _status;
      }
    }
    _appCheck = customAppCheck;

    final siteKey = (webRecaptchaSiteKey != null && webRecaptchaSiteKey.isNotEmpty)
        ? webRecaptchaSiteKey
        : defaultWebRecaptchaSiteKey;

    try {
      if (isWeb) {
        if (isRelease) {
          await customAppCheck.activate(
            providerWeb: ReCaptchaV3Provider(siteKey),
          );
        } else {
          await customAppCheck.activate(
            providerWeb: WebDebugProvider(),
          );
        }
      } else {
        switch (platform) {
          case TargetPlatform.android:
            if (isRelease) {
              await customAppCheck.activate(
                providerAndroid: const AndroidPlayIntegrityProvider(),
              );
            } else {
              await customAppCheck.activate(
                providerAndroid: const AndroidDebugProvider(),
              );
            }
            break;

          case TargetPlatform.iOS:
          case TargetPlatform.macOS:
            if (isRelease) {
              await customAppCheck.activate(
                providerApple: const AppleAppAttestWithDeviceCheckFallbackProvider(),
              );
            } else {
              await customAppCheck.activate(
                providerApple: const AppleDebugProvider(),
              );
            }
            break;

          default:
            // Handled by isPlatformSupported check above
            break;
        }
      }

      // Enable automatic token refresh so active user sessions (Barista POS,
      // Admin Dashboard, Customer ordering) never encounter expired attestation tokens
      await customAppCheck.setTokenAutoRefreshEnabled(true);

      _status = AppCheckStatus(
        isInitialized: true,
        isSupportedPlatform: true,
        providerName: providerName,
        isReleaseMode: isRelease,
      );

      _log('Firebase App Check successfully activated with provider: $providerName');
      return _status;
    } catch (e, stackTrace) {
      final errorMsg = 'Failed to activate Firebase App Check: $e';
      _status = AppCheckStatus(
        isInitialized: false,
        isSupportedPlatform: true,
        providerName: providerName,
        isReleaseMode: isRelease,
        error: errorMsg,
      );
      _log(errorMsg, error: e, stackTrace: stackTrace);
      return _status;
    }
  }

  /// Evaluates whether the given platform has native Firebase App Check SDK support
  static bool isPlatformSupported({
    required bool isWeb,
    required TargetPlatform platform,
  }) {
    if (isWeb) return true;
    switch (platform) {
      case TargetPlatform.android:
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
        return true;
      case TargetPlatform.windows:
      case TargetPlatform.linux:
      case TargetPlatform.fuchsia:
        return false;
    }
  }

  /// Resolves the human-readable provider name according to platform and environment
  static String resolveProviderName({
    required bool isWeb,
    required TargetPlatform platform,
    required bool isRelease,
  }) {
    if (isWeb) {
      return isRelease
          ? 'Web reCAPTCHA v3 (Production)'
          : 'Web Debug Provider (Development)';
    }

    switch (platform) {
      case TargetPlatform.android:
        return isRelease
            ? 'Android Play Integrity (Production)'
            : 'Android Debug Provider (Development)';

      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
        return isRelease
            ? 'Apple App Attest with DeviceCheck Fallback (Production)'
            : 'Apple Debug Provider (Development)';

      default:
        return 'Unsupported (${platform.name})';
    }
  }

  /// Request the current active App Check token.
  ///
  /// Useful for diagnostics, custom backend API headers, or validating attestation.
  Future<String?> getToken({bool forceRefresh = false}) async {
    if (_appCheck == null || !_status.isSupportedPlatform) {
      return null;
    }
    try {
      final token = await _appCheck!.getToken(forceRefresh);
      return token;
    } catch (e) {
      _log('Error retrieving App Check token: $e');
      return null;
    }
  }

  /// Stream of token changes (fired when App Check automatically refreshes token)
  Stream<String?> get onTokenChange {
    if (_appCheck == null || !_status.isSupportedPlatform) {
      return const Stream.empty();
    }
    return _appCheck!.onTokenChange;
  }

  /// Diagnostic logging helper
  void _log(String message, {Object? error, StackTrace? stackTrace}) {
    if (kDebugMode) {
      developer.log(
        '[AppCheckService] $message',
        name: 'Lambac.AppCheck',
        error: error,
        stackTrace: stackTrace,
      );
    }
  }

  @visibleForTesting
  void resetForTesting() {
    _appCheck = null;
    _status = const AppCheckStatus(
      isInitialized: false,
      isSupportedPlatform: false,
      providerName: 'None',
      isReleaseMode: kReleaseMode,
    );
  }
}
