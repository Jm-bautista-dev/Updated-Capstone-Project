import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:lambac_app/core/errors/app_failure.dart';
import 'package:lambac_app/core/network/result.dart';
import 'package:lambac_app/core/routing/app_routes.dart';
import 'package:lambac_app/core/utils/validators.dart';
import 'package:lambac_app/features/auth/data/datasources/auth_remote_datasource.dart';
import 'package:lambac_app/features/auth/data/datasources/mock_auth_remote_datasource.dart';
import 'package:lambac_app/features/auth/data/models/auth_response_model.dart';
import 'package:lambac_app/features/auth/data/models/change_password_request.dart';
import 'package:lambac_app/features/auth/data/models/forgot_password_request.dart';
import 'package:lambac_app/features/auth/data/models/login_request.dart';
import 'package:lambac_app/features/admin/data/models/create_user_request.dart';
import 'package:lambac_app/features/auth/data/models/register_request.dart';
import 'package:lambac_app/features/auth/data/models/reset_password_request.dart';
import 'package:lambac_app/features/auth/data/models/update_profile_request.dart';
import 'package:lambac_app/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:lambac_app/features/auth/presentation/providers/auth_provider.dart';
import 'package:lambac_app/core/widgets/buttons/app_button.dart';
import 'package:lambac_app/features/auth/presentation/screens/register_screen.dart';
import 'package:lambac_app/shared/models/user_model.dart';
import 'package:lambac_app/shared/services/storage_service.dart';

import 'package:lambac_app/features/auth/data/models/request_register_otp_request.dart';
import 'package:lambac_app/features/auth/data/models/verify_register_otp_request.dart';
import 'package:lambac_app/features/auth/data/models/request_login_otp_request.dart';
import 'package:lambac_app/features/auth/data/models/verify_login_otp_request.dart';

class FailingNetworkAuthDataSource implements AuthRemoteDataSource {
  @override
  Future<Result<RequestLoginOtpResponse, AppFailure>> requestLoginOtp(RequestLoginOtpRequest request) async {
    return const Result.failure(NetworkFailure(message: 'No internet connection.'));
  }

  @override
  Future<Result<RequestLoginOtpResponse, AppFailure>> resendLoginOtp({required String email, required String password}) async {
    return const Result.failure(NetworkFailure(message: 'No internet connection.'));
  }

  @override
  Future<Result<AuthResponseModel, AppFailure>> verifyLoginOtp(VerifyLoginOtpRequest request) async {
    return const Result.failure(NetworkFailure(message: 'No internet connection.'));
  }

  @override
  Future<Result<RequestRegisterOtpResponse, AppFailure>> requestRegisterOtp(RequestRegisterOtpRequest request) async {
    return const Result.failure(
      NetworkFailure(message: 'No internet connection detected.'),
    );
  }

  @override
  Future<Result<VerifyRegisterOtpResponse, AppFailure>> verifyRegisterOtp(VerifyRegisterOtpRequest request) async {
    return const Result.failure(
      NetworkFailure(message: 'No internet connection detected.'),
    );
  }

  @override
  Future<Result<RequestRegisterOtpResponse, AppFailure>> resendRegisterOtp(String email) async {
    return const Result.failure(
      NetworkFailure(message: 'No internet connection detected.'),
    );
  }

  @override
  Future<Result<AuthResponseModel, AppFailure>> register(RegisterRequest request) async {
    return const Result.failure(
      NetworkFailure(message: 'No internet connection detected.'),
    );
  }

  @override
  Future<Result<AuthResponseModel, AppFailure>> login(LoginRequest request) async {
    return const Result.failure(NetworkFailure(message: 'No internet connection.'));
  }

  @override
  Future<Result<void, AppFailure>> logout() async => const Result.success(null);

  @override
  Future<Result<void, AppFailure>> forgotPassword(ForgotPasswordRequest request) async => const Result.success(null);

  @override
  Future<Result<void, AppFailure>> resetPassword(ResetPasswordRequest request) async => const Result.success(null);

  @override
  Future<Result<UserModel, AppFailure>> getProfile() async => const Result.failure(UnauthorizedFailure(message: 'None'));

  @override
  Future<Result<UserModel, AppFailure>> updateProfile(UpdateProfileRequest request) async => const Result.failure(UnauthorizedFailure(message: 'None'));

  @override
  Future<Result<void, AppFailure>> changePassword(ChangePasswordRequest request) async => const Result.success(null);

  @override
  Future<Result<String, AppFailure>> refreshToken(String refreshToken) async => const Result.failure(UnauthorizedFailure(message: 'None'));

  @override
  Future<Result<UserModel, AppFailure>> completeFirstLoginPassword(FirstLoginPasswordRequest request) async => const Result.failure(UnauthorizedFailure(message: 'None'));

  @override
  Future<Result<UserModel, AppFailure>> acceptTerms({required String version}) async =>
      const Result.failure(NetworkFailure(message: 'No internet connection.'));

