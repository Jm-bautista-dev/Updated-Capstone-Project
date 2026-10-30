import 'dart:async';
import 'dart:math';
import '../../../../core/errors/app_failure.dart';
import '../../../../core/network/result.dart';
import '../../../../core/security/audit_logger.dart';
import '../../../../core/security/password_hasher.dart';
import '../../../../core/services/email_service.dart';
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
import 'auth_remote_datasource.dart';
import 'mock_user_database.dart';

/// Temporary pending registration record during customer OTP verification

/// Temporary pending login record during 2FA Gmail OTP verification
class PendingLoginOtpRecord {
  final String email;
  final String password;
  String otpHashed;
  DateTime expiresAt;
  DateTime cooldownUntil;
  int attemptsCount;
  String? testOtp;

  PendingLoginOtpRecord({
    required this.email,
    required this.password,
    required this.otpHashed,
    required this.expiresAt,
    required this.cooldownUntil,
    this.attemptsCount = 0,
    this.testOtp,
  });
}

class PendingRegistrationRecord {
  final String fullName;
  final String email;
  final String passwordHash;
  final String? phoneNumber;
  String otpHashed;
  DateTime expiresAt;
  DateTime cooldownUntil;
  int attemptsCount;
  bool isVerified;
  String? verificationToken;
  DateTime? tokenExpiresAt;
  String? testOtp; // Exclusively retained in mock memory for unit testing assertions

  PendingRegistrationRecord({
    required this.fullName,
    required this.email,
    required this.passwordHash,
    this.phoneNumber,
    required this.otpHashed,
    required this.expiresAt,
    required this.cooldownUntil,
    this.attemptsCount = 0,
    this.isVerified = false,
    this.verificationToken,
    this.tokenExpiresAt,
    this.testOtp,
  });
}

/// Secure Offline & Development Mock Data Source for Authentication
class MockAuthRemoteDataSource implements AuthRemoteDataSource {
  final MockUserDatabase _db = MockUserDatabase();
  final AuditLogger _auditLogger = AuditLogger();
  static final Map<String, PendingRegistrationRecord> _pendingRegistrations = {};

  /// Test helper to get latest generated OTP for a pending registration
  String? getPendingOtpForTesting(String email) {
    return _pendingRegistrations[email.trim().toLowerCase()]?.testOtp;
  }

  /// Test helper to force-expire a pending OTP
  void forceExpirePendingOtpForTesting(String email) {
    final pending = _pendingRegistrations[email.trim().toLowerCase()];
    if (pending != null) {
      pending.expiresAt = DateTime.now().subtract(const Duration(seconds: 1));
    }
  }

  /// Test helper to clear cooldown
  void resetCooldownForTesting(String email) {
    final pending = _pendingRegistrations[email.trim().toLowerCase()];
    if (pending != null) {
      pending.cooldownUntil = DateTime.now().subtract(const Duration(seconds: 1));
    }
  }

  /// Email-Enumeration Protection configuration: when true, forgotPassword does not reveal if an email exists
  bool emailEnumerationProtection = false;

  static final Map<String, DateTime> _passwordResetCooldowns = {};
  static final Map<String, int> _passwordResetFailedAttempts = {};

  /// Test helper to reset password reset cooldowns and failed attempts
  void resetPasswordResetCooldownForTesting([String? email]) {
    if (email != null) {
      _passwordResetCooldowns.remove(email.trim().toLowerCase());
      _passwordResetFailedAttempts.remove(email.trim().toLowerCase());
    } else {
      _passwordResetCooldowns.clear();
      _passwordResetFailedAttempts.clear();
    }
  }

  static final Map<String, PendingLoginOtpRecord> _pendingLoginOtps = {};

  static void resetLoginOtps() => _pendingLoginOtps.clear();

