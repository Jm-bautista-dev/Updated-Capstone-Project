import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:16
 * @route '/api/v1/customer/products'
 */
const index6fdf302ec31176b4d33198d2b2078444 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index6fdf302ec31176b4d33198d2b2078444.url(options),
    method: 'get',
})

index6fdf302ec31176b4d33198d2b2078444.definition = {
    methods: ["get","head"],
    url: '/api/v1/customer/products',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:16
 * @route '/api/v1/customer/products'
 */
index6fdf302ec31176b4d33198d2b2078444.url = (options?: RouteQueryOptions) => {
    return index6fdf302ec31176b4d33198d2b2078444.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:16
 * @route '/api/v1/customer/products'
 */
index6fdf302ec31176b4d33198d2b2078444.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index6fdf302ec31176b4d33198d2b2078444.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:16
 * @route '/api/v1/customer/products'
 */
index6fdf302ec31176b4d33198d2b2078444.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index6fdf302ec31176b4d33198d2b2078444.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:16
 * @route '/api/v1/customer/products'
 */
    const index6fdf302ec31176b4d33198d2b2078444Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index6fdf302ec31176b4d33198d2b2078444.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:16
 * @route '/api/v1/customer/products'
 */
        index6fdf302ec31176b4d33198d2b2078444Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index6fdf302ec31176b4d33198d2b2078444.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:16
 * @route '/api/v1/customer/products'
 */
        index6fdf302ec31176b4d33198d2b2078444Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index6fdf302ec31176b4d33198d2b2078444.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index6fdf302ec31176b4d33198d2b2078444.form = index6fdf302ec31176b4d33198d2b2078444Form
    /**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:16
 * @route '/api/customer/products'
 */
const index90b8edaf3c6cbdc86f8722086b9a0c51 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index90b8edaf3c6cbdc86f8722086b9a0c51.url(options),
    method: 'get',
})

index90b8edaf3c6cbdc86f8722086b9a0c51.definition = {
    methods: ["get","head"],
    url: '/api/customer/products',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:16
 * @route '/api/customer/products'
 */
index90b8edaf3c6cbdc86f8722086b9a0c51.url = (options?: RouteQueryOptions) => {
    return index90b8edaf3c6cbdc86f8722086b9a0c51.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:16
 * @route '/api/customer/products'
 */
index90b8edaf3c6cbdc86f8722086b9a0c51.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index90b8edaf3c6cbdc86f8722086b9a0c51.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:16
 * @route '/api/customer/products'
 */
index90b8edaf3c6cbdc86f8722086b9a0c51.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index90b8edaf3c6cbdc86f8722086b9a0c51.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:16
 * @route '/api/customer/products'
 */
    const index90b8edaf3c6cbdc86f8722086b9a0c51Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index90b8edaf3c6cbdc86f8722086b9a0c51.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:16
 * @route '/api/customer/products'
 */
        index90b8edaf3c6cbdc86f8722086b9a0c51Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index90b8edaf3c6cbdc86f8722086b9a0c51.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:16
 * @route '/api/customer/products'
 */
        index90b8edaf3c6cbdc86f8722086b9a0c51Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index90b8edaf3c6cbdc86f8722086b9a0c51.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index90b8edaf3c6cbdc86f8722086b9a0c51.form = index90b8edaf3c6cbdc86f8722086b9a0c51Form

export const index = {
    '/api/v1/customer/products': index6fdf302ec31176b4d33198d2b2078444,
    '/api/customer/products': index90b8edaf3c6cbdc86f8722086b9a0c51,
}

const ProductController = { index }

export default ProductController