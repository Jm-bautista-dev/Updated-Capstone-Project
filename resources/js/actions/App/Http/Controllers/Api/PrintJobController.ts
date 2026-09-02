import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\PrintJobController::pending
 * @see app/Http/Controllers/Api/PrintJobController.php:22
 * @route '/api/v1/pos/print-jobs/pending'
 */
export const pending = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pending.url(options),
    method: 'get',
})

pending.definition = {
    methods: ["get","head"],
    url: '/api/v1/pos/print-jobs/pending',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PrintJobController::pending
 * @see app/Http/Controllers/Api/PrintJobController.php:22
 * @route '/api/v1/pos/print-jobs/pending'
 */
pending.url = (options?: RouteQueryOptions) => {
    return pending.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PrintJobController::pending
 * @see app/Http/Controllers/Api/PrintJobController.php:22
 * @route '/api/v1/pos/print-jobs/pending'
 */
pending.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pending.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\PrintJobController::pending
 * @see app/Http/Controllers/Api/PrintJobController.php:22
 * @route '/api/v1/pos/print-jobs/pending'
 */
pending.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pending.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\PrintJobController::pending
 * @see app/Http/Controllers/Api/PrintJobController.php:22
 * @route '/api/v1/pos/print-jobs/pending'
 */
    const pendingForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: pending.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\PrintJobController::pending
 * @see app/Http/Controllers/Api/PrintJobController.php:22
 * @route '/api/v1/pos/print-jobs/pending'
 */
        pendingForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pending.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\PrintJobController::pending
 * @see app/Http/Controllers/Api/PrintJobController.php:22
 * @route '/api/v1/pos/print-jobs/pending'
 */
        pendingForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pending.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    pending.form = pendingForm
/**
* @see \App\Http\Controllers\Api\PrintJobController::show
 * @see app/Http/Controllers/Api/PrintJobController.php:52
 * @route '/api/v1/pos/print-jobs/{uuid}'
 */
export const show = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/v1/pos/print-jobs/{uuid}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PrintJobController::show
 * @see app/Http/Controllers/Api/PrintJobController.php:52
 * @route '/api/v1/pos/print-jobs/{uuid}'
 */
show.url = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { uuid: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    uuid: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        uuid: args.uuid,
                }

    return show.definition.url
            .replace('{uuid}', parsedArgs.uuid.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PrintJobController::show
 * @see app/Http/Controllers/Api/PrintJobController.php:52
 * @route '/api/v1/pos/print-jobs/{uuid}'
 */
show.get = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\PrintJobController::show
 * @see app/Http/Controllers/Api/PrintJobController.php:52
 * @route '/api/v1/pos/print-jobs/{uuid}'
 */
show.head = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\PrintJobController::show
 * @see app/Http/Controllers/Api/PrintJobController.php:52
 * @route '/api/v1/pos/print-jobs/{uuid}'
 */
    const showForm = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\PrintJobController::show
 * @see app/Http/Controllers/Api/PrintJobController.php:52
 * @route '/api/v1/pos/print-jobs/{uuid}'
 */
        showForm.get = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\PrintJobController::show
 * @see app/Http/Controllers/Api/PrintJobController.php:52
 * @route '/api/v1/pos/print-jobs/{uuid}'
 */
        showForm.head = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\Api\PrintJobController::updateStatus
 * @see app/Http/Controllers/Api/PrintJobController.php:70
 * @route '/api/v1/pos/print-jobs/{uuid}/status'
 */
export const updateStatus = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateStatus.url(args, options),
    method: 'post',
})

updateStatus.definition = {
    methods: ["post"],
    url: '/api/v1/pos/print-jobs/{uuid}/status',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\PrintJobController::updateStatus
 * @see app/Http/Controllers/Api/PrintJobController.php:70
 * @route '/api/v1/pos/print-jobs/{uuid}/status'
 */
updateStatus.url = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { uuid: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    uuid: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        uuid: args.uuid,
                }

    return updateStatus.definition.url
            .replace('{uuid}', parsedArgs.uuid.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PrintJobController::updateStatus
 * @see app/Http/Controllers/Api/PrintJobController.php:70
 * @route '/api/v1/pos/print-jobs/{uuid}/status'
 */
updateStatus.post = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateStatus.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\PrintJobController::updateStatus
 * @see app/Http/Controllers/Api/PrintJobController.php:70
 * @route '/api/v1/pos/print-jobs/{uuid}/status'
 */
    const updateStatusForm = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateStatus.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\PrintJobController::updateStatus
 * @see app/Http/Controllers/Api/PrintJobController.php:70
 * @route '/api/v1/pos/print-jobs/{uuid}/status'
 */
        updateStatusForm.post = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateStatus.url(args, options),
            method: 'post',
        })
    
    updateStatus.form = updateStatusForm
/**
* @see \App\Http\Controllers\Api\PrintJobController::reprint
 * @see app/Http/Controllers/Api/PrintJobController.php:97
 * @route '/api/v1/pos/print-jobs/reprint'
 */
export const reprint = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reprint.url(options),
    method: 'post',
})

reprint.definition = {
    methods: ["post"],
    url: '/api/v1/pos/print-jobs/reprint',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\PrintJobController::reprint
 * @see app/Http/Controllers/Api/PrintJobController.php:97
 * @route '/api/v1/pos/print-jobs/reprint'
 */
reprint.url = (options?: RouteQueryOptions) => {
    return reprint.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PrintJobController::reprint
 * @see app/Http/Controllers/Api/PrintJobController.php:97
 * @route '/api/v1/pos/print-jobs/reprint'
 */
reprint.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reprint.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\PrintJobController::reprint
 * @see app/Http/Controllers/Api/PrintJobController.php:97
 * @route '/api/v1/pos/print-jobs/reprint'
 */
    const reprintForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reprint.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\PrintJobController::reprint
 * @see app/Http/Controllers/Api/PrintJobController.php:97
 * @route '/api/v1/pos/print-jobs/reprint'
 */
        reprintForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reprint.url(options),
            method: 'post',
        })
    
    reprint.form = reprintForm
const PrintJobController = { pending, show, updateStatus, reprint }

export default PrintJobController