import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/errors/app_failure.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/result.dart';
import '../../../../shared/models/user_model.dart';
import '../../../admin/data/models/create_user_request.dart';
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

/// Contract for Remote Authentication API calls
abstract class AuthRemoteDataSource {
  Future<Result<AuthResponseModel, AppFailure>> login(LoginRequest request);
  Future<Result<RequestLoginOtpResponse, AppFailure>> requestLoginOtp(RequestLoginOtpRequest request);
  Future<Result<AuthResponseModel, AppFailure>> verifyLoginOtp(VerifyLoginOtpRequest request);
  Future<Result<RequestLoginOtpResponse, AppFailure>> resendLoginOtp({required String email, required String password});
  Future<Result<RequestRegisterOtpResponse, AppFailure>> requestRegisterOtp(RequestRegisterOtpRequest request);
  Future<Result<VerifyRegisterOtpResponse, AppFailure>> verifyRegisterOtp(VerifyRegisterOtpRequest request);
  Future<Result<RequestRegisterOtpResponse, AppFailure>> resendRegisterOtp(String email);
  Future<Result<AuthResponseModel, AppFailure>> register(RegisterRequest request);
  Future<Result<void, AppFailure>> logout();
  Future<Result<String, AppFailure>> refreshToken(String refreshToken);
  Future<Result<void, AppFailure>> forgotPassword(ForgotPasswordRequest request);
  Future<Result<void, AppFailure>> resetPassword(ResetPasswordRequest request);
  Future<Result<UserModel, AppFailure>> getProfile();
  Future<Result<UserModel, AppFailure>> updateProfile(UpdateProfileRequest request);
  Future<Result<void, AppFailure>> changePassword(ChangePasswordRequest request);
  Future<Result<UserModel, AppFailure>> completeFirstLoginPassword(FirstLoginPasswordRequest request);
  Future<Result<UserModel, AppFailure>> acceptTerms({required String version});
  Future<Result<void, AppFailure>> deleteAccount();
}

