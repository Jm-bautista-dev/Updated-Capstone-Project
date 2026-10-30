import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lambac_app/core/widgets/buttons/app_favorite_button.dart';
import 'package:lambac_app/core/widgets/cards/app_product_card.dart';
import 'package:lambac_app/core/widgets/cards/app_product_list_card.dart';

void main() {
  group('AppProductCard Widget Tests', () {
    testWidgets('Renders product information accurately', (WidgetTester tester) async {
      bool favoriteToggled = false;
      bool addedToCart = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: AppProductCard(
                id: 'test-apo',
                name: 'Mt. Apo Honey Anaerobic',
                origin: 'Davao del Sur, PH',
                tastingNotes: 'Wild raspberry and honey',
                price: 480.0,
                roastLevel: 'Light Roast',
                onFavoriteToggle: (fav) => favoriteToggled = fav,
                onAddToCart: () => addedToCart = true,
              ),
            ),
          ),
        ),
      );

      expect(find.text('Mt. Apo Honey Anaerobic'), findsOneWidget);
      expect(find.text('DAVAO DEL SUR, PH'), findsOneWidget);
      expect(find.text('Wild raspberry and honey'), findsOneWidget);
      expect(find.text('Light Roast'), findsOneWidget);
      expect(find.text('₱480.00'), findsOneWidget);

      // Tap favorite button
      await tester.tap(find.byType(AppFavoriteButton));
      await tester.pumpAndSettle();
      expect(favoriteToggled, isTrue);

      // Tap Add-to-cart button
      await tester.tap(find.byIcon(Icons.add_rounded));
      await tester.pumpAndSettle();
      expect(addedToCart, isTrue);
    });

    testWidgets('AppProductListCard renders in horizontal layout', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: AppProductListCard(
                id: 'test-tokyo',
                name: 'Tokyo Kissaten House Blend',
                origin: 'Lambac Signature',
                tastingNotes: 'Velvet crema and cocoa',
                price: 380.0,
                roastLevel: 'Dark Roast',
                onAddToCart: () {},
              ),
            ),
          ),
        ),
      );

      expect(find.text('Tokyo Kissaten House Blend'), findsOneWidget);
      expect(find.text('₱380.00'), findsOneWidget);
      expect(find.text('Add'), findsOneWidget);
    });
  });
}
