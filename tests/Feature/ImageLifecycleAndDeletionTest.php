<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Product;
use App\Models\User;
use App\Utils\ImageHelper;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageLifecycleAndDeletionTest extends TestCase
{
    use RefreshDatabase;

    public User $admin;
    public Ingredient $ingredient;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->branch = Branch::create([
            'name'                     => 'Test Branch',
            'address'                  => 'Test Address',
            'latitude'                 => 14.229,
            'longitude'                => 121.328,
            'is_main'                  => true,
            'pickup_enabled'           => true,
            'pickup_opening_time'      => '08:00:00',
            'pickup_closing_time'      => '22:00:00',
            'pickup_lead_time_minutes' => 20,
        ]);

        $this->admin = User::create([
            'name'              => 'Admin User',
            'email'             => 'admin@test.com',
            'password'          => bcrypt('password'),
            'role'              => 'admin',
            'branch_id'         => $this->branch->id,
            'email_verified_at' => now(),
        ]);

        $this->category = Category::create([
            'name'        => 'Sushi Rolls',
            'slug'        => 'sushi-rolls',
            'description' => 'Test Category',
        ]);

        $this->ingredient = Ingredient::create([
            'name'               => 'Sushi Rice',
            'unit'               => 'g',
            'cost_per_base_unit' => 0.10,
        ]);

        \App\Models\IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->ingredient->id, 'branch_id' => $this->branch->id],
            [
                'stock'           => 10000,
                'cost_per_unit'   => 0.10,
                'low_stock_level' => 100,
            ]
        );
    }

    public function test_product_store_with_image_creates_file_and_sets_path(): void
    {
        $file = UploadedFile::fake()->create('california-roll.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->admin)->post('/products', [
            'name'          => 'California Roll',
            'category_id'   => $this->category->id,
            'selling_price' => 250.00,
            'unit'          => 'pcs',
            'branch_option' => 'single',
            'branch_id'     => $this->branch->id,
            'recipe'        => [
                ['ingredient_id' => $this->ingredient->id, 'quantity_required' => 100, 'unit' => 'g'],
            ],
            'image'         => $file,
        ]);

        $response->assertRedirect();

        $product = Product::where('name', 'California Roll')->first();
        $this->assertNotNull($product);
        $this->assertNotNull($product->image_path);
        Storage::disk('public')->assertExists($product->image_path);
        $this->assertNotNull($product->image_url);
    }

    public function test_product_update_with_replacement_image_deletes_old_file(): void
    {
        $oldFile = UploadedFile::fake()->create('old-image.jpg', 100, 'image/jpeg');

        $this->actingAs($this->admin)->post('/products', [
            'name'          => 'Tuna Maki',
            'category_id'   => $this->category->id,
            'selling_price' => 200.00,
            'unit'          => 'pcs',
            'branch_option' => 'single',
            'branch_id'     => $this->branch->id,
            'recipe'        => [
                ['ingredient_id' => $this->ingredient->id, 'quantity_required' => 50, 'unit' => 'g'],
            ],
            'image'         => $oldFile,
        ]);

        $product = Product::where('name', 'Tuna Maki')->first();
        $oldPath = $product->image_path;
        $this->assertNotNull($oldPath);
        Storage::disk('public')->assertExists($oldPath);

        // Upload replacement image
        $newFile = UploadedFile::fake()->create('new-image.webp', 100, 'image/webp');

        $updateResponse = $this->actingAs($this->admin)->put("/products/{$product->id}", [
            'name'          => 'Tuna Maki Premium',
            'category_id'   => $this->category->id,
            'selling_price' => 220.00,
            'unit'          => 'pcs',
            'recipe'        => [
                ['ingredient_id' => $this->ingredient->id, 'quantity_required' => 50, 'unit' => 'g'],
            ],
            'image'         => $newFile,
        ]);

        $updateResponse->assertRedirect();

        $product->refresh();
        $this->assertNotEquals($oldPath, $product->image_path);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($product->image_path);
    }

    public function test_product_update_with_remove_image_flag_clears_db_and_deletes_physical_file(): void
    {
        $file = UploadedFile::fake()->create('to-be-deleted.jpg', 100, 'image/jpeg');

        $this->actingAs($this->admin)->post('/products', [
            'name'          => 'Dragon Roll',
            'category_id'   => $this->category->id,
            'selling_price' => 350.00,
            'unit'          => 'pcs',
            'branch_option' => 'single',
            'branch_id'     => $this->branch->id,
            'recipe'        => [
                ['ingredient_id' => $this->ingredient->id, 'quantity_required' => 80, 'unit' => 'g'],
            ],
            'image'         => $file,
        ]);

        $product = Product::where('name', 'Dragon Roll')->first();
        $oldPath = $product->image_path;
        $this->assertNotNull($oldPath);
        Storage::disk('public')->assertExists($oldPath);

        // User removes the image in UI and submits with remove_image = true
        $updateResponse = $this->actingAs($this->admin)->put("/products/{$product->id}", [
            'name'          => 'Dragon Roll',
            'category_id'   => $this->category->id,
            'selling_price' => 350.00,
            'unit'          => 'pcs',
            'recipe'        => [
                ['ingredient_id' => $this->ingredient->id, 'quantity_required' => 80, 'unit' => 'g'],
            ],
            'remove_image'  => true,
        ]);

        $updateResponse->assertRedirect();

        $product->refresh();
        $this->assertNull($product->image_path);
        $this->assertNull($product->image_url);
        Storage::disk('public')->assertMissing($oldPath);
    }

    public function test_product_deletion_deletes_physical_image(): void
    {
        $file = UploadedFile::fake()->create('temp-product.jpg', 100, 'image/jpeg');

        $this->actingAs($this->admin)->post('/products', [
            'name'          => 'Temp Product',
            'category_id'   => $this->category->id,
            'selling_price' => 100.00,
            'unit'          => 'pcs',
            'branch_option' => 'single',
            'branch_id'     => $this->branch->id,
            'recipe'        => [
                ['ingredient_id' => $this->ingredient->id, 'quantity_required' => 10, 'unit' => 'g'],
            ],
            'image'         => $file,
        ]);

        $product = Product::where('name', 'Temp Product')->first();
        $imagePath = $product->image_path;
        $this->assertNotNull($imagePath);
        Storage::disk('public')->assertExists($imagePath);

        $deleteResponse = $this->actingAs($this->admin)->delete("/products/{$product->id}");
        $deleteResponse->assertRedirect();

        Storage::disk('public')->assertMissing($imagePath);
    }

    public function test_category_image_lifecycle_create_update_remove_and_destroy(): void
    {
        $file = UploadedFile::fake()->create('cat-initial.jpg', 100, 'image/jpeg');

        $this->actingAs($this->admin)->post('/categories', [
            'name'        => 'Bento Boxes',
            'description' => 'Hearty Bento Combos',
            'image'       => $file,
        ]);

        $category = Category::where('name', 'Bento Boxes')->first();
        $this->assertNotNull($category);
        $this->assertNotNull($category->image_path);
        $initialPath = $category->image_path;
        Storage::disk('public')->assertExists($initialPath);

        // Update with remove_image = true
        $this->actingAs($this->admin)->put("/categories/{$category->id}", [
            'name'         => 'Bento Boxes',
            'description'  => 'Hearty Bento Combos',
            'remove_image' => true,
        ]);

        $category->refresh();
        $this->assertNull($category->image_path);
        $this->assertNull($category->image_url);
        Storage::disk('public')->assertMissing($initialPath);
    }

    public function test_clean_orphaned_images_artisan_command(): void
    {
        // Place an orphaned file directly on fake public disk
        Storage::disk('public')->put('products/orphaned-unreferenced-image.jpg', 'fake-image-bytes');
        Storage::disk('public')->assertExists('products/orphaned-unreferenced-image.jpg');

        // Run the clean command
        $this->artisan('storage:clean-orphaned-images', ['--force' => true])
            ->assertSuccessful();

        Storage::disk('public')->assertMissing('products/orphaned-unreferenced-image.jpg');
    }
}
