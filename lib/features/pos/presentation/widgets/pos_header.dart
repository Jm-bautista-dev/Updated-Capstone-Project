import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/widgets/chips/app_chip.dart';
import '../../../../core/widgets/visuals/lambac_3d_coffee_bean.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../products/presentation/providers/categories_provider.dart';
import '../providers/pos_cart_provider.dart';
import '../providers/pos_realtime_products_provider.dart';

/// Top POS Header with live clock, sync indicator, search bar, and category filters
class PosHeader extends ConsumerStatefulWidget {
  final VoidCallback? onBack;

  const PosHeader({super.key, this.onBack});

  @override
  ConsumerState<PosHeader> createState() => _PosHeaderState();
}

class _PosHeaderState extends ConsumerState<PosHeader> {
  final TextEditingController _searchController = TextEditingController();
  late Timer _clockTimer;
  DateTime _currentTime = DateTime.now();

  @override
  void initState() {
    super.initState();
    _clockTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) setState(() => _currentTime = DateTime.now());
    });
  }

  @override
  void dispose() {
    _clockTimer.cancel();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final user = ref.watch(currentUserProvider);
    final isLiveSync = ref.watch(posLiveSyncStatusProvider);
    final cartState = ref.watch(posCartNotifierProvider);
    final selectedCategory = ref.watch(posSelectedCategoryProvider);
    final categoriesAsync = ref.watch(categoriesProvider);

    final staffName = user?.fullName.isNotEmpty == true ? user!.fullName : 'Staff Member';
    final roleName = user?.isAdmin == true ? 'Administrator' : 'Barista';
    final formattedTime = DateFormat('EEE, MMM d • h:mm a').format(_currentTime);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        border: Border(
          bottom: BorderSide(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
            width: 1,
          ),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Row 1: Back Button, Brand / Title, Staff Badge, Live Sync, and Business DateTime
          Row(
            children: [
              // Back Button
              IconButton(
                icon: const Icon(Icons.arrow_back_rounded, size: 22),
                tooltip: 'Return to Operations',
                onPressed: widget.onBack ?? () => Navigator.of(context).maybePop(),
              ),
              const SizedBox(width: 4),

              // Roastery Brand Icon
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated,
                  borderRadius: AppRadius.radiusMd,
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  ),
                ),
                child: const Lambac3DCoffeeBean(
                  size: 20,
                  intensity: BeanIntensity.minimal,
                  roastStyle: BeanRoastStyle.mediumRoast,
                ),
              ),
              const SizedBox(width: 10),

              // Title and Flagship info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        Text(
                          'Point of Sale',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.3,
                            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                          ),
                        ),
                        // Live sync status indicator
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: isLiveSync
                                ? AppColors.success.withValues(alpha: 0.15)
                                : AppColors.warning.withValues(alpha: 0.15),
                            borderRadius: AppRadius.radiusPill,
                            border: Border.all(
                              color: isLiveSync
                                  ? AppColors.success.withValues(alpha: 0.35)
                                  : AppColors.warning.withValues(alpha: 0.35),
                              width: 0.8,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: BoxDecoration(
                                  color: isLiveSync ? AppColors.success : AppColors.warning,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 5),
                              Text(
                                isLiveSync ? 'LIVE SYNC' : 'CONNECTING',
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                  color: isLiveSync ? AppColors.success : AppColors.warning,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 1),
                    Text(
                      'Session Road Flagship • Counter Sales Terminal',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),

              // Staff & DateTime Badge
              Flexible(
                fit: FlexFit.loose,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated,
                    borderRadius: AppRadius.radiusMd,
                    border: Border.all(
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircleAvatar(
                        radius: 13,
                        backgroundColor: isDark ? AppColors.brandAmberDark : AppColors.brandAmber,
                        child: Text(
                          staffName.isNotEmpty ? staffName[0].toUpperCase() : 'S',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Flexible(
                                  child: Text(
                                    staffName,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '($roleName)',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? AppColors.brandAmberLight : AppColors.brandAmberDark,
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              formattedTime,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 10,
                                color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Row 2: Search Field + Transaction Status Pill
          Row(
            children: [
              // Search Input
              Expanded(
                child: Container(
                  height: 42,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated,
                    borderRadius: AppRadius.radiusMd,
                    border: Border.all(
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
                  child: TextField(
                    controller: _searchController,
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Search products by name, origin, or notes...',
                      hintStyle: TextStyle(
                        fontSize: 12.5,
                        color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                      ),
                      prefixIcon: Icon(
                        Icons.search_rounded,
                        size: 20,
                        color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                      ),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded, size: 18),
                              onPressed: () {
                                _searchController.clear();
                                ref.read(posSearchQueryProvider.notifier).state = '';
                              },
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    onChanged: (val) {
                      ref.read(posSearchQueryProvider.notifier).state = val;
                      setState(() {});
                    },
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Transaction Status Pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: cartState.isEmpty
                      ? (isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated)
                      : AppColors.brandAmber.withValues(alpha: 0.15),
                  borderRadius: AppRadius.radiusMd,
                  border: Border.all(
                    color: cartState.isEmpty
                        ? (isDark ? AppColors.darkBorder : AppColors.lightBorder)
                        : AppColors.brandAmber.withValues(alpha: 0.35),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      cartState.isEmpty
                          ? Icons.point_of_sale_outlined
                          : Icons.shopping_cart_checkout_rounded,
                      size: 16,
                      color: cartState.isEmpty
                          ? (isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary)
                          : AppColors.brandAmber,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      cartState.isEmpty
                          ? 'NEW TRANSACTION'
                          : '${cartState.itemCount} ITEMS IN ORDER',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                        color: cartState.isEmpty
                            ? (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary)
                            : AppColors.brandAmber,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Row 3: Category Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                AppChip(
                  label: 'All Products',
                  isSelected: selectedCategory == 'all',
                  onSelected: (_) => ref.read(posSelectedCategoryProvider.notifier).state = 'all',
                ),
                const SizedBox(width: 8),
                categoriesAsync.maybeWhen(
                  data: (cats) {
                    return Row(
                      mainAxisSize: MainAxisSize.min,
                      children: cats.map((cat) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: AppChip(
                            label: cat.name,
                            isSelected: selectedCategory.toLowerCase() == cat.id.toLowerCase(),
                            onSelected: (_) =>
                                ref.read(posSelectedCategoryProvider.notifier).state = cat.id,
                          ),
                        );
                      }).toList(),
                    );
                  },
                  orElse: () => const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
