import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\AnalyticsController::exportMethod
 * @see app/Http/Controllers/Admin/AnalyticsController.php:181
 * @route '/analytics/cashier-performance/export'
 */
export const exportMethod = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/analytics/cashier-performance/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\AnalyticsController::exportMethod
 * @see app/Http/Controllers/Admin/AnalyticsController.php:181
 * @route '/analytics/cashier-performance/export'
 */
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AnalyticsController::exportMethod
 * @see app/Http/Controllers/Admin/AnalyticsController.php:181
 * @route '/analytics/cashier-performance/export'
 */
exportMethod.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\AnalyticsController::exportMethod
 * @see app/Http/Controllers/Admin/AnalyticsController.php:181
 * @route '/analytics/cashier-performance/export'
 */
exportMethod.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\AnalyticsController::exportMethod
 * @see app/Http/Controllers/Admin/AnalyticsController.php:181
 * @route '/analytics/cashier-performance/export'
 */
    const exportMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportMethod.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\AnalyticsController::exportMethod
 * @see app/Http/Controllers/Admin/AnalyticsController.php:181
 * @route '/analytics/cashier-performance/export'
 */
        exportMethodForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportMethod.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\AnalyticsController::exportMethod
 * @see app/Http/Controllers/Admin/AnalyticsController.php:181
 * @route '/analytics/cashier-performance/export'
 */
        exportMethodForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportMethod.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportMethod.form = exportMethodForm
const cashierPerformance = {
    export: Object.assign(exportMethod, exportMethod),
}

export default cashierPerformance