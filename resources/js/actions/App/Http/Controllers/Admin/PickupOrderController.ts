import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/pickups'
 */
const indexdd7fb018c722a9d62e4c4cb8a1e96501 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexdd7fb018c722a9d62e4c4cb8a1e96501.url(options),
    method: 'get',
})

indexdd7fb018c722a9d62e4c4cb8a1e96501.definition = {
    methods: ["get","head"],
    url: '/pickups',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/pickups'
 */
indexdd7fb018c722a9d62e4c4cb8a1e96501.url = (options?: RouteQueryOptions) => {
    return indexdd7fb018c722a9d62e4c4cb8a1e96501.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/pickups'
 */
indexdd7fb018c722a9d62e4c4cb8a1e96501.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexdd7fb018c722a9d62e4c4cb8a1e96501.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/pickups'
 */
indexdd7fb018c722a9d62e4c4cb8a1e96501.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: indexdd7fb018c722a9d62e4c4cb8a1e96501.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/pickups'
 */
    const indexdd7fb018c722a9d62e4c4cb8a1e96501Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: indexdd7fb018c722a9d62e4c4cb8a1e96501.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/pickups'
 */
        indexdd7fb018c722a9d62e4c4cb8a1e96501Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexdd7fb018c722a9d62e4c4cb8a1e96501.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/pickups'
 */
        indexdd7fb018c722a9d62e4c4cb8a1e96501Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexdd7fb018c722a9d62e4c4cb8a1e96501.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    indexdd7fb018c722a9d62e4c4cb8a1e96501.form = indexdd7fb018c722a9d62e4c4cb8a1e96501Form
    /**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/admin/pickups'
 */
const index1419591afb92824e62260c10ace2bd2b = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index1419591afb92824e62260c10ace2bd2b.url(options),
    method: 'get',
})

index1419591afb92824e62260c10ace2bd2b.definition = {
    methods: ["get","head"],
    url: '/admin/pickups',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/admin/pickups'
 */
index1419591afb92824e62260c10ace2bd2b.url = (options?: RouteQueryOptions) => {
    return index1419591afb92824e62260c10ace2bd2b.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/admin/pickups'
 */
index1419591afb92824e62260c10ace2bd2b.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index1419591afb92824e62260c10ace2bd2b.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/admin/pickups'
 */
index1419591afb92824e62260c10ace2bd2b.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index1419591afb92824e62260c10ace2bd2b.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/admin/pickups'
 */
    const index1419591afb92824e62260c10ace2bd2bForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index1419591afb92824e62260c10ace2bd2b.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/admin/pickups'
 */
        index1419591afb92824e62260c10ace2bd2bForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index1419591afb92824e62260c10ace2bd2b.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/admin/pickups'
 */
        index1419591afb92824e62260c10ace2bd2bForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index1419591afb92824e62260c10ace2bd2b.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index1419591afb92824e62260c10ace2bd2b.form = index1419591afb92824e62260c10ace2bd2bForm

export const index = {
    '/pickups': indexdd7fb018c722a9d62e4c4cb8a1e96501,
    '/admin/pickups': index1419591afb92824e62260c10ace2bd2b,
}

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::storeManual
 * @see app/Http/Controllers/Admin/PickupOrderController.php:146
 * @route '/pickups/manual'
 */
export const storeManual = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeManual.url(options),
    method: 'post',
})

storeManual.definition = {
    methods: ["post"],
    url: '/pickups/manual',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::storeManual
 * @see app/Http/Controllers/Admin/PickupOrderController.php:146
 * @route '/pickups/manual'
 */
storeManual.url = (options?: RouteQueryOptions) => {
    return storeManual.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::storeManual
 * @see app/Http/Controllers/Admin/PickupOrderController.php:146
 * @route '/pickups/manual'
 */
storeManual.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeManual.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\PickupOrderController::storeManual
 * @see app/Http/Controllers/Admin/PickupOrderController.php:146
 * @route '/pickups/manual'
 */
    const storeManualForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeManual.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PickupOrderController::storeManual
 * @see app/Http/Controllers/Admin/PickupOrderController.php:146
 * @route '/pickups/manual'
 */
        storeManualForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeManual.url(options),
            method: 'post',
        })
    
    storeManual.form = storeManualForm
