import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ReceiptController::upload
 * @see app/Http/Controllers/Api/ReceiptController.php:30
 * @route '/api/receipts/upload'
 */
export const upload = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: upload.url(options),
    method: 'post',
})

upload.definition = {
    methods: ["post"],
    url: '/api/receipts/upload',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ReceiptController::upload
 * @see app/Http/Controllers/Api/ReceiptController.php:30
 * @route '/api/receipts/upload'
 */
upload.url = (options?: RouteQueryOptions) => {
    return upload.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ReceiptController::upload
 * @see app/Http/Controllers/Api/ReceiptController.php:30
 * @route '/api/receipts/upload'
 */
upload.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: upload.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ReceiptController::upload
 * @see app/Http/Controllers/Api/ReceiptController.php:30
 * @route '/api/receipts/upload'
 */
    const uploadForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: upload.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ReceiptController::upload
 * @see app/Http/Controllers/Api/ReceiptController.php:30
 * @route '/api/receipts/upload'
 */
        uploadForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: upload.url(options),
            method: 'post',
        })
    
    upload.form = uploadForm
/**
* @see \App\Http\Controllers\Api\ReceiptController::process
 * @see app/Http/Controllers/Api/ReceiptController.php:72
 * @route '/api/receipts/process'
 */
export const process = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: process.url(options),
    method: 'post',
})

process.definition = {
    methods: ["post"],
    url: '/api/receipts/process',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ReceiptController::process
 * @see app/Http/Controllers/Api/ReceiptController.php:72
 * @route '/api/receipts/process'
 */
process.url = (options?: RouteQueryOptions) => {
    return process.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ReceiptController::process
 * @see app/Http/Controllers/Api/ReceiptController.php:72
 * @route '/api/receipts/process'
 */
process.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: process.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ReceiptController::process
 * @see app/Http/Controllers/Api/ReceiptController.php:72
 * @route '/api/receipts/process'
 */
    const processForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: process.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ReceiptController::process
 * @see app/Http/Controllers/Api/ReceiptController.php:72
 * @route '/api/receipts/process'
 */
        processForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: process.url(options),
            method: 'post',
        })
    
    process.form = processForm
/**
* @see \App\Http\Controllers\Api\ReceiptController::stockIn
 * @see app/Http/Controllers/Api/ReceiptController.php:161
 * @route '/api/inventory/stock-in'
 */
export const stockIn = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: stockIn.url(options),
    method: 'post',
})

stockIn.definition = {
    methods: ["post"],
    url: '/api/inventory/stock-in',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ReceiptController::stockIn
 * @see app/Http/Controllers/Api/ReceiptController.php:161
 * @route '/api/inventory/stock-in'
 */
stockIn.url = (options?: RouteQueryOptions) => {
    return stockIn.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ReceiptController::stockIn
 * @see app/Http/Controllers/Api/ReceiptController.php:161
 * @route '/api/inventory/stock-in'
 */
stockIn.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: stockIn.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ReceiptController::stockIn
 * @see app/Http/Controllers/Api/ReceiptController.php:161
 * @route '/api/inventory/stock-in'
 */
    const stockInForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: stockIn.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ReceiptController::stockIn
 * @see app/Http/Controllers/Api/ReceiptController.php:161
 * @route '/api/inventory/stock-in'
 */
        stockInForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: stockIn.url(options),
            method: 'post',
        })
    
    stockIn.form = stockInForm
const ReceiptController = { upload, process, stockIn }

export default ReceiptController