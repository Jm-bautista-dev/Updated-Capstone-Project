import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\AnalyticsController::run
 * @see app/Http/Controllers/Admin/AnalyticsController.php:417
 * @route '/analytics/forecast-benchmarking/run'
 */
export const run = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: run.url(options),
    method: 'post',
})

run.definition = {
    methods: ["post"],
    url: '/analytics/forecast-benchmarking/run',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\AnalyticsController::run
 * @see app/Http/Controllers/Admin/AnalyticsController.php:417
 * @route '/analytics/forecast-benchmarking/run'
 */
run.url = (options?: RouteQueryOptions) => {
    return run.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AnalyticsController::run
 * @see app/Http/Controllers/Admin/AnalyticsController.php:417
 * @route '/analytics/forecast-benchmarking/run'
 */
run.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: run.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\AnalyticsController::run
 * @see app/Http/Controllers/Admin/AnalyticsController.php:417
 * @route '/analytics/forecast-benchmarking/run'
 */
    const runForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: run.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\AnalyticsController::run
 * @see app/Http/Controllers/Admin/AnalyticsController.php:417
 * @route '/analytics/forecast-benchmarking/run'
 */
        runForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: run.url(options),
            method: 'post',
        })
    
    run.form = runForm
/**
* @see \App\Http\Controllers\Admin\AnalyticsController::save
 * @see app/Http/Controllers/Admin/AnalyticsController.php:428
 * @route '/analytics/forecast-benchmarking/save'
 */
export const save = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: save.url(options),
    method: 'post',
})

save.definition = {
    methods: ["post"],
    url: '/analytics/forecast-benchmarking/save',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\AnalyticsController::save
 * @see app/Http/Controllers/Admin/AnalyticsController.php:428
 * @route '/analytics/forecast-benchmarking/save'
 */
save.url = (options?: RouteQueryOptions) => {
    return save.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AnalyticsController::save
 * @see app/Http/Controllers/Admin/AnalyticsController.php:428
 * @route '/analytics/forecast-benchmarking/save'
 */
save.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: save.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\AnalyticsController::save
 * @see app/Http/Controllers/Admin/AnalyticsController.php:428
 * @route '/analytics/forecast-benchmarking/save'
 */
    const saveForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: save.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\AnalyticsController::save
 * @see app/Http/Controllers/Admin/AnalyticsController.php:428
 * @route '/analytics/forecast-benchmarking/save'
 */
        saveForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: save.url(options),
            method: 'post',
        })
    
    save.form = saveForm
/**
* @see \App\Http\Controllers\Admin\AnalyticsController::exportMethod
 * @see app/Http/Controllers/Admin/AnalyticsController.php:461
 * @route '/analytics/forecast-benchmarking/export'
 */
export const exportMethod = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/analytics/forecast-benchmarking/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\AnalyticsController::exportMethod
 * @see app/Http/Controllers/Admin/AnalyticsController.php:461
 * @route '/analytics/forecast-benchmarking/export'
 */
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AnalyticsController::exportMethod
 * @see app/Http/Controllers/Admin/AnalyticsController.php:461
 * @route '/analytics/forecast-benchmarking/export'
 */
exportMethod.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\AnalyticsController::exportMethod
 * @see app/Http/Controllers/Admin/AnalyticsController.php:461
 * @route '/analytics/forecast-benchmarking/export'
 */
exportMethod.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\AnalyticsController::exportMethod
 * @see app/Http/Controllers/Admin/AnalyticsController.php:461
 * @route '/analytics/forecast-benchmarking/export'
 */
    const exportMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportMethod.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\AnalyticsController::exportMethod
 * @see app/Http/Controllers/Admin/AnalyticsController.php:461
 * @route '/analytics/forecast-benchmarking/export'
 */
        exportMethodForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportMethod.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\AnalyticsController::exportMethod
 * @see app/Http/Controllers/Admin/AnalyticsController.php:461
 * @route '/analytics/forecast-benchmarking/export'
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
const forecastBenchmarking = {
    run: Object.assign(run, run),
save: Object.assign(save, save),
export: Object.assign(exportMethod, exportMethod),
}

export default forecastBenchmarking