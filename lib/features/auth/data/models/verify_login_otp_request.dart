/// Data Transfer Object for Verifying Login OTP
class VerifyLoginOtpRequest {
  final String email;
  final String password;
  final String otp;

  const VerifyLoginOtpRequest({
    required this.email,
    required this.password,
    required this.otp,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email.trim().toLowerCase(),
      'password': password,
      'otp': otp.trim(),
    };
  }
}
