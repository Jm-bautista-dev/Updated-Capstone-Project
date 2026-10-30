import 'dart:convert';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/errors/app_failure.dart';
import '../../../../core/network/result.dart';
import '../../../../shared/models/user_model.dart';
import '../../../../shared/services/storage_service.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../../admin/data/models/create_user_request.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/auth_response_model.dart';
import '../models/change_password_request.dart';
import '../models/forgot_password_request.dart';
import '../models/login_request.dart';
import '../models/request_login_otp_request.dart';
import '../models/verify_login_otp_request.dart';
import '../models/register_request.dart';
import '../models/request_register_otp_request.dart';
import '../models/reset_password_request.dart';
import '../models/update_profile_request.dart';
import '../models/verify_register_otp_request.dart';

/// Concrete implementation of AuthRepository
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final StorageService _storageService;

  AuthRepositoryImpl({
    required AuthRemoteDataSource remoteDataSource,
    required StorageService storageService,
  })  : _remoteDataSource = remoteDataSource,
        _storageService = storageService;

  @override
  Future<Result<AuthResponseModel, AppFailure>> login(LoginRequest request) async {
    final result = await _remoteDataSource.login(request);

    if (result is Success<AuthResponseModel, AppFailure>) {
      final authData = result.data;
      await _persistSession(authData);
    }

    return result;
  }

  @override
  Future<Result<RequestLoginOtpResponse, AppFailure>> requestLoginOtp(RequestLoginOtpRequest request) {
    return _remoteDataSource.requestLoginOtp(request);
  }

  @override
  Future<Result<AuthResponseModel, AppFailure>> verifyLoginOtp(VerifyLoginOtpRequest request) async {
    final result = await _remoteDataSource.verifyLoginOtp(request);

    if (result is Success<AuthResponseModel, AppFailure>) {
      final authData = result.data;
      await _persistSession(authData);
    }

    return result;
  }

  @override
  Future<Result<RequestLoginOtpResponse, AppFailure>> resendLoginOtp({required String email, required String password}) {
    return _remoteDataSource.resendLoginOtp(email: email, password: password);
  }

  @override
  Future<Result<RequestRegisterOtpResponse, AppFailure>> requestRegisterOtp(RequestRegisterOtpRequest request) {
    return _remoteDataSource.requestRegisterOtp(request);
  }

  @override
  Future<Result<VerifyRegisterOtpResponse, AppFailure>> verifyRegisterOtp(VerifyRegisterOtpRequest request) {
    return _remoteDataSource.verifyRegisterOtp(request);
  }

  @override
  Future<Result<RequestRegisterOtpResponse, AppFailure>> resendRegisterOtp(String email) {
    return _remoteDataSource.resendRegisterOtp(email);
  }

  @override
  Future<Result<AuthResponseModel, AppFailure>> register(RegisterRequest request) async {
    final result = await _remoteDataSource.register(request);

    if (result is Success<AuthResponseModel, AppFailure>) {
      final authData = result.data;
      await _persistSession(authData);
    }

    return result;
  }

  @override
  Future<Result<void, AppFailure>> logout() async {
    try {
      await _remoteDataSource.logout();
    } catch (_) {
      // Still proceed with clearing local storage
    }
    await _clearSession();
    return const Result.success(null);
  }

  @override
  Future<Result<AuthResponseModel?, AppFailure>> restoreSession() async {
    try {
      final token = await _storageService.getToken();
      final refreshToken = await _storageService.getRefreshToken();
      final userJsonString = await _storageService.getString(AppConstants.userDataKey);

      if (token == null || token.isEmpty) {
        return const Result.success(null);
      }

      // 1. Authoritative check: ask remote data source (Firebase Auth & Firestore) for active session
      final profileResult = await _remoteDataSource.getProfile();
      if (profileResult is Success<UserModel, AppFailure>) {
        final user = profileResult.data;
        await _storageService.setString(AppConstants.userIdKey, user.id);
        await _storageService.setString(AppConstants.userDataKey, jsonEncode(user.toJson()));
        return Result.success(
          AuthResponseModel(
            accessToken: token,
            refreshToken: refreshToken,
            user: user,
          ),
        );
      }

      // If remote profile was rejected (disabled, unauthorized, not found, or invalid role),
      // strictly clear the session. Never allow a stale cached role to override the server.
      final failure = (profileResult as Failure<UserModel, AppFailure>).failure;
      if (failure is UnauthorizedFailure || failure is NotFoundFailure || failure is ForbiddenFailure) {
        await _clearSession();
        return const Result.success(null);
      }

      // 2. Offline fallback ONLY for network connection failures with matching cached session
      if (userJsonString != null && userJsonString.isNotEmpty) {
        try {
          final userMap = jsonDecode(userJsonString) as Map<String, dynamic>;
          final user = UserModel.fromJson(userMap);
          return Result.success(
            AuthResponseModel(
              accessToken: token,
              refreshToken: refreshToken,
              user: user,
            ),
          );
        } catch (_) {}
      }

      // No valid session
      await _clearSession();
      return const Result.success(null);
    } catch (e) {
      await _clearSession();
      return const Result.success(null);
    }
  }

  @override
  Future<Result<void, AppFailure>> forgotPassword(ForgotPasswordRequest request) {
    return _remoteDataSource.forgotPassword(request);
  }

  @override
  Future<Result<void, AppFailure>> resetPassword(ResetPasswordRequest request) {
    return _remoteDataSource.resetPassword(request);
  }

  @override
  Future<Result<UserModel, AppFailure>> getProfile() async {
    final result = await _remoteDataSource.getProfile();
    if (result is Success<UserModel, AppFailure>) {
      await _storageService.setString(AppConstants.userDataKey, jsonEncode(result.data.toJson()));
    }
    return result;
  }

  @override
  Future<Result<UserModel, AppFailure>> updateProfile(UpdateProfileRequest request) async {
    final result = await _remoteDataSource.updateProfile(request);
    if (result is Success<UserModel, AppFailure>) {
      await _storageService.setString(AppConstants.userDataKey, jsonEncode(result.data.toJson()));
    }
    return result;
  }

  @override
  Future<Result<void, AppFailure>> changePassword(ChangePasswordRequest request) {
    return _remoteDataSource.changePassword(request);
  }

  @override
  Future<Result<UserModel, AppFailure>> completeFirstLoginPassword(FirstLoginPasswordRequest request) async {
    final result = await _remoteDataSource.completeFirstLoginPassword(request);
    if (result is Success<UserModel, AppFailure>) {
      await _storageService.setString(AppConstants.userDataKey, jsonEncode(result.data.toJson()));
    }
    return result;
  }

  @override
  Future<Result<UserModel, AppFailure>> acceptTerms({required String version}) async {
    final result = await _remoteDataSource.acceptTerms(version: version);
    if (result is Success<UserModel, AppFailure>) {
      await _storageService.setString(AppConstants.userDataKey, jsonEncode(result.data.toJson()));
    }
    return result;
  }

  @override
  Future<Result<void, AppFailure>> deleteAccount() async {
    final result = await _remoteDataSource.deleteAccount();
    if (result.isSuccess) {
      await _clearSession();
    }
    return result;
  }

  Future<void> _persistSession(AuthResponseModel authData) async {
    await _storageService.setToken(authData.accessToken);
    if (authData.refreshToken != null) {
      await _storageService.setRefreshToken(authData.refreshToken!);
    }
    await _storageService.setString(AppConstants.userIdKey, authData.user.id);
    await _storageService.setString(AppConstants.userDataKey, jsonEncode(authData.user.toJson()));
  }

  Future<void> _clearSession() async {
    await _storageService.clearAuthTokens();
    await _storageService.remove(AppConstants.userDataKey);
  }
}
