import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/utils/responsive_layout.dart';
import '../../../products/data/models/product_model.dart';
import '../../../products/data/models/product_variant_model.dart';
import '../providers/pos_cart_provider.dart';
import '../providers/pos_realtime_products_provider.dart';
import 'pos_product_card.dart';

/// Product Catalog Grid for POS with real-time Firestore updates and responsive column layout
class PosProductGrid extends ConsumerWidget {
  const PosProductGrid({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final productsAsync = ref.watch(posProductsStreamProvider);
    final filteredProducts = ref.watch(posFilteredProductsProvider);
    final cartState = ref.watch(posCartNotifierProvider);
    final cartNotifier = ref.read(posCartNotifierProvider.notifier);
    final searchQuery = ref.watch(posSearchQueryProvider);

    return productsAsync.when(
      loading: () => _buildLoadingGrid(context, isDark),
      error: (err, stack) => _buildErrorState(context, isDark, err.toString()),
      data: (allProducts) {
        if (allProducts.isEmpty) {
          return _buildEmptyCatalogState(isDark);
        }

        if (filteredProducts.isEmpty) {
          return _buildEmptySearchState(context, ref, isDark, searchQuery);
        }

        final columnCount = ResponsiveLayout.getGridColumnCount(
          context,
          itemWidth: 175.0,
          minColumns: 2,
          maxColumns: 5,
        );

        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: columnCount,
            childAspectRatio: 0.67,
            crossAxisSpacing: 14,
            mainAxisSpacing: 14,
          ),
          itemCount: filteredProducts.length,
          itemBuilder: (context, index) {
            final product = filteredProducts[index];

            // Count total units of this product in cart (across all variants)
            final cartQty = cartState.items
                .where((i) => i.product.id == product.id)
                .fold(0, (sum, i) => sum + i.quantity);

            return PosProductCard(
              product: product,
              cartQuantity: cartQty,
              onAddToCart: ({
                required ProductModel product,
                ProductVariantModel? sizeVariant,
                ProductVariantModel? grindVariant,
                required int quantity,
              }) {
                cartNotifier.addItem(
                  product: product,
                  sizeVariant: sizeVariant,
                  grindVariant: grindVariant,
                  quantity: quantity,
                );
              },
            );
          },
        );
      },
    );
  }

  Widget _buildLoadingGrid(BuildContext context, bool isDark) {
    final columnCount = ResponsiveLayout.getGridColumnCount(
      context,
      itemWidth: 175.0,
      minColumns: 2,
      maxColumns: 5,
    );

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: columnCount,
        childAspectRatio: 0.67,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
      ),
      itemCount: 6,
      itemBuilder: (_, __) => Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
          borderRadius: AppRadius.radiusMd,
          border: Border.all(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          ),
        ),
        child: Column(
          children: [
            Expanded(
              flex: 5,
              child: Container(
                color: isDark ? AppColors.shimmerBaseDark : AppColors.shimmerBase,
              ),
            ),
            Expanded(
              flex: 4,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Container(
                      height: 12,
                      width: 100,
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.shimmerBaseDark : AppColors.shimmerBase,
                        borderRadius: AppRadius.radiusSm,
                      ),
                    ),
                    Container(
                      height: 10,
                      width: 60,
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.shimmerBaseDark : AppColors.shimmerBase,
                        borderRadius: AppRadius.radiusSm,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptySearchState(BuildContext context, WidgetRef ref, bool isDark, String query) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.search_off_rounded,
              size: 54,
              color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
            ),
            const SizedBox(height: 14),
            Text(
              'No Products Found',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'No items match "$query" in the current category.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () {
                ref.read(posSearchQueryProvider.notifier).state = '';
                ref.read(posSelectedCategoryProvider.notifier).state = 'all';
              },
              child: const Text('Reset Catalog Filters'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyCatalogState(bool isDark) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.coffee_rounded,
            size: 56,
            color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
          ),
          const SizedBox(height: 14),
          Text(
            'Product Catalog Empty',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Waiting for real-time Firestore catalog synchronization...',
            style: TextStyle(
              fontSize: 13,
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, bool isDark, String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded, size: 48, color: AppColors.error),
            const SizedBox(height: 12),
            Text(
              'Catalog Synchronization Error',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: AppColors.error),
            ),
          ],
        ),
      ),
    );
  }
}