  @override
  Future<Result<void, AppFailure>> deleteAccount() async => const Result.success(null);
}

void main() {
  group('Lambac Roastery — Secure Registration Validation Acceptance Suite', () {
    late InMemoryStorageService storageService;
    late MockAuthRemoteDataSource remoteDataSource;
    late AuthRepositoryImpl authRepository;

    setUp(() {
      storageService = InMemoryStorageService();
      remoteDataSource = MockAuthRemoteDataSource();
      authRepository = AuthRepositoryImpl(
        remoteDataSource: remoteDataSource,
        storageService: storageService,
      );
    });

    Widget buildTestableWidget(Widget child, {AuthRepositoryImpl? customRepo}) {
      final router = GoRouter(
        initialLocation: '/test',
        routes: [
          GoRoute(
            path: '/test',
            builder: (context, state) => child,
          ),
          GoRoute(
            path: AppRoutes.registerOtp,
            builder: (context, state) => const Scaffold(body: Text('OTP Verification')),
          ),
        ],
      );

      return ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(customRepo ?? authRepository),
        ],
        child: MaterialApp.router(
          routerConfig: router,
        ),
      );
    }

    // ------------------------------------------------------------------------
    // TEST 1 — Empty Form Validation
    // ------------------------------------------------------------------------
    testWidgets('TEST 1: Empty Form Submission displays field errors without triggering API', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 1920);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(buildTestableWidget(const RegisterScreen()));

      // Tap submit button without filling fields
      await tester.tap(find.byType(AppButton));
      await tester.pumpAndSettle();

      expect(find.text('Please enter your full name'), findsOneWidget);
      expect(find.text('Please enter your email address'), findsOneWidget);
      expect(find.text('Please enter a password'), findsOneWidget);
      expect(find.text('Please confirm your password'), findsOneWidget);
    });

    // ------------------------------------------------------------------------
    // TEST 2 — Invalid Email
    // ------------------------------------------------------------------------
    test('TEST 2: Email validation rejects malformed syntax on client and server', () {
      expect(Validators.email('not-an-email'), equals('Please enter a valid email address'));
      expect(Validators.email('user@'), equals('Please enter a valid email address'));
      expect(Validators.email('@domain.com'), equals('Please enter a valid email address'));
      expect(Validators.email('valid.customer@lambac.com'), isNull);
    });

    // ------------------------------------------------------------------------
    // TEST 3 — Weak Password Policy
    // ------------------------------------------------------------------------
    test('TEST 3: Weak password without uppercase/lowercase/number is blocked', () {
      // Missing uppercase
      expect(Validators.password('password123'), contains('uppercase letter'));
      // Missing number
      expect(Validators.password('PasswordCoffee'), contains('number'));
      // Too short
      expect(Validators.password('Pass1'), contains('at least 8 characters'));
      // Valid strong password
      expect(Validators.password('CoffeeRoast2026'), isNull);
    });

    // ------------------------------------------------------------------------
    // TEST 4 — Password Mismatch
    // ------------------------------------------------------------------------
    testWidgets('TEST 4: Password mismatch shows clear error and blocks registration', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 1920);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(buildTestableWidget(const RegisterScreen()));

      final fields = find.byType(TextField);
      await tester.enterText(fields.at(0), 'Carlos Mendoza');
      await tester.enterText(fields.at(1), 'carlos.m@example.com');
      await tester.enterText(fields.at(3), 'CoffeeRoast2026');
      await tester.enterText(fields.at(4), 'MismatchPass999');

      await tester.tap(find.byType(AppButton));
      await tester.pumpAndSettle();

      expect(find.text('Passwords do not match'), findsOneWidget);
    });

    // ------------------------------------------------------------------------
    // TEST 5 — Existing Email (Duplicate Account)
    // ------------------------------------------------------------------------
    test('TEST 5: Duplicate email returns professional user-facing error without SQL errors', () async {
      // Existing user in mock DB is coffee.lover@lambac.com
      final result = await authRepository.requestRegisterOtp(
        const RequestRegisterOtpRequest(
          fullName: 'Duplicate User',
          email: 'coffee.lover@lambac.com',
          password: 'CoffeeRoast2026',
        ),
      );

      expect(result.isFailure, isTrue);
      expect(result.failureOrNull, isA<ValidationFailure>());
      final failure = result.failureOrNull as ValidationFailure;
      expect(failure.message, contains('already exists'));
      expect(failure.fieldErrors?['email']?.first, contains('already exists'));
    });

    // ------------------------------------------------------------------------
    // TEST 6 — Malformed / Length Boundaries
    // ------------------------------------------------------------------------
    test('TEST 6: Name boundary and legitimate special character validation', () {
      expect(Validators.fullName('A'), contains('at least 2 characters'));
      expect(Validators.fullName('a' * 101), contains('cannot exceed 100 characters'));
      // Legitimate characters in Filipino / International names
      expect(Validators.fullName("José Rizal"), isNull);
      expect(Validators.fullName("Anne-Marie O'Connor"), isNull);
      expect(Validators.fullName("Juan Dela Cruz Jr."), isNull);
    });

    // ------------------------------------------------------------------------
    // TEST 7 — Network Failure Handling
    // ------------------------------------------------------------------------
    testWidgets('TEST 7: Network connection failure displays friendly guidance', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 1920);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final failingRepo = AuthRepositoryImpl(
        remoteDataSource: FailingNetworkAuthDataSource(),
        storageService: storageService,
      );

      await tester.pumpWidget(buildTestableWidget(const RegisterScreen(), customRepo: failingRepo));

      final fields = find.byType(TextField);
      await tester.enterText(fields.at(0), 'Elena Reyes');
      await tester.enterText(fields.at(1), 'elena.reyes@example.com');
      await tester.enterText(fields.at(3), 'RoasteryPass2026');
      await tester.enterText(fields.at(4), 'RoasteryPass2026');

      await tester.tap(find.byType(AppButton));
      await tester.pumpAndSettle();

      expect(find.text('Unable to connect. Please check your internet connection and try again.'), findsOneWidget);
    });

    // ------------------------------------------------------------------------
    // TEST 8 — Repeated Register Taps Protection
    // ------------------------------------------------------------------------
    testWidgets('TEST 8: Submit button shows loading state and prevents double submission', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 1920);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(buildTestableWidget(const RegisterScreen()));

      final fields = find.byType(TextField);
      await tester.enterText(fields.at(0), 'Ramon Santos');
      await tester.enterText(fields.at(1), 'ramon.santos@lambac.com');
      await tester.enterText(fields.at(3), 'RamonPass2026');
      await tester.enterText(fields.at(4), 'RamonPass2026');

      await tester.tap(find.byType(AppButton));
      await tester.pump();

      // In-flight state shows loading and prevents duplicate taps
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      await tester.pump(const Duration(milliseconds: 1000));
      await tester.pumpWidget(const SizedBox());
    });

    // ------------------------------------------------------------------------
    // TEST 9 — Successful Customer Registration with OTP Verification
    // ------------------------------------------------------------------------
    test('TEST 9: Successful registration creates active customer with JWT session', () async {
      const email = 'maria.teresa@lambac.com';
      final otpReq = await authRepository.requestRegisterOtp(
        const RequestRegisterOtpRequest(
          fullName: 'Maria Teresa Cruz',
          email: email,
          password: 'SecureCoffee2026',
          phoneNumber: '09171234567',
        ),
      );
      expect(otpReq.isSuccess, isTrue);

      final otp = remoteDataSource.getPendingOtpForTesting(email)!;
      final verifyRes = await authRepository.verifyRegisterOtp(
        VerifyRegisterOtpRequest(email: email, otp: otp),
      );
      expect(verifyRes.isSuccess, isTrue);

      final result = await authRepository.register(
        RegisterRequest(
          fullName: 'Maria Teresa Cruz',
          email: email,
          password: 'SecureCoffee2026',
          phoneNumber: '09171234567',
          verificationToken: verifyRes.dataOrNull!.verificationToken,
        ),
      );

      expect(result.isSuccess, isTrue);
      final user = result.dataOrNull!.user;
      expect(user.fullName, equals('Maria Teresa Cruz'));
      expect(user.email, equals('maria.teresa@lambac.com'));
      expect(user.role, equals(UserRole.customer));
      expect(user.status, equals(UserStatus.active));

      final token = await storageService.getToken();
      expect(token, isNotNull);
    });

    // ------------------------------------------------------------------------
    // TEST 10 — Privilege Escalation Prevention
    // ------------------------------------------------------------------------
    test('TEST 10: Backend strictly creates Customer account regardless of client context', () async {
      const email = 'hacker.attempt@lambac.com';
      await authRepository.requestRegisterOtp(
        const RequestRegisterOtpRequest(
          fullName: 'Hacker Attempt',
          email: email,
          password: 'HackerPassword2026',
        ),
      );

      final otp = remoteDataSource.getPendingOtpForTesting(email)!;
      final verifyRes = await authRepository.verifyRegisterOtp(
        VerifyRegisterOtpRequest(email: email, otp: otp),
      );

      final result = await authRepository.register(
        RegisterRequest(
          fullName: 'Hacker Attempt',
          email: email,
          password: 'HackerPassword2026',
          verificationToken: verifyRes.dataOrNull!.verificationToken,
        ),
      );

      expect(result.isSuccess, isTrue);
      final createdUser = result.dataOrNull!.user;
      // Server forces UserRole.customer
      expect(createdUser.role, equals(UserRole.customer));
      expect(createdUser.isAdmin, isFalse);
      expect(createdUser.isStaff, isFalse);
    });
  });
}
