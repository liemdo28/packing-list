<?php

return [
    'transfer_rules' => [
        'B1' => ['B2', 'B3'],
        'B2' => [],
        'B3' => ['B1', 'B2'],
    ],

    'statuses' => [
        'draft'                        => 'Draft',
        'submitted'                    => 'Submitted',
        'processing'                   => 'Processing',
        'ready_to_ship'                => 'Ready to Ship',
        'in_transit'                   => 'In Transit',
        'received_pending_confirmation'=> 'Received Pending Confirmation',
        'completed'                    => 'Completed',
        'cancelled'                    => 'Cancelled',
        'disputed'                     => 'Disputed',
    ],

    'status_colors' => [
        'draft'                        => 'gray',
        'submitted'                    => 'blue',
        'processing'                   => 'yellow',
        'ready_to_ship'                => 'purple',
        'in_transit'                   => 'indigo',
        'received_pending_confirmation'=> 'orange',
        'completed'                    => 'green',
        'cancelled'                    => 'red',
        'disputed'                     => 'pink',
    ],

    'roles' => [
        'admin'      => 'Admin',
        'b1'         => 'Store B1',
        'b2'         => 'Store B2',
        'b3'         => 'Store B3',
        'accountant' => 'Accountant',
    ],

    'store_roles' => ['b1', 'b2', 'b3'],

    'units' => ['kg', 'pcs', 'box', 'bottle', 'can', 'pack', 'bag', 'carton', 'block'],

    'categories' => ['Beverage', 'Food', 'Supply'],
];
