import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:27
 * @route '/deliveries'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/deliveries',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:27
 * @route '/deliveries'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:27
 * @route '/deliveries'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:27
 * @route '/deliveries'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:27
 * @route '/deliveries'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:27
 * @route '/deliveries'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:27
 * @route '/deliveries'
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
* @see \App\Http\Controllers\Admin\DeliveryController::store
 * @see app/Http/Controllers/Admin/DeliveryController.php:72
 * @route '/deliveries'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/deliveries',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::store
 * @see app/Http/Controllers/Admin/DeliveryController.php:72
 * @route '/deliveries'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::store
 * @see app/Http/Controllers/Admin/DeliveryController.php:72
 * @route '/deliveries'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::store
 * @see app/Http/Controllers/Admin/DeliveryController.php:72
 * @route '/deliveries'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::store
 * @see app/Http/Controllers/Admin/DeliveryController.php:72
 * @route '/deliveries'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\DeliveryController::updateStatus
 * @see app/Http/Controllers/Admin/DeliveryController.php:82
 * @route '/deliveries/{delivery}/status'
 */
export const updateStatus = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateStatus.url(args, options),
    method: 'put',
})

updateStatus.definition = {
    methods: ["put"],
    url: '/deliveries/{delivery}/status',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::updateStatus
 * @see app/Http/Controllers/Admin/DeliveryController.php:82
 * @route '/deliveries/{delivery}/status'
 */
updateStatus.url = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { delivery: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { delivery: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    delivery: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        delivery: typeof args.delivery === 'object'
                ? args.delivery.id
                : args.delivery,
                }

    return updateStatus.definition.url
            .replace('{delivery}', parsedArgs.delivery.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::updateStatus
 * @see app/Http/Controllers/Admin/DeliveryController.php:82
 * @route '/deliveries/{delivery}/status'
 */
updateStatus.put = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateStatus.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::updateStatus
 * @see app/Http/Controllers/Admin/DeliveryController.php:82
 * @route '/deliveries/{delivery}/status'
 */
    const updateStatusForm = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::updateStatus
 * @see app/Http/Controllers/Admin/DeliveryController.php:82
 * @route '/deliveries/{delivery}/status'
 */
        updateStatusForm.put = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateStatus.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateStatus.form = updateStatusForm
/**
* @see \App\Http\Controllers\Admin\DeliveryController::cancel
 * @see app/Http/Controllers/Admin/DeliveryController.php:95
 * @route '/deliveries/{delivery}/cancel'
 */
export const cancel = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

cancel.definition = {
    methods: ["post"],
    url: '/deliveries/{delivery}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::cancel
 * @see app/Http/Controllers/Admin/DeliveryController.php:95
 * @route '/deliveries/{delivery}/cancel'
 */
cancel.url = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { delivery: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { delivery: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    delivery: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        delivery: typeof args.delivery === 'object'
                ? args.delivery.id
                : args.delivery,
                }

    return cancel.definition.url
            .replace('{delivery}', parsedArgs.delivery.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::cancel
 * @see app/Http/Controllers/Admin/DeliveryController.php:95
 * @route '/deliveries/{delivery}/cancel'
 */
cancel.post = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::cancel
 * @see app/Http/Controllers/Admin/DeliveryController.php:95
 * @route '/deliveries/{delivery}/cancel'
 */
    const cancelForm = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancel.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::cancel
 * @see app/Http/Controllers/Admin/DeliveryController.php:95
 * @route '/deliveries/{delivery}/cancel'
 */
        cancelForm.post = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancel.url(args, options),
            method: 'post',
        })
    
    cancel.form = cancelForm
/**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:141
 * @route '/deliveries/recommend'
 */
export const recommend = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: recommend.url(options),
    method: 'get',
})

recommend.definition = {
    methods: ["get","head"],
    url: '/deliveries/recommend',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:141
 * @route '/deliveries/recommend'
 */
recommend.url = (options?: RouteQueryOptions) => {
    return recommend.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:141
 * @route '/deliveries/recommend'
 */
recommend.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: recommend.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:141
 * @route '/deliveries/recommend'
 */
recommend.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: recommend.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:141
 * @route '/deliveries/recommend'
 */
    const recommendForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: recommend.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:141
 * @route '/deliveries/recommend'
 */
        recommendForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: recommend.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:141
 * @route '/deliveries/recommend'
 */
        recommendForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: recommend.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    recommend.form = recommendForm
const DeliveryController = { index, store, updateStatus, cancel, recommend }

export default DeliveryController