  @override
  Future<Result<RequestLoginOtpResponse, AppFailure>> requestLoginOtp(RequestLoginOtpRequest request) async {
    await Future.delayed(const Duration(milliseconds: 250));
    final normalizedEmail = request.email.trim().toLowerCase();
    final userEntry = _db.getByEmail(normalizedEmail);

    if (userEntry == null || !PasswordHasher.verifyPassword(request.password, userEntry.passwordHash)) {
      _auditLogger.log(
        action: AuditActionType.loginFailure,
        actorEmail: normalizedEmail,
        actorRole: 'unknown',
        isSuccess: false,
        details: 'Invalid credentials provided during Login OTP request.',
      );
      return const Result.failure(
        UnauthorizedFailure(
          message: 'Invalid email or password. Please verify your credentials.',
        ),
      );
    }

    if (userEntry.user.status == UserStatus.disabled) {
      return const Result.failure(
        UnauthorizedFailure(
          message: 'This account has been disabled. Please contact your system administrator.',
        ),
      );
    }

    // Cooldown check (45 seconds)
    final existingPending = _pendingLoginOtps[normalizedEmail];
    if (existingPending != null && DateTime.now().isBefore(existingPending.cooldownUntil)) {
      final remainingSecs = existingPending.cooldownUntil.difference(DateTime.now()).inSeconds;
      return Result.failure(
        ValidationFailure(
          message: 'Please wait $remainingSecs seconds before requesting a new sign-in code.',
        ),
      );
    }

    final random = Random.secure();
    final otpNumber = 100000 + random.nextInt(900000);
    final rawOtp = otpNumber.toString();
    final otpHashed = PasswordHasher.hashPassword(rawOtp);

    await EmailService.instance.sendLoginOtpEmail(
      recipientEmail: normalizedEmail,
      recipientName: userEntry.user.fullName,
      otpCode: rawOtp,
      expiresInMinutes: 5,
    );

    _pendingLoginOtps[normalizedEmail] = PendingLoginOtpRecord(
      email: normalizedEmail,
      password: request.password,
      otpHashed: otpHashed,
      expiresAt: DateTime.now().add(const Duration(minutes: 5)),
      cooldownUntil: DateTime.now().add(const Duration(seconds: 45)),
      testOtp: rawOtp,
    );

    return Result.success(
      RequestLoginOtpResponse(
        email: normalizedEmail,
        maskedEmail: EmailService.maskEmail(normalizedEmail),
        expiresInSeconds: 300,
        resendCooldownSeconds: 45,
        message: 'A 6-digit verification code has been sent to your Gmail.',
        debugOtp: rawOtp,
      ),
    );
  }

  @override
  Future<Result<AuthResponseModel, AppFailure>> verifyLoginOtp(VerifyLoginOtpRequest request) async {
    await Future.delayed(const Duration(milliseconds: 250));
    final normalizedEmail = request.email.trim().toLowerCase();
    final pending = _pendingLoginOtps[normalizedEmail];

    if (pending == null) {
      return const Result.failure(
        ValidationFailure(
          message: 'No pending sign-in request found. Please sign in again.',
        ),
      );
    }

    if (pending.attemptsCount >= 5) {
      pending.otpHashed = '';
      return const Result.failure(
        ValidationFailure(
          message: 'Too many failed verification attempts. Please request a new code.',
        ),
      );
    }

    if (DateTime.now().isAfter(pending.expiresAt)) {
      return const Result.failure(
        ValidationFailure(
          message: 'This verification code has expired. Please request a new code.',
        ),
      );
    }

    pending.attemptsCount++;

    if (!PasswordHasher.verifyPassword(request.otp.trim(), pending.otpHashed)) {
      final remainingAttempts = 5 - pending.attemptsCount;
      return Result.failure(
        ValidationFailure(
          message: remainingAttempts > 0
              ? 'Invalid verification code. $remainingAttempts attempt(s) remaining.'
              : 'Too many failed attempts. Code has been invalidated.',
        ),
      );
    }

    // OTP verified! Clear record and finalize login
    _pendingLoginOtps.remove(normalizedEmail);
    return login(LoginRequest(email: normalizedEmail, password: request.password));
  }

  @override
  Future<Result<RequestLoginOtpResponse, AppFailure>> resendLoginOtp({
    required String email,
    required String password,
  }) async {
    return requestLoginOtp(RequestLoginOtpRequest(email: email, password: password));
  }

