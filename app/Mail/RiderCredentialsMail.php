<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RiderCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $riderName;
    public string $riderEmail;
    public string $plainPassword;

    /**
     * Create a new message instance.
     */
    public function __construct(string $name, string $email, string $password)
    {
        $this->riderName     = $name;
        $this->riderEmail    = $email;
        $this->plainPassword = $password;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Rider Account Credentials – Maki POS',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.rider_credentials',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
