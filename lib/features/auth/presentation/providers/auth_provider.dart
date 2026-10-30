import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/app_failure.dart';
import '../../../../core/network/result.dart';
import '../../../../shared/models/auth_state.dart';
import '../../../../shared/models/user_model.dart';
import '../../../../shared/services/storage_service.dart';
import 'package:firebase_core/firebase_core.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../data/datasources/firebase_auth_remote_datasource.dart';
import '../../data/datasources/mock_auth_remote_datasource.dart';
import '../../../admin/data/models/create_user_request.dart';
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
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../../cart/presentation/providers/cart_provider.dart';
import '../../../chat/presentation/providers/chat_provider.dart';
import '../../../notifications/presentation/providers/notification_provider.dart';
import '../../../orders/presentation/providers/orders_provider.dart';
import '../../../products/presentation/providers/favorites_provider.dart';

/// Provider for Remote Data Source backed by Firebase Authentication & Cloud Firestore
final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  try {
    if (Firebase.apps.isEmpty) {
      return MockAuthRemoteDataSource();
    }
  } catch (_) {
    return MockAuthRemoteDataSource();
  }
  return FirebaseAuthRemoteDataSourceImpl();
});

/// Provider for Domain AuthRepository
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final remoteDataSource = ref.watch(authRemoteDataSourceProvider);
  final storageService = ref.watch(storageServiceProvider);

  return AuthRepositoryImpl(
    remoteDataSource: remoteDataSource,
    storageService: storageService,
  );
});

/// Convenience provider for the currently authenticated UserModel
final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authNotifierProvider).user;
});

/// Convenience provider for checking authenticated state
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authNotifierProvider).isAuthenticated;
});

/// Convenience provider for checking if current user is an authenticated customer (not guest)
final isCustomerAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authNotifierProvider).isCustomerAuthenticated;
});

/// Auth State Notifier Provider
final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return AuthNotifier(repository: repository, ref: ref);
});

