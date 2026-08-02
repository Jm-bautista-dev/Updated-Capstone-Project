import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ProductController::index
 * @see app/Http/Controllers/Api/ProductController.php:24
 * @route '/api/v1/products'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/v1/products',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ProductController::index
 * @see app/Http/Controllers/Api/ProductController.php:24
 * @route '/api/v1/products'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProductController::index
 * @see app/Http/Controllers/Api/ProductController.php:24
 * @route '/api/v1/products'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ProductController::index
 * @see app/Http/Controllers/Api/ProductController.php:24
 * @route '/api/v1/products'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ProductController::index
 * @see app/Http/Controllers/Api/ProductController.php:24
 * @route '/api/v1/products'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ProductController::index
 * @see app/Http/Controllers/Api/ProductController.php:24
 * @route '/api/v1/products'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ProductController::index
 * @see app/Http/Controllers/Api/ProductController.php:24
 * @route '/api/v1/products'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\Api\ProductController::getUnifiedMenu
 * @see app/Http/Controllers/Api/ProductController.php:141
 * @route '/api/v1/customer/menu'
 */
export const getUnifiedMenu = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getUnifiedMenu.url(options),
    method: 'get',
})

getUnifiedMenu.definition = {
    methods: ["get","head"],
    url: '/api/v1/customer/menu',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ProductController::getUnifiedMenu
 * @see app/Http/Controllers/Api/ProductController.php:141
 * @route '/api/v1/customer/menu'
 */
getUnifiedMenu.url = (options?: RouteQueryOptions) => {
    return getUnifiedMenu.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProductController::getUnifiedMenu
 * @see app/Http/Controllers/Api/ProductController.php:141
 * @route '/api/v1/customer/menu'
 */
getUnifiedMenu.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getUnifiedMenu.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ProductController::getUnifiedMenu
 * @see app/Http/Controllers/Api/ProductController.php:141
 * @route '/api/v1/customer/menu'
 */
getUnifiedMenu.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getUnifiedMenu.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ProductController::getUnifiedMenu
 * @see app/Http/Controllers/Api/ProductController.php:141
 * @route '/api/v1/customer/menu'
 */
    const getUnifiedMenuForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getUnifiedMenu.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ProductController::getUnifiedMenu
 * @see app/Http/Controllers/Api/ProductController.php:141
 * @route '/api/v1/customer/menu'
 */
        getUnifiedMenuForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getUnifiedMenu.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ProductController::getUnifiedMenu
 * @see app/Http/Controllers/Api/ProductController.php:141
 * @route '/api/v1/customer/menu'
 */
        getUnifiedMenuForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getUnifiedMenu.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getUnifiedMenu.form = getUnifiedMenuForm
const ProductController = { index, getUnifiedMenu }

export default ProductController