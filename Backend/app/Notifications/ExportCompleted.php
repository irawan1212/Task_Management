<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ExportCompleted extends Notification
{
    use Queueable;

    protected $downloadUrl;

    public function __construct($downloadUrl)
    {
        $this->downloadUrl = $downloadUrl;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Your Task Export is Ready')
            ->line('Your requested task export has been completed.')
            ->action('Download File', $this->downloadUrl)
            ->line('The download link will expire in 24 hours.');
    }
}