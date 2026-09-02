import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\SalesController::index
 * @see app/Http/Controllers/SalesController.php:13
 * @route '/sales'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/sales',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SalesController::index
 * @see app/Http/Controllers/SalesController.php:13
 * @route '/sales'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesController::index
 * @see app/Http/Controllers/SalesController.php:13
 * @route '/sales'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SalesController::index
 * @see app/Http/Controllers/SalesController.php:13
 * @route '/sales'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SalesController::index
 * @see app/Http/Controllers/SalesController.php:13
 * @route '/sales'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SalesController::index
 * @see app/Http/Controllers/SalesController.php:13
 * @route '/sales'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SalesController::index
 * @see app/Http/Controllers/SalesController.php:13
 * @route '/sales'
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
/**
* @see \App\Http\Controllers\SalesController::exportSummary
 * @see app/Http/Controllers/SalesController.php:153
 * @route '/sales/export/summary'
 */
export const exportSummary = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportSummary.url(options),
    method: 'get',
})

exportSummary.definition = {
    methods: ["get","head"],
    url: '/sales/export/summary',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SalesController::exportSummary
 * @see app/Http/Controllers/SalesController.php:153
 * @route '/sales/export/summary'
 */
exportSummary.url = (options?: RouteQueryOptions) => {
    return exportSummary.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesController::exportSummary
 * @see app/Http/Controllers/SalesController.php:153
 * @route '/sales/export/summary'
 */
exportSummary.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportSummary.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SalesController::exportSummary
 * @see app/Http/Controllers/SalesController.php:153
 * @route '/sales/export/summary'
 */
exportSummary.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportSummary.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SalesController::exportSummary
 * @see app/Http/Controllers/SalesController.php:153
 * @route '/sales/export/summary'
 */
    const exportSummaryForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportSummary.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SalesController::exportSummary
 * @see app/Http/Controllers/SalesController.php:153
 * @route '/sales/export/summary'
 */
        exportSummaryForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportSummary.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SalesController::exportSummary
 * @see app/Http/Controllers/SalesController.php:153
 * @route '/sales/export/summary'
 */
        exportSummaryForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportSummary.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportSummary.form = exportSummaryForm
/**
* @see \App\Http\Controllers\SalesController::exportCsv
 * @see app/Http/Controllers/SalesController.php:211
 * @route '/sales/export'
 */
export const exportCsv = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportCsv.url(options),
    method: 'get',
})

exportCsv.definition = {
    methods: ["get","head"],
    url: '/sales/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SalesController::exportCsv
 * @see app/Http/Controllers/SalesController.php:211
 * @route '/sales/export'
 */
exportCsv.url = (options?: RouteQueryOptions) => {
    return exportCsv.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesController::exportCsv
 * @see app/Http/Controllers/SalesController.php:211
 * @route '/sales/export'
 */
exportCsv.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportCsv.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SalesController::exportCsv
 * @see app/Http/Controllers/SalesController.php:211
 * @route '/sales/export'
 */
exportCsv.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportCsv.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SalesController::exportCsv
 * @see app/Http/Controllers/SalesController.php:211
 * @route '/sales/export'
 */
    const exportCsvForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportCsv.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SalesController::exportCsv
 * @see app/Http/Controllers/SalesController.php:211
 * @route '/sales/export'
 */
        exportCsvForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportCsv.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SalesController::exportCsv
 * @see app/Http/Controllers/SalesController.php:211
 * @route '/sales/export'
 */
        exportCsvForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportCsv.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportCsv.form = exportCsvForm
/**
* @see \App\Http\Controllers\SalesController::updateStatus
 * @see app/Http/Controllers/SalesController.php:74
 * @route '/sales/{sale}/status'
 */
export const updateStatus = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateStatus.url(args, options),
    method: 'put',
})

updateStatus.definition = {
    methods: ["put","patch"],
    url: '/sales/{sale}/status',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\SalesController::updateStatus
 * @see app/Http/Controllers/SalesController.php:74
 * @route '/sales/{sale}/status'
 */
updateStatus.url = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { sale: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { sale: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    sale: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        sale: typeof args.sale === 'object'
                ? args.sale.id
                : args.sale,
                }

    return updateStatus.definition.url
            .replace('{sale}', parsedArgs.sale.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesController::updateStatus
 * @see app/Http/Controllers/SalesController.php:74
 * @route '/sales/{sale}/status'
 */
updateStatus.put = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateStatus.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\SalesController::updateStatus
 * @see app/Http/Controllers/SalesController.php:74
 * @route '/sales/{sale}/status'
 */
updateStatus.patch = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\SalesController::updateStatus
 * @see app/Http/Controllers/SalesController.php:74
 * @route '/sales/{sale}/status'
 */
    const updateStatusForm = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SalesController::updateStatus
 * @see app/Http/Controllers/SalesController.php:74
 * @route '/sales/{sale}/status'
 */
        updateStatusForm.put = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateStatus.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\SalesController::updateStatus
 * @see app/Http/Controllers/SalesController.php:74
 * @route '/sales/{sale}/status'
 */
        updateStatusForm.patch = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateStatus.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateStatus.form = updateStatusForm
const SalesController = { index, exportSummary, exportCsv, updateStatus }

export default SalesController