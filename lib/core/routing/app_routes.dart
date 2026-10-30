/// Centralized Route Paths and Names for Lambac Coffee Roastery
class AppRoutes {
  AppRoutes._();

  // Root & Onboarding
  static const String splash = '/';
  static const String splashName = 'splash';

  static const String onboarding = '/onboarding';
  static const String onboardingName = 'onboarding';

  // Authentication
  static const String login = '/login';
  static const String loginName = 'login';

  static const String loginOtp = '/login/verify-otp';
  static const String loginOtpName = 'login_otp';

  static const String register = '/register';
  static const String registerName = 'register';

  static const String registerOtp = '/register/verify-otp';
  static const String registerOtpName = 'register_otp';

  static const String forgotPassword = '/forgot-password';
  static const String forgotPasswordName = 'forgot_password';

  static const String resetPassword = '/reset-password';
  static const String resetPasswordName = 'reset_password';

  static const String firstLoginSetup = '/auth/first-login-setup';
  static const String firstLoginSetupName = 'first_login_setup';

  static const String termsAndConditions = '/terms-and-conditions';
  static const String termsAndConditionsName = 'terms_and_conditions';

  // Main Tabs (ShellRoute)
  static const String home = '/home';
  static const String homeName = 'home';

  static const String products = '/products';
  static const String productsName = 'products';

  static const String cart = '/cart';
  static const String cartName = 'cart';

  static const String orders = '/orders';
  static const String ordersName = 'orders';

  static const String chat = '/chat';
  static const String chatName = 'chat';

  static const String profile = '/profile';
  static const String profileName = 'profile';

  // Sub-routes & Details
  static const String productDetail = '/products/:id';
  static const String productDetailName = 'product_detail';
  static String productDetailPath(String id) => '/products/$id';

  static const String checkout = '/checkout';
  static const String checkoutName = 'checkout';

  static const String orderConfirmation = '/order-confirmation';
  static const String orderConfirmationName = 'order_confirmation';

  static const String orderDetail = '/orders/:id';
  static const String orderDetailName = 'order_detail';
  static String orderDetailPath(String id) => '/orders/$id';

  static const String settings = '/settings';
  static const String settingsName = 'settings';

  static const String privacyPolicy = '/privacy-policy';
  static const String privacyPolicyName = 'privacy_policy';

  static const String helpGuide = '/help-guide';
  static const String helpGuideName = 'help_guide';

  static const String analytics = '/analytics';
  static const String analyticsName = 'analytics';

  // Business Admin & Sales Routes
  static const String adminDashboard = '/admin';
  static const String adminDashboardName = 'admin_dashboard';

  static const String adminProducts = '/admin/products';
  static const String adminProductsName = 'admin_products';

  static const String adminOrders = '/admin/orders';
  static const String adminOrdersName = 'admin_orders';

  static const String staffInbox = '/admin/inbox';
  static const String staffInboxName = 'staff_inbox';

  static const String forecasting = '/admin/forecasting';
  static const String forecastingName = 'forecasting';

  static const String forecastBenchmarking = '/admin/forecast-benchmarking';
  static const String forecastBenchmarkingName = 'forecast_benchmarking';

  static const String businessIntelligence = '/admin/business-intelligence';
  static const String businessIntelligenceName = 'business_intelligence';

  static const String adminSales = '/admin/sales';
  static const String adminSalesName = 'admin_sales';

  static const String adminAccounts = '/admin/accounts';
  static const String adminAccountsName = 'admin_accounts';

  static const String adminProfile = '/admin/profile';
  static const String adminProfileName = 'admin_profile';

  static const String adminTutorial = '/admin/tutorial';
  static const String adminTutorialName = 'admin_tutorial';

  static const String adminHelpGuide = '/admin/help-guide';
  static const String adminHelpGuideName = 'admin_help_guide';

  static const String prescriptiveActionDetail = '/admin/prescriptive/actions/:id';
  static const String prescriptiveActionDetailName = 'prescriptive_action_detail';
  static String prescriptiveActionDetailPath(String id) => '/admin/prescriptive/actions/$id';

  // Staff / Bartender Operations Routes
  static const String staffDashboard = '/staff';
  static const String staffDashboardName = 'staff_dashboard';

  static const String staffOrders = '/staff/orders';
  static const String staffOrdersName = 'staff_orders';

  static const String staffSales = '/staff/sales';
  static const String staffSalesName = 'staff_sales';

  static const String staffInboxRoute = '/staff/inbox';
  static const String staffInboxRouteName = 'staff_inbox_op';

  static const String staffProfile = '/staff/profile';
  static const String staffProfileName = 'staff_profile';

  static const String staffTutorial = '/staff/tutorial';
  static const String staffTutorialName = 'staff_tutorial';

  static const String staffHelpGuide = '/staff/help-guide';
  static const String staffHelpGuideName = 'staff_help_guide';

  static const String staffChat = '/staff/chat';
  static const String staffChatName = 'staff_chat';

  /// Customer-only routes that Staff and Admin must NEVER access
  static const List<String> customerOnlyRoutes = [
    home,
    products,
    productDetail,
    cart,
    checkout,
    orderConfirmation,
    orders,
    orderDetail,
    profile,
    chat,
    helpGuide,
  ];

  /// Routes that require customer authentication (redirected to /login if unauthenticated)
  static const List<String> protectedCustomerRoutes = [
    cart,
    checkout,
    orderConfirmation,
    orders,
    orderDetail,
    chat,
    profile,
    settings,
  ];

  /// Backwards-compatible alias for existing code referencing protectedRoutes
  static const List<String> protectedRoutes = [
    cart,
    checkout,
    orderConfirmation,
    orders,
    chat,
    profile,
    settings,
    analytics,
  ];

  /// Operational routes dedicated to Staff / Bartender role
  static const List<String> staffRoutes = [
    staffDashboard,
    staffOrders,
    staffSales,
    staffInboxRoute,
    staffProfile,
    staffTutorial,
    staffHelpGuide,
    staffChat,
  ];

  /// Privileged Routes strictly reserved for Administrator role only (Employees & Customers forbidden)
  static const List<String> adminOnlyRoutes = [
    adminDashboard,
    adminProducts,
    adminAccounts,
    adminProfile,
    adminTutorial,
    adminHelpGuide,
    forecasting,
    forecastBenchmarking,
    businessIntelligence,
    analytics,
  ];

  // Point of Sale (POS) Counter Operations (Admin + Barista)
  static const String pos = '/pos';
  static const String posName = 'pos';

  /// Operational business routes (Admin and Staff can both access)
  static const List<String> operationalRoutes = [
    pos,
    adminOrders,
    staffInbox,
    adminSales,
    staffOrders,
    staffSales,
    staffInboxRoute,
  ];

  /// All admin surface routes
  static const List<String> adminRoutes = [
    adminDashboard,
    adminProducts,
    adminOrders,
    staffInbox,
    forecasting,
    forecastBenchmarking,
    businessIntelligence,
    adminSales,
    adminAccounts,
    adminProfile,
    adminTutorial,
    adminHelpGuide,
    analytics,
  ];

  /// Routes accessible only when unauthenticated (redirect to role-based dashboard if authenticated)
  static const List<String> unauthOnlyRoutes = [
    login,
    loginOtp,
    register,
    registerOtp,
    forgotPassword,
    resetPassword,
  ];
}
