<x-mail::message>
# Email Verification

Hello!

You are receiving this email because you requested a verification code for your account.

Your verification code is:

<x-mail::panel>
**{{ $code }}**
</x-mail::panel>

This code will expire in 15 minutes.

If you did not request this code, no further action is required.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
