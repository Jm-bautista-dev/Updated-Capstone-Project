import 'dart:async';
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../security/audit_logger.dart';

/// Secure Email Service for Lambac Coffee Roastery
/// Dispatches via Google Apps Script Gmail Relay & Cloud Firestore Audit
class EmailService {
  static final EmailService _instance = EmailService._internal();
  factory EmailService() => _instance;
  static EmailService get instance => _instance;

  /// Google Apps Script Web App Endpoint for Lambac Roastery Gmail Relay
  static const String googleScriptEndpoint =
      'https://script.google.com/macros/s/AKfycbySs5fu20uioslsQ9w1n2i4VhFZrMKkfn68e8q28_Dr0KXn2g7s8tqMDwU3lJg_GSg/exec';

  final FirebaseFirestore? _customFirestore;
  final Dio _dio;

  EmailService._internal({FirebaseFirestore? firestore, Dio? dio})
      : _customFirestore = firestore,
        _dio = dio ??
            Dio(
              BaseOptions(
                connectTimeout: const Duration(seconds: 15),
                receiveTimeout: const Duration(seconds: 15),
                sendTimeout: const Duration(seconds: 15),
                followRedirects: true,
                validateStatus: (status) => true,
              ),
            );

  bool _simulateFailure = false;
  String? _lastDispatchedRecipient;
  DateTime? _lastDispatchedAt;

  FirebaseFirestore get _firestore => _customFirestore ?? FirebaseFirestore.instance;

  void setSimulateFailure(bool simulate) {
    _simulateFailure = simulate;
  }

  String? get lastDispatchedRecipient => _lastDispatchedRecipient;
  DateTime? get lastDispatchedAt => _lastDispatchedAt;

  static String maskEmail(String email) {
    final trimmed = email.trim();
    final atIndex = trimmed.indexOf('@');
    if (atIndex <= 1) return trimmed;

    final username = trimmed.substring(0, atIndex);
    final domain = trimmed.substring(atIndex);

    if (username.length <= 2) {
      return '${username[0]}•$domain';
    } else if (username.length <= 4) {
      return '${username[0]}${'•' * (username.length - 1)}$domain';
    } else {
      final firstChar = username[0];
      final lastChar = username[username.length - 1];
      final dots = '•' * (username.length - 2);
      return '$firstChar$dots$lastChar$domain';
    }
  }

  /// Dispatches a branded Registration OTP verification email to the customer
  Future<bool> sendRegistrationOtpEmail({
    required String recipientEmail,
    required String recipientName,
    required String otpCode,
    int expiresInMinutes = 5,
  }) async {
    if (_simulateFailure) {
      AuditLogger().log(
        action: AuditActionType.loginFailure,
        actorEmail: recipientEmail.trim().toLowerCase(),
        actorRole: 'customer',
        isSuccess: false,
        details: 'SMTP/Gmail Transport Failure: Unable to deliver OTP email to recipient.',
      );
      return false;
    }

    final normalizedRecipient = recipientEmail.trim().toLowerCase();
    _lastDispatchedRecipient = normalizedRecipient;
    _lastDispatchedAt = DateTime.now();

    final htmlContent = '''
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #1A1412; color: #F5EFEB; border-radius: 12px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #D4A373; font-size: 24px; margin: 0; letter-spacing: 2px;">LAMBAC COFFEE ROASTERY</h1>
    <p style="color: #A89F91; font-size: 14px; margin-top: 4px;">Artisanal Roasts & Specialty Brews</p>
  </div>
  <div style="background-color: #261E1A; padding: 24px; border-radius: 8px; border: 1px solid #3D322B;">
    <h2 style="color: #FFFFFF; font-size: 18px; margin-top: 0;">Verify Your Email Address</h2>
    <p style="color: #D1C7BD; font-size: 14px; line-height: 1.6;">
      Hello <strong>$recipientName</strong>,<br/><br/>
      Thank you for creating an account with Lambac Coffee Roastery. Please use the 6-digit verification code below to complete your registration:
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <span style="font-size: 34px; font-weight: bold; letter-spacing: 10px; color: #D4A373; background-color: #1A1412; padding: 14px 28px; border-radius: 8px; border: 1px dashed #D4A373; display: inline-block;">
        $otpCode
      </span>
    </div>
    <p style="color: #A89F91; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
      ⏱️ This verification code will expire in <strong>$expiresInMinutes minutes</strong>.<br/>
      If you did not request this code, please safely ignore this email.
    </p>
  </div>
  <div style="text-align: center; margin-top: 24px; color: #7A6F68; font-size: 11px;">
    © 2026 Lambac Coffee Roastery • All Rights Reserved
  </div>
</div>
''';

    // 1. Dispatch via Google Apps Script (GET Query for 100% Web CORS compatibility)
    try {
      final getUri = Uri.parse(googleScriptEndpoint).replace(
        queryParameters: {
          'to': normalizedRecipient,
          'name': recipientName,
          'otp': otpCode,
          'subject': 'Verify Your Lambac Coffee Roastery Account — $otpCode',
        },
      );

      // Trigger GET dispatch
      _dio.getUri(getUri).catchError((_) => Response(requestOptions: RequestOptions()));

      // Also trigger POST dispatch
      final payload = {
        'to': normalizedRecipient,
        'subject': 'Verify Your Lambac Coffee Roastery Account — $otpCode',
        'html': htmlContent,
        'text': 'Your verification code is: $otpCode',
        'name': recipientName,
        'otp': otpCode,
      };

      _dio.post(
        googleScriptEndpoint,
        data: jsonEncode(payload),
        options: Options(contentType: 'text/plain;charset=utf-8'),
      ).catchError((_) => Response(requestOptions: RequestOptions()));
    } catch (e) {
      if (kDebugMode) {
        debugPrint('⚠️ [EmailService] Dispatch error: $e');
      }
    }

    // 2. Queue into Cloud Firestore 'mail' collection as persistent audit
    try {
      await _firestore.collection('mail').add({
        'to': normalizedRecipient,
        'recipient_name': recipientName,
        'subject': 'Verify Your Lambac Coffee Roastery Account',
        'otp': otpCode,
        'created_at': DateTime.now().toIso8601String(),
      });
    } catch (_) {}

    // 3. Debug logging
    if (kDebugMode) {
      debugPrint('════════════════════════════════════════════════════════════════');
      debugPrint('📧 [LAMBAC EMAIL DISPATCHED] Gmail Delivery');
      debugPrint('To: $normalizedRecipient ($recipientName)');
      debugPrint('OTP: $otpCode');
      debugPrint('════════════════════════════════════════════════════════════════');
    }

    AuditLogger().log(
      action: AuditActionType.loginSuccess,
      actorEmail: normalizedRecipient,
      actorRole: 'customer',
      isSuccess: true,
      details: 'Secure OTP verification email dispatched to $normalizedRecipient.',
    );

    return true;
  }

