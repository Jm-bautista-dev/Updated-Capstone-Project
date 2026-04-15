<?php

require __DIR__.'/vendor/autoload.php';

use GuzzleHttp\Client;

$client = new Client(['base_uri' => 'http://localhost:8000']);

try {
    $response = $client->post('/api/orders', [
        'json' => [
            'customer_name' => 'Test Mobile User',
            'contact_number' => '09991122334',
            'address' => 'API Test Location',
            'items' => [
                [
                    'product_id' => 1,
                    'quantity' => 2,
                    'price' => 150.00
                ]
            ],
            'total_amount' => 300.00
        ],
        'headers' => [
            'Accept' => 'application/json'
        ]
    ]);

    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Body: " . $response->getBody() . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    if (method_exists($e, 'getResponse') && $e->getResponse()) {
        echo "Response: " . $e->getResponse()->getBody() . "\n";
    }
}