  @override
  Future<Result<AuthResponseModel, AppFailure>> login(LoginRequest request) async {
    await Future.delayed(const Duration(milliseconds: 500));

    final normalizedEmail = request.email.trim().toLowerCase();
    final userEntry = _db.getByEmail(normalizedEmail);

    if (userEntry == null || !PasswordHasher.verifyPassword(request.password, userEntry.passwordHash)) {
      _auditLogger.log(
        action: AuditActionType.loginFailure,
        actorEmail: normalizedEmail,
        actorRole: 'unknown',
        isSuccess: false,
        details: 'Invalid credentials provided.',
      );
      return const Result.failure(
        UnauthorizedFailure(
          message: 'Invalid email or password. Please verify your credentials.',
        ),
      );
    }

    // Check account operational status (e.g. Disabled accounts cannot authenticate)
    if (userEntry.user.status == UserStatus.disabled) {
      _auditLogger.log(
        action: AuditActionType.loginFailure,
        actorEmail: normalizedEmail,
        actorRole: userEntry.user.role.name,
        isSuccess: false,
        details: 'Authentication rejected: Account has been disabled.',
      );
      return const Result.failure(
        UnauthorizedFailure(
          message: 'This account has been disabled. Please contact your system administrator.',
        ),
      );
    }

    // Update last login timestamp
    final updatedUser = userEntry.user.copyWith(lastLoginAt: DateTime.now());
    userEntry.user = updatedUser;
    _db.saveRecord(userEntry);
    _db.setCurrentUser(updatedUser);

    _auditLogger.log(
      action: AuditActionType.loginSuccess,
      actorEmail: updatedUser.email,
      actorRole: updatedUser.role.name,
      isSuccess: true,
      details: 'Authentication successful. Role: ${updatedUser.role.name}, mustChangePassword: ${updatedUser.mustChangePassword}',
    );

    final token = 'mock_jwt_token_${DateTime.now().millisecondsSinceEpoch}';
    final refreshToken = 'lambac_refresh_token_${DateTime.now().millisecondsSinceEpoch}';

    return Result.success(
      AuthResponseModel(
        accessToken: token,
        refreshToken: refreshToken,
        user: updatedUser,
      ),
    );
  }

