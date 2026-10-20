<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\IprogSmsService;
use App\Services\PhoneNumberService;

class TestIprogSmsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'iprog:test-sms 
                            {phone? : Philippine mobile number to test (e.g. 09171234567)}
                            {--verify= : OTP code to verify directly}
                            {--check-credits : Only check account balance and exit}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform live integration smoke test with official IPROG SMS OTP API';

    /**
     * Execute the console command.
     */
    public function handle(IprogSmsService $smsService): int
    {
        $this->info('=====================================================');
        $this->info('  MAKI DESU - IPROG SMS Real Integration Smoke Test  ');
        $this->info('=====================================================');

        if (!$smsService->isConfigured()) {
            $this->error('[FAIL] IPROG_SMS_API_TOKEN is not configured in .env or services.php');
            return Command::FAILURE;
        }

        $this->line('[1/3] Checking provider balance & account status...');
        $credits = $smsService->getCredits();
        if (!$credits['success']) {
            $this->error('[FAIL] Unable to connect to IPROG API: ' . $credits['message']);
            return Command::FAILURE;
        }

        $this->info(" -> Account Verified. Available SMS Credits: {$credits['balance']}");

        if ($this->option('check-credits')) {
            return Command::SUCCESS;
        }

        $phone = $this->argument('phone');
        if (empty($phone)) {
            $phone = $this->ask('Enter Philippine mobile number to test (e.g. 09XXXXXXXXX or +639XXXXXXXXX)');
        }

        $normalized = PhoneNumberService::normalize($phone);
        if (!$normalized || !PhoneNumberService::isValidPhMobile($normalized)) {
            $this->error("[FAIL] Invalid Philippine mobile number: '{$phone}'. Must be 11 digits starting with 09.");
            return Command::INVALID;
        }

        $masked = PhoneNumberService::mask($normalized);
        $verifyCode = $this->option('verify');

        // Direct verify option
        if (!empty($verifyCode)) {
            $this->line("[2/3] Verifying OTP '{$verifyCode}' for {$masked} directly...");
            $verifyResult = $smsService->verifyOtp($normalized, $verifyCode);

            if ($verifyResult['success']) {
                $this->info("[SUCCESS] OTP Verified Successfully by IPROG provider!");
                return Command::SUCCESS;
            } else {
                $this->error("[FAIL] OTP verification rejected: " . $verifyResult['message']);
                return Command::FAILURE;
            }
        }

        // Send OTP
        $this->line("[2/3] Sending real OTP via IPROG to {$masked}...");
        $sendResult = $smsService->sendOtp($normalized);

        if (!$sendResult['success']) {
            $this->error("[FAIL] Provider rejected OTP dispatch: " . $sendResult['message']);
            return Command::FAILURE;
        }

        $this->info(" -> SMS OTP dispatched to carrier queue successfully!");
        $this->info(" -> Destination: {$masked}");
        $this->info(" -> Valid for: {$sendResult['expires_in_minutes']} minutes");

        // Interactive verification prompt
        $enteredCode = $this->ask('Please enter the 6-digit OTP code received on your phone (or press Enter to skip)');
        if (empty($enteredCode)) {
            $this->warn('OTP verification prompt skipped by user. Send test was successful.');
            return Command::SUCCESS;
        }

        $this->line("[3/3] Verifying code with IPROG verify_otp endpoint...");
        $verifyResult = $smsService->verifyOtp($normalized, trim($enteredCode));

        if ($verifyResult['success']) {
            $this->info('=====================================================');
            $this->info(' [PASS] Live end-to-end SMS OTP delivery & verification');
            $this->info('        confirmed working via official IPROG API!      ');
            $this->info('=====================================================');
            return Command::SUCCESS;
        } else {
            $this->error('[FAIL] OTP verification failed: ' . $verifyResult['message']);
            return Command::FAILURE;
        }
    }
}