/// StateNotifier managing global authentication lifecycle
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;
  final Ref? _ref;

  AuthNotifier({
    required AuthRepository repository,
    Ref? ref,
  })  : _repository = repository,
        _ref = ref,
        super(const AuthState.initial()) {
    restoreSession();
  }

  /// Restores session on app startup from secure storage
  Future<void> restoreSession() async {
    state = const AuthState.initial();
    final result = await _repository.restoreSession();
    if (!mounted) return;

    result.when(
      success: (authData) {
        if (authData != null) {
          state = AuthState.authenticated(
            user: authData.user,
            token: authData.accessToken,
          );
        } else {
          state = const AuthState.unauthenticated();
        }
      },
      failure: (failure) {
        state = const AuthState.unauthenticated();
      },
    );
  }

  /// Login with email and password
  Future<Result<UserModel, AppFailure>> login({
    required String email,
    required String password,
  }) async {
    state = const AuthState.authenticating();

    final result = await _repository.login(
      LoginRequest(email: email, password: password),
    );

    if (mounted) {
      result.when(
        success: (authData) {
          state = AuthState.authenticated(
            user: authData.user,
            token: authData.accessToken,
          );
        },
        failure: (failure) {
          state = AuthState.failure(failure);
        },
      );
    }

    return result.when(
      success: (authData) => Result.success(authData.user),
      failure: (failure) => Result.failure(failure),
    );
  }

  /// Request a 6-digit Sign-In / Login OTP dispatched to user Gmail
  Future<Result<RequestLoginOtpResponse, AppFailure>> requestLoginOtp({
    required String email,
    required String password,
  }) async {
    return _repository.requestLoginOtp(
      RequestLoginOtpRequest(
        email: email,
        password: password,
      ),
    );
  }

  /// Verify 6-digit Sign-In / Login OTP and authenticate user
  Future<Result<UserModel, AppFailure>> verifyLoginOtp({
    required String email,
    required String password,
    required String otp,
  }) async {
    state = const AuthState.authenticating();

    final result = await _repository.verifyLoginOtp(
      VerifyLoginOtpRequest(
        email: email,
        password: password,
        otp: otp,
      ),
    );

    if (mounted) {
      result.when(
        success: (authData) {
          state = AuthState.authenticated(
            user: authData.user,
            token: authData.accessToken,
          );
        },
        failure: (failure) {
          state = AuthState.failure(failure);
        },
      );
    }

    return result.when(
      success: (authData) => Result.success(authData.user),
      failure: (failure) => Result.failure(failure),
    );
  }

  /// Resend a fresh 6-digit Sign-In / Login OTP code to user Gmail
  Future<Result<RequestLoginOtpResponse, AppFailure>> resendLoginOtp({
    required String email,
    required String password,
  }) async {
    return _repository.resendLoginOtp(
      email: email,
      password: password,
    );
  }

  /// Request 6-digit registration verification OTP via customer Gmail
  Future<Result<RequestRegisterOtpResponse, AppFailure>> requestRegisterOtp({
    required String fullName,
    required String email,
    required String password,
    String? phoneNumber,
  }) async {
    return _repository.requestRegisterOtp(
      RequestRegisterOtpRequest(
        fullName: fullName,
        email: email,
        password: password,
        phoneNumber: phoneNumber,
      ),
    );
  }

  /// Verify 6-digit OTP code submitted by customer
  Future<Result<VerifyRegisterOtpResponse, AppFailure>> verifyRegisterOtp({
    required String email,
    required String otp,
  }) async {
    return _repository.verifyRegisterOtp(
      VerifyRegisterOtpRequest(
        email: email,
        otp: otp,
      ),
    );
  }

  /// Resend a fresh 6-digit registration OTP code to customer email
  Future<Result<RequestRegisterOtpResponse, AppFailure>> resendRegisterOtp(String email) async {
    return _repository.resendRegisterOtp(email);
  }

  /// Register new customer account with verified OTP token
  Future<Result<UserModel, AppFailure>> register({
    required String fullName,
    required String email,
    required String password,
    String? phoneNumber,
    String? verificationToken,
  }) async {
    state = const AuthState.authenticating();

    final result = await _repository.register(
      RegisterRequest(
        fullName: fullName,
        email: email,
        password: password,
        phoneNumber: phoneNumber,
        verificationToken: verificationToken,
      ),
    );

    if (mounted) {
      result.when(
        success: (authData) {
          state = AuthState.authenticated(
            user: authData.user,
            token: authData.accessToken,
          );
        },
        failure: (failure) {
          state = AuthState.failure(failure);
        },
      );
    }

    return result.when(
      success: (authData) => Result.success(authData.user),
      failure: (failure) => Result.failure(failure),
    );
  }

  /// Continue browsing as guest
  void continueAsGuest() {
    final guestUser = UserModel.guest();
    state = AuthState.authenticated(
      user: guestUser,
      token: 'guest_session_token',
    );
  }

  /// Request password reset link/OTP
  Future<Result<void, AppFailure>> forgotPassword(String email) async {
    return _repository.forgotPassword(ForgotPasswordRequest(email: email));
  }

  /// Confirm password reset with token/code
  Future<Result<void, AppFailure>> resetPassword({
    required String email,
    required String token,
    required String newPassword,
  }) async {
    return _repository.resetPassword(
      ResetPasswordRequest(
        email: email,
        resetToken: token,
        newPassword: newPassword,
      ),
    );
  }

  /// Update authenticated user's profile
  Future<Result<UserModel, AppFailure>> updateProfile({
    String? fullName,
    String? phoneNumber,
    String? avatarUrl,
  }) async {
    final result = await _repository.updateProfile(
      UpdateProfileRequest(
        fullName: fullName,
        phoneNumber: phoneNumber,
        avatarUrl: avatarUrl,
      ),
    );

    return result.when(
      success: (updatedUser) {
        if (state.status == AuthStatus.authenticated && state.token != null) {
          state = AuthState.authenticated(user: updatedUser, token: state.token!);
        }
        return Result.success(updatedUser);
      },
      failure: (failure) => Result.failure(failure),
    );
  }

  /// Change password while authenticated
  Future<Result<void, AppFailure>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) {
    return _repository.changePassword(
      ChangePasswordRequest(
        currentPassword: currentPassword,
        newPassword: newPassword,
      ),
    );
  }

  /// Complete forced first-login password setup
  Future<Result<UserModel, AppFailure>> completeFirstLoginPassword(String newPassword) async {
    final result = await _repository.completeFirstLoginPassword(
      FirstLoginPasswordRequest(newPassword: newPassword),
    );

    return result.when(
      success: (updatedUser) {
        if (state.token != null) {
          state = AuthState.authenticated(user: updatedUser, token: state.token!);
        }
        return Result.success(updatedUser);
      },
      failure: (failure) => Result.failure(failure),
    );
  }

  /// Record explicit Terms & Conditions acceptance for authenticated account
  Future<Result<UserModel, AppFailure>> acceptTerms({required String version}) async {
    final result = await _repository.acceptTerms(version: version);

    return result.when(
      success: (updatedUser) {
        if (state.token != null) {
          state = AuthState.authenticated(user: updatedUser, token: state.token!);
        }
        return Result.success(updatedUser);
      },
      failure: (failure) => Result.failure(failure),
    );
  }

  /// Handle session expiration
  void handleSessionExpired() {
    state = const AuthState.sessionExpired();
  }

  /// Log out and terminate session with comprehensive customer-session teardown
  Future<void> logout() async {
    state = const AuthState.authenticating();
    await _repository.logout();

    // Explicit session teardown across repositories & subscriptions
    if (_ref != null) {
      try {
        _ref.read(notificationRepositoryProvider).clearSession();
        _ref.read(chatRepositoryProvider).clearSession();
        _ref.read(orderRepositoryProvider).clearSession();
        _ref.read(favoritesProvider.notifier).reset();
        _ref.read(cartNotifierProvider.notifier).clearCart();
      } catch (_) {}
    }

    // Setting state to unauthenticated automatically propagates currentUserProvider = null
    // to all downstream providers (chat, notifications, orders, favorites, cart), cleanly
    // resetting them without stale state.
    state = const AuthState.unauthenticated();
  }

  /// Permanently delete customer account with comprehensive customer-session teardown
  Future<Result<void, AppFailure>> deleteAccount() async {
    state = const AuthState.authenticating();
    final result = await _repository.deleteAccount();

    if (result.isSuccess) {
      if (_ref != null) {
        try {
          _ref.read(notificationRepositoryProvider).clearSession();
          _ref.read(chatRepositoryProvider).clearSession();
          _ref.read(orderRepositoryProvider).clearSession();
          _ref.read(favoritesProvider.notifier).reset();
          _ref.read(cartNotifierProvider.notifier).clearCart();
        } catch (_) {}
      }

      state = const AuthState.unauthenticated();
    } else {
      state = AuthState.failure(result.failureOrNull!);
    }
    return result;
  }
}