  @override
  Future<Result<RequestRegisterOtpResponse, AppFailure>> requestRegisterOtp(RequestRegisterOtpRequest request) async {
    await Future.delayed(const Duration(milliseconds: 350));

    final fieldErrors = <String, List<String>>{};

    // 1. Server-side Full Name Validation
    final trimmedName = request.fullName.trim();
    if (trimmedName.isEmpty) {
      fieldErrors['fullName'] = ['Please enter your full name.'];
    } else if (trimmedName.length < 2 || trimmedName.length > 100) {
      fieldErrors['fullName'] = ['Full name must be between 2 and 100 characters.'];
    } else if (!RegExp(r"^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s'\-\.]+$").hasMatch(trimmedName)) {
      fieldErrors['fullName'] = ['Full name contains invalid characters.'];
    }

    // 2. Server-side Email Validation
    final normalizedEmail = request.email.trim().toLowerCase();
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (normalizedEmail.isEmpty) {
      fieldErrors['email'] = ['Please enter your email address.'];
    } else if (normalizedEmail.length > 254 || !emailRegex.hasMatch(normalizedEmail)) {
      fieldErrors['email'] = ['Please enter a valid email address.'];
    } else if (_db.getByEmail(normalizedEmail) != null) {
      fieldErrors['email'] = ['An account with this email already exists. Please sign in instead.'];
    }

    // 3. Server-side Password Strength Validation
    final pwd = request.password;
    if (pwd.isEmpty) {
      fieldErrors['password'] = ['Please enter a password.'];
    } else if (pwd.length < 8) {
      fieldErrors['password'] = ['Password must be at least 8 characters long.'];
    } else if (pwd.length > 128) {
      fieldErrors['password'] = ['Password cannot exceed 128 characters.'];
    } else if (!pwd.contains(RegExp(r'[A-Z]')) ||
        !pwd.contains(RegExp(r'[a-z]')) ||
        !pwd.contains(RegExp(r'[0-9]'))) {
      fieldErrors['password'] = [
        'Password must contain an uppercase letter, a lowercase letter, and a number.',
      ];
    }

    // 4. Server-side Phone Validation (Optional)
    if (request.phoneNumber != null && request.phoneNumber!.trim().isNotEmpty) {
      final cleanPhone = request.phoneNumber!.replaceAll(RegExp(r'[\s-]'), '');
      if (!RegExp(r'^(09|\+639)\d{9}$').hasMatch(cleanPhone)) {
        fieldErrors['phoneNumber'] = ['Please enter a valid mobile number (e.g. 09123456789).'];
      }
    }

    if (fieldErrors.isNotEmpty) {
      final mainMessage = fieldErrors['email']?.first ??
          fieldErrors['password']?.first ??
          fieldErrors['fullName']?.first ??
          'Validation failed. Please check your inputs.';

      return Result.failure(
        ValidationFailure(
          message: mainMessage,
          fieldErrors: fieldErrors,
        ),
      );
    }

    // Rate Limit / Cooldown check: prevent rapid repeated requests
    final existingPending = _pendingRegistrations[normalizedEmail];
    if (existingPending != null && DateTime.now().isBefore(existingPending.cooldownUntil)) {
      final remainingSecs = existingPending.cooldownUntil.difference(DateTime.now()).inSeconds;
      return Result.failure(
        ValidationFailure(
          message: 'Please wait $remainingSecs seconds before requesting a new verification code.',
        ),
      );
    }

    // Generate Cryptographically Secure 6-digit numeric OTP (100000..999999)
    final random = Random.secure();
    final otpNumber = 100000 + random.nextInt(900000);
    final rawOtp = otpNumber.toString();
    final otpHashed = PasswordHasher.hashPassword(rawOtp);

    // Dispatch OTP via Gmail / SMTP Service
    final emailDispatched = await EmailService.instance.sendRegistrationOtpEmail(
      recipientEmail: normalizedEmail,
      recipientName: trimmedName,
      otpCode: rawOtp,
      expiresInMinutes: 5,
    );

    if (!emailDispatched) {
      return const Result.failure(
        NetworkFailure(
          message: "We couldn't send the verification code. Please check your email and try again.",
        ),
      );
    }

    // Store pending registration state (Password hashed with salt, OTP hashed with salt)
    _pendingRegistrations[normalizedEmail] = PendingRegistrationRecord(
      fullName: trimmedName,
      email: normalizedEmail,
      passwordHash: PasswordHasher.hashPassword(request.password),
      phoneNumber: request.phoneNumber?.trim(),
      otpHashed: otpHashed,
      expiresAt: DateTime.now().add(const Duration(minutes: 5)),
      cooldownUntil: DateTime.now().add(const Duration(seconds: 45)),
      testOtp: rawOtp,
    );

    _auditLogger.log(
      action: AuditActionType.loginSuccess,
      actorEmail: normalizedEmail,
      actorRole: 'customer',
      details: 'Customer registration OTP generated and dispatched via Gmail SMTP.',
    );

    return Result.success(
      RequestRegisterOtpResponse(
        email: normalizedEmail,
        maskedEmail: EmailService.maskEmail(normalizedEmail),
        expiresInSeconds: 300,
        resendCooldownSeconds: 45,
        message: 'A 6-digit verification code has been sent to your email.',
      ),
    );
  }