/// Concrete Dio-based implementation
class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient _apiClient;

  AuthRemoteDataSourceImpl({required ApiClient apiClient})
      : _apiClient = apiClient;

  @override
  Future<Result<AuthResponseModel, AppFailure>> login(LoginRequest request) {
    return _apiClient.post(
      ApiEndpoints.login,
      data: request.toJson(),
      requiresAuth: false,
      decoder: (data) => AuthResponseModel.fromJson(data as Map<String, dynamic>),
    );
  }

  @override
  Future<Result<RequestLoginOtpResponse, AppFailure>> requestLoginOtp(RequestLoginOtpRequest request) {
    return _apiClient.post(
      '/auth/login/otp/request',
      data: request.toJson(),
      requiresAuth: false,
      decoder: (data) => RequestLoginOtpResponse.fromJson(data as Map<String, dynamic>),
    );
  }

  @override
  Future<Result<AuthResponseModel, AppFailure>> verifyLoginOtp(VerifyLoginOtpRequest request) {
    return _apiClient.post(
      '/auth/login/otp/verify',
      data: request.toJson(),
      requiresAuth: false,
      decoder: (data) => AuthResponseModel.fromJson(data as Map<String, dynamic>),
    );
  }

  @override
  Future<Result<RequestLoginOtpResponse, AppFailure>> resendLoginOtp({required String email, required String password}) {
    return _apiClient.post(
      '/auth/login/otp/resend',
      data: {'email': email.trim().toLowerCase(), 'password': password},
      requiresAuth: false,
      decoder: (data) => RequestLoginOtpResponse.fromJson(data as Map<String, dynamic>),
    );
  }

  @override
  Future<Result<RequestRegisterOtpResponse, AppFailure>> requestRegisterOtp(RequestRegisterOtpRequest request) {
    return _apiClient.post(
      ApiEndpoints.requestRegisterOtp,
      data: request.toJson(),
      requiresAuth: false,
      decoder: (data) => RequestRegisterOtpResponse.fromJson(data as Map<String, dynamic>),
    );
  }

  @override
  Future<Result<VerifyRegisterOtpResponse, AppFailure>> verifyRegisterOtp(VerifyRegisterOtpRequest request) {
    return _apiClient.post(
      ApiEndpoints.verifyRegisterOtp,
      data: request.toJson(),
      requiresAuth: false,
      decoder: (data) => VerifyRegisterOtpResponse.fromJson(data as Map<String, dynamic>),
    );
  }

  @override
  Future<Result<RequestRegisterOtpResponse, AppFailure>> resendRegisterOtp(String email) {
    return _apiClient.post(
      ApiEndpoints.resendRegisterOtp,
      data: {'email': email.trim().toLowerCase()},
      requiresAuth: false,
      decoder: (data) => RequestRegisterOtpResponse.fromJson(data as Map<String, dynamic>),
    );
  }

  @override
  Future<Result<AuthResponseModel, AppFailure>> register(RegisterRequest request) {
    return _apiClient.post(
      ApiEndpoints.register,
      data: request.toJson(),
      requiresAuth: false,
      decoder: (data) => AuthResponseModel.fromJson(data as Map<String, dynamic>),
    );
  }

  @override
  Future<Result<void, AppFailure>> logout() {
    return _apiClient.post(
      ApiEndpoints.logout,
      requiresAuth: true,
      decoder: (_) {},
    );
  }

  @override
  Future<Result<String, AppFailure>> refreshToken(String refreshToken) {
    return _apiClient.post(
      ApiEndpoints.refreshToken,
      data: {'refresh_token': refreshToken},
      requiresAuth: false,
      decoder: (data) => (data as Map<String, dynamic>)['access_token'].toString(),
    );
  }

  @override
  Future<Result<void, AppFailure>> forgotPassword(ForgotPasswordRequest request) {
    return _apiClient.post(
      ApiEndpoints.forgotPassword,
      data: request.toJson(),
      requiresAuth: false,
      decoder: (_) {},
    );
  }

  @override
  Future<Result<void, AppFailure>> resetPassword(ResetPasswordRequest request) {
    return _apiClient.post(
      ApiEndpoints.resetPassword,
      data: request.toJson(),
      requiresAuth: false,
      decoder: (_) {},
    );
  }

  @override
  Future<Result<UserModel, AppFailure>> getProfile() {
    return _apiClient.get(
      ApiEndpoints.userProfile,
      requiresAuth: true,
      decoder: (data) => UserModel.fromJson(data as Map<String, dynamic>),
    );
  }

  @override
  Future<Result<UserModel, AppFailure>> updateProfile(UpdateProfileRequest request) {
    return _apiClient.put(
      ApiEndpoints.updateProfile,
      data: request.toJson(),
      requiresAuth: true,
      decoder: (data) => UserModel.fromJson(data as Map<String, dynamic>),
    );
  }

  @override
  Future<Result<void, AppFailure>> changePassword(ChangePasswordRequest request) {
    return _apiClient.post(
      ApiEndpoints.changePassword,
      data: request.toJson(),
      requiresAuth: true,
      decoder: (_) {},
    );
  }

  @override
  Future<Result<UserModel, AppFailure>> completeFirstLoginPassword(FirstLoginPasswordRequest request) {
    return _apiClient.post(
      ApiEndpoints.firstLoginPassword,
      data: request.toJson(),
      requiresAuth: true,
      decoder: (data) => UserModel.fromJson(data as Map<String, dynamic>),
    );
  }

  @override
  Future<Result<UserModel, AppFailure>> acceptTerms({required String version}) {
    return _apiClient.post(
      '/users/terms/accept',
      data: {'version': version},
      requiresAuth: true,
      decoder: (data) => UserModel.fromJson(data as Map<String, dynamic>),
    );
  }

  @override
  Future<Result<void, AppFailure>> deleteAccount() {
    return _apiClient.delete(
      '/users/account',
      requiresAuth: true,
      decoder: (_) {},
    );
  }
}