/**
* @see \App\Http\Controllers\Admin\PickupOrderController::updateStatus
 * @see app/Http/Controllers/Admin/PickupOrderController.php:179
 * @route '/pickups/{id}/status'
 */
export const updateStatus = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateStatus.url(args, options),
    method: 'post',
})

updateStatus.definition = {
    methods: ["post"],
    url: '/pickups/{id}/status',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::updateStatus
 * @see app/Http/Controllers/Admin/PickupOrderController.php:179
 * @route '/pickups/{id}/status'
 */
updateStatus.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return updateStatus.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::updateStatus
 * @see app/Http/Controllers/Admin/PickupOrderController.php:179
 * @route '/pickups/{id}/status'
 */
updateStatus.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateStatus.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\PickupOrderController::updateStatus
 * @see app/Http/Controllers/Admin/PickupOrderController.php:179
 * @route '/pickups/{id}/status'
 */
    const updateStatusForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateStatus.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PickupOrderController::updateStatus
 * @see app/Http/Controllers/Admin/PickupOrderController.php:179
 * @route '/pickups/{id}/status'
 */
        updateStatusForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateStatus.url(args, options),
            method: 'post',
        })
    
    updateStatus.form = updateStatusForm
/**
* @see \App\Http\Controllers\Admin\PickupOrderController::verifyComplete
 * @see app/Http/Controllers/Admin/PickupOrderController.php:205
 * @route '/pickups/{id}/verify-complete'
 */
export const verifyComplete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verifyComplete.url(args, options),
    method: 'post',
})

verifyComplete.definition = {
    methods: ["post"],
    url: '/pickups/{id}/verify-complete',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::verifyComplete
 * @see app/Http/Controllers/Admin/PickupOrderController.php:205
 * @route '/pickups/{id}/verify-complete'
 */
verifyComplete.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return verifyComplete.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::verifyComplete
 * @see app/Http/Controllers/Admin/PickupOrderController.php:205
 * @route '/pickups/{id}/verify-complete'
 */
verifyComplete.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verifyComplete.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\PickupOrderController::verifyComplete
 * @see app/Http/Controllers/Admin/PickupOrderController.php:205
 * @route '/pickups/{id}/verify-complete'
 */
    const verifyCompleteForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: verifyComplete.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PickupOrderController::verifyComplete
 * @see app/Http/Controllers/Admin/PickupOrderController.php:205
 * @route '/pickups/{id}/verify-complete'
 */
        verifyCompleteForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: verifyComplete.url(args, options),
            method: 'post',
        })
    
    verifyComplete.form = verifyCompleteForm
/**
* @see \App\Http\Controllers\Admin\PickupOrderController::reschedule
 * @see app/Http/Controllers/Admin/PickupOrderController.php:231
 * @route '/pickups/{id}/reschedule'
 */
export const reschedule = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reschedule.url(args, options),
    method: 'post',
})

reschedule.definition = {
    methods: ["post"],
    url: '/pickups/{id}/reschedule',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::reschedule
 * @see app/Http/Controllers/Admin/PickupOrderController.php:231
 * @route '/pickups/{id}/reschedule'
 */
reschedule.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return reschedule.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::reschedule
 * @see app/Http/Controllers/Admin/PickupOrderController.php:231
 * @route '/pickups/{id}/reschedule'
 */
reschedule.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reschedule.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\PickupOrderController::reschedule
 * @see app/Http/Controllers/Admin/PickupOrderController.php:231
 * @route '/pickups/{id}/reschedule'
 */
    const rescheduleForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reschedule.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PickupOrderController::reschedule
 * @see app/Http/Controllers/Admin/PickupOrderController.php:231
 * @route '/pickups/{id}/reschedule'
 */
        rescheduleForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reschedule.url(args, options),
            method: 'post',
        })
    
    reschedule.form = rescheduleForm
const PickupOrderController = { index, storeManual, updateStatus, verifyComplete, reschedule }

export default PickupOrderController