  @override
  Future<Result<VerifyRegisterOtpResponse, AppFailure>> verifyRegisterOtp(VerifyRegisterOtpRequest request) async {
    await Future.delayed(const Duration(milliseconds: 300));

    final normalizedEmail = request.email.trim().toLowerCase();
    final pending = _pendingRegistrations[normalizedEmail];

    if (pending == null) {
      return const Result.failure(
        ValidationFailure(
          message: 'No pending registration found for this email. Please register again.',
        ),
      );
    }

    if (pending.attemptsCount >= 5) {
      pending.otpHashed = '';
      return const Result.failure(
        ValidationFailure(
          message: 'Too many verification attempts. Please request a new code.',
        ),
      );
    }

    if (DateTime.now().isAfter(pending.expiresAt)) {
      return const Result.failure(
        ValidationFailure(
          message: 'This verification code has expired. Please request a new code.',
        ),
      );
    }

    if (pending.otpHashed.isEmpty || !PasswordHasher.verifyPassword(request.otp.trim(), pending.otpHashed)) {
      pending.attemptsCount += 1;
      if (pending.attemptsCount >= 5) {
        pending.otpHashed = '';
        return const Result.failure(
          ValidationFailure(
            message: 'Too many verification attempts. Please request a new code.',
          ),
        );
      }
      return const Result.failure(
        ValidationFailure(
          message: 'The verification code is incorrect.',
          fieldErrors: {
            'otp': ['Invalid verification code.'],
          },
        ),
      );
    }

    // OTP matched! Mark single-use consumed and issue short-lived verification token
    pending.otpHashed = '';
    final random = Random.secure();
    final verificationToken = 'reg_vtok_${random.nextInt(10000000)}_${DateTime.now().millisecondsSinceEpoch}';
    pending.isVerified = true;
    pending.verificationToken = verificationToken;
    pending.tokenExpiresAt = DateTime.now().add(const Duration(minutes: 10));

    _auditLogger.log(
      action: AuditActionType.loginSuccess,
      actorEmail: normalizedEmail,
      actorRole: 'customer',
      details: 'Customer registration OTP verified successfully. Verification token issued.',
    );

    return Result.success(
      VerifyRegisterOtpResponse(
        email: normalizedEmail,
        verificationToken: verificationToken,
        message: 'Email successfully verified.',
      ),
    );
  }

  @override
  Future<Result<RequestRegisterOtpResponse, AppFailure>> resendRegisterOtp(String email) async {
    await Future.delayed(const Duration(milliseconds: 300));

    final normalizedEmail = email.trim().toLowerCase();
    final pending = _pendingRegistrations[normalizedEmail];

    if (pending == null) {
      return const Result.failure(
        ValidationFailure(
          message: 'No pending registration found for this email. Please register again.',
        ),
      );
    }

    if (DateTime.now().isBefore(pending.cooldownUntil)) {
      final remainingSecs = pending.cooldownUntil.difference(DateTime.now()).inSeconds;
      return Result.failure(
        ValidationFailure(
          message: 'Please wait $remainingSecs seconds before requesting a new code.',
        ),
      );
    }

    // Generate new 6-digit cryptographic OTP, invalidating prior code
    final random = Random.secure();
    final otpNumber = 100000 + random.nextInt(900000);
    final rawOtp = otpNumber.toString();

    pending.otpHashed = PasswordHasher.hashPassword(rawOtp);
    pending.attemptsCount = 0;
    pending.expiresAt = DateTime.now().add(const Duration(minutes: 5));
    pending.cooldownUntil = DateTime.now().add(const Duration(seconds: 45));
    pending.isVerified = false;
    pending.verificationToken = null;
    pending.testOtp = rawOtp;

    final emailDispatched = await EmailService.instance.sendRegistrationOtpEmail(
      recipientEmail: normalizedEmail,
      recipientName: pending.fullName,
      otpCode: rawOtp,
      expiresInMinutes: 5,
    );

    if (!emailDispatched) {
      return const Result.failure(
        NetworkFailure(
          message: "We couldn't send a new code. Please try again.",
        ),
      );
    }

    return Result.success(
      RequestRegisterOtpResponse(
        email: normalizedEmail,
        maskedEmail: EmailService.maskEmail(normalizedEmail),
        expiresInSeconds: 300,
        resendCooldownSeconds: 45,
        message: 'A new verification code has been sent to your email.',
      ),
    );
  }

