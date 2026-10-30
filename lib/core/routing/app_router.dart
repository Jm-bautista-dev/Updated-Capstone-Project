import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'app_routes.dart';
import 'route_guards.dart';
import '../widgets/feedback/app_error_view.dart';
import '../../features/admin/presentation/screens/account_management_screen.dart';
import '../../features/admin/presentation/screens/admin_dashboard_screen.dart';
import '../../features/admin/presentation/screens/admin_orders_screen.dart';
import '../../features/admin/presentation/screens/admin_products_screen.dart';
import '../../features/admin/presentation/screens/admin_profile_screen.dart';
import '../../features/admin/presentation/screens/staff_inbox_screen.dart';
import '../../features/admin/presentation/screens/staff_operations_screen.dart';
import '../../features/admin/presentation/screens/staff_profile_screen.dart';
import '../../features/analytics/presentation/screens/analytics_screen.dart';
import '../../features/auth/presentation/screens/first_login_password_setup_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/login_otp_verification_screen.dart';
import '../../features/auth/presentation/screens/register_otp_verification_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/reset_password_screen.dart';
import '../../features/auth/presentation/screens/terms_and_conditions_screen.dart';
import '../../features/cart/presentation/screens/cart_screen.dart';
import '../../features/cart/presentation/screens/checkout_screen.dart';
import '../../features/cart/presentation/screens/order_confirmation_screen.dart';
import '../../features/chat/presentation/screens/chat_screen.dart';
import '../../features/forecasting/presentation/screens/forecasting_benchmarking_screen.dart';
import '../../features/forecasting/presentation/screens/forecasting_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/onboarding/presentation/screens/admin_help_guide_screen.dart';
import '../../features/onboarding/presentation/screens/admin_tutorial_screen.dart';
import '../../features/onboarding/presentation/screens/help_guide_screen.dart';
import '../../features/onboarding/presentation/screens/onboarding_screen.dart';
import '../../features/onboarding/presentation/screens/staff_help_guide_screen.dart';
import '../../features/onboarding/presentation/screens/staff_tutorial_screen.dart';
import '../../features/orders/presentation/screens/order_detail_screen.dart';
import '../../features/orders/presentation/screens/orders_screen.dart';
import '../../features/pos/presentation/screens/pos_screen.dart';
import '../../features/prescriptive/presentation/screens/business_intelligence_screen.dart';
import '../../features/prescriptive/presentation/screens/prescriptive_action_detail_screen.dart';
import '../../features/products/presentation/screens/product_detail_screen.dart';
import '../../features/products/presentation/screens/products_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/profile/presentation/screens/settings_screen.dart';
import '../../features/profile/presentation/screens/privacy_policy_screen.dart';
import '../../features/sales/presentation/screens/admin_sales_screen.dart';
import '../../features/shell/presentation/screens/admin_shell_screen.dart';
import '../../features/shell/presentation/screens/main_shell_screen.dart';
import '../../features/shell/presentation/screens/staff_shell_screen.dart';
import '../../features/splash/presentation/screens/splash_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'rootNav');

// ── Unique navigator keys for each StatefulShellBranch ──
// Customer shell branches
final _customerHomeKey = GlobalKey<NavigatorState>(debugLabel: 'customerHome');
final _customerProductsKey = GlobalKey<NavigatorState>(debugLabel: 'customerProducts');
final _customerCartKey = GlobalKey<NavigatorState>(debugLabel: 'customerCart');
final _customerOrdersKey = GlobalKey<NavigatorState>(debugLabel: 'customerOrders');
final _customerProfileKey = GlobalKey<NavigatorState>(debugLabel: 'customerProfile');
// Staff shell branches
final _staffOrdersKey = GlobalKey<NavigatorState>(debugLabel: 'staffOrders');
final _staffInboxKey = GlobalKey<NavigatorState>(debugLabel: 'staffInbox');
final _staffProfileKey = GlobalKey<NavigatorState>(debugLabel: 'staffProfile');
// Admin shell branches
final _adminDashboardKey = GlobalKey<NavigatorState>(debugLabel: 'adminDashboard');
final _adminOrdersKey = GlobalKey<NavigatorState>(debugLabel: 'adminOrders');
final _adminProductsKey = GlobalKey<NavigatorState>(debugLabel: 'adminProducts');
final _adminIntelligenceKey = GlobalKey<NavigatorState>(debugLabel: 'adminIntelligence');
final _adminControlKey = GlobalKey<NavigatorState>(debugLabel: 'adminControl');

