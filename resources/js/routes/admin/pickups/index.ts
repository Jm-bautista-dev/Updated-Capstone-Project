import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/admin/pickups'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/pickups',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/admin/pickups'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/admin/pickups'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/admin/pickups'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/admin/pickups'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/admin/pickups'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/admin/pickups'
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
const pickups = {
    index: Object.assign(index, index),
}

export default pickups