  @override
  Future<Result<AuthResponseModel, AppFailure>> register(RegisterRequest request) async {
    await Future.delayed(const Duration(milliseconds: 400));

    final fieldErrors = <String, List<String>>{};

    // 1. Server-side Full Name Validation
    final trimmedName = request.fullName.trim();
    if (trimmedName.isEmpty) {
      fieldErrors['fullName'] = ['Please enter your full name.'];
    } else if (trimmedName.length < 2 || trimmedName.length > 100) {
      fieldErrors['fullName'] = ['Full name must be between 2 and 100 characters.'];
    } else if (!RegExp(r"^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s'\-\.]+$").hasMatch(trimmedName)) {
      fieldErrors['fullName'] = ['Full name contains invalid characters.'];
    }

    // 2. Server-side Email Validation
    final normalizedEmail = request.email.trim().toLowerCase();
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (normalizedEmail.isEmpty) {
      fieldErrors['email'] = ['Please enter your email address.'];
    } else if (normalizedEmail.length > 254 || !emailRegex.hasMatch(normalizedEmail)) {
      fieldErrors['email'] = ['Please enter a valid email address.'];
    } else if (_db.getByEmail(normalizedEmail) != null) {
      fieldErrors['email'] = ['An account with this email already exists. Please sign in instead.'];
    }

    // 3. Server-side Password Strength Validation
    final pwd = request.password;
    if (pwd.isEmpty) {
      fieldErrors['password'] = ['Please enter a password.'];
    } else if (pwd.length < 8) {
      fieldErrors['password'] = ['Password must be at least 8 characters long.'];
    } else if (pwd.length > 128) {
      fieldErrors['password'] = ['Password cannot exceed 128 characters.'];
    } else if (!pwd.contains(RegExp(r'[A-Z]')) ||
        !pwd.contains(RegExp(r'[a-z]')) ||
        !pwd.contains(RegExp(r'[0-9]'))) {
      fieldErrors['password'] = [
        'Password must contain an uppercase letter, a lowercase letter, and a number.',
      ];
    }

    if (fieldErrors.isNotEmpty) {
      final mainMessage = fieldErrors['email']?.first ??
          fieldErrors['password']?.first ??
          fieldErrors['fullName']?.first ??
          'Validation failed. Please check your inputs.';

      return Result.failure(
        ValidationFailure(
          message: mainMessage,
          fieldErrors: fieldErrors,
        ),
      );
    }

    // 4. API BYPASS PREVENTION: Check valid verification token
    final token = request.verificationToken;
    final pending = _pendingRegistrations[normalizedEmail];

    if (token == null ||
        token.isEmpty ||
        pending == null ||
        !pending.isVerified ||
        pending.verificationToken != token ||
        (pending.tokenExpiresAt != null && DateTime.now().isAfter(pending.tokenExpiresAt!))) {
      return const Result.failure(
        ValidationFailure(
          message: 'Email verification required. Please verify your email with the 6-digit OTP code before creating an account.',
        ),
      );
    }

    // SECURITY ENFORCEMENT: Public customer registration MUST ONLY create Customer roles.
    final newCustomer = UserModel(
      id: 'usr_cust_${DateTime.now().millisecondsSinceEpoch}',
      email: normalizedEmail,
      fullName: trimmedName,
      phoneNumber: request.phoneNumber?.trim() ?? pending.phoneNumber,
      role: UserRole.customer, // FORCED ROLE
      status: UserStatus.active,
      mustChangePassword: false,
      loyaltyPoints: 50,
      createdAt: DateTime.now(),
      lastLoginAt: DateTime.now(),
    );

    _db.saveRecord(UserDatabaseRecord(
      user: newCustomer,
      passwordHash: pending.passwordHash,
    ));
    _db.setCurrentUser(newCustomer);
    _pendingRegistrations.remove(normalizedEmail);

    _auditLogger.log(
      action: AuditActionType.loginSuccess,
      actorEmail: newCustomer.email,
      actorRole: 'customer',
      details: 'Public customer account created and authenticated after OTP email verification.',
    );

    final jwtToken = 'mock_jwt_token_${DateTime.now().millisecondsSinceEpoch}';
    final refreshToken = 'lambac_refresh_token_${DateTime.now().millisecondsSinceEpoch}';

    return Result.success(
      AuthResponseModel(
        accessToken: jwtToken,
        refreshToken: refreshToken,
        user: newCustomer,
      ),
    );
  }

  @override
  Future<Result<void, AppFailure>> logout() async {
    await Future.delayed(const Duration(milliseconds: 200));
    final current = _db.currentUser;
    if (current != null) {
      _auditLogger.log(
        action: AuditActionType.logout,
        actorEmail: current.email,
        actorRole: current.role.name,
        details: 'User initiated session termination.',
      );
    }
    _db.setCurrentUser(null);
    return const Result.success(null);
  }

