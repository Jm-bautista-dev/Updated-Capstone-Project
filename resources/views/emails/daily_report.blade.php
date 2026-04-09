<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', sans-serif; color: #1f2937; line-height: 1.5; }
        .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
        .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .header { text-align: center; margin-bottom: 40px; }
        .title { font-size: 24px; font-weight: 800; color: #111827; margin: 0; }
        .subtitle { color: #6b7280; font-size: 14px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .stat-card { border: 1px solid #f3f4f6; border-radius: 8px; padding: 16px; background: #f9fafb; }
        .stat-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-value { font-size: 20px; font-weight: 800; color: #111827; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase; padding: 12px 8px; border-bottom: 1px solid #e5e7eb; }
        td { padding: 12px 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; }
        .badge-out { background: #fee2e2; color: #ef4444; }
        .badge-low { background: #fef3c7; color: #d97706; }
        .badge-good { background: #d1fae5; color: #059669; }
        .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Daily Operations Report</h1>
            <p class="subtitle">{{ now()->format('l, F d, Y') }} • System Summary</p>
        </div>

        <!-- Sales Summary -->
        <div class="card">
            <h2 style="font-size: 16px; margin-top: 0;">💰 Sales Performance</h2>
            <div class="grid" style="display: table; width: 100%;">
                <div style="display: table-cell; width: 50%;">
                    <div class="stat-card">
                        <div class="stat-label">Total Revenue</div>
                        <div class="stat-value">₱{{ number_format($data['total_revenue'], 2) }}</div>
                    </div>
                </div>
                <div style="display: table-cell; width: 50%; padding-left: 20px;">
                    <div class="stat-card">
                        <div class="stat-label">Total Transactions</div>
                        <div class="stat-value">{{ $data['total_transactions'] }}</div>
                    </div>
                </div>
            </div>

            <h3 style="font-size: 13px; margin: 20px 0 10px;">🏆 Top Selling Products</h3>
            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th style="text-align: right;">Quantity Sold</th>
                        <th style="text-align: right;">Total Sales</th>
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

        <!-- Inventory Status -->
        <div class="card">
            <h2 style="font-size: 16px; margin-top: 0;">📦 Inventory Status</h2>
            <table>
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Current Stock</th>
                        <th>Scale (g/ml)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($data['inventory'] as $item)
                    <tr>
                        <td><strong>{{ $item->name }}</strong></td>
                        <td>{{ number_format($item->quantity, 2) }} {{ $item->unit }}</td>
                        <td>{{ number_format($item->available_pos_units, 0) }} {{ $item->pos_unit_label }}</td>
                        <td>
                            @if($item->quantity <= 0)
                                <span class="badge badge-out">OUT OF STOCK</span>
                            @elseif($item->quantity <= $item->low_stock_threshold)
                                <span class="badge badge-low">LOW STOCK</span>
                            @else
                                <span class="badge badge-good">HEALTHY</span>
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>Generated automatically by Maki POS System at {{ now()->format('h:i A') }}</p>
            <p>&copy; {{ date('Y') }} Maki POS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
