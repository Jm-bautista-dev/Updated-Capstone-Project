<?php

namespace App\Services;

use App\Models\Ingredient;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OcrService
{
    /**
     * Perform OCR text extraction on a given file.
     * Supports Google Vision API, local Tesseract fallback, and a mock simulator.
     */
    public function performOcr(string $filePath): string
    {
        // 1. Preferred: Google Vision API
        $googleKey = config('services.google_vision.key');
        if (!empty($googleKey)) {
            try {
                if (!file_exists($filePath)) {
                    throw new \Exception("File not found at path: {$filePath}");
                }

                $imageContent = base64_encode(file_get_contents($filePath));
                
                $response = Http::post("https://vision.googleapis.com/v1/images:annotate?key={$googleKey}", [
                    'requests' => [
                        [
                            'image' => [
                                'content' => $imageContent,
                            ],
                            'features' => [
                                [
                                    'type' => 'TEXT_DETECTION',
                                ],
                            ],
                        ],
                    ],
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $text = $data['responses'][0]['textAnnotations'][0]['description'] ?? '';
                    if (!empty($text)) {
                        Log::info('Google Vision OCR completed successfully.');
                        return $text;
                    }
                } else {
                    Log::error('Google Vision OCR request failed: ' . $response->body());
                }
            } catch (\Exception $e) {
                Log::error('Google Vision OCR Exception: ' . $e->getMessage());
            }
        }

        // 2. Fallback: Tesseract OCR (shell execution if binary is installed)
        try {
            $hasTesseract = false;
            exec('tesseract --version', $versionOutput, $returnCode);
            if ($returnCode === 0) {
                $hasTesseract = true;
            }

            if ($hasTesseract) {
                $outputPath = tempnam(sys_get_temp_dir(), 'ocr_');
                // Tesseract will automatically append .txt to output path
                $cmd = "tesseract " . escapeshellarg($filePath) . " " . escapeshellarg($outputPath);
                exec($cmd, $execOutput, $execCode);

                if ($execCode === 0 && file_exists($outputPath . '.txt')) {
                    $text = file_get_contents($outputPath . '.txt');
                    @unlink($outputPath);
                    @unlink($outputPath . '.txt');
                    if (!empty(trim($text))) {
                        Log::info('Tesseract OCR completed successfully.');
                        return $text;
                    }
                }
                @unlink($outputPath);
                @unlink($outputPath . '.txt');
            }
        } catch (\Exception $e) {
            Log::error('Tesseract OCR Fallback Exception: ' . $e->getMessage());
        }

        // 3. Fallback: Throw Exception if no OCR engine is configured
        Log::error('No active OCR driver found (Google Vision API key missing and Tesseract not installed).');
        throw new \Exception("No active OCR driver found. Please configure GOOGLE_VISION_API_KEY in your .env file or install Tesseract OCR on the server.");
    }

    /**
     * Parse OCR text into structured line items.
     */
    public function parseOcrText(string $text): array
    {
        $lines = explode("\n", $text);
        $parsedItems = [];

        // Common units regex pattern
        $unitPattern = '(?:kg|g|l|ml|pcs|pieces|kilograms|grams|liters|milliliters|bags|packs|kg\b|g\b|l\b|ml\b|pcs\b)';

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            // Clean line of some visual noise
            $cleanLine = preg_replace('/[\|•\*]/', '', $line);
            $cleanLine = trim($cleanLine);

            $quantity = null;
            $unit = 'pcs';
            $itemName = '';
            $matched = false;

            // Pattern A: <Quantity> <Unit> <Name> (e.g. "10 kg Chicken Breast", "5pcs Eggs")
            $patternA = '/^\s*([\d\.,]+)\s*(' . $unitPattern . ')?\s+(?:of\s+)?([A-Za-z0-9\s\-\'\"\&]+)/i';
            // Pattern B: <Name> <Quantity> <Unit> (e.g. "Chicken Breast - 10 kg", "Rice 20kg", "Salt 5 g")
            $patternB = '/^\s*([A-Za-z0-9\s\-\'\"\&]+?)\s*[\-\:]?\s*([\d\.,]+)\s*(' . $unitPattern . ')?\s*$/i';

            if (preg_match($patternA, $cleanLine, $matches)) {
                $quantity = floatval(str_replace(',', '', $matches[1]));
                $unit = !empty($matches[2]) ? strtolower($matches[2]) : 'pcs';
                $itemName = trim($matches[3]);
                $matched = true;
            } elseif (preg_match($patternB, $cleanLine, $matches)) {
                $itemName = trim($matches[1]);
                $quantity = floatval(str_replace(',', '', $matches[2]));
                $unit = !empty($matches[3]) ? strtolower($matches[3]) : 'pcs';
                $matched = true;
            } else {
                // General Fallback: Find first quantity/unit match anywhere in the line
                $patternFallback = '/\b([\d\.,]+)\s*(' . $unitPattern . ')?\b/i';
                if (preg_match($patternFallback, $cleanLine, $matches, PREG_OFFSET_CAPTURE)) {
                    $quantity = floatval(str_replace(',', '', $matches[1][0]));
                    $unit = !empty($matches[2][0]) ? strtolower($matches[2][0]) : 'pcs';
                    
                    // The rest of the line is the product name
                    $matchStart = $matches[0][1];
                    $matchLength = strlen($matches[0][0]);
                    
                    $partBefore = substr($cleanLine, 0, $matchStart);
                    $partAfter = substr($cleanLine, $matchStart + $matchLength);
                    
                    $itemName = trim($partBefore . ' ' . $partAfter);
                    $itemName = preg_replace('/\s+/', ' ', $itemName); // remove double spaces
                    $itemName = trim($itemName, " -:,"); // clean trailing punctuation
                    
                    if (!empty($itemName)) {
                        $matched = true;
                    }
                }
            }

            if ($matched && $quantity > 0 && !empty($itemName)) {
                // Normalize some units
                if ($unit === 'kilograms') $unit = 'kg';
                if ($unit === 'grams') $unit = 'g';
                if ($unit === 'liters') $unit = 'L';
                if ($unit === 'milliliters') $unit = 'ml';
                if ($unit === 'pieces') $unit = 'pcs';

                $parsedItems[] = [
                    'raw_line' => $line,
                    'item_name' => $itemName,
                    'quantity' => $quantity,
                    'unit' => $unit
                ];
            }
        }

        return $parsedItems;
    }

    /**
     * Match parsed receipt items against database ingredients using Levenshtein fuzzy matching.
     */
    public function matchIngredients(array $parsedItems, int $branchId): array
    {
        // Fetch all active ingredients (global list)
        /** @var \Illuminate\Database\Eloquent\Collection $ingredients */
        $ingredients = Ingredient::query()->orderBy('name')->get();

        $matchedResults = [];

        foreach ($parsedItems as $item) {
            $parsedName = $item['item_name'];
            $parsedNameClean = strtolower(preg_replace('/[^a-z0-9]/', '', $parsedName));

            $bestMatch = null;
            $bestScore = 0;

            foreach ($ingredients as $ingredient) {
                $ingName = $ingredient->name;
                $ingNameClean = strtolower(preg_replace('/[^a-z0-9]/', '', $ingName));

                // 1. Exact Match
                if ($parsedNameClean === $ingNameClean) {
                    $bestMatch = $ingredient;
                    $bestScore = 100;
                    break;
                }

                // 2. Fuzzy Match via Levenshtein
                $lev = levenshtein($parsedNameClean, $ingNameClean);
                $maxLen = max(strlen($parsedNameClean), strlen($ingNameClean));
                $score = $maxLen > 0 ? (1 - ($lev / $maxLen)) * 100 : 0;

                // 3. Substring match bonus
                if (str_contains($parsedNameClean, $ingNameClean) || str_contains($ingNameClean, $parsedNameClean)) {
                    $score = max($score, 75); // high baseline for substring containment
                }

                if ($score > $bestScore) {
                    $bestScore = $score;
                    $bestMatch = $ingredient;
                }
            }

            // Determine review state based on confidence score threshold
            $needsReview = true;
            $suggestedId = null;
            $suggestedName = null;

            if ($bestMatch) {
                $suggestedId = $bestMatch->id;
                $suggestedName = $bestMatch->name;
                
                if ($bestScore >= 80) {
                    $needsReview = false;
                }
            }

            $matchedResults[] = [
                'raw_line' => $item['raw_line'],
                'item_name' => $item['item_name'],
                'detected_qty' => $item['quantity'],
                'detected_unit' => $item['unit'],
                'suggested_match_id' => $suggestedId,
                'suggested_match_name' => $suggestedName,
                'confidence' => round($bestScore, 1),
                'needs_review' => $needsReview
            ];
        }

        return $matchedResults;
    }

}
