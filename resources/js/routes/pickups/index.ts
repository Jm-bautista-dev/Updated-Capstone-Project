import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/pickups'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/pickups',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/pickups'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/pickups'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/pickups'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/pickups'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/pickups'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\PickupOrderController::index
 * @see app/Http/Controllers/Admin/PickupOrderController.php:26
 * @route '/pickups'
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
* @see \App\Http\Controllers\Admin\PickupOrderController::manual
 * @see app/Http/Controllers/Admin/PickupOrderController.php:146
 * @route '/pickups/manual'
 */
export const manual = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: manual.url(options),
    method: 'post',
})

manual.definition = {
    methods: ["post"],
    url: '/pickups/manual',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::manual
 * @see app/Http/Controllers/Admin/PickupOrderController.php:146
 * @route '/pickups/manual'
 */
manual.url = (options?: RouteQueryOptions) => {
    return manual.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PickupOrderController::manual
 * @see app/Http/Controllers/Admin/PickupOrderController.php:146
 * @route '/pickups/manual'
 */
manual.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: manual.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\PickupOrderController::manual
 * @see app/Http/Controllers/Admin/PickupOrderController.php:146
 * @route '/pickups/manual'
 */
    const manualForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: manual.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PickupOrderController::manual
 * @see app/Http/Controllers/Admin/PickupOrderController.php:146
 * @route '/pickups/manual'
 */
        manualForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: manual.url(options),
            method: 'post',
        })
    
    manual.form = manualForm
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
const pickups = {
    index: Object.assign(index, index),
manual: Object.assign(manual, manual),
updateStatus: Object.assign(updateStatus, updateStatus),
verifyComplete: Object.assign(verifyComplete, verifyComplete),
reschedule: Object.assign(reschedule, reschedule),
}

export default pickups