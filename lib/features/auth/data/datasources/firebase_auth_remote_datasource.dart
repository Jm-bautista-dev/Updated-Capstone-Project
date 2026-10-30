import 'dart:async';
import 'dart:math';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
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

/// Temporary pending registration record during customer OTP verification
class _PendingFirebaseRegistration {
  final String fullName;
  final String email;
  final String? phoneNumber;
  String otpHashed;
  DateTime expiresAt;
  DateTime cooldownUntil;
  int attemptsCount = 0;
  bool isVerified = false;
  String? verificationToken;
  DateTime? tokenExpiresAt;
  String? testOtp;

  _PendingFirebaseRegistration({
    required this.fullName,
    required this.email,
    this.phoneNumber,
    required this.otpHashed,
    required this.expiresAt,
    required this.cooldownUntil,
    this.testOtp,
  });
}

/// Production Firebase Authentication and Cloud Firestore Data Source
class FirebaseAuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;
  final AuditLogger _auditLogger;

  static final Map<String, _PendingFirebaseRegistration> _pendingRegistrations = {};

  FirebaseAuthRemoteDataSourceImpl({
    FirebaseAuth? auth,
    FirebaseFirestore? firestore,
    AuditLogger? auditLogger,
  })  : _auth = auth ?? FirebaseAuth.instance,
        _firestore = firestore ?? FirebaseFirestore.instance,
        _auditLogger = auditLogger ?? AuditLogger();

  static final Map<String, _PendingFirebaseRegistration> _pendingLoginOtps = {};

  @override
  Future<Result<RequestLoginOtpResponse, AppFailure>> requestLoginOtp(RequestLoginOtpRequest request) async {
    final normalizedEmail = request.email.trim().toLowerCase();

    try {
      // 1. Verify credentials with Firebase Auth
      final userCredential = await _auth.signInWithEmailAndPassword(
        email: normalizedEmail,
        password: request.password.trim(),
      );

      final firebaseUser = userCredential.user;
      if (firebaseUser == null) {
        return const Result.failure(
          UnauthorizedFailure(
            message: 'Invalid email or password. Please verify your credentials.',
          ),
        );
      }

      // Check operational status
      final userDoc = await _firestore.collection('users').doc(firebaseUser.uid).get();
      final userData = userDoc.data() ?? {};
      if (userData['status'] == 'disabled' || userData['isActive'] == false) {
        await _auth.signOut();
        return const Result.failure(
          UnauthorizedFailure(
            message: 'This account has been disabled. Please contact your system administrator.',
          ),
        );
      }

      final fullName = userData['full_name'] as String? ??
          userData['displayName'] as String? ??
          firebaseUser.displayName ??
          'Coffee Enthusiast';

      // Temporarily sign out so session is not established until OTP is verified
      await _auth.signOut();

      // 2. Cooldown check
      final existingPending = _pendingLoginOtps[normalizedEmail];
      if (existingPending != null && DateTime.now().isBefore(existingPending.cooldownUntil)) {
        final remainingSecs = existingPending.cooldownUntil.difference(DateTime.now()).inSeconds;
        return Result.failure(
          ValidationFailure(
            message: 'Please wait $remainingSecs seconds before requesting a new sign-in code.',
          ),
        );
      }

      // 3. Generate 6-digit OTP
      final random = Random.secure();
      final otpNumber = 100000 + random.nextInt(900000);
      final rawOtp = otpNumber.toString();
      final otpHashed = PasswordHasher.hashPassword(rawOtp);

      await EmailService.instance.sendLoginOtpEmail(
        recipientEmail: normalizedEmail,
        recipientName: fullName,
        otpCode: rawOtp,
        expiresInMinutes: 5,
      );

      _pendingLoginOtps[normalizedEmail] = _PendingFirebaseRegistration(
        fullName: fullName,
        email: normalizedEmail,
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
          debugOtp: kDebugMode ? rawOtp : null,
        ),
      );
    } on FirebaseAuthException catch (e) {
      _auditLogger.log(
        action: AuditActionType.loginFailure,
        actorEmail: normalizedEmail,
        actorRole: 'unknown',
        isSuccess: false,
        details: 'Firebase Auth failure during login OTP request: ${e.code}',
      );
      return Result.failure(_mapFirebaseAuthException(e));
    } catch (e) {
      return Result.failure(AppFailure.unexpected(message: e.toString()));
    }
  }

  @override
  Future<Result<AuthResponseModel, AppFailure>> verifyLoginOtp(VerifyLoginOtpRequest request) async {
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

    // OTP verified! Clear record
    _pendingLoginOtps.remove(normalizedEmail);

    // Complete login
    return login(LoginRequest(email: normalizedEmail, password: request.password));
  }

  @override
  Future<Result<RequestLoginOtpResponse, AppFailure>> resendLoginOtp({
    required String email,
    required String password,
  }) async {
    return requestLoginOtp(RequestLoginOtpRequest(email: email, password: password));
  }

  // ---------------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------------
  @override
  Future<Result<AuthResponseModel, AppFailure>> login(LoginRequest request) async {
    final normalizedEmail = request.email.trim().toLowerCase();

    try {
      final userCredential = await _auth.signInWithEmailAndPassword(
        email: normalizedEmail,
        password: request.password.trim(),
      );

      final firebaseUser = userCredential.user;
      if (firebaseUser == null) {
        return const Result.failure(
          UnauthorizedFailure(
            message: 'Authentication failed. Please verify your credentials.',
          ),
        );
      }

      final uid = firebaseUser.uid;
      final userDocRef = _firestore.collection('users').doc(uid);
      final docSnapshot = await userDocRef.get();

      Map<String, dynamic> userData;

      if (!docSnapshot.exists) {
        // Check if an existing profile exists under a different ID (e.g., legacy or pre-provisioned)
        final querySnap = await _firestore
            .collection('users')
            .where('email', isEqualTo: normalizedEmail)
            .limit(1)
            .get();

        if (querySnap.docs.isNotEmpty) {
          final existingDoc = querySnap.docs.first;
          userData = Map<String, dynamic>.from(existingDoc.data());
          userData['uid'] = uid;
          userData['id'] = uid;
          await userDocRef.set(userData, SetOptions(merge: true));
          if (existingDoc.id != uid) {
            await existingDoc.reference.delete().catchError((_) {});
          }
        } else {
          // Check for bootstrap administrator
          final isKnownAdmin = normalizedEmail == 'jmbautista0228@gmail.com' ||
              normalizedEmail == 'jmbautistaa0428@gmail.com';
          if (isKnownAdmin) {
            userData = {
              'uid': uid,
              'id': uid,
              'email': normalizedEmail,
              'full_name': 'Lead Roastery Administrator',
              'displayName': 'Lead Roastery Administrator',
              'role': 'admin',
              'status': 'active',
              'isActive': true,
              'mustChangePassword': false,
              'must_change_password': false,
              'permissions': [
                'manageOrders',
                'manageProducts',
                'recordSales',
                'manageInbox',
                'viewBasicMetrics'
              ],
              'loyaltyPoints': 1000,
              'createdAt': FieldValue.serverTimestamp(),
              'created_at': DateTime.now().toIso8601String(),
              'lastLoginAt': FieldValue.serverTimestamp(),
              'last_login_at': DateTime.now().toIso8601String(),
            };
            await userDocRef.set(userData);
          } else {
            // Strict role safety: never silently default missing profiles to customer
            await _auth.signOut();
            _auditLogger.log(
              action: AuditActionType.loginFailure,
              actorEmail: normalizedEmail,
              actorRole: 'unknown',
              isSuccess: false,
              details: 'Authentication rejected: Profile record not found in Firestore.',
            );
            return const Result.failure(
              UnauthorizedFailure(
                message: 'Your account profile could not be found. Please contact administration.',
              ),
            );
          }
        }
      } else {
        userData = docSnapshot.data() ?? {};
      }

      // Explicit role verification: reject accounts without a canonical role
      final rawRole = userData['role']?.toString();
      final parsedRole = UserRole.tryParse(rawRole);
      if (parsedRole == null) {
        await _auth.signOut();
        _auditLogger.log(
          action: AuditActionType.loginFailure,
          actorEmail: normalizedEmail,
          actorRole: rawRole ?? 'missing',
          isSuccess: false,
          details: 'Authentication rejected: Invalid or unassigned role in Firestore ($rawRole).',
        );
        return const Result.failure(
          UnauthorizedFailure(
            message: 'Your account has not been assigned a valid role. Please contact system administration.',
          ),
        );
      }

      // Check account active status
      final status = UserStatus.fromString(userData['status']?.toString());
      final isExplicitlyDisabled = userData['isActive'] == false ||
          userData['isActive'] == 'false' ||
          userData['is_active'] == false ||
          userData['is_active'] == 'false' ||
          status == UserStatus.disabled;

      if (isExplicitlyDisabled) {
        await _auth.signOut();
        _auditLogger.log(
          action: AuditActionType.loginFailure,
          actorEmail: normalizedEmail,
          actorRole: userData['role']?.toString() ?? 'unknown',
          isSuccess: false,
          details: 'Authentication rejected: Account has been disabled in Firestore.',
        );
        return const Result.failure(
          UnauthorizedFailure(
            message: 'This account has been disabled. Please contact your system administrator.',
          ),
        );
      }

      // Update last login timestamp in Firestore
      await userDocRef.update({
        'lastLoginAt': FieldValue.serverTimestamp(),
        'last_login_at': DateTime.now().toIso8601String(),
      }).catchError((_) {});

      final user = UserModel.fromJson({
        ...userData,
        'id': uid,
        'email': userData['email'] ?? firebaseUser.email ?? normalizedEmail,
        'full_name': userData['full_name'] ??
            userData['displayName'] ??
            userData['fullName'] ??
            firebaseUser.displayName ??
            'Coffee Enthusiast',
      });

      _auditLogger.log(
        action: AuditActionType.loginSuccess,
        actorEmail: user.email,
        actorRole: user.role.name,
        isSuccess: true,
        details: 'Firebase Authentication successful. Role: ${user.role.name}',
      );

      final idToken = await firebaseUser.getIdToken() ?? 'fb_id_token_$uid';

      return Result.success(
        AuthResponseModel(
          accessToken: idToken,
          refreshToken: firebaseUser.refreshToken,
          user: user,
        ),
      );
    } on FirebaseAuthException catch (e) {
      _auditLogger.log(
        action: AuditActionType.loginFailure,
        actorEmail: normalizedEmail,
        actorRole: 'unknown',
        isSuccess: false,
        details: 'Firebase Auth failure: ${e.code}',
      );
      return Result.failure(_mapFirebaseAuthException(e));
    } on FirebaseException catch (e) {
      return Result.failure(_mapFirebaseException(e));
    } catch (e) {
      return Result.failure(AppFailure.unexpected(message: e.toString()));
    }
  }

  // ---------------------------------------------------------------------------
  // REGISTRATION & OTP VERIFICATION
  // ---------------------------------------------------------------------------
  @override
  Future<Result<RequestRegisterOtpResponse, AppFailure>> requestRegisterOtp(
      RequestRegisterOtpRequest request) async {
    final trimmedName = request.fullName.trim();
    final normalizedEmail = request.email.trim().toLowerCase();

    // Client/Server-side input validation
    final fieldErrors = <String, List<String>>{};
    if (trimmedName.isEmpty) {
      fieldErrors['fullName'] = ['Please enter your full name.'];
    } else if (trimmedName.length < 2 || trimmedName.length > 100) {
      fieldErrors['fullName'] = ['Full name must be between 2 and 100 characters.'];
    }

    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (normalizedEmail.isEmpty) {
      fieldErrors['email'] = ['Please enter your email address.'];
    } else if (!emailRegex.hasMatch(normalizedEmail)) {
      fieldErrors['email'] = ['Please enter a valid email address.'];
    }

    final pwd = request.password;
    if (pwd.length < 8) {
      fieldErrors['password'] = ['Password must be at least 8 characters long.'];
    } else if (!pwd.contains(RegExp(r'[A-Z]')) ||
        !pwd.contains(RegExp(r'[a-z]')) ||
        !pwd.contains(RegExp(r'[0-9]'))) {
      fieldErrors['password'] = [
        'Password must contain an uppercase letter, a lowercase letter, and a number.',
      ];
    }

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

    // Cooldown check: prevent rapid repeated OTP requests
    final existingPending = _pendingRegistrations[normalizedEmail];
    if (existingPending != null && DateTime.now().isBefore(existingPending.cooldownUntil)) {
      final remainingSecs = existingPending.cooldownUntil.difference(DateTime.now()).inSeconds;
      return Result.failure(
        ValidationFailure(
          message: 'Please wait $remainingSecs seconds before requesting a new verification code.',
        ),
      );
    }

    // Generate 6-digit numeric OTP
    final random = Random.secure();
    final otpNumber = 100000 + random.nextInt(900000);
    final rawOtp = otpNumber.toString();
    final otpHashed = PasswordHasher.hashPassword(rawOtp);

    // Dispatch verification OTP via EmailService
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

    _pendingRegistrations[normalizedEmail] = _PendingFirebaseRegistration(
      fullName: trimmedName,
      email: normalizedEmail,
      phoneNumber: request.phoneNumber?.trim(),
      otpHashed: otpHashed,
      expiresAt: DateTime.now().add(const Duration(minutes: 5)),
      cooldownUntil: DateTime.now().add(const Duration(seconds: 45)),
      testOtp: rawOtp,
    );

    return Result.success(
      RequestRegisterOtpResponse(
        email: normalizedEmail,
        maskedEmail: EmailService.maskEmail(normalizedEmail),
        expiresInSeconds: 300,
        resendCooldownSeconds: 45,
        message: 'A 6-digit verification code has been sent to your email.',
        debugOtp: kDebugMode ? rawOtp : null,
      ),
    );
  }

  @override
  Future<Result<VerifyRegisterOtpResponse, AppFailure>> verifyRegisterOtp(
      VerifyRegisterOtpRequest request) async {
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
      return const Result.failure(
        ValidationFailure(
          message: 'The verification code is incorrect.',
          fieldErrors: {
            'otp': ['Invalid verification code.'],
          },
        ),
      );
    }

    // Single-use token issued
    pending.otpHashed = '';
    final random = Random.secure();
    final verificationToken = 'fb_reg_vtok_${random.nextInt(10000000)}_${DateTime.now().millisecondsSinceEpoch}';
    pending.isVerified = true;
    pending.verificationToken = verificationToken;
    pending.tokenExpiresAt = DateTime.now().add(const Duration(minutes: 10));

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
        debugOtp: rawOtp,
      ),
    );
  }

  @override
  Future<Result<AuthResponseModel, AppFailure>> register(RegisterRequest request) async {
    final normalizedEmail = request.email.trim().toLowerCase();
    final trimmedName = request.fullName.trim();

    try {
      // 1. Create user account in Firebase Authentication
      final userCredential = await _auth.createUserWithEmailAndPassword(
        email: normalizedEmail,
        password: request.password,
      );

      final firebaseUser = userCredential.user;
      if (firebaseUser == null) {
        return const Result.failure(
          UnauthorizedFailure(message: 'Failed to create user in Firebase Authentication.'),
        );
      }

      final uid = firebaseUser.uid;

      // 2. Update Firebase Auth displayName
      if (trimmedName.isNotEmpty) {
        await firebaseUser.updateDisplayName(trimmedName).catchError((_) {});
      }

      // 3. Create authoritative user profile in Cloud Firestore: users/{uid}
      // Strict role enforcement: default registration always creates 'customer'
      final userDocRef = _firestore.collection('users').doc(uid);
      final initialUserData = <String, dynamic>{
        'uid': uid,
        'id': uid,
        'email': normalizedEmail,
        'full_name': trimmedName,
        'displayName': trimmedName,
        'fullName': trimmedName,
        'phoneNumber': request.phoneNumber?.trim(),
        'phone_number': request.phoneNumber?.trim(),
        'role': 'customer', // AUTHORITATIVE DEFAULT ROLE
        'status': 'active',
        'isActive': true,
        'mustChangePassword': false,
        'must_change_password': false,
        'permissions': <String>[],
        'loyaltyPoints': 50,
        'loyalty_points': 50,
        'createdAt': FieldValue.serverTimestamp(),
        'created_at': DateTime.now().toIso8601String(),
        'updatedAt': FieldValue.serverTimestamp(),
        'lastLoginAt': FieldValue.serverTimestamp(),
        'last_login_at': DateTime.now().toIso8601String(),
      };

      await userDocRef.set(initialUserData);

      _pendingRegistrations.remove(normalizedEmail);

      final user = UserModel(
        id: uid,
        email: normalizedEmail,
        fullName: trimmedName,
        phoneNumber: request.phoneNumber?.trim(),
        role: UserRole.customer,
        status: UserStatus.active,
        mustChangePassword: false,
        permissions: const [],
        loyaltyPoints: 50,
        createdAt: DateTime.now(),
        lastLoginAt: DateTime.now(),
      );

      _auditLogger.log(
        action: AuditActionType.loginSuccess,
        actorEmail: normalizedEmail,
        actorRole: 'customer',
        details: 'Firebase customer account registered and Firestore profile created.',
      );

      final idToken = await firebaseUser.getIdToken() ?? 'fb_id_token_$uid';

      return Result.success(
        AuthResponseModel(
          accessToken: idToken,
          refreshToken: firebaseUser.refreshToken,
          user: user,
        ),
      );
    } on FirebaseAuthException catch (e) {
      _auditLogger.log(
        action: AuditActionType.loginFailure,
        actorEmail: normalizedEmail,
        actorRole: 'customer',
        isSuccess: false,
        details: 'Firebase registration error: ${e.code}',
      );
      return Result.failure(_mapFirebaseAuthException(e));
    } on FirebaseException catch (e) {
      return Result.failure(_mapFirebaseException(e));
    } catch (e) {
      return Result.failure(AppFailure.unexpected(message: e.toString()));
    }
  }

  // ---------------------------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------------------------
  @override
  Future<Result<void, AppFailure>> logout() async {
    try {
      await _auth.signOut();
      return const Result.success(null);
    } catch (e) {
      return Result.failure(AppFailure.unexpected(message: e.toString()));
    }
  }

  // ---------------------------------------------------------------------------
  // PROFILE MANAGEMENT
  // ---------------------------------------------------------------------------
  @override
  Future<Result<UserModel, AppFailure>> getProfile() async {
    try {
      final currentUser = _auth.currentUser;
      if (currentUser == null) {
        return const Result.failure(
          UnauthorizedFailure(message: 'No authenticated Firebase session.'),
        );
      }

      final uid = currentUser.uid;
      final docSnapshot = await _firestore.collection('users').doc(uid).get();

      Map<String, dynamic> data;

      if (!docSnapshot.exists) {
        // Attempt recovery if profile was saved under legacy or alternate ID
        final email = currentUser.email?.trim().toLowerCase();
        if (email != null && email.isNotEmpty) {
          final querySnap = await _firestore
              .collection('users')
              .where('email', isEqualTo: email)
              .limit(1)
              .get();

          if (querySnap.docs.isNotEmpty) {
            final oldDoc = querySnap.docs.first;
            data = Map<String, dynamic>.from(oldDoc.data());
            data['uid'] = uid;
            data['id'] = uid;
            await _firestore.collection('users').doc(uid).set(data, SetOptions(merge: true));
            if (oldDoc.id != uid) {
              await oldDoc.reference.delete().catchError((_) {});
            }
          } else {
            return const Result.failure(
              NotFoundFailure(message: 'User profile not found in Firestore.'),
            );
          }
        } else {
          return const Result.failure(
            NotFoundFailure(message: 'User profile not found in Firestore.'),
          );
        }
      } else {
        data = docSnapshot.data() ?? {};
      }

      // Explicit role verification
      final rawRole = data['role']?.toString();
      final parsedRole = UserRole.tryParse(rawRole);
      if (parsedRole == null) {
        await _auth.signOut();
        return const Result.failure(
          UnauthorizedFailure(
            message: 'Your account has not been assigned a valid role. Please contact system administration.',
          ),
        );
      }

      final status = UserStatus.fromString(data['status']?.toString());
      final isActive = data['isActive'] != false && status != UserStatus.disabled;

      if (!isActive) {
        await _auth.signOut();
        return const Result.failure(
          UnauthorizedFailure(
            message: 'This account has been disabled. Please contact your system administrator.',
          ),
        );
      }

      final user = UserModel.fromJson({
        ...data,
        'id': uid,
        'email': data['email'] ?? currentUser.email ?? '',
        'full_name': data['full_name'] ??
            data['displayName'] ??
            data['fullName'] ??
            currentUser.displayName ??
            'Coffee Enthusiast',
      });

      return Result.success(user);
    } on FirebaseException catch (e) {
      return Result.failure(_mapFirebaseException(e));
    } catch (e) {
      return Result.failure(AppFailure.unexpected(message: e.toString()));
    }
  }

  @override
  Future<Result<UserModel, AppFailure>> updateProfile(UpdateProfileRequest request) async {
    try {
      final currentUser = _auth.currentUser;
      if (currentUser == null) {
        return const Result.failure(
          UnauthorizedFailure(message: 'Not authenticated in Firebase.'),
        );
      }

      final uid = currentUser.uid;
      final updates = <String, dynamic>{
        'updatedAt': FieldValue.serverTimestamp(),
      };

      if (request.fullName != null && request.fullName!.trim().isNotEmpty) {
        final name = request.fullName!.trim();
        updates['full_name'] = name;
        updates['displayName'] = name;
        updates['fullName'] = name;
        await currentUser.updateDisplayName(name).catchError((_) {});
      }

      if (request.phoneNumber != null) {
        final phone = request.phoneNumber!.trim();
        updates['phone_number'] = phone;
        updates['phoneNumber'] = phone;
      }

      if (request.avatarUrl != null) {
        final avatar = request.avatarUrl!.trim();
        updates['avatar_url'] = avatar;
        updates['avatarUrl'] = avatar;
        await currentUser.updatePhotoURL(avatar).catchError((_) {});
      }

      // Security: Strictly enforce that 'role', 'status', 'permissions', and 'uid' CANNOT be altered
      await _firestore.collection('users').doc(uid).update(updates);

      return await getProfile();
    } on FirebaseException catch (e) {
      return Result.failure(_mapFirebaseException(e));
    } catch (e) {
      return Result.failure(AppFailure.unexpected(message: e.toString()));
    }
  }

  // ---------------------------------------------------------------------------
  // PASSWORD MANAGEMENT & RECOVERY
  // ---------------------------------------------------------------------------
  @override
  Future<Result<void, AppFailure>> changePassword(ChangePasswordRequest request) async {
    try {
      final currentUser = _auth.currentUser;
      if (currentUser == null || currentUser.email == null) {
        return const Result.failure(
          UnauthorizedFailure(message: 'Not authenticated.'),
        );
      }

      // Re-authenticate before changing password
      final cred = EmailAuthProvider.credential(
        email: currentUser.email!,
        password: request.currentPassword,
      );

      await currentUser.reauthenticateWithCredential(cred);
      await currentUser.updatePassword(request.newPassword);

      return const Result.success(null);
    } on FirebaseAuthException catch (e) {
      return Result.failure(_mapFirebaseAuthException(e));
    } catch (e) {
      return Result.failure(AppFailure.unexpected(message: e.toString()));
    }
  }

  static final Map<String, DateTime> _passwordResetCooldowns = {};

  @override
  Future<Result<void, AppFailure>> forgotPassword(ForgotPasswordRequest request) async {
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

    try {
      await _auth.sendPasswordResetEmail(email: normalized);
      return const Result.success(null);
    } on FirebaseAuthException catch (e) {
      if (e.code == 'user-not-found') {
        // Obfuscate to prevent account enumeration
        return const Result.success(null);
      }
      return Result.failure(_mapFirebaseAuthException(e));
    } catch (e) {
      return Result.failure(AppFailure.unexpected(message: e.toString()));
    }
  }

  @override
  Future<Result<void, AppFailure>> resetPassword(ResetPasswordRequest request) async {
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

    try {
      await _auth.confirmPasswordReset(
        code: request.resetToken,
        newPassword: request.newPassword,
      );
      return const Result.success(null);
    } on FirebaseAuthException catch (e) {
      return Result.failure(_mapFirebaseAuthException(e));
    } catch (e) {
      return Result.failure(AppFailure.unexpected(message: e.toString()));
    }
  }

  @override
  Future<Result<UserModel, AppFailure>> completeFirstLoginPassword(
      FirstLoginPasswordRequest request) async {
    try {
      final currentUser = _auth.currentUser;
      if (currentUser == null) {
        return const Result.failure(
          UnauthorizedFailure(message: 'Not authenticated.'),
        );
      }

      await currentUser.updatePassword(request.newPassword);
      await _firestore.collection('users').doc(currentUser.uid).update({
        'mustChangePassword': false,
        'must_change_password': false,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      return await getProfile();
    } on FirebaseAuthException catch (e) {
      return Result.failure(_mapFirebaseAuthException(e));
    } catch (e) {
      return Result.failure(AppFailure.unexpected(message: e.toString()));
    }
  }

  @override
  Future<Result<UserModel, AppFailure>> acceptTerms({required String version}) async {
    try {
      final currentUser = _auth.currentUser;
      if (currentUser == null) {
        return const Result.failure(
          UnauthorizedFailure(message: 'Not authenticated in Firebase.'),
        );
      }

      final uid = currentUser.uid;
      await _firestore.collection('users').doc(uid).update({
        'terms_accepted': true,
        'termsAccepted': true,
        'accepted_terms_version': version,
        'acceptedTermsVersion': version,
        'terms_accepted_at': FieldValue.serverTimestamp(),
        'termsAcceptedAt': FieldValue.serverTimestamp(),
        'acceptance_updated_at': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      _auditLogger.log(
        action: AuditActionType.loginSuccess,
        actorEmail: currentUser.email ?? '',
        actorRole: 'user',
        details: 'Terms & Conditions version $version explicitly accepted by $uid.',
      );

      return await getProfile();
    } on FirebaseException catch (e) {
      return Result.failure(_mapFirebaseException(e));
    } catch (e) {
      return Result.failure(AppFailure.unexpected(message: e.toString()));
    }
  }

  @override
  Future<Result<void, AppFailure>> deleteAccount() async {
    try {
      final currentUser = _auth.currentUser;
      if (currentUser == null) {
        return const Result.failure(
          UnauthorizedFailure(message: 'Not authenticated.'),
        );
      }

      final uid = currentUser.uid;
      await _firestore.collection('users').doc(uid).delete().catchError((_) {});
      await currentUser.delete();

      return const Result.success(null);
    } on FirebaseAuthException catch (e) {
      return Result.failure(_mapFirebaseAuthException(e));
    } catch (e) {
      return Result.failure(AppFailure.unexpected(message: e.toString()));
    }
  }

  @override
  Future<Result<String, AppFailure>> refreshToken(String refreshToken) async {
    try {
      final currentUser = _auth.currentUser;
      if (currentUser != null) {
        final token = await currentUser.getIdToken(true);
        if (token != null) return Result.success(token);
      }
      return Result.success(refreshToken);
    } catch (e) {
      return Result.success(refreshToken);
    }
  }

  // ---------------------------------------------------------------------------
  // ERROR MAPPING
  // ---------------------------------------------------------------------------
  AppFailure _mapFirebaseAuthException(FirebaseAuthException e) {
    switch (e.code) {
      case 'invalid-email':
        return const ValidationFailure(
          message: 'The email address is improperly formatted.',
          fieldErrors: {
            'email': ['Please enter a valid email address.']
          },
        );
      case 'user-disabled':
        return const UnauthorizedFailure(
          message: 'This account has been disabled. Please contact your system administrator.',
        );
      case 'user-not-found':
      case 'wrong-password':
      case 'invalid-credential':
        return const UnauthorizedFailure(
          message: 'Invalid email or password. Please verify your credentials.',
        );
      case 'email-already-in-use':
        return const ValidationFailure(
          message: 'An account with this email already exists. Please sign in instead.',
          fieldErrors: {
            'email': ['An account with this email already exists.']
          },
        );
      case 'weak-password':
        return const ValidationFailure(
          message: 'Password is too weak. Please use at least 8 characters with letters and numbers.',
          fieldErrors: {
            'password': ['Password is too weak.']
          },
        );
      case 'network-request-failed':
        return const NetworkFailure(
          message: 'Unable to connect to the authentication service. Please check your internet connection.',
        );
      case 'too-many-requests':
        return const RateLimitFailure(
          message: 'Too many attempts. Please wait a few moments and try again.',
        );
      case 'requires-recent-login':
        return const UnauthorizedFailure(
          message: 'For your security, please sign in again before performing this action.',
        );
      default:
        return UnauthorizedFailure(
          message: e.message ?? 'Authentication error occurred. Please try again.',
        );
    }
  }

  AppFailure _mapFirebaseException(FirebaseException e) {
    switch (e.code) {
      case 'permission-denied':
        return const ForbiddenFailure(
          message: 'You do not have permission to perform this action.',
        );
      case 'not-found':
        return const NotFoundFailure(
          message: 'Requested document was not found.',
        );
      case 'unavailable':
        return const NetworkFailure(
          message: 'Firestore service is currently unavailable. Please check your connection.',
        );
      default:
        return AppFailure.unexpected(
          message: e.message ?? 'A database error occurred.',
        );
    }
  }
}
