import 'package:flutter_test/flutter_test.dart';
import 'package:lambac_app/core/errors/app_failure.dart';
import 'package:lambac_app/features/auth/data/datasources/mock_auth_remote_datasource.dart';
import 'package:lambac_app/features/auth/data/models/request_login_otp_request.dart';
import 'package:lambac_app/features/auth/data/models/verify_login_otp_request.dart';
import 'package:lambac_app/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:lambac_app/features/auth/presentation/providers/auth_provider.dart';
import 'package:lambac_app/shared/models/auth_state.dart';
import 'package:lambac_app/shared/services/storage_service.dart';

void main() {
  group('Login Gmail OTP Verification Acceptance Suite', () {
    late InMemoryStorageService storageService;
    late MockAuthRemoteDataSource remoteDataSource;
    late AuthRepositoryImpl authRepository;
    late AuthNotifier authNotifier;

    setUp(() {
      MockAuthRemoteDataSource.resetLoginOtps();
      storageService = InMemoryStorageService();
      remoteDataSource = MockAuthRemoteDataSource();
      authRepository = AuthRepositoryImpl(
        remoteDataSource: remoteDataSource,
        storageService: storageService,
      );
      authNotifier = AuthNotifier(repository: authRepository);
    });

    group('MockAuthRemoteDataSource - Login OTP Flow', () {
      test('requestLoginOtp succeeds with valid credentials and issues 6-digit OTP', () async {
        final result = await remoteDataSource.requestLoginOtp(
          const RequestLoginOtpRequest(
            email: 'coffee.lover@lambac.com',
            password: 'password123',
          ),
        );

        expect(result.isSuccess, isTrue);
        final response = result.dataOrNull!;
        expect(response.email, equals('coffee.lover@lambac.com'));
        expect(response.maskedEmail, contains('•'));
        expect(response.maskedEmail, endsWith('@lambac.com'));
        expect(response.debugOtp, isNotNull);
        expect(response.debugOtp!.length, equals(6));
        expect(response.expiresInSeconds, equals(300));
      });

      test('requestLoginOtp rejects with invalid credentials without issuing OTP', () async {
        final result = await remoteDataSource.requestLoginOtp(
          const RequestLoginOtpRequest(
            email: 'coffee.lover@lambac.com',
            password: 'wrong_password',
          ),
        );

        expect(result.isFailure, isTrue);
        expect(result.failureOrNull, isA<AppFailure>());
        expect(result.failureOrNull!.message, contains('Invalid email or password'));
      });

      test('requestLoginOtp rejects non-existent account without issuing OTP', () async {
        final result = await remoteDataSource.requestLoginOtp(
          const RequestLoginOtpRequest(
            email: 'nonexistent.user@lambac.com',
            password: 'password123',
          ),
        );

        expect(result.isFailure, isTrue);
        expect(result.failureOrNull, isA<AppFailure>());
      });

      test('resendLoginOtp enforces 45-second cooldown', () async {
        final initial = await remoteDataSource.requestLoginOtp(
          const RequestLoginOtpRequest(
            email: 'coffee.lover@lambac.com',
            password: 'password123',
          ),
        );
        expect(initial.isSuccess, isTrue);

        // Immediate resend must fail with rate limit
        final resendResult = await remoteDataSource.resendLoginOtp(
          email: 'coffee.lover@lambac.com',
          password: 'password123',
        );

        expect(resendResult.isFailure, isTrue);
        expect(resendResult.failureOrNull!.message, contains('Please wait'));
      });

      test('verifyLoginOtp succeeds with correct OTP code and returns valid AuthSession', () async {
        final otpResp = await remoteDataSource.requestLoginOtp(
          const RequestLoginOtpRequest(
            email: 'coffee.lover@lambac.com',
            password: 'password123',
          ),
        );
        expect(otpResp.isSuccess, isTrue);

        final result = await remoteDataSource.verifyLoginOtp(
          VerifyLoginOtpRequest(
            email: 'coffee.lover@lambac.com',
            password: 'password123',
            otp: otpResp.dataOrNull!.debugOtp!,
          ),
        );

        expect(result.isSuccess, isTrue);
        final session = result.dataOrNull!;
        expect(session.user.email, equals('coffee.lover@lambac.com'));
        expect(session.accessToken, isNotEmpty);
      });

      test('verifyLoginOtp fails with incorrect OTP and locks after 5 attempts', () async {
        final otpResp = await remoteDataSource.requestLoginOtp(
          const RequestLoginOtpRequest(
            email: 'coffee.lover@lambac.com',
            password: 'password123',
          ),
        );
        expect(otpResp.isSuccess, isTrue);

        // 4 failed attempts
        for (int i = 0; i < 4; i++) {
          final failResult = await remoteDataSource.verifyLoginOtp(
            const VerifyLoginOtpRequest(
              email: 'coffee.lover@lambac.com',
              password: 'password123',
              otp: '000000',
            ),
          );
          expect(failResult.isFailure, isTrue);
          expect(failResult.failureOrNull!.message, contains('Invalid verification code'));
        }

        // 5th failed attempt locks out the request
        final fifthResult = await remoteDataSource.verifyLoginOtp(
          const VerifyLoginOtpRequest(
            email: 'coffee.lover@lambac.com',
            password: 'password123',
            otp: '000000',
          ),
        );
        expect(fifthResult.isFailure, isTrue);
        expect(fifthResult.failureOrNull!.message, contains('Too many failed attempts'));

        // Subsequent attempt says too many attempts
        final lockedResult = await remoteDataSource.verifyLoginOtp(
          const VerifyLoginOtpRequest(
            email: 'coffee.lover@lambac.com',
            password: 'password123',
            otp: '000000',
          ),
        );
        expect(lockedResult.isFailure, isTrue);
        expect(lockedResult.failureOrNull!.message, contains('Too many failed verification attempts'));
      });
    });

    group('AuthRepositoryImpl - Login OTP Integration', () {
      test('requestLoginOtp and verifyLoginOtp persist session to storage', () async {
        final reqResult = await authRepository.requestLoginOtp(
          const RequestLoginOtpRequest(
            email: 'coffee.lover@lambac.com',
            password: 'password123',
          ),
        );

        expect(reqResult.isSuccess, isTrue);
        final otpResp = reqResult.dataOrNull!;
        expect(otpResp.debugOtp, isNotNull);

        final verifyResult = await authRepository.verifyLoginOtp(
          VerifyLoginOtpRequest(
            email: 'coffee.lover@lambac.com',
            password: 'password123',
            otp: otpResp.debugOtp!,
          ),
        );

        expect(verifyResult.isSuccess, isTrue);
        expect(verifyResult.dataOrNull!.user.email, equals('coffee.lover@lambac.com'));

        // Storage contains token and user
        final storedToken = await storageService.getToken();
        expect(storedToken, isNotNull);
        expect(storedToken, isNotEmpty);
      });
    });

    group('AuthNotifier - End-to-End Login Flow', () {
      test('requestLoginOtp maintains unauthenticated state and returns debug OTP', () async {
        final result = await authNotifier.requestLoginOtp(
          email: 'coffee.lover@lambac.com',
          password: 'password123',
        );

        expect(result.isSuccess, isTrue);
        expect(authNotifier.state.isAuthenticated, isFalse);
      });

      test('verifyLoginOtp transitions state to authenticated upon correct code', () async {
        final reqResult = await authNotifier.requestLoginOtp(
          email: 'coffee.lover@lambac.com',
          password: 'password123',
        );
        final otpCode = reqResult.dataOrNull!.debugOtp!;

        final verifyResult = await authNotifier.verifyLoginOtp(
          email: 'coffee.lover@lambac.com',
          password: 'password123',
          otp: otpCode,
        );

        expect(verifyResult.isSuccess, isTrue);
        expect(authNotifier.state.isAuthenticated, isTrue);
        expect(authNotifier.state.user?.email, equals('coffee.lover@lambac.com'));
        expect(authNotifier.state.status, equals(AuthStatus.authenticated));
      });
    });
  });
}
