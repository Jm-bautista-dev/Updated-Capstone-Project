import 'dart:async';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lambac_app/core/services/app_check_service.dart';
import 'package:mocktail/mocktail.dart';

class MockFirebaseAppCheck extends Mock implements FirebaseAppCheck {}

class FakeAndroidAppCheckProvider extends Fake implements AndroidAppCheckProvider {}
class FakeAppleAppCheckProvider extends Fake implements AppleAppCheckProvider {}

void main() {
  setUpAll(() {
    registerFallbackValue(FakeAndroidAppCheckProvider());
    registerFallbackValue(FakeAppleAppCheckProvider());
    registerFallbackValue(ReCaptchaV3Provider('dummy-key'));
  });

  setUp(() {
    AppCheckService.instance.resetForTesting();
  });

  tearDown(() {
    AppCheckService.instance.resetForTesting();
  });

  group('AppCheckService - Platform & Provider Resolution Matrix', () {
    test('1. Android Provider Matrix: Play Integrity in release vs Debug in dev', () {
      final releaseProvider = AppCheckService.resolveProviderName(
        isWeb: false,
        platform: TargetPlatform.android,
        isRelease: true,
      );
      final devProvider = AppCheckService.resolveProviderName(
        isWeb: false,
        platform: TargetPlatform.android,
        isRelease: false,
      );

      expect(releaseProvider, contains('Play Integrity'));
      expect(releaseProvider, contains('Production'));
      expect(devProvider, contains('Debug Provider'));
      expect(devProvider, contains('Development'));
    });

    test('2. Apple Provider Matrix: App Attest Fallback in release vs Debug in dev', () {
      final releaseProviderIOS = AppCheckService.resolveProviderName(
        isWeb: false,
        platform: TargetPlatform.iOS,
        isRelease: true,
      );
      final devProviderIOS = AppCheckService.resolveProviderName(
        isWeb: false,
        platform: TargetPlatform.iOS,
        isRelease: false,
      );

      expect(releaseProviderIOS, contains('App Attest with DeviceCheck Fallback'));
      expect(releaseProviderIOS, contains('Production'));
      expect(devProviderIOS, contains('Apple Debug Provider'));
      expect(devProviderIOS, contains('Development'));

      final releaseProviderMacOS = AppCheckService.resolveProviderName(
        isWeb: false,
        platform: TargetPlatform.macOS,
        isRelease: true,
      );
      expect(releaseProviderMacOS, contains('App Attest with DeviceCheck Fallback'));
    });

    test('3. Web Provider Matrix: reCAPTCHA v3 on web environments', () {
      final releaseWeb = AppCheckService.resolveProviderName(
        isWeb: true,
        platform: TargetPlatform.android,
        isRelease: true,
      );
      final devWeb = AppCheckService.resolveProviderName(
        isWeb: true,
        platform: TargetPlatform.android,
        isRelease: false,
      );

      expect(releaseWeb, contains('reCAPTCHA v3 (Production)'));
      expect(devWeb, contains('Web Debug Provider (Development)'));
    });

    test('4. Security Guarantee: Debug providers NEVER selected in release mode', () {
      final platforms = [
        TargetPlatform.android,
        TargetPlatform.iOS,
        TargetPlatform.macOS,
      ];

      for (final p in platforms) {
        final resolved = AppCheckService.resolveProviderName(
          isWeb: false,
          platform: p,
          isRelease: true,
        );
        expect(resolved, isNot(contains('Debug')),
            reason: 'Platform ${p.name} must never select a debug provider in release mode');
      }
    });

    test('5. Platform Support Gate: Distinguishes supported vs unsupported desktop environments', () {
      // Supported platforms
      expect(AppCheckService.isPlatformSupported(isWeb: true, platform: TargetPlatform.windows), isTrue);
      expect(AppCheckService.isPlatformSupported(isWeb: false, platform: TargetPlatform.android), isTrue);
      expect(AppCheckService.isPlatformSupported(isWeb: false, platform: TargetPlatform.iOS), isTrue);
      expect(AppCheckService.isPlatformSupported(isWeb: false, platform: TargetPlatform.macOS), isTrue);

      // Unsupported desktop platforms (Windows / Linux / Fuchsia native)
      expect(AppCheckService.isPlatformSupported(isWeb: false, platform: TargetPlatform.windows), isFalse);
      expect(AppCheckService.isPlatformSupported(isWeb: false, platform: TargetPlatform.linux), isFalse);
      expect(AppCheckService.isPlatformSupported(isWeb: false, platform: TargetPlatform.fuchsia), isFalse);
    });
  });

  group('AppCheckService - Lifecycle & Execution', () {
    test('6. Unsupported Desktop Platform gracefully marks status without throwing', () async {
      final status = await AppCheckService.initialize(
        platform: TargetPlatform.windows,
        isWeb: false,
      );

      expect(status.isInitialized, isTrue);
      expect(status.isSupportedPlatform, isFalse);
      expect(status.providerName, contains('Unsupported'));
      expect(status.isSuccess, isTrue); // Initialized cleanly without error
      expect(AppCheckService.instance.isInitialized, isTrue);
    });

    test('7. getToken returns null when run on unsupported desktop or uninitialized', () async {
      final token = await AppCheckService.instance.getToken();
      expect(token, isNull);
    });

    test('8. onTokenChange returns empty stream when on unsupported platform', () async {
      final stream = AppCheckService.instance.onTokenChange;
      final events = await stream.toList();
      expect(events, isEmpty);
    });

    test('9. Android Production Initialization triggers Play Integrity & Token Refresh', () async {
      final mockAppCheck = MockFirebaseAppCheck();
      when(() => mockAppCheck.activate(
            providerAndroid: any(named: 'providerAndroid'),
          )).thenAnswer((_) async {});
      when(() => mockAppCheck.setTokenAutoRefreshEnabled(any()))
          .thenAnswer((_) async {});
      when(() => mockAppCheck.getToken(any()))
          .thenAnswer((_) async => 'android-play-integrity-token');

      final status = await AppCheckService.initialize(
        appCheck: mockAppCheck,
        platform: TargetPlatform.android,
        isWeb: false,
        isRelease: true,
      );

      expect(status.isSuccess, isTrue);
      expect(status.isSupportedPlatform, isTrue);
      expect(status.providerName, contains('Play Integrity'));

      verify(() => mockAppCheck.activate(
            providerAndroid: any(named: 'providerAndroid'),
          )).called(1);
      verify(() => mockAppCheck.setTokenAutoRefreshEnabled(true)).called(1);

      final token = await AppCheckService.instance.getToken();
      expect(token, equals('android-play-integrity-token'));
    });

    test('10. iOS Production Initialization triggers App Attest with Fallback', () async {
      final mockAppCheck = MockFirebaseAppCheck();
      when(() => mockAppCheck.activate(
            providerApple: any(named: 'providerApple'),
          )).thenAnswer((_) async {});
      when(() => mockAppCheck.setTokenAutoRefreshEnabled(any()))
          .thenAnswer((_) async {});

      final status = await AppCheckService.initialize(
        appCheck: mockAppCheck,
        platform: TargetPlatform.iOS,
        isWeb: false,
        isRelease: true,
      );

      expect(status.isSuccess, isTrue);
      expect(status.isSupportedPlatform, isTrue);
      expect(status.providerName, contains('App Attest with DeviceCheck Fallback'));

      verify(() => mockAppCheck.activate(
            providerApple: any(named: 'providerApple'),
          )).called(1);
      verify(() => mockAppCheck.setTokenAutoRefreshEnabled(true)).called(1);
    });

    test('11a. Web Development Initialization triggers WebDebugProvider', () async {
      final mockAppCheck = MockFirebaseAppCheck();
      when(() => mockAppCheck.activate(
            providerWeb: any(named: 'providerWeb'),
          )).thenAnswer((_) async {});
      when(() => mockAppCheck.setTokenAutoRefreshEnabled(any()))
          .thenAnswer((_) async {});

      final status = await AppCheckService.initialize(
        appCheck: mockAppCheck,
        platform: TargetPlatform.android,
        isWeb: true,
        isRelease: false,
      );

      expect(status.isSuccess, isTrue);
      expect(status.isSupportedPlatform, isTrue);
      expect(status.providerName, contains('Web Debug Provider'));

      verify(() => mockAppCheck.activate(
            providerWeb: any(named: 'providerWeb'),
          )).called(1);
      verify(() => mockAppCheck.setTokenAutoRefreshEnabled(true)).called(1);
    });

    test('11. Web Production Initialization triggers ReCaptchaV3Provider', () async {
      final mockAppCheck = MockFirebaseAppCheck();
      when(() => mockAppCheck.activate(
            providerWeb: any(named: 'providerWeb'),
          )).thenAnswer((_) async {});
      when(() => mockAppCheck.setTokenAutoRefreshEnabled(any()))
          .thenAnswer((_) async {});

      final status = await AppCheckService.initialize(
        appCheck: mockAppCheck,
        platform: TargetPlatform.android,
        isWeb: true,
        isRelease: true,
        webRecaptchaSiteKey: 'custom-recaptcha-key-999',
      );

      expect(status.isSuccess, isTrue);
      expect(status.isSupportedPlatform, isTrue);
      expect(status.providerName, contains('reCAPTCHA v3'));

      verify(() => mockAppCheck.activate(
            providerWeb: any(named: 'providerWeb'),
          )).called(1);
      verify(() => mockAppCheck.setTokenAutoRefreshEnabled(true)).called(1);
    });

    test('12. Token change listener receives real-time auto-refresh events', () async {
      final mockAppCheck = MockFirebaseAppCheck();
      final tokenController = StreamController<String?>.broadcast();
      when(() => mockAppCheck.activate(
            providerAndroid: any(named: 'providerAndroid'),
          )).thenAnswer((_) async {});
      when(() => mockAppCheck.setTokenAutoRefreshEnabled(any()))
          .thenAnswer((_) async {});
      when(() => mockAppCheck.onTokenChange)
          .thenAnswer((_) => tokenController.stream);

      await AppCheckService.initialize(
        appCheck: mockAppCheck,
        platform: TargetPlatform.android,
        isWeb: false,
        isRelease: false,
      );

      final nextTokenFuture = AppCheckService.instance.onTokenChange.first;
      tokenController.add('refreshed-attested-token-xyz');
      expect(await nextTokenFuture, equals('refreshed-attested-token-xyz'));

      await tokenController.close();
    });

    test('13. Uninitialized Firebase handles error gracefully without crashing', () async {
      // Calling initialize on supported platform without passing mockAppCheck when Firebase is uninitialized
      final status = await AppCheckService.initialize(
        platform: TargetPlatform.android,
        isWeb: false,
      );

      expect(status.isInitialized, isFalse);
      expect(status.isSupportedPlatform, isTrue);
      expect(status.error, isNotNull);
      expect(status.error, contains('Firebase App Check instance unavailable'));
    });
  });
}