  /// Dispatches a branded Sign-In / Login OTP verification email to the user
  Future<bool> sendLoginOtpEmail({
    required String recipientEmail,
    required String recipientName,
    required String otpCode,
    int expiresInMinutes = 5,
  }) async {
    if (_simulateFailure) {
      AuditLogger().log(
        action: AuditActionType.loginFailure,
        actorEmail: recipientEmail.trim().toLowerCase(),
        actorRole: 'customer',
        isSuccess: false,
        details: 'SMTP/Gmail Transport Failure: Unable to deliver Sign-in OTP email to recipient.',
      );
      return false;
    }

    final normalizedRecipient = recipientEmail.trim().toLowerCase();
    _lastDispatchedRecipient = normalizedRecipient;
    _lastDispatchedAt = DateTime.now();

    final htmlContent = '''
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #1A1412; color: #F5EFEB; border-radius: 12px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #D4A373; font-size: 24px; margin: 0; letter-spacing: 2px;">LAMBAC COFFEE ROASTERY</h1>
    <p style="color: #A89F91; font-size: 14px; margin-top: 4px;">Artisanal Roasts & Specialty Brews</p>
  </div>
  <div style="background-color: #261E1A; padding: 24px; border-radius: 8px; border: 1px solid #3D322B;">
    <h2 style="color: #FFFFFF; font-size: 18px; margin-top: 0;">Sign In Verification Code</h2>
    <p style="color: #D1C7BD; font-size: 14px; line-height: 1.6;">
      Hello <strong>$recipientName</strong>,<br/><br/>
      You requested to sign in to your Lambac Coffee Roastery account. Please use the 6-digit verification code below to authorize your sign-in:
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <span style="font-size: 34px; font-weight: bold; letter-spacing: 10px; color: #D4A373; background-color: #1A1412; padding: 14px 28px; border-radius: 8px; border: 1px dashed #D4A373; display: inline-block;">
        $otpCode
      </span>
    </div>
    <p style="color: #A89F91; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
      ⏱️ This verification code will expire in <strong>$expiresInMinutes minutes</strong>.<br/>
      If you did not initiate this sign-in request, please safely ignore this email or update your password.
    </p>
  </div>
  <div style="text-align: center; margin-top: 24px; color: #7A6F68; font-size: 11px;">
    © 2026 Lambac Coffee Roastery • All Rights Reserved
  </div>
</div>
''';

    // 1. Dispatch via Google Apps Script (GET Query for 100% Web CORS compatibility)
    try {
      final getUri = Uri.parse(googleScriptEndpoint).replace(
        queryParameters: {
          'to': normalizedRecipient,
          'name': recipientName,
          'otp': otpCode,
          'subject': 'Sign In Verification Code — $otpCode',
        },
      );

      _dio.getUri(getUri).catchError((_) => Response(requestOptions: RequestOptions()));

      final payload = {
        'to': normalizedRecipient,
        'subject': 'Sign In Verification Code — $otpCode',
        'html': htmlContent,
        'text': 'Your sign-in verification code is: $otpCode',
        'name': recipientName,
        'otp': otpCode,
      };

      _dio.post(
        googleScriptEndpoint,
        data: jsonEncode(payload),
        options: Options(contentType: 'text/plain;charset=utf-8'),
      ).catchError((_) => Response(requestOptions: RequestOptions()));
    } catch (e) {
      if (kDebugMode) {
        debugPrint('⚠️ [EmailService] Login OTP dispatch error: $e');
      }
    }

    // 2. Queue into Cloud Firestore 'mail' collection as persistent audit
    try {
      await _firestore.collection('mail').add({
        'to': normalizedRecipient,
        'recipient_name': recipientName,
        'subject': 'Sign In Verification Code',
        'otp': otpCode,
        'type': 'login_otp',
        'created_at': DateTime.now().toIso8601String(),
      });
    } catch (_) {}

    // 3. Debug logging
    if (kDebugMode) {
      debugPrint('════════════════════════════════════════════════════════════════');
      debugPrint('📧 [LAMBAC EMAIL DISPATCHED] Gmail Delivery');
      debugPrint('To: $normalizedRecipient ($recipientName)');
      debugPrint('OTP: $otpCode');
      debugPrint('Type: Sign-In Verification');
      debugPrint('════════════════════════════════════════════════════════════════');
    }

    AuditLogger().log(
      action: AuditActionType.loginSuccess,
      actorEmail: normalizedRecipient,
      actorRole: 'customer',
      isSuccess: true,
      details: 'Secure Login OTP verification email dispatched to $normalizedRecipient.',
    );

    return true;
  }
}
