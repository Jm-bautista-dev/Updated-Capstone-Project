import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:27
 * @route '/delivery'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/delivery',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:27
 * @route '/delivery'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:27
 * @route '/delivery'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:27
 * @route '/delivery'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:27
 * @route '/delivery'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:27
 * @route '/delivery'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:27
 * @route '/delivery'
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
const delivery = {
    index: Object.assign(index, index),
}

export default delivery