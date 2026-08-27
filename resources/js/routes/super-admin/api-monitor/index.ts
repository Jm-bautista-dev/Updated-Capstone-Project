import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\ApiMonitorController::index
 * @see app/Http/Controllers/SuperAdmin/ApiMonitorController.php:17
 * @route '/super-admin/api-monitor'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/super-admin/api-monitor',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\ApiMonitorController::index
 * @see app/Http/Controllers/SuperAdmin/ApiMonitorController.php:17
 * @route '/super-admin/api-monitor'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\ApiMonitorController::index
 * @see app/Http/Controllers/SuperAdmin/ApiMonitorController.php:17
 * @route '/super-admin/api-monitor'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\ApiMonitorController::index
 * @see app/Http/Controllers/SuperAdmin/ApiMonitorController.php:17
 * @route '/super-admin/api-monitor'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\ApiMonitorController::index
 * @see app/Http/Controllers/SuperAdmin/ApiMonitorController.php:17
 * @route '/super-admin/api-monitor'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\ApiMonitorController::index
 * @see app/Http/Controllers/SuperAdmin/ApiMonitorController.php:17
 * @route '/super-admin/api-monitor'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\ApiMonitorController::index
 * @see app/Http/Controllers/SuperAdmin/ApiMonitorController.php:17
 * @route '/super-admin/api-monitor'
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
const apiMonitor = {
    index: Object.assign(index, index),
}

export default apiMonitor