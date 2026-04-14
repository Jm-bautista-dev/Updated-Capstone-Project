<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', sans-serif; color: #1f2937; line-height: 1.5; background: #f3f4f6; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: transparent; }
        .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: 800; color: #111827; margin: 0; }
        .subtitle { color: #6b7280; font-size: 14px; }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .stat-card { border: 1px solid #f3f4f6; border-radius: 8px; padding: 16px; background: #f9fafb; display: inline-block; width: 45%; vertical-align: top; }
        .stat-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-value { font-size: 20px; font-weight: 800; color: #111827; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase; padding: 12px 8px; border-bottom: 1px solid #e5e7eb; }
        td { padding: 12px 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; }
        .badge-out { background: #fee2e2; color: #ef4444; }
        .badge-low { background: #fef3c7; color: #d97706; }
        .badge-good { background: #d1fae5; color: #059669; }
        .branch-header { background: #f3f4f6; padding: 8px 12px; font-size: 14px; font-weight: 800; color: #374151; margin-top: 20px; border-radius: 6px; }
        .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Daily Operations Report</h1>
            <p class="subtitle">{{ now()->format('l, F d, Y') }} • Maki POS System</p>
        </div>

        <!-- Sales Performance -->
        <div class="card">
            <h2 style="font-size: 16px; margin-top: 0; color: #059669;">💰 Sales Performance</h2>
            <div style="width: 100%;">
                <div class="stat-card">
                    <div class="stat-label">Total Revenue</div>
                    <div class="stat-value">₱{{ number_format($data['total_revenue'], 2) }}</div>
                </div>
                <div class="stat-card" style="margin-left: 5%;">
                    <div class="stat-label">Total Transactions</div>
                    <div class="stat-value">{{ $data['total_transactions'] }}</div>
                </div>
            </div>

            <h3 style="font-size: 13px; margin: 24px 0 10px; text-transform: uppercase; color: #6b7280;">🏆 Top Selling Products</h3>
            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th style="text-align: right;">Qty Sold</th>
                        <th style="text-align: right;">Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($data['top_products'] as $product)
                    <tr>
                        <td><strong>{{ $product->name }}</strong></td>
                        <td style="text-align: right;">{{ $product->total_qty }}</td>
                        <td style="text-align: right;">₱{{ number_format($product->total_revenue, 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Branch-Specific Inventory -->
        <div class="card">
            <h2 style="font-size: 16px; margin-top: 0; color: #3b82f6;">📦 Ingredient Inventory</h2>
            
            @forelse($data['ingredient_inventory'] as $branchName => $stocks)
                <div class="branch-header">📍 {{ $branchName }}</div>
                <table>
                    <thead>
                        <tr>
                            <th>Ingredient</th>
                            <th>Stock</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($stocks as $stock)
                        <tr>
                            <td><strong>{{ $stock->ingredient->name }}</strong></td>
                            <td>{{ number_format($stock->stock, 2) }} {{ $stock->ingredient->unit }}</td>
                            <td>
                                @if($stock->stock <= 0)
                                    <span class="badge badge-out">OUT</span>
                                @elseif($stock->stock <= $stock->low_stock_level)
                                    <span class="badge badge-low">LOW</span>
                                @else
                                    <span class="badge badge-good">OK</span>
                                @endif
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            @empty
                <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 20px;">No ingredient stocks found.</p>
            @endforelse
        </div>

        @if($data['legacy_inventory']->isNotEmpty())
        <!-- Legacy Inventory Items -->
        <div class="card">
            <h2 style="font-size: 16px; margin-top: 0; color: #6b7280;">🏷️ Other Items (Legacy)</h2>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Stock</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($data['legacy_inventory'] as $item)
                    <tr>
                        <td>{{ $item->name }}</td>
                        <td>{{ number_format($item->quantity, 2) }} {{ $item->unit }}</td>
                        <td>
                            @if($item->quantity <= 0)
                                <span class="badge badge-out">OUT</span>
                            @elseif($item->quantity <= $item->low_stock_threshold)
                                <span class="badge badge-low">LOW</span>
                            @else
                                <span class="badge badge-good">OK</span>
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif

        <div class="footer">
            <p>Generated automatically at {{ now()->format('h:i A') }}</p>
            <p>&copy; {{ date('Y') }} Maki POS System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
