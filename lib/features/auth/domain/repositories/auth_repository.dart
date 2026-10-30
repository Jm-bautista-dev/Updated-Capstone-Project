import '../../../../core/errors/app_failure.dart';
import '../../../../core/network/result.dart';
import '../../../../shared/models/user_model.dart';
import '../../../admin/data/models/create_user_request.dart';
import '../../data/models/auth_response_model.dart';
import '../../data/models/change_password_request.dart';
import '../../data/models/forgot_password_request.dart';
import '../../data/models/login_request.dart';
import '../../data/models/request_login_otp_request.dart';
import '../../data/models/verify_login_otp_request.dart';
import '../../data/models/register_request.dart';
import '../../data/models/request_register_otp_request.dart';
import '../../data/models/reset_password_request.dart';
import '../../data/models/update_profile_request.dart';
import '../../data/models/verify_register_otp_request.dart';

/// Clean Domain Repository Contract for Authentication & Account Management
abstract class AuthRepository {
  /// Attempt login with email and password credentials
  Future<Result<AuthResponseModel, AppFailure>> login(LoginRequest request);

  /// Request a 6-digit Sign-In / Login OTP dispatched to user Gmail
  Future<Result<RequestLoginOtpResponse, AppFailure>> requestLoginOtp(RequestLoginOtpRequest request);

  /// Verify 6-digit Sign-In / Login OTP and authenticate
  Future<Result<AuthResponseModel, AppFailure>> verifyLoginOtp(VerifyLoginOtpRequest request);

  /// Resend a fresh 6-digit Sign-In / Login OTP code
  Future<Result<RequestLoginOtpResponse, AppFailure>> resendLoginOtp({required String email, required String password});


  /// Request a 6-digit registration verification OTP sent to customer Gmail/email
  Future<Result<RequestRegisterOtpResponse, AppFailure>> requestRegisterOtp(RequestRegisterOtpRequest request);

  /// Verify 6-digit OTP code against backend
  Future<Result<VerifyRegisterOtpResponse, AppFailure>> verifyRegisterOtp(VerifyRegisterOtpRequest request);

  /// Resend a fresh 6-digit registration OTP code
  Future<Result<RequestRegisterOtpResponse, AppFailure>> resendRegisterOtp(String email);

  /// Register a new customer account using verified registration token
  Future<Result<AuthResponseModel, AppFailure>> register(RegisterRequest request);

  /// Terminate active session and clear tokens
  Future<Result<void, AppFailure>> logout();

  /// Restore cached session from secure storage
  Future<Result<AuthResponseModel?, AppFailure>> restoreSession();

  /// Send password reset instructions
  Future<Result<void, AppFailure>> forgotPassword(ForgotPasswordRequest request);

  /// Confirm password reset with token & new password
  Future<Result<void, AppFailure>> resetPassword(ResetPasswordRequest request);

  /// Fetch authenticated user profile
  Future<Result<UserModel, AppFailure>> getProfile();

  /// Update user profile details
  Future<Result<UserModel, AppFailure>> updateProfile(UpdateProfileRequest request);

  /// Change account password
  Future<Result<void, AppFailure>> changePassword(ChangePasswordRequest request);

  /// Complete forced first-login password setup
  Future<Result<UserModel, AppFailure>> completeFirstLoginPassword(FirstLoginPasswordRequest request);

  /// Record explicit Terms & Conditions acceptance for authenticated account
  Future<Result<UserModel, AppFailure>> acceptTerms({required String version});

  /// Permanently delete account
  Future<Result<void, AppFailure>> deleteAccount();
}
