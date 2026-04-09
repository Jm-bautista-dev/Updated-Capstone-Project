<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
        .header { text-align: center; padding-bottom: 20px; }
        .status-low { color: #f59e0b; font-weight: bold; font-size: 24px; }
        .status-out { color: #ef4444; font-weight: bold; font-size: 24px; }
        .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { font-size: 12px; color: #6b7280; text-align: center; margin-top: 30px; }
        .btn { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            @if($statusType === 'out')
                <h1 class="status-out">❌ OUT OF STOCK</h1>
            @else
                <h1 class="status-low">⚠️ LOW STOCK ALERT</h1>
            @endif
        </div>

        <p>This is an automated alert from your <strong>Maki POS & Inventory System</strong>.</p>

        <div class="details">
            <h2 style="margin-top: 0;">{{ $item->name }}</h2>
            <p><strong>Current Level:</strong> {{ number_format($item->quantity, 4) }} {{ $item->unit }}</p>
            <p><strong>Equivalent:</strong> {{ number_format($item->available_pos_units, 0) }} {{ $item->pos_unit_label }}</p>
            <p><strong>Threshold:</strong> {{ number_format($item->low_stock_threshold, 4) }} {{ $item->unit }}</p>
            <p><strong>Status:</strong> 
                @if($statusType === 'out')
                    <span style="color: #ef4444; font-weight: bold;">DEPLETED</span>
                @else
                    <span style="color: #f59e0b; font-weight: bold;">RUNNING LOW</span>
                @endif
            </p>
        </div>

        <p>Please restock this item immediately to avoid transaction delays.</p>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="{{ config('app.url') }}/inventory-items" class="btn">View Inventory</a>
        </div>

        <div class="footer">
            <p>&copy; {{ date('Y') }} Maki POS System. All rights reserved.</p>
            <p>Automated Stock Intelligence System</p>
        </div>
    </div>
</body>
</html>
