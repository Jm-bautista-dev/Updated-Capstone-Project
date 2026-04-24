import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:20
 * @route '/api/customer/products'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/customer/products',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:20
 * @route '/api/customer/products'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:20
 * @route '/api/customer/products'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:20
 * @route '/api/customer/products'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:20
 * @route '/api/customer/products'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:20
 * @route '/api/customer/products'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Customer\ProductController::index
 * @see app/Http/Controllers/Customer/ProductController.php:20
 * @route '/api/customer/products'
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
const ProductController = { index }

export default ProductController