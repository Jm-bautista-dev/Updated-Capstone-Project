<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>503 Service Unavailable — {{ $title ?? 'System Under Maintenance' }}</title>
    <style>
        body { margin: 0; background: #020617; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 1.5rem; padding: 2rem; max-width: 28rem; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
        .title { font-size: 1.25rem; font-weight: 900; margin-top: 1rem; color: #ffffff; }
        .msg { font-size: 0.875rem; color: #94a3b8; margin-top: 0.5rem; line-height: 1.5; }
        .eta { margin-top: 1rem; padding: 0.75rem; background: #020617; border: 1px solid #1e293b; border-radius: 1rem; font-size: 0.75rem; color: #fbbf24; font-weight: 600; }
        .btn { display: block; width: 100%; margin-top: 1.5rem; padding: 0.75rem; background: #f43f5e; color: #ffffff; font-weight: 900; text-decoration: none; border-radius: 1rem; font-size: 0.75rem; border: none; cursor: pointer; }
    </style>
</head>
<body>
    <div class="card">
        <h1 style="margin:0; font-size: 1.5rem; font-weight: 900; color: #f43f5e;">MAKI DESU</h1>
        <p style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: #94a3b8; margin: 0.25rem 0 0 0;">OPERATIONAL SYSTEM</p>
        <div class="title">{{ $title ?? 'System Under Maintenance' }}</div>
        <div class="msg">{{ $message ?? 'We are performing scheduled maintenance. Please check back shortly.' }}</div>
        @if(!empty($estimatedRestorationTime))
            <div class="eta">Estimated Restoration: {{ $estimatedRestorationTime }}</div>
        @endif
        <button class="btn" onclick="window.location.reload()">Check Back / Refresh</button>
    </div>
</body>
</html>
