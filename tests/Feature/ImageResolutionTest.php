<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Utils\ImageHelper;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageResolutionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_missing_or_obsolete_image_path_resolves_to_null_and_prevents_404(): void
    {
        // Path does not exist on disk
        $nonExistentPath = 'products/ZK7gjm5qP1ljb1FGIl7uOarutPrNPFse2uEJb7cV.jpg';
        $resolved = ImageHelper::resolveUrl($nonExistentPath, 'products');

        $this->assertNull($resolved, 'Missing image path should resolve to null to prevent 404 errors.');

        // Bare filename without folder prefix
        $bareNonExistent = 'ZK7gjm5qP1ljb1FGIl7uOarutPrNPFse2uEJb7cV.jpg';
        $this->assertNull(ImageHelper::resolveUrl($bareNonExistent, 'products'));
    }

    public function test_existing_uploaded_product_image_resolves_to_valid_url(): void
    {
        // Put a fake image in public storage
        Storage::disk('public')->put('products/sample_maki.jpg', 'fake-image-bytes');

        $resolved = ImageHelper::resolveUrl('products/sample_maki.jpg', 'products');

        $this->assertNotNull($resolved);
        $this->assertStringContainsString('storage/products/sample_maki.jpg', $resolved);
    }

    public function test_unprefixed_filename_resolves_to_default_folder_when_file_exists(): void
    {
        // Put a file in products folder
        Storage::disk('public')->put('products/california_roll.jpg', 'fake-image-bytes');

        // Database stores just the filename without 'products/'
        $resolved = ImageHelper::resolveUrl('california_roll.jpg', 'products');

        $this->assertNotNull($resolved);
        $this->assertStringContainsString('storage/products/california_roll.jpg', $resolved);
    }

    public function test_external_cdn_urls_are_preserved(): void
    {
        $externalUrl = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800';
        $resolved = ImageHelper::resolveUrl($externalUrl, 'products');

        $this->assertSame($externalUrl, $resolved);
    }

    public function test_product_model_appends_image_url_correctly(): void
    {
        $branch = Branch::create([
            'name'      => 'Victoria Branch',
            'code'      => 'VIC',
            'address'   => 'Victoria, Tarlac',
            'is_active' => true,
        ]);
        $category = Category::create(['name' => 'Sushi Rolls']);

        // 1. Product with non-existent image
        $productMissingImg = Product::create([
            'name'          => 'Dragon Roll',
            'category_id'   => $category->id,
            'branch_id'     => $branch->id,
            'selling_price' => 150,
            'cost_price'    => 50,
            'image_path'    => 'products/missing_file_123.jpg',
        ]);

        $this->assertNull($productMissingImg->image_url);
        $arrayData = $productMissingImg->toArray();
        $this->assertArrayHasKey('image_url', $arrayData);
        $this->assertNull($arrayData['image_url']);

        // 2. Product with valid image on disk
        Storage::disk('public')->put('products/dragon_roll.jpg', 'image-data');
        $productWithImg = Product::create([
            'name'          => 'Dragon Roll Special',
            'category_id'   => $category->id,
            'branch_id'     => $branch->id,
            'selling_price' => 200,
            'cost_price'    => 80,
            'image_path'    => 'products/dragon_roll.jpg',
        ]);

        $this->assertNotNull($productWithImg->image_url);
        $this->assertStringContainsString('storage/products/dragon_roll.jpg', $productWithImg->image_url);
    }

    public function test_category_model_appends_image_url_correctly(): void
    {
        // 1. Category with missing image
        $categoryMissing = Category::create([
            'name'       => 'Platters',
            'image_path' => 'categories/non_existent.png',
        ]);
        $this->assertNull($categoryMissing->image_url);

        // 2. Category with existing image
        Storage::disk('public')->put('categories/platters.png', 'cat-image');
        $categoryWithImg = Category::create([
            'name'       => 'Platters Active',
            'image_path' => 'categories/platters.png',
        ]);
        $this->assertNotNull($categoryWithImg->image_url);
        $this->assertStringContainsString('storage/categories/platters.png', $categoryWithImg->image_url);
    }

    public function test_api_products_response_handles_missing_images_gracefully(): void
    {
        $branch = Branch::create([
            'name'      => 'Victoria Branch',
            'code'      => 'VIC',
            'address'   => 'Victoria, Tarlac',
            'is_active' => true,
        ]);
        $category = Category::create(['name' => 'Bento']);

        Product::create([
            'name'          => 'Salmon Bento',
            'category_id'   => $category->id,
            'branch_id'     => $branch->id,
            'selling_price' => 180,
            'cost_price'    => 70,
            'image_path'    => 'products/ZK7gjm5qP1ljb1FGIl7uOarutPrNPFse2uEJb7cV.jpg',
        ]);

        $response = $this->getJson("/api/v1/products?branch_id={$branch->id}");
        $response->assertOk();

        // Check that returned image is null rather than an invalid 404 URL
        $json = $response->json();
        $this->assertNotEmpty($json['products']);
        $this->assertNull($json['products'][0]['image']);
    }
}
