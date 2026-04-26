<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1f2937; line-height: 1.6; background: #f8fafc; padding: 20px; margin: 0; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: #ffffff; padding: 40px 32px; text-align: center; }
        .header-icon { width: 64px; height: 64px; margin: 0 auto 16px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.025em; }
        .header p { margin: 8px 0 0; opacity: 0.85; font-size: 13px; font-weight: 500; }
        .content { padding: 32px; }
        .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
        .intro { font-size: 14px; color: #475569; margin-bottom: 24px; line-height: 1.7; }
        .credentials-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .credentials-box h3 { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 0 0 16px 0; }
        .credential-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .credential-row:last-child { border-bottom: none; padding-bottom: 0; }
        .credential-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .credential-value { font-size: 14px; font-weight: 700; color: #0f172a; font-family: 'SF Mono', 'Fira Code', monospace; }
        .password-value { font-size: 18px; font-weight: 800; color: #1e293b; letter-spacing: 0.1em; background: #f1f5f9; padding: 4px 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
        .warning-box { background: #fee2e2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin-bottom: 24px; display: flex; gap: 12px; align-items: flex-start; }
        .warning-icon { width: 24px; height: 24px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #ffffff; flex-shrink: 0; }
        .warning-text { font-size: 13px; color: #991b1b; font-weight: 700; line-height: 1.5; }
        .steps { margin-bottom: 24px; }
        .steps h3 { font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; }
        .step { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
        .step-number { width: 24px; height: 24px; background: #1e293b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: white; flex-shrink: 0; }
        .step-text { font-size: 13px; color: #475569; line-height: 1.5; padding-top: 2px; }
        .footer { background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 4px 0; font-size: 11px; color: #94a3b8; }
        .footer .brand { font-weight: 800; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-icon">🏢</div>
            <h1>Employee Onboarding</h1>
            <p>Your access to Maki POS has been authorized</p>
        </div>

        <div class="content">
            <p class="greeting">Hello {{ $name }},</p>
            <p class="intro">
                An administrator has created your account on the Maki POS System. 
                You can now log in using the credentials below.
            </p>

            <div class="credentials-box">
                <h3>🔐 Your Login Credentials</h3>
                <div class="credential-row">
                    <span class="credential-label">Email</span>
                    <span class="credential-value">{{ $email }}</span>
                </div>
                <div class="credential-row">
                    <span class="credential-label">Password</span>
                    <span class="password-value">{{ $password }}</span>
                </div>
            </div>

            <div class="warning-box">
                <div class="warning-icon">!</div>
                <div class="warning-text">
                    SECURITY REQUIREMENT: You are required to change your password immediately after your first login.
                </div>
            </div>

            <div class="steps">
                <h3>🚀 Next Steps</h3>
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-text">Navigate to the login page</div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-text">Enter your email and temporary password</div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-text">Create your new permanent password when prompted</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p class="brand">Maki POS — Internal System</p>
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; {{ date('Y') }} Maki POS System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