// ── Unique shell keys for each StatefulShellRoute to prevent duplicate GlobalKey collisions ──
final _customerShellKey = GlobalKey<StatefulNavigationShellState>(debugLabel: 'customerShellKey');
final _staffShellKey = GlobalKey<StatefulNavigationShellState>(debugLabel: 'staffShellKey');
final _adminShellKey = GlobalKey<StatefulNavigationShellState>(debugLabel: 'adminShellKey');

/// Global Application GoRouter Provider (keepAlive prevents GlobalKey duplication)
final appRouterProvider = Provider<GoRouter>((ref) {
  ref.keepAlive();
  final authListenable = AuthRouterListenable(ref);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoutes.splash,
    refreshListenable: authListenable,
    redirect: (context, state) => appRouteGuard(context, state, ref),
    debugLogDiagnostics: false,
    errorBuilder: (context, state) => Scaffold(
      body: SafeArea(
        child: AppErrorView(
          title: '404 - Page Not Found',
          message: 'The route "${state.uri}" does not exist in Lambac Coffee App.',
          retryText: 'Back to Home',
          onRetry: () => context.go(AppRoutes.home),
        ),
      ),
    ),
    routes: [
      // ----------------------------------------------------------------------
      // Splash & Onboarding
      // ----------------------------------------------------------------------
      GoRoute(
        path: AppRoutes.splash,
        name: AppRoutes.splashName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const SplashScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.onboarding,
        name: AppRoutes.onboardingName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final isReplay = state.uri.queryParameters['replay'] == 'true';
          final step = int.tryParse(state.uri.queryParameters['step'] ?? '0') ?? 0;
          return MaterialPage(
            key: state.pageKey,
            child: OnboardingScreen(isReplay: isReplay, initialStep: step),
          );
        },
      ),

      // ----------------------------------------------------------------------
      // Authentication Routes
      // ----------------------------------------------------------------------
      GoRoute(
        path: AppRoutes.loginOtp,
        name: AppRoutes.loginOtpName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final args = state.extra as LoginOtpScreenArgs? ??
              LoginOtpScreenArgs(
                email: state.uri.queryParameters['email'] ?? '',
                password: state.uri.queryParameters['password'] ?? '',
                redirectPath: state.uri.queryParameters['redirect'],
              );
          return MaterialPage(
            key: state.pageKey,
            child: LoginOtpVerificationScreen(args: args),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.login,
        name: AppRoutes.loginName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final redirect = state.uri.queryParameters['redirect'];
          return MaterialPage(
            key: state.pageKey,
            child: LoginScreen(redirectPath: redirect),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.register,
        name: AppRoutes.registerName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const RegisterScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.registerOtp,
        name: AppRoutes.registerOtpName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final args = state.extra as RegisterOtpScreenArgs? ??
              RegisterOtpScreenArgs(
                fullName: state.uri.queryParameters['name'] ?? '',
                email: state.uri.queryParameters['email'] ?? '',
                password: state.uri.queryParameters['password'] ?? '',
              );
          return MaterialPage(
            key: state.pageKey,
            child: RegisterOtpVerificationScreen(args: args),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.forgotPassword,
        name: AppRoutes.forgotPasswordName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const ForgotPasswordScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.resetPassword,
        name: AppRoutes.resetPasswordName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final email = state.uri.queryParameters['email'];
          return MaterialPage(
            key: state.pageKey,
            child: ResetPasswordScreen(email: email),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.firstLoginSetup,
        name: AppRoutes.firstLoginSetupName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const FirstLoginPasswordSetupScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.termsAndConditions,
        name: AppRoutes.termsAndConditionsName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final isReview = state.uri.queryParameters['mode'] == 'review';
          return MaterialPage(
            key: state.pageKey,
            child: TermsAndConditionsScreen(isReviewMode: isReview),
          );
        },
      ),

      // ----------------------------------------------------------------------
      // 1. CUSTOMER APPLICATION STATEFUL SHELL (Consumer Shopping Tabs)
      // ----------------------------------------------------------------------
      StatefulShellRoute.indexedStack(
        key: _customerShellKey,
        parentNavigatorKey: _rootNavigatorKey,
        restorationScopeId: 'customerShell',
        pageBuilder: (context, state, navigationShell) => NoTransitionPage(
          key: const ValueKey('customerShellPage'),
          name: 'customerShell',
          child: MainShellScreen(navigationShell: navigationShell),
        ),
        branches: [
          // Branch 0: Customer Home
          StatefulShellBranch(
            navigatorKey: _customerHomeKey,
            routes: [
              GoRoute(
                path: AppRoutes.home,
                name: AppRoutes.homeName,
                pageBuilder: (context, state) => MaterialPage(
                  key: state.pageKey,
                  child: const HomeScreen(),
                ),
              ),
            ],
          ),

          // Branch 1: Roastery Products Catalog
          StatefulShellBranch(
            navigatorKey: _customerProductsKey,
            routes: [
              GoRoute(
                path: AppRoutes.products,
                name: AppRoutes.productsName,
                pageBuilder: (context, state) => MaterialPage(
                  key: state.pageKey,
                  child: const ProductsScreen(),
                ),
              ),
            ],
          ),

          // Branch 2: Shopping Cart
          StatefulShellBranch(
            navigatorKey: _customerCartKey,
            routes: [
              GoRoute(
                path: AppRoutes.cart,
                name: AppRoutes.cartName,
                pageBuilder: (context, state) => MaterialPage(
                  key: state.pageKey,
                  child: const CartScreen(),
                ),
              ),
            ],
          ),

          // Branch 3: Customer Orders History
          StatefulShellBranch(
            navigatorKey: _customerOrdersKey,
            routes: [
              GoRoute(
                path: AppRoutes.orders,
                name: AppRoutes.ordersName,
                pageBuilder: (context, state) => MaterialPage(
                  key: state.pageKey,
                  child: const OrdersScreen(),
                ),
              ),
            ],
          ),

          // Branch 4: Member Profile
          StatefulShellBranch(
            navigatorKey: _customerProfileKey,
            routes: [
              GoRoute(
                path: AppRoutes.profile,
                name: AppRoutes.profileName,
                pageBuilder: (context, state) => MaterialPage(
                  key: state.pageKey,
                  child: const ProfileScreen(),
                ),
              ),
            ],
          ),
        ],
      ),

      // ----------------------------------------------------------------------
      // 2. STAFF / BARTENDER OPERATIONS SHELL (Station & Order Queue)
      // ----------------------------------------------------------------------
      StatefulShellRoute.indexedStack(
        key: _staffShellKey,
        parentNavigatorKey: _rootNavigatorKey,
        restorationScopeId: 'staffShell',
        pageBuilder: (context, state, navigationShell) => NoTransitionPage(
          key: const ValueKey('staffShellPage'),
          name: 'staffShell',
          child: StaffShellScreen(navigationShell: navigationShell),
        ),
        branches: [
          // Branch 0: Operational Queue
          StatefulShellBranch(
            navigatorKey: _staffOrdersKey,
            routes: [
              GoRoute(
                path: AppRoutes.staffOrders,
                name: AppRoutes.staffOrdersName,
                pageBuilder: (context, state) => MaterialPage(
                  key: state.pageKey,
                  child: const StaffOperationsScreen(),
                ),
              ),
            ],
          ),

          // Branch 1: Concierge Customer Support Inbox
          StatefulShellBranch(
            navigatorKey: _staffInboxKey,
            routes: [
              GoRoute(
                path: AppRoutes.staffInboxRoute,
                name: AppRoutes.staffInboxRouteName,
                pageBuilder: (context, state) => MaterialPage(
                  key: state.pageKey,
                  child: const StaffInboxScreen(),
                ),
              ),
            ],
          ),

          // Branch 2: Staff Station Profile & Shift Control
          StatefulShellBranch(
            navigatorKey: _staffProfileKey,
            routes: [
              GoRoute(
                path: AppRoutes.staffProfile,
                name: AppRoutes.staffProfileName,
                pageBuilder: (context, state) => MaterialPage(
                  key: state.pageKey,
                  child: const StaffProfileScreen(),
                ),
              ),
            ],
          ),
        ],
      ),

      // Staff Dashboard redirect to Staff Orders
      GoRoute(
        path: AppRoutes.staffDashboard,
        name: AppRoutes.staffDashboardName,
        parentNavigatorKey: _rootNavigatorKey,
        redirect: (context, state) => AppRoutes.staffOrders,
      ),

      // Legacy Staff Sales redirect to Staff Orders
      GoRoute(
        path: AppRoutes.staffSales,
        name: AppRoutes.staffSalesName,
        parentNavigatorKey: _rootNavigatorKey,
        redirect: (context, state) => AppRoutes.staffOrders,
      ),

      // ----------------------------------------------------------------------
      // Point of Sale (POS) Counter Operations (Admin + Barista)
      // ----------------------------------------------------------------------
      GoRoute(
        path: AppRoutes.pos,
        name: AppRoutes.posName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const PosScreen(),
        ),
      ),

      // ----------------------------------------------------------------------
      // 3. ADMIN OPERATIONS + ADMINISTRATION SHELL (Executive Governance)
      // ----------------------------------------------------------------------
      StatefulShellRoute.indexedStack(
        key: _adminShellKey,
        parentNavigatorKey: _rootNavigatorKey,
        restorationScopeId: 'adminShell',
        pageBuilder: (context, state, navigationShell) => NoTransitionPage(
          key: const ValueKey('adminShellPage'),
          name: 'adminShell',
          child: AdminShellScreen(navigationShell: navigationShell),
        ),
        branches: [
          // Branch 0: Admin Dashboard & Executive Overview
          StatefulShellBranch(
            navigatorKey: _adminDashboardKey,
            routes: [
              GoRoute(
                path: AppRoutes.adminDashboard,
                name: AppRoutes.adminDashboardName,
                pageBuilder: (context, state) => MaterialPage(
                  key: state.pageKey,
                  child: const AdminDashboardScreen(),
                ),
              ),
            ],
          ),

          // Branch 1: Roastery Orders Pickup Queue
          StatefulShellBranch(
            navigatorKey: _adminOrdersKey,
            routes: [
              GoRoute(
                path: AppRoutes.adminOrders,
                name: AppRoutes.adminOrdersName,
                pageBuilder: (context, state) => MaterialPage(
                  key: state.pageKey,
                  child: const AdminOrdersScreen(),
                ),
              ),
            ],
          ),

          // Branch 2: Roastery Products Catalog Management
          StatefulShellBranch(
            navigatorKey: _adminProductsKey,
            routes: [
              GoRoute(
                path: AppRoutes.adminProducts,
                name: AppRoutes.adminProductsName,
                pageBuilder: (context, state) => MaterialPage(
                  key: state.pageKey,
                  child: const AdminProductsScreen(),
                ),
              ),
            ],
          ),

          // Branch 3: Business Intelligence (Pipeline + Descriptive + Forecasting + Prescriptive)
          StatefulShellBranch(
            navigatorKey: _adminIntelligenceKey,
            routes: [
              GoRoute(
                path: AppRoutes.businessIntelligence,
                name: AppRoutes.businessIntelligenceName,
                pageBuilder: (context, state) => MaterialPage(
                  key: state.pageKey,
                  child: const BusinessIntelligenceScreen(),
                ),
              ),
            ],
          ),

          // Branch 4: Admin Control Center & Settings
          StatefulShellBranch(
            navigatorKey: _adminControlKey,
            routes: [
              GoRoute(
                path: AppRoutes.adminProfile,
                name: AppRoutes.adminProfileName,
                pageBuilder: (context, state) => MaterialPage(
                  key: state.pageKey,
                  child: const AdminProfileScreen(),
                ),
              ),
            ],
          ),
        ],
      ),

      // ----------------------------------------------------------------------
      // Customer Sub-routes & Detail Push Routes
      // ----------------------------------------------------------------------
      GoRoute(
        path: AppRoutes.productDetail,
        name: AppRoutes.productDetailName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final productId = state.pathParameters['id'] ?? '';
          return MaterialPage(
            key: state.pageKey,
            child: ProductDetailScreen(productId: productId),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.checkout,
        name: AppRoutes.checkoutName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const CheckoutScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.orderConfirmation,
        name: AppRoutes.orderConfirmationName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final orderId = state.uri.queryParameters['orderId'] ?? '';
          return MaterialPage(
            key: state.pageKey,
            child: OrderConfirmationScreen(orderId: orderId),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.orderDetail,
        name: AppRoutes.orderDetailName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final orderId = state.pathParameters['id'] ?? '';
          return MaterialPage(
            key: state.pageKey,
            child: OrderDetailScreen(orderId: orderId),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.chat,
        name: AppRoutes.chatName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final customerId = state.uri.queryParameters['customerId'] ?? (state.extra as String?);
          return MaterialPage(
            key: state.pageKey,
            child: ChatScreen(customerId: customerId),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.settings,
        name: AppRoutes.settingsName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const SettingsScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.privacyPolicy,
        name: AppRoutes.privacyPolicyName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const PrivacyPolicyScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.helpGuide,
        name: AppRoutes.helpGuideName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const HelpGuideScreen(),
        ),
      ),

      // ----------------------------------------------------------------------
      // Admin Sub-routes & Sub-modules
      // ----------------------------------------------------------------------
      GoRoute(
        path: AppRoutes.staffInbox,
        name: AppRoutes.staffInboxName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const StaffInboxScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.forecasting,
        name: AppRoutes.forecastingName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const ForecastingScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.forecastBenchmarking,
        name: AppRoutes.forecastBenchmarkingName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const ForecastingBenchmarkingScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.adminSales,
        name: AppRoutes.adminSalesName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const AdminSalesScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.adminAccounts,
        name: AppRoutes.adminAccountsName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const AccountManagementScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.analytics,
        name: AppRoutes.analyticsName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const AnalyticsScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.prescriptiveActionDetail,
        name: AppRoutes.prescriptiveActionDetailName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final actionId = state.pathParameters['id'] ?? '';
          return MaterialPage(
            key: state.pageKey,
            child: PrescriptiveActionDetailScreen(actionId: actionId),
          );
        },
      ),

      // ----------------------------------------------------------------------
      // Admin Executive Onboarding & Help Guide
      // ----------------------------------------------------------------------
      GoRoute(
        path: AppRoutes.adminTutorial,
        name: AppRoutes.adminTutorialName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final isReplay = state.uri.queryParameters['replay'] == 'true';
          final step = int.tryParse(state.uri.queryParameters['step'] ?? '0') ?? 0;
          return MaterialPage(
            key: state.pageKey,
            child: AdminTutorialScreen(isReplay: isReplay, initialStep: step),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.adminHelpGuide,
        name: AppRoutes.adminHelpGuideName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const AdminHelpGuideScreen(),
        ),
      ),

      // ----------------------------------------------------------------------
      // Staff Operations Onboarding & Help Guide
      // ----------------------------------------------------------------------
      GoRoute(
        path: AppRoutes.staffTutorial,
        name: AppRoutes.staffTutorialName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final isReplay = state.uri.queryParameters['replay'] == 'true';
          final step = int.tryParse(state.uri.queryParameters['step'] ?? '0') ?? 0;
          return MaterialPage(
            key: state.pageKey,
            child: StaffTutorialScreen(isReplay: isReplay, initialStep: step),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.staffHelpGuide,
        name: AppRoutes.staffHelpGuideName,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const StaffHelpGuideScreen(),
        ),
      ),
    ],
  );
});
