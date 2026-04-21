import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import cashierPerformanceDb39e1 from './cashier-performance'
/**
* @see \App\Http\Controllers\Admin\AnalyticsController::cashierPerformance
 * @see app/Http/Controllers/Admin/AnalyticsController.php:136
 * @route '/analytics/cashier-performance'
 */
export const cashierPerformance = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: cashierPerformance.url(options),
    method: 'get',
})

cashierPerformance.definition = {
    methods: ["get","head"],
    url: '/analytics/cashier-performance',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\AnalyticsController::cashierPerformance
 * @see app/Http/Controllers/Admin/AnalyticsController.php:136
 * @route '/analytics/cashier-performance'
 */
cashierPerformance.url = (options?: RouteQueryOptions) => {
    return cashierPerformance.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AnalyticsController::cashierPerformance
 * @see app/Http/Controllers/Admin/AnalyticsController.php:136
 * @route '/analytics/cashier-performance'
 */
cashierPerformance.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: cashierPerformance.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\AnalyticsController::cashierPerformance
 * @see app/Http/Controllers/Admin/AnalyticsController.php:136
 * @route '/analytics/cashier-performance'
 */
cashierPerformance.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: cashierPerformance.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\AnalyticsController::cashierPerformance
 * @see app/Http/Controllers/Admin/AnalyticsController.php:136
 * @route '/analytics/cashier-performance'
 */
    const cashierPerformanceForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: cashierPerformance.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\AnalyticsController::cashierPerformance
 * @see app/Http/Controllers/Admin/AnalyticsController.php:136
 * @route '/analytics/cashier-performance'
 */
        cashierPerformanceForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: cashierPerformance.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\AnalyticsController::cashierPerformance
 * @see app/Http/Controllers/Admin/AnalyticsController.php:136
 * @route '/analytics/cashier-performance'
 */
        cashierPerformanceForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: cashierPerformance.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    cashierPerformance.form = cashierPerformanceForm
/**
* @see \App\Http\Controllers\Admin\AnalyticsController::salesForecast
 * @see app/Http/Controllers/Admin/AnalyticsController.php:247
 * @route '/analytics/sales-forecast'
 */
export const salesForecast = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: salesForecast.url(options),
    method: 'get',
})

salesForecast.definition = {
    methods: ["get","head"],
    url: '/analytics/sales-forecast',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\AnalyticsController::salesForecast
 * @see app/Http/Controllers/Admin/AnalyticsController.php:247
 * @route '/analytics/sales-forecast'
 */
salesForecast.url = (options?: RouteQueryOptions) => {
    return salesForecast.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AnalyticsController::salesForecast
 * @see app/Http/Controllers/Admin/AnalyticsController.php:247
 * @route '/analytics/sales-forecast'
 */
salesForecast.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: salesForecast.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\AnalyticsController::salesForecast
 * @see app/Http/Controllers/Admin/AnalyticsController.php:247
 * @route '/analytics/sales-forecast'
 */
salesForecast.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: salesForecast.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\AnalyticsController::salesForecast
 * @see app/Http/Controllers/Admin/AnalyticsController.php:247
 * @route '/analytics/sales-forecast'
 */
    const salesForecastForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: salesForecast.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\AnalyticsController::salesForecast
 * @see app/Http/Controllers/Admin/AnalyticsController.php:247
 * @route '/analytics/sales-forecast'
 */
        salesForecastForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: salesForecast.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\AnalyticsController::salesForecast
 * @see app/Http/Controllers/Admin/AnalyticsController.php:247
 * @route '/analytics/sales-forecast'
 */
        salesForecastForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: salesForecast.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    salesForecast.form = salesForecastForm
/**
* @see \App\Http\Controllers\Admin\AnalyticsController::restockSuggestions
 * @see app/Http/Controllers/Admin/AnalyticsController.php:270
 * @route '/analytics/restock-suggestions'
 */
export const restockSuggestions = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: restockSuggestions.url(options),
    method: 'get',
})

restockSuggestions.definition = {
    methods: ["get","head"],
    url: '/analytics/restock-suggestions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\AnalyticsController::restockSuggestions
 * @see app/Http/Controllers/Admin/AnalyticsController.php:270
 * @route '/analytics/restock-suggestions'
 */
restockSuggestions.url = (options?: RouteQueryOptions) => {
    return restockSuggestions.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AnalyticsController::restockSuggestions
 * @see app/Http/Controllers/Admin/AnalyticsController.php:270
 * @route '/analytics/restock-suggestions'
 */
restockSuggestions.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: restockSuggestions.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\AnalyticsController::restockSuggestions
 * @see app/Http/Controllers/Admin/AnalyticsController.php:270
 * @route '/analytics/restock-suggestions'
 */
restockSuggestions.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: restockSuggestions.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\AnalyticsController::restockSuggestions
 * @see app/Http/Controllers/Admin/AnalyticsController.php:270
 * @route '/analytics/restock-suggestions'
 */
    const restockSuggestionsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: restockSuggestions.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\AnalyticsController::restockSuggestions
 * @see app/Http/Controllers/Admin/AnalyticsController.php:270
 * @route '/analytics/restock-suggestions'
 */
        restockSuggestionsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: restockSuggestions.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\AnalyticsController::restockSuggestions
 * @see app/Http/Controllers/Admin/AnalyticsController.php:270
 * @route '/analytics/restock-suggestions'
 */
        restockSuggestionsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: restockSuggestions.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    restockSuggestions.form = restockSuggestionsForm
const analytics = {
    cashierPerformance: Object.assign(cashierPerformance, cashierPerformanceDb39e1),
salesForecast: Object.assign(salesForecast, salesForecast),
restockSuggestions: Object.assign(restockSuggestions, restockSuggestions),
}

export default analytics