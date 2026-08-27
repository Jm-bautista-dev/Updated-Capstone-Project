<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\SystemSetting;
use App\Models\FeatureFlag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email    = env('SUPER_ADMIN_EMAIL', 'superadmin@makidesu');
        $password = env('SUPER_ADMIN_PASSWORD', '09475591719');

        // Create or update Super Admin user safely
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name'                 => 'Super Admin',
                'first_name'           => 'Super',
                'last_name'            => 'Admin',
                'role'                 => User::ROLE_SUPER_ADMIN,
                'password'             => Hash::make($password),
                'must_change_password' => false,
            ]
        );

        Log::info('SuperAdminSeeder: Super Admin seeded.', ['email' => $email]);

        // Seed Default System Settings
        $defaultSettings = [
            'app_name'                     => ['value' => 'Maki Desu Operations', 'group' => 'system', 'type' => 'string', 'description' => 'System Display Name'],
            'app_version'                  => ['value' => '2.5.0', 'group' => 'system', 'type' => 'string', 'description' => 'Current Application Release Version'],
            'min_supported_app_version'    => ['value' => '1.0.0', 'group' => 'mobile', 'type' => 'string', 'description' => 'Minimum Supported Customer/Rider Mobile App Version'],
            'maintenance_mode'             => ['value' => 'false', 'group' => 'maintenance', 'type' => 'boolean', 'description' => 'Global Application Maintenance Mode State'],
            'maintenance_title'            => ['value' => 'System Under Maintenance', 'group' => 'maintenance', 'type' => 'string', 'description' => 'Title shown during maintenance'],
            'maintenance_message'          => ['value' => 'We are performing scheduled infrastructure upgrades. Please check back shortly.', 'group' => 'maintenance', 'type' => 'string', 'description' => 'Message shown to users during maintenance'],
            'estimated_restoration_time'   => ['value' => '30 minutes', 'group' => 'maintenance', 'type' => 'string', 'description' => 'Estimated time remaining for maintenance window'],
        ];

        foreach ($defaultSettings as $key => $config) {
            SystemSetting::updateOrCreate(
                ['key' => $key],
                [
                    'value'       => $config['value'],
                    'group'       => $config['group'],
                    'type'        => $config['type'],
                    'description' => $config['description'],
                    'updated_by'  => $user->id,
                ]
            );
        }

        // Seed Default Feature Flags
        $defaultFlags = [
            'delivery_tracking'    => ['name' => 'Delivery Live GPS Tracking', 'description' => 'Real-time rider location updates for customers and admins', 'enabled' => true],
            'customer_ordering'    => ['name' => 'Customer Mobile App Ordering', 'description' => 'Allows customers to place new mobile orders', 'enabled' => true],
            'pos_delivery'         => ['name' => 'POS Delivery Checkout', 'description' => 'Allows cashier to place delivery orders from POS terminal', 'enabled' => true],
            'rider_cancellation'   => ['name' => 'Rider Cancellation Requests', 'description' => 'Allows riders to request delivery cancellation with cashier approval', 'enabled' => true],
            'prescriptive_restock' => ['name' => 'Prescriptive Restock Suggestions', 'description' => 'AI/Algorithmic inventory restock recommendation engine', 'enabled' => true],
            'push_notifications'   => ['name' => 'Expo Push Notifications', 'description' => 'Automated push notifications to mobile customers', 'enabled' => true],
            'experimental_features'=> ['name' => 'Experimental Beta Features', 'description' => 'Developer beta features testing flag', 'enabled' => false],
        ];

        foreach ($defaultFlags as $key => $flag) {
            FeatureFlag::updateOrCreate(
                ['key' => $key],
                [
                    'name'        => $flag['name'],
                    'description' => $flag['description'],
                    'is_enabled'  => $flag['enabled'],
                    'updated_by'  => $user->id,
                ]
            );
        }
    }
}
