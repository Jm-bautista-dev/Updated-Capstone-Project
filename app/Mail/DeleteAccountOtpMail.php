<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DeleteAccountOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $otp;
    public string $userName;

    public function __construct(string $otp, string $userName = 'Valued Customer')
    {
        $this->otp = $otp;
        $this->userName = $userName;
    }

    public function build()
    {
        return $this->subject('MakiDesu - Account Deletion Verification Code')
                    ->html("
                        <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                            <h2 style='color: #111827;'>Account Deletion Verification Code</h2>
                            <p>Hello <strong>{$this->userName}</strong>,</p>
                            <p>You requested to delete your MakiDesu account. Use the verification code below to confirm this action:</p>
                            <div style='text-align: center; margin: 30px 0;'>
                                <span style='display: inline-block; background-color: #FEF2F2; color: #DC2626; font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px 24px; border-radius: 8px; border: 1px dashed #FCA5A5;'>{$this->otp}</span>
                            </div>
                            <p style='color: #6B7280; font-size: 14px;'>This code is valid for <strong>10 minutes</strong>. If you did not make this request, please ignore this email and change your account password immediately.</p>
                            <hr style='border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;' />
                            <p style='color: #9CA3AF; font-size: 12px;'>MakiDesu Japanese Fast Food POS & Ordering System</p>
                        </div>
                    ");
    }
}
