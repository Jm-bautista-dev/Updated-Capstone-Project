import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/errors/app_failure.dart';
import '../../../../core/routing/app_routes.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/app_bars/lambac_app_bar.dart';
import '../../../../core/widgets/buttons/app_button.dart';
import '../../../../core/widgets/feedback/app_toast.dart';
import '../../../../core/widgets/visuals/cinematic_roastery_background.dart';
import '../../../../core/widgets/visuals/lambac_3d_coffee_bean.dart';
import '../../../cart/presentation/providers/cart_provider.dart';
import '../../../cart/presentation/providers/pending_action_provider.dart';
import '../providers/auth_provider.dart';

/// Screen arguments passed to Login OTP screen
class LoginOtpScreenArgs {
  final String email;
  final String password;
  final String? maskedEmail;
  final String? redirectPath;
  final String? debugOtp;

  const LoginOtpScreenArgs({
    required this.email,
    required this.password,
    this.maskedEmail,
    this.redirectPath,
    this.debugOtp,
  });
}

/// Dedicated Premium 6-Digit Gmail OTP Verification Screen for Sign In
class LoginOtpVerificationScreen extends ConsumerStatefulWidget {
  final LoginOtpScreenArgs args;
  final bool autoStartCooldown;

  const LoginOtpVerificationScreen({
    super.key,
    required this.args,
    this.autoStartCooldown = true,
  });

  @override
  ConsumerState<LoginOtpVerificationScreen> createState() => _LoginOtpVerificationScreenState();
}

class _LoginOtpVerificationScreenState extends ConsumerState<LoginOtpVerificationScreen> {
  static const int _otpLength = 6;
  static const int _initialCooldownSeconds = 45;

  late final List<TextEditingController> _controllers;
  late final List<FocusNode> _focusNodes;

  Timer? _cooldownTimer;
  int _secondsRemaining = _initialCooldownSeconds;
  bool _isVerifying = false;
  bool _isResending = false;
  String? _errorMessage;
  String? _currentDebugOtp;

