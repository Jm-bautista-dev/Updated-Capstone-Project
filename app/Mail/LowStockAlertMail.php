<?php

namespace App\Mail;

use App\Models\InventoryItem;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LowStockAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public $item;
    public $statusType; // 'low' or 'out'

    /**
     * Create a new message instance.
     */
    public function __construct(InventoryItem $item, string $statusType)
    {
        $this->item = $item;
        $this->statusType = $statusType;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->statusType === 'out' 
            ? "❌ CRITICAL: {$this->item->name} is OUT OF STOCK" 
            : "⚠️ ALERT: {$this->item->name} is LOW ON STOCK";

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.low_stock_alert',
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
