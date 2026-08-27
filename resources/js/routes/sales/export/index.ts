import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SalesController::summary
 * @see app/Http/Controllers/SalesController.php:153
 * @route '/sales/export/summary'
 */
export const summary = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: summary.url(options),
    method: 'get',
})

summary.definition = {
    methods: ["get","head"],
    url: '/sales/export/summary',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SalesController::summary
 * @see app/Http/Controllers/SalesController.php:153
 * @route '/sales/export/summary'
 */
summary.url = (options?: RouteQueryOptions) => {
    return summary.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesController::summary
 * @see app/Http/Controllers/SalesController.php:153
 * @route '/sales/export/summary'
 */
summary.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: summary.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SalesController::summary
 * @see app/Http/Controllers/SalesController.php:153
 * @route '/sales/export/summary'
 */
summary.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: summary.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SalesController::summary
 * @see app/Http/Controllers/SalesController.php:153
 * @route '/sales/export/summary'
 */
    const summaryForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: summary.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SalesController::summary
 * @see app/Http/Controllers/SalesController.php:153
 * @route '/sales/export/summary'
 */
        summaryForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: summary.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SalesController::summary
 * @see app/Http/Controllers/SalesController.php:153
 * @route '/sales/export/summary'
 */
        summaryForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: summary.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    summary.form = summaryForm