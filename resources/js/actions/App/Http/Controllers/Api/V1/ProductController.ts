import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\V1\ProductController::getProductsByLocation
 * @see app/Http/Controllers/Api/V1/ProductController.php:16
 * @route '/api/v1/customer/products'
 */
export const getProductsByLocation = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getProductsByLocation.url(options),
    method: 'get',
})

getProductsByLocation.definition = {
    methods: ["get","head"],
    url: '/api/v1/customer/products',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\V1\ProductController::getProductsByLocation
 * @see app/Http/Controllers/Api/V1/ProductController.php:16
 * @route '/api/v1/customer/products'
 */
getProductsByLocation.url = (options?: RouteQueryOptions) => {
    return getProductsByLocation.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\V1\ProductController::getProductsByLocation
 * @see app/Http/Controllers/Api/V1/ProductController.php:16
 * @route '/api/v1/customer/products'
 */
getProductsByLocation.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getProductsByLocation.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\V1\ProductController::getProductsByLocation
 * @see app/Http/Controllers/Api/V1/ProductController.php:16
 * @route '/api/v1/customer/products'
 */
getProductsByLocation.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getProductsByLocation.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\V1\ProductController::getProductsByLocation
 * @see app/Http/Controllers/Api/V1/ProductController.php:16
 * @route '/api/v1/customer/products'
 */
    const getProductsByLocationForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getProductsByLocation.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\V1\ProductController::getProductsByLocation
 * @see app/Http/Controllers/Api/V1/ProductController.php:16
 * @route '/api/v1/customer/products'
 */
        getProductsByLocationForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getProductsByLocation.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\V1\ProductController::getProductsByLocation
 * @see app/Http/Controllers/Api/V1/ProductController.php:16
 * @route '/api/v1/customer/products'
 */
        getProductsByLocationForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getProductsByLocation.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getProductsByLocation.form = getProductsByLocationForm
const ProductController = { getProductsByLocation }

export default ProductController