  @override
  void initState() {
    super.initState();
    _currentDebugOtp = widget.args.debugOtp;
    _controllers = List.generate(_otpLength, (_) => TextEditingController());
    _focusNodes = List.generate(_otpLength, (_) => FocusNode());
    if (widget.autoStartCooldown) {
      _startCooldownTimer();
    }
  }

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _startCooldownTimer() {
    _cooldownTimer?.cancel();
    _secondsRemaining = _initialCooldownSeconds;
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_secondsRemaining > 0) {
        setState(() {
          _secondsRemaining--;
        });
      } else {
        timer.cancel();
      }
    });
  }

  String get _currentOtpCode {
    return _controllers.map((c) => c.text).join();
  }

  bool get _isOtpComplete => _currentOtpCode.length == _otpLength;

  void _onDigitChanged(int index, String value) {
    setState(() {
      _errorMessage = null;
    });

    // Handle paste of full 6-digit code
    if (value.length > 1) {
      final digits = value.replaceAll(RegExp(r'\D'), '');
      if (digits.isNotEmpty) {
        for (int i = 0; i < _otpLength && i < digits.length; i++) {
          _controllers[i].text = digits[i];
        }
        final nextFocusIndex = digits.length < _otpLength ? digits.length : _otpLength - 1;
        _focusNodes[nextFocusIndex].requestFocus();

        if (digits.length >= _otpLength) {
          _handleVerify();
        }
        return;
      }
    }

    if (value.isNotEmpty) {
      if (index < _otpLength - 1) {
        _focusNodes[index + 1].requestFocus();
      } else {
        _focusNodes[index].unfocus();
        if (_isOtpComplete) {
          _handleVerify();
        }
      }
    }
  }

  void _onKeyDown(int index, KeyEvent event) {
    if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.backspace) {
      if (_controllers[index].text.isEmpty && index > 0) {
        _focusNodes[index - 1].requestFocus();
        _controllers[index - 1].text = '';
      }
    }
  }

  Future<void> _handleResendCode() async {
    if (_secondsRemaining > 0 || _isResending || _isVerifying) return;

    setState(() {
      _isResending = true;
      _errorMessage = null;
    });

    final result = await ref.read(authNotifierProvider.notifier).resendLoginOtp(
      email: widget.args.email,
      password: widget.args.password,
    );

    if (!mounted) return;

    setState(() {
      _isResending = false;
    });

    result.when(
      success: (response) {
        setState(() {
          _currentDebugOtp = response.debugOtp ?? _currentDebugOtp;
        });
        for (final c in _controllers) {
          c.clear();
        }
        _focusNodes[0].requestFocus();
        _startCooldownTimer();
        AppToast.success(context, 'A new verification code has been dispatched to your Gmail.');
      },
      failure: (failure) {
        setState(() {
          _errorMessage = failure.message;
        });
      },
    );
  }

  Future<void> _handleVerify() async {
    if (!_isOtpComplete || _isVerifying) return;

    setState(() {
      _isVerifying = true;
      _errorMessage = null;
    });

    final otpCode = _currentOtpCode;
    final authNotifier = ref.read(authNotifierProvider.notifier);

    // Verify 6-digit OTP code against backend and finalize login
    final verifyResult = await authNotifier.verifyLoginOtp(
      email: widget.args.email,
      password: widget.args.password,
      otp: otpCode,
    );

    if (!mounted) return;

    setState(() {
      _isVerifying = false;
    });

    verifyResult.when(
      success: (user) {
        if (user.isAdmin) {
          context.go(AppRoutes.adminDashboard);
          return;
        } else if (user.isEmployee || user.isBarista) {
          context.go(AppRoutes.staffOrders);
          return;
        }

        // Customer: Restore and synchronize any pending cart action
        final pendingAction = ref.read(pendingActionProvider.notifier).consumePendingAction();
        if (pendingAction != null) {
          ref.read(cartNotifierProvider.notifier).addItem(
            product: pendingAction.product,
            sizeVariant: pendingAction.sizeVariant,
            grindVariant: pendingAction.grindVariant,
            quantity: pendingAction.quantity,
            specialInstructions: pendingAction.specialInstructions,
          );

          final sizeName = pendingAction.sizeVariant?.name ?? '250g Bag';
          final grindName = pendingAction.grindVariant?.name ?? 'Whole Bean';

          AppToast.cartItemAdded(
            context,
            productName: pendingAction.product.name,
            quantity: pendingAction.quantity,
            variantDescription: '$sizeName, $grindName',
            onViewCart: () => context.push(AppRoutes.cart),
          );
        } else {
          AppToast.success(context, 'Welcome back, ${user.fullName}!');
        }

        final target = widget.args.redirectPath ?? AppRoutes.home;
        context.go(target);
      },
      failure: (failure) {
        setState(() {
          final err = failure is ValidationFailure && failure.fieldErrors?['otp'] != null
              ? failure.fieldErrors!['otp']!.first
              : failure.message;
          _errorMessage = err;
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final displayEmail = widget.args.maskedEmail ?? widget.args.email;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkCanvas : AppColors.lightCanvas,
      appBar: LambacAppBar(
        title: 'Sign In Verification',
        showBackButton: true,
        onBack: () => context.canPop() ? context.pop() : context.go(AppRoutes.login),
      ),
      body: CinematicRoasteryBackground.hero(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: AppSpacing.screenPadding,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // 3D Coffee Bean Icon
                    Center(
                      child: Lambac3DCoffeeBean(
                        size: 68,
                        roastStyle: isDark ? BeanRoastStyle.mediumRoast : BeanRoastStyle.honeyGold,
                        intensity: BeanIntensity.high,
                        enableFloating: true,
                        enableRotation: true,
                        showGlow: true,
                      ),
                    ),
                    AppSpacing.vSpaceMd,

                    Text(
                      'Verify Your Identity',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      ),
                    ),
                    AppSpacing.vSpaceSm,

                    RichText(
                      textAlign: TextAlign.center,
                      text: TextSpan(
                        style: TextStyle(
                          fontSize: 14,
                          height: 1.5,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                        children: [
                          const TextSpan(text: "We've dispatched a 6-digit verification code to your Gmail\n"),
                          TextSpan(
                            text: displayEmail,
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: isDark ? AppColors.brandAmberLight : AppColors.brandAmber,
                            ),
                          ),
                        ],
                      ),
                    ),

                    if (_currentDebugOtp != null) ...[
                      AppSpacing.vSpaceMd,
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.brandAmber.withValues(alpha: 0.15),
                          borderRadius: AppRadius.radiusMd,
                          border: Border.all(color: AppColors.brandAmber.withValues(alpha: 0.4)),
                        ),
                        child: Text(
                          'Test OTP: $_currentDebugOtp',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 2,
                            color: isDark ? AppColors.brandAmberLight : AppColors.brandAmberDark,
                          ),
                        ),
                      ),
                    ],

                    AppSpacing.vSpaceXl,

                    // Error Banner (if any)
                    if (_errorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.error.withValues(alpha: 0.15) : AppColors.errorBackground,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.error.withValues(alpha: 0.5)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, size: 18, color: AppColors.error),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.error,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      AppSpacing.vSpaceLg,
                    ],

                    // 6-Digit OTP Boxes
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(_otpLength, (index) {
                        return SizedBox(
                          width: 48,
                          height: 56,
                          child: KeyboardListener(
                            focusNode: FocusNode(),
                            onKeyEvent: (event) => _onKeyDown(index, event),
                            child: TextField(
                              controller: _controllers[index],
                              focusNode: _focusNodes[index],
                              textAlign: TextAlign.center,
                              keyboardType: TextInputType.number,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                                LengthLimitingTextInputFormatter(1),
                              ],
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                              ),
                              decoration: InputDecoration(
                                counterText: '',
                                contentPadding: EdgeInsets.zero,
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: AppRadius.radiusMd,
                                  borderSide: BorderSide(
                                    color: _controllers[index].text.isNotEmpty
                                        ? AppColors.brandAmber
                                        : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                                    width: _controllers[index].text.isNotEmpty ? 1.5 : 1.0,
                                  ),
                                ),
                                focusedBorder: const OutlineInputBorder(
                                  borderRadius: AppRadius.radiusMd,
                                  borderSide: BorderSide(
                                    color: AppColors.brandAmber,
                                    width: 2.0,
                                  ),
                                ),
                                filled: true,
                                fillColor: isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated,
                              ),
                              onChanged: (val) => _onDigitChanged(index, val),
                            ),
                          ),
                        );
                      }),
                    ),

                    AppSpacing.vSpaceXl,

                    // Verify & Sign In Button
                    AppButton.primary(
                      text: 'Verify & Sign In',
                      isLoading: _isVerifying,
                      onPressed: _isOtpComplete && !_isVerifying ? _handleVerify : null,
                    ),

                    AppSpacing.vSpaceLg,

                    // Resend Code Section
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          "Didn't receive the email? ",
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                        if (_secondsRemaining > 0)
                          Text(
                            'Resend in ${_secondsRemaining}s',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: isDark ? AppColors.brandAmberLight : AppColors.brandAmber,
                            ),
                          )
                        else
                          TextButton(
                            onPressed: _isResending || _isVerifying ? null : _handleResendCode,
                            child: _isResending
                                ? const SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Text(
                                    'Resend Code',
                                    style: TextStyle(fontWeight: FontWeight.w700),
                                  ),
                          ),
                      ],
                    ),

                    AppSpacing.vSpaceMd,

                    // Back to Login with different account
                    Center(
                      child: TextButton(
                        onPressed: () => context.go(AppRoutes.login),
                        child: const Text('Sign in with a different account'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
