import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_shadows.dart';
import '../../../../core/utils/currency_formatter.dart';
import '../../../../core/widgets/feedback/app_toast.dart';
import '../../../products/data/models/product_model.dart';
import '../../../products/data/models/product_variant_model.dart';
import '../../../products/presentation/widgets/app_product_image.dart';
import 'pos_variant_selector_modal.dart';

/// Production POS Product Card optimized for high-speed counter transactions
class PosProductCard extends StatelessWidget {
  final ProductModel product;
  final int cartQuantity;
  final void Function({
    required ProductModel product,
    ProductVariantModel? sizeVariant,
    ProductVariantModel? grindVariant,
    required int quantity,
  }) onAddToCart;

  const PosProductCard({
    super.key,
    required this.product,
    this.cartQuantity = 0,
    required this.onAddToCart,
  });

  bool get _isUnavailable => product.isSoldOut || !product.isEnabled;
  bool get _hasVariants => product.sizeVariants.isNotEmpty || product.grindVariants.isNotEmpty;

  void _handleTap(BuildContext context) {
    if (_isUnavailable) {
      AppToast.info(context, '${product.name} is currently sold out or unavailable.');
      return;
    }

    if (_hasVariants) {
      PosVariantSelectorModal.show(
        context,
        product: product,
        onAddToCart: onAddToCart,
      );
    } else {
      onAddToCart(
        product: product,
        quantity: 1,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final availabilityColor = _isUnavailable
        ? AppColors.error
        : (product.availability == ProductAvailability.lowStock
            ? AppColors.warning
            : AppColors.success);

    final availabilityText = _isUnavailable
        ? 'SOLD OUT'
        : (product.availability == ProductAvailability.lowStock ? 'LIMITED' : 'IN STOCK');

    return InkWell(
      onTap: () => _handleTap(context),
      borderRadius: AppRadius.radiusMd,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : AppColors.lightSurfaceElevated,
          borderRadius: AppRadius.radiusMd,
          border: Border.all(
            color: cartQuantity > 0
                ? AppColors.brandAmber
                : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
            width: cartQuantity > 0 ? 1.8 : 1.0,
          ),
          boxShadow: isDark ? AppShadows.cardDark : AppShadows.cardLight,
        ),
        child: ClipRRect(
          borderRadius: AppRadius.radiusMd,
          child: Stack(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Product Image Area with Aspect Ratio
                  Expanded(
                    flex: 5,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        AppProductImage(
                          imageUrl: product.imageUrl,
                          fit: BoxFit.cover,
                        ),
                        // Dark gradient overlay for text readability
                        Positioned.fill(
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.black.withValues(alpha: 0.25),
                                  Colors.transparent,
                                  Colors.black.withValues(alpha: 0.45),
                                ],
                              ),
                            ),
                          ),
                        ),
                        // Category Pill Top-Left
                        Positioned(
                          top: 8,
                          left: 8,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.65),
                              borderRadius: AppRadius.radiusPill,
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.2),
                                width: 0.8,
                              ),
                            ),
                            child: Text(
                              product.categoryName.toUpperCase(),
                              style: const TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.6,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                        // Availability Tag Top-Right
                        Positioned(
                          top: 8,
                          right: 8,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(
                              color: availabilityColor.withValues(alpha: 0.9),
                              borderRadius: AppRadius.radiusPill,
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 5,
                                  height: 5,
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  availabilityText,
                                  style: const TextStyle(
                                    fontSize: 8.5,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.5,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        // Cart Quantity Badge Bottom-Right of Image
                        if (cartQuantity > 0)
                          Positioned(
                            bottom: 8,
                            right: 8,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.brandAmber,
                                borderRadius: AppRadius.radiusPill,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.3),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.shopping_bag_rounded, size: 12, color: Colors.white),
                                  const SizedBox(width: 4),
                                  Text(
                                    '$cartQuantity in cart',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),

                  // Product Details Area
                  Expanded(
                    flex: 5,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                product.name,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  height: 1.2,
                                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 3),
                              Text(
                                '${product.origin} • ${product.roastLevel}',
                                style: TextStyle(
                                  fontSize: 10.5,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    CurrencyFormatter.format(product.basePrice),
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: isDark ? AppColors.brandAmberLight : AppColors.brandAmberDark,
                                    ),
                                  ),
                                  if (_hasVariants)
                                    Text(
                                      'Options avail.',
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w500,
                                        color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                                      ),
                                    ),
                                ],
                              ),
                              // Fast Add Button
                              Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  color: _isUnavailable
                                      ? (isDark ? AppColors.darkBorder : AppColors.lightBorder)
                                      : (cartQuantity > 0 ? AppColors.brandAmber : (isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurface)),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: _isUnavailable
                                        ? Colors.transparent
                                        : (cartQuantity > 0 ? AppColors.brandAmber : (isDark ? AppColors.darkBorder : AppColors.lightBorder)),
                                    width: 1,
                                  ),
                                ),
                                child: Icon(
                                  _hasVariants ? Icons.tune_rounded : Icons.add_rounded,
                                  size: 18,
                                  color: _isUnavailable
                                      ? (isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary)
                                      : (cartQuantity > 0 ? Colors.white : (isDark ? AppColors.brandAmberLight : AppColors.brandAmberDark)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              // Disabled / Sold Out Translucent Scrim
              if (_isUnavailable)
                Positioned.fill(
                  child: Container(
                    color: (isDark ? Colors.black : Colors.white).withValues(alpha: 0.6),
                    alignment: Alignment.center,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.error,
                        borderRadius: AppRadius.radiusPill,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.3),
                            blurRadius: 6,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: const Text(
                        'UNAVAILABLE',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.0,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
