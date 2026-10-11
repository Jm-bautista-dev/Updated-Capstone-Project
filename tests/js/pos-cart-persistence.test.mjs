// Test Suite for POS Cart Persistence & Scoping Logic

class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  key(index) {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  get length() {
    return this.store.size;
  }
}

const mockStorage = new MockLocalStorage();
globalThis.window = {
  localStorage: mockStorage,
};
globalThis.localStorage = mockStorage;

// Now import the library
const {
  getPosCartStorageKey,
  savePosCart,
  loadAndRevalidatePosCart,
  clearPosCart,
  clearAllPosCarts,
  validateCartBeforeCheckout,
  DEFAULT_DELIVERY_INFO,
} = await import('../../resources/js/lib/pos-cart-storage.ts');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✓ PASSED: ${message}`);
  }
}

console.log('\n--- Running POS Cart Persistence Verification Suite ---\n');

// Test 1: Storage Key Scoping
const key1 = getPosCartStorageKey(1, 10);
const key2 = getPosCartStorageKey(2, 10);
const key3 = getPosCartStorageKey(1, 20);
assert(key1 === 'makidesu_pos_cart_u1_b10', 'Key generation format matches expected format');
assert(key1 !== key2, 'Cashier 1 and Cashier 2 have distinct storage keys');
assert(key1 !== key3, 'Branch 10 and Branch 20 have distinct storage keys');

// Test 2: Save and Restore Cart with Addons, Discounts, and Quantities
mockStorage.clear();
const sampleCart = [
  {
    id: 101,
    name: 'California Maki',
    sku: 'CAL-01',
    selling_price: 150,
    stock: 20,
    quantity: 2,
    selected_addons: [
      { addon_id: 5, name: 'Extra Wasabi', price: 15, quantity: 1, subtotal: 15 }
    ]
  }
];

const saved = savePosCart(1, 10, {
  cart: sampleCart,
  orderType: 'takeout',
  kioskStep: 'checkout',
  activeDiscount: {
    type: 'senior_pwd',
    typeName: 'Senior Citizen',
    percentage: 20,
    customerName: 'Maria Santos',
    idNumber: 'SC-12345',
  },
  deliveryInfo: { ...DEFAULT_DELIVERY_INFO },
  calculatedDeliveryFee: null,
});
assert(saved === true, 'Cart successfully saved to storage');

// Restore under identical user and branch
const catalog = [
  {
    id: 101,
    name: 'California Maki',
    selling_price: 150,
    stock: 20,
    available_addons: [{ id: 5, name: 'Extra Wasabi', price: 15 }]
  }
];

const restoredSame = loadAndRevalidatePosCart(1, 10, catalog);
assert(restoredSame.isRestored === true, 'Cart is marked as restored');
assert(restoredSame.cart.length === 1, 'Restored cart has 1 product');
assert(restoredSame.cart[0].quantity === 2, 'Restored quantity preserved as 2');
assert(restoredSame.orderType === 'takeout', 'Restored orderType is takeout');
assert(restoredSame.kioskStep === 'checkout', 'Restored kioskStep is checkout');
assert(restoredSame.activeDiscount?.idNumber === 'SC-12345', 'Restored discount ID number preserved');

// Test 3: Cashier and Branch Isolation (Different cashier tries to load)
const restoredOtherUser = loadAndRevalidatePosCart(2, 10, catalog);
assert(restoredOtherUser.isRestored === false, 'Different cashier cannot access user 1 cart');
assert(restoredOtherUser.cart.length === 0, 'Different cashier receives empty cart');

// Different branch tries to load
const restoredOtherBranch = loadAndRevalidatePosCart(1, 20, catalog);
assert(restoredOtherBranch.isRestored === false, 'Different branch cannot access branch 10 cart');
assert(restoredOtherBranch.cart.length === 0, 'Different branch receives empty cart');

// Test 4: Authoritative Catalog Revalidation (Sold-Out Product Removed)
const catalogSoldOut = [
  {
    id: 101,
    name: 'California Maki',
    selling_price: 150,
    stock: 0, // sold out now
    available_addons: [{ id: 5, name: 'Extra Wasabi', price: 15 }]
  }
];
const restoredSoldOut = loadAndRevalidatePosCart(1, 10, catalogSoldOut);
assert(restoredSoldOut.cart.length === 0, 'Sold out item is removed from restored cart');
assert(restoredSoldOut.notices.some(n => n.includes('sold out')), 'Notice generated for sold out item');

// Test 5: Authoritative Catalog Revalidation (Stock Limit Clamping)
savePosCart(1, 10, {
  cart: [{ ...sampleCart[0], quantity: 15 }],
  orderType: 'dine-in',
  kioskStep: 'browse',
  activeDiscount: null,
  deliveryInfo: { ...DEFAULT_DELIVERY_INFO },
  calculatedDeliveryFee: null,
});

const catalogLowStock = [
  {
    id: 101,
    name: 'California Maki',
    selling_price: 150,
    stock: 5, // only 5 available
    available_addons: [{ id: 5, name: 'Extra Wasabi', price: 15 }]
  }
];
const restoredLowStock = loadAndRevalidatePosCart(1, 10, catalogLowStock);
assert(restoredLowStock.cart[0].quantity === 5, 'Quantity clamped to available stock 5');
assert(restoredLowStock.notices.some(n => n.includes('adjusted')), 'Notice generated for quantity adjustment');

// Test 6: Authoritative Catalog Revalidation (Price Update Sync)
const catalogNewPrice = [
  {
    id: 101,
    name: 'California Maki',
    selling_price: 180, // price increased
    stock: 20,
    available_addons: [{ id: 5, name: 'Extra Wasabi', price: 20 }] // addon price increased
  }
];
const restoredNewPrice = loadAndRevalidatePosCart(1, 10, catalogNewPrice);
assert(restoredNewPrice.cart[0].selling_price === 180, 'Cart item price updated to fresh catalog price 180');
assert(restoredNewPrice.cart[0].selected_addons?.[0].price === 20, 'Addon price updated to fresh catalog price 20');

// Test 7: Safe Handling of Corrupted JSON
mockStorage.setItem('makidesu_pos_cart_u1_b10', '{malformed json!@#$%');
const restoredCorrupt = loadAndRevalidatePosCart(1, 10, catalog);
assert(restoredCorrupt.isRestored === false, 'Corrupted JSON handled safely without crash');
assert(restoredCorrupt.cart.length === 0, 'Corrupted JSON returns empty cart');
assert(mockStorage.getItem('makidesu_pos_cart_u1_b10') === null, 'Corrupted entry pruned from storage');

// Test 8: Pre-Checkout Validation
const validCheck = validateCartBeforeCheckout(sampleCart, catalog);
assert(validCheck.isValid === true, 'Pre-checkout passes with valid stock and price');

const invalidCheck = validateCartBeforeCheckout(sampleCart, catalogSoldOut);
assert(invalidCheck.isValid === false, 'Pre-checkout blocks checkout if item is sold out');

// Test 9: Clear Scoped Cart & Clear All
savePosCart(1, 10, {
  cart: sampleCart,
  orderType: 'dine-in',
  kioskStep: 'browse',
  activeDiscount: null,
  deliveryInfo: { ...DEFAULT_DELIVERY_INFO },
  calculatedDeliveryFee: null,
});
assert(mockStorage.length === 1, 'Storage has 1 item before clear');
clearPosCart(1, 10);
assert(mockStorage.length === 0, 'Scoped clearPosCart removed target key');

// Clear all carts (e.g. on terminal logout)
savePosCart(1, 10, {
  cart: sampleCart,
  orderType: 'dine-in',
  kioskStep: 'browse',
  activeDiscount: null,
  deliveryInfo: { ...DEFAULT_DELIVERY_INFO },
  calculatedDeliveryFee: null,
});
savePosCart(2, 20, {
  cart: sampleCart,
  orderType: 'dine-in',
  kioskStep: 'browse',
  activeDiscount: null,
  deliveryInfo: { ...DEFAULT_DELIVERY_INFO },
  calculatedDeliveryFee: null,
});
assert(mockStorage.length === 2, 'Storage has 2 cashier carts');
clearAllPosCarts();
assert(mockStorage.length === 0, 'clearAllPosCarts removed all cart keys');

console.log('\n🎉 ALL 18 POS CART PERSISTENCE & SCOPING TESTS PASSED PERFECTLY!\n');
