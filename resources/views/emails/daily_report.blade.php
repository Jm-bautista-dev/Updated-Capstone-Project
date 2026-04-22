<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', -apple-system, sans-serif; color: #1f2937; line-height: 1.6; background: #f8fafc; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
        .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 32px 24px; }
        .section { margin-bottom: 32px; }
        .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 16px; display: flex; align-items: center; }
        
        .branch-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
        .branch-name { font-weight: 800; color: #0f172a; margin-bottom: 4px; font-size: 16px; }
        .branch-stats { font-size: 14px; color: #475569; }
        .branch-top-product { font-size: 12px; color: #64748b; font-style: italic; margin-top: 4px; }

        .inventory-list { list-style: none; padding: 0; margin: 0; }
        .inventory-item { padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; display: flex; justify-content: space-between; }
        .inventory-item:last-child { border-bottom: none; }
        .status-pill { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .status-out { background: #fee2e2; color: #991b1b; }
        .status-low { background: #fef3c7; color: #92400e; }

        .insight-card { background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 16px; }
        .insight-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px; }
        .insight-row:last-child { margin-bottom: 0; }
        .insight-label { color: #166534; font-weight: 600; }
        .insight-value { font-weight: 800; color: #14532d; }

        .footer { background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
        .no-data { color: #94a3b8; font-style: italic; font-size: 14px; padding: 12px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 DAILY SUMMARY</h1>
            <p>{{ $data['date'] }} • Maki POS Business Report</p>
        </div>

        <div class="content">
            <!-- SALES PERFORMANCE -->
            <div class="section">
                <div class="section-title">🏪 SALES PERFORMANCE</div>
                @forelse($data['branch_summaries'] as $summary)
                    <div class="branch-card">
                        <div class="branch-name">{{ $summary['name'] }}</div>
                        <div class="branch-stats">
                            <strong>₱{{ number_format($summary['total_sales'], 2) }}</strong> | {{ $summary['orders_count'] }} orders
                        </div>
                        <div class="branch-top-product">
                            ✨ Top Product: {{ $summary['top_product'] }}
                        </div>
                    </div>
                @empty
                    <div class="no-data">No sales recorded today.</div>
                @endforelse
            </div>

            <!-- INVENTORY ALERTS -->
            <div class="section">
                <div class="section-title">📦 INVENTORY ALERTS</div>
                
                @if($data['out_of_stock']->isNotEmpty())
                    <p style="font-size: 13px; font-weight: 700; color: #ef4444; margin-bottom: 8px;">🔴 Out of Stock</p>
                    <ul class="inventory-list" style="margin-bottom: 20px;">
                        @foreach($data['out_of_stock'] as $item)
                            <li class="inventory-item">
                                <span>{{ $item->ingredient->name }} ({{ $item->branch->name }})</span>
                                <span class="status-pill status-out">OUT</span>
                            </li>
                        @endforeach
                    </ul>
                @endif

                @if($data['low_stock']->isNotEmpty())
                    <p style="font-size: 13px; font-weight: 700; color: #f59e0b; margin-bottom: 8px;">🟡 Low Stock</p>
                    <ul class="inventory-list">
                        @foreach($data['low_stock'] as $item)
                            <li class="inventory-item">
                                <span>{{ $item->ingredient->name }} ({{ $item->branch->name }})</span>
                                <span style="color: #64748b;">{{ number_format($item->stock, 1) }} {{ $item->ingredient->unit }} left</span>
                            </li>
                        @endforeach
                    </ul>
                @endif

                @if($data['out_of_stock']->isEmpty() && $data['low_stock']->isEmpty())
                    <div class="no-data">No inventory alerts today. All stocks are healthy! ✅</div>
                @endif
            </div>

            <!-- KEY INSIGHTS -->
            <div class="section" style="margin-bottom: 0;">
                <div class="section-title">📈 OVERVIEW</div>
                <div class="insight-card">
                    <div class="insight-row">
                        <span class="insight-label">Total Sales Today</span>
                        <span class="insight-value">₱{{ number_format($data['overall_total'], 2) }}</span>
                    </div>
                    <div class="insight-row">
                        <span class="insight-label">Best Performing Branch</span>
                        <span class="insight-value">{{ $data['best_branch'] }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Generated automatically at 7:00 PM (Server Time)</p>
            <p>This is an automated system report. Please do not reply.</p>
            <p>&copy; {{ date('Y') }} Maki POS System</p>
        </div>
    </div>
</body>
</html>
