<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            'view projects',
            'create projects',
            'edit projects',
            'delete projects',
            'view categories',
            'create categories',
            'edit categories',
            'delete categories',
            'view tasks',
            'create tasks',
            'edit tasks',
            'delete tasks',
            'manage users',
            'manage roles',
        ];
        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        // Create roles and assign permissions
        $adminRole = Role::firstOrCreate(['name' => 'Administrator']);
        $adminRole->syncPermissions(Permission::all());

        $userRole = Role::firstOrCreate(['name' => 'User']);
        $userRole->syncPermissions([
            'view projects',
            'create projects',
            'edit projects',
            'delete projects',
            'view categories',
            'view tasks',
            'create tasks',
            'edit tasks',
            'delete tasks',
        ]);

        // Create admin user (or update if exists)
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
            ]
        );
        if (!$admin->hasRole('Administrator')) {
            $admin->assignRole('Administrator');
        }

        // Create regular user (or update if exists)
        $user = User::firstOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Regular User',
                'password' => Hash::make('password'),
            ]
        );
        if (!$user->hasRole('User')) {
            $user->assignRole('User');
        }
    }
}