  @override
  Future<Result<String, AppFailure>> refreshToken(String refreshToken) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return Result.success('lambac_refreshed_jwt_${DateTime.now().millisecondsSinceEpoch}');
  }

  @override
  Future<Result<void, AppFailure>> forgotPassword(ForgotPasswordRequest request) async {
    await Future.delayed(const Duration(milliseconds: 400));
    final normalized = request.email.trim().toLowerCase();

    final now = DateTime.now();
    final cooldown = _passwordResetCooldowns[normalized];
    if (cooldown != null && now.isBefore(cooldown)) {
      final remainingSecs = cooldown.difference(now).inSeconds + 1;
      return Result.failure(
        RateLimitFailure(
          message: 'Password reset request limit reached. Please wait $remainingSecs seconds before trying again.',
        ),
      );
    }
    _passwordResetCooldowns[normalized] = now.add(const Duration(seconds: 60));

    final record = _db.getByEmail(normalized);
    if (record == null) {
      if (emailEnumerationProtection) {
        return const Result.success(null);
      }
      return const Result.failure(
        NotFoundFailure(
          message: 'No account registered with this email address.',
        ),
      );
    }

    _passwordResetFailedAttempts[normalized] = 0;

    _auditLogger.log(
      action: AuditActionType.passwordResetRequested,
      actorEmail: normalized,
      actorRole: record.user.role.name,
      details: 'Customer initiated forgot password verification link.',
    );

    return const Result.success(null);
  }

  @override
  Future<Result<void, AppFailure>> resetPassword(ResetPasswordRequest request) async {
    await Future.delayed(const Duration(milliseconds: 500));
    final normalized = request.email.trim().toLowerCase();
    final record = _db.getByEmail(normalized);

    if (record == null) {
      return const Result.failure(NotFoundFailure(message: 'Account not found.'));
    }

    final failedAttempts = _passwordResetFailedAttempts[normalized] ?? 0;
    if (failedAttempts >= 5) {
      return const Result.failure(
        RateLimitFailure(
          message: 'Maximum password reset verification attempts exceeded. Please request a new reset code.',
        ),
      );
    }

    if (request.resetToken.trim() != '123456' && request.resetToken.trim() != '888888') {
      _passwordResetFailedAttempts[normalized] = failedAttempts + 1;
      final remaining = 5 - (failedAttempts + 1);
      return Result.failure(
        ValidationFailure(
          message: 'Invalid or expired verification code.',
          fieldErrors: {
            'token': [
              'Code is incorrect. $remaining attempts remaining.',
            ],
          },
        ),
      );
    }

    final password = request.newPassword;
    if (password.length < 8 ||
        !password.contains(RegExp(r'[A-Z]')) ||
        !password.contains(RegExp(r'[a-z]')) ||
        !password.contains(RegExp(r'[0-9]'))) {
      return const Result.failure(
        ValidationFailure(
          message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.',
        ),
      );
    }

    _passwordResetFailedAttempts.remove(normalized);
    _passwordResetCooldowns.remove(normalized);

    record.passwordHash = PasswordHasher.hashPassword(request.newPassword);
    record.user = record.user.copyWith(mustChangePassword: false);
    _db.saveRecord(record);

    _auditLogger.log(
      action: AuditActionType.passwordResetRequested,
      actorEmail: normalized,
      actorRole: record.user.role.name,
      details: 'Password successfully reset via verification code.',
    );

    return const Result.success(null);
  }

  @override
  Future<Result<UserModel, AppFailure>> completeFirstLoginPassword(FirstLoginPasswordRequest request) async {
    await Future.delayed(const Duration(milliseconds: 400));

    final current = _db.currentUser;
    if (current == null) {
      return const Result.failure(UnauthorizedFailure(message: 'Session not authenticated.'));
    }

    final record = _db.getByEmail(current.email);
    if (record == null) {
      return const Result.failure(NotFoundFailure(message: 'User record not found.'));
    }

    if (request.newPassword.length < 8) {
      return const Result.failure(
        ValidationFailure(message: 'Password must be at least 8 characters long.'),
      );
    }

    record.passwordHash = PasswordHasher.hashPassword(request.newPassword);
    final updatedUser = record.user.copyWith(mustChangePassword: false);
    record.user = updatedUser;
    _db.saveRecord(record);
    _db.setCurrentUser(updatedUser);

    _auditLogger.log(
      action: AuditActionType.firstLoginPasswordChanged,
      actorEmail: updatedUser.email,
      actorRole: updatedUser.role.name,
      details: 'First-login mandatory password setup completed successfully.',
    );

    return Result.success(updatedUser);
  }

  @override
  Future<Result<UserModel, AppFailure>> acceptTerms({required String version}) async {
    final current = _db.currentUser;
    if (current == null) {
      return const Result.failure(UnauthorizedFailure(message: 'No active session.'));
    }

    final record = _db.getByEmail(current.email);
    if (record == null) {
      return const Result.failure(NotFoundFailure(message: 'User record not found.'));
    }

    final updated = record.user.copyWith(
      termsAccepted: true,
      acceptedTermsVersion: version,
      termsAcceptedAt: DateTime.now(),
    );

    record.user = updated;
    _db.saveRecord(record);
    _db.setCurrentUser(updated);

    return Result.success(updated);
  }

  @override
  Future<Result<UserModel, AppFailure>> getProfile() async {
    final current = _db.currentUser;
    if (current == null) {
      return const Result.failure(UnauthorizedFailure(message: 'No active session.'));
    }
    await Future.delayed(const Duration(milliseconds: 200));
    final record = _db.getByEmail(current.email);
    if (record == null) {
      _db.setCurrentUser(null);
      return const Result.failure(NotFoundFailure(message: 'User profile not found in database.'));
    }
    if (record.user.status == UserStatus.disabled) {
      _db.setCurrentUser(null);
      return const Result.failure(
        UnauthorizedFailure(
          message: 'This account has been disabled. Please contact your system administrator.',
        ),
      );
    }
    return Result.success(record.user);
  }

  @override
  Future<Result<UserModel, AppFailure>> updateProfile(UpdateProfileRequest request) async {
    await Future.delayed(const Duration(milliseconds: 400));
    final current = _db.currentUser;
    if (current == null) {
      return const Result.failure(UnauthorizedFailure(message: 'No active session.'));
    }

    final record = _db.getByEmail(current.email);
    if (record == null) {
      return const Result.failure(NotFoundFailure(message: 'User record not found.'));
    }

    final updated = record.user.copyWith(
      fullName: request.fullName ?? record.user.fullName,
      phoneNumber: request.phoneNumber ?? record.user.phoneNumber,
      avatarUrl: request.avatarUrl ?? record.user.avatarUrl,
    );

    record.user = updated;
    _db.saveRecord(record);
    _db.setCurrentUser(updated);

    return Result.success(updated);
  }

  @override
  Future<Result<void, AppFailure>> changePassword(ChangePasswordRequest request) async {
    await Future.delayed(const Duration(milliseconds: 400));
    final current = _db.currentUser;
    if (current == null) {
      return const Result.failure(UnauthorizedFailure(message: 'No active session.'));
    }

    final record = _db.getByEmail(current.email);
    if (record == null || !PasswordHasher.verifyPassword(request.currentPassword, record.passwordHash)) {
      return const Result.failure(
        ValidationFailure(
          message: 'Current password does not match our records.',
          fieldErrors: {'current_password': ['Incorrect password.']},
        ),
      );
    }

    record.passwordHash = PasswordHasher.hashPassword(request.newPassword);
    record.user = record.user.copyWith(mustChangePassword: false);
    _db.saveRecord(record);

    _auditLogger.log(
      action: AuditActionType.roleChanged,
      actorEmail: current.email,
      actorRole: current.role.name,
      details: 'User changed account password.',
    );

    return const Result.success(null);
  }

  @override
  Future<Result<void, AppFailure>> deleteAccount() async {
    await Future.delayed(const Duration(milliseconds: 400));
    final current = _db.currentUser;
    if (current != null) {
      _db.removeByEmail(current.email);
      _db.setCurrentUser(null);
    }
    return const Result.success(null);
  }
}
