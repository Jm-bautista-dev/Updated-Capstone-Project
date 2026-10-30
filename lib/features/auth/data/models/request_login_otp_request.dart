/// Data Transfer Object for Requesting Login OTP via Gmail
class RequestLoginOtpRequest {
  final String email;
  final String password;

  const RequestLoginOtpRequest({
    required this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email.trim().toLowerCase(),
      'password': password,
    };
  }
}

/// Response returned after Login OTP is generated and dispatched via Gmail Relay
class RequestLoginOtpResponse {
  final String email;
  final String maskedEmail;
  final int expiresInSeconds;
  final int resendCooldownSeconds;
  final String message;
  final String? debugOtp;

  const RequestLoginOtpResponse({
    required this.email,
    required this.maskedEmail,
    required this.expiresInSeconds,
    required this.resendCooldownSeconds,
    required this.message,
    this.debugOtp,
  });

  factory RequestLoginOtpResponse.fromJson(Map<String, dynamic> json) {
    return RequestLoginOtpResponse(
      email: json['email'] as String? ?? '',
      maskedEmail: json['masked_email'] as String? ?? '',
      expiresInSeconds: json['expires_in_seconds'] as int? ?? 300,
      resendCooldownSeconds: json['resend_cooldown_seconds'] as int? ?? 45,
      message: json['message'] as String? ?? 'Verification code sent to your Gmail.',
      debugOtp: json['debug_otp'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'masked_email': maskedEmail,
      'expires_in_seconds': expiresInSeconds,
      'resend_cooldown_seconds': resendCooldownSeconds,
      'message': message,
      if (debugOtp != null) 'debug_otp': debugOtp,
    };
  }
}
