import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\DeliveryController::getLiveRiderLocations
 * @see app/Http/Controllers/Admin/DeliveryController.php:455
 * @route '/api/v1/deliveries/live-riders'
 */
const getLiveRiderLocations054d85beb9c8c410feec91746240edf6 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getLiveRiderLocations054d85beb9c8c410feec91746240edf6.url(options),
    method: 'get',
})

getLiveRiderLocations054d85beb9c8c410feec91746240edf6.definition = {
    methods: ["get","head"],
    url: '/api/v1/deliveries/live-riders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::getLiveRiderLocations
 * @see app/Http/Controllers/Admin/DeliveryController.php:455
 * @route '/api/v1/deliveries/live-riders'
 */
getLiveRiderLocations054d85beb9c8c410feec91746240edf6.url = (options?: RouteQueryOptions) => {
    return getLiveRiderLocations054d85beb9c8c410feec91746240edf6.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::getLiveRiderLocations
 * @see app/Http/Controllers/Admin/DeliveryController.php:455
 * @route '/api/v1/deliveries/live-riders'
 */
getLiveRiderLocations054d85beb9c8c410feec91746240edf6.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getLiveRiderLocations054d85beb9c8c410feec91746240edf6.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DeliveryController::getLiveRiderLocations
 * @see app/Http/Controllers/Admin/DeliveryController.php:455
 * @route '/api/v1/deliveries/live-riders'
 */
getLiveRiderLocations054d85beb9c8c410feec91746240edf6.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getLiveRiderLocations054d85beb9c8c410feec91746240edf6.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::getLiveRiderLocations
 * @see app/Http/Controllers/Admin/DeliveryController.php:455
 * @route '/api/v1/deliveries/live-riders'
 */
    const getLiveRiderLocations054d85beb9c8c410feec91746240edf6Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getLiveRiderLocations054d85beb9c8c410feec91746240edf6.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::getLiveRiderLocations
 * @see app/Http/Controllers/Admin/DeliveryController.php:455
 * @route '/api/v1/deliveries/live-riders'
 */
        getLiveRiderLocations054d85beb9c8c410feec91746240edf6Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getLiveRiderLocations054d85beb9c8c410feec91746240edf6.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DeliveryController::getLiveRiderLocations
 * @see app/Http/Controllers/Admin/DeliveryController.php:455
 * @route '/api/v1/deliveries/live-riders'
 */
        getLiveRiderLocations054d85beb9c8c410feec91746240edf6Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getLiveRiderLocations054d85beb9c8c410feec91746240edf6.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getLiveRiderLocations054d85beb9c8c410feec91746240edf6.form = getLiveRiderLocations054d85beb9c8c410feec91746240edf6Form
    /**
* @see \App\Http\Controllers\Admin\DeliveryController::getLiveRiderLocations
 * @see app/Http/Controllers/Admin/DeliveryController.php:455
 * @route '/deliveries/live-riders'
 */
const getLiveRiderLocations85a34385fd96f61867bbfea3d5390bcc = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getLiveRiderLocations85a34385fd96f61867bbfea3d5390bcc.url(options),
    method: 'get',
})

getLiveRiderLocations85a34385fd96f61867bbfea3d5390bcc.definition = {
    methods: ["get","head"],
    url: '/deliveries/live-riders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::getLiveRiderLocations
 * @see app/Http/Controllers/Admin/DeliveryController.php:455
 * @route '/deliveries/live-riders'
 */
getLiveRiderLocations85a34385fd96f61867bbfea3d5390bcc.url = (options?: RouteQueryOptions) => {
    return getLiveRiderLocations85a34385fd96f61867bbfea3d5390bcc.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::getLiveRiderLocations
 * @see app/Http/Controllers/Admin/DeliveryController.php:455
 * @route '/deliveries/live-riders'
 */
getLiveRiderLocations85a34385fd96f61867bbfea3d5390bcc.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getLiveRiderLocations85a34385fd96f61867bbfea3d5390bcc.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DeliveryController::getLiveRiderLocations
 * @see app/Http/Controllers/Admin/DeliveryController.php:455
 * @route '/deliveries/live-riders'
 */
getLiveRiderLocations85a34385fd96f61867bbfea3d5390bcc.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getLiveRiderLocations85a34385fd96f61867bbfea3d5390bcc.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::getLiveRiderLocations
 * @see app/Http/Controllers/Admin/DeliveryController.php:455
 * @route '/deliveries/live-riders'
 */
    const getLiveRiderLocations85a34385fd96f61867bbfea3d5390bccForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getLiveRiderLocations85a34385fd96f61867bbfea3d5390bcc.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::getLiveRiderLocations
 * @see app/Http/Controllers/Admin/DeliveryController.php:455
 * @route '/deliveries/live-riders'
 */
        getLiveRiderLocations85a34385fd96f61867bbfea3d5390bccForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getLiveRiderLocations85a34385fd96f61867bbfea3d5390bcc.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DeliveryController::getLiveRiderLocations
 * @see app/Http/Controllers/Admin/DeliveryController.php:455
 * @route '/deliveries/live-riders'
 */
        getLiveRiderLocations85a34385fd96f61867bbfea3d5390bccForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getLiveRiderLocations85a34385fd96f61867bbfea3d5390bcc.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getLiveRiderLocations85a34385fd96f61867bbfea3d5390bcc.form = getLiveRiderLocations85a34385fd96f61867bbfea3d5390bccForm

export const getLiveRiderLocations = {
    '/api/v1/deliveries/live-riders': getLiveRiderLocations054d85beb9c8c410feec91746240edf6,
    '/deliveries/live-riders': getLiveRiderLocations85a34385fd96f61867bbfea3d5390bcc,
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::getRoute
 * @see app/Http/Controllers/Admin/DeliveryController.php:573
 * @route '/api/v1/deliveries/{id}/route'
 */
const getRoute39812b5e1fe2ef106ff477c170250c7d = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getRoute39812b5e1fe2ef106ff477c170250c7d.url(args, options),
    method: 'get',
})

getRoute39812b5e1fe2ef106ff477c170250c7d.definition = {
    methods: ["get","head"],
    url: '/api/v1/deliveries/{id}/route',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::getRoute
 * @see app/Http/Controllers/Admin/DeliveryController.php:573
 * @route '/api/v1/deliveries/{id}/route'
 */
getRoute39812b5e1fe2ef106ff477c170250c7d.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return getRoute39812b5e1fe2ef106ff477c170250c7d.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::getRoute
 * @see app/Http/Controllers/Admin/DeliveryController.php:573
 * @route '/api/v1/deliveries/{id}/route'
 */
getRoute39812b5e1fe2ef106ff477c170250c7d.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getRoute39812b5e1fe2ef106ff477c170250c7d.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DeliveryController::getRoute
 * @see app/Http/Controllers/Admin/DeliveryController.php:573
 * @route '/api/v1/deliveries/{id}/route'
 */
getRoute39812b5e1fe2ef106ff477c170250c7d.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getRoute39812b5e1fe2ef106ff477c170250c7d.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::getRoute
 * @see app/Http/Controllers/Admin/DeliveryController.php:573
 * @route '/api/v1/deliveries/{id}/route'
 */
    const getRoute39812b5e1fe2ef106ff477c170250c7dForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getRoute39812b5e1fe2ef106ff477c170250c7d.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::getRoute
 * @see app/Http/Controllers/Admin/DeliveryController.php:573
 * @route '/api/v1/deliveries/{id}/route'
 */
        getRoute39812b5e1fe2ef106ff477c170250c7dForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getRoute39812b5e1fe2ef106ff477c170250c7d.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DeliveryController::getRoute
 * @see app/Http/Controllers/Admin/DeliveryController.php:573
 * @route '/api/v1/deliveries/{id}/route'
 */
        getRoute39812b5e1fe2ef106ff477c170250c7dForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getRoute39812b5e1fe2ef106ff477c170250c7d.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getRoute39812b5e1fe2ef106ff477c170250c7d.form = getRoute39812b5e1fe2ef106ff477c170250c7dForm
    /**
* @see \App\Http\Controllers\Admin\DeliveryController::getRoute
 * @see app/Http/Controllers/Admin/DeliveryController.php:573
 * @route '/deliveries/{delivery}/route'
 */
const getRoute5dbb1d26137d8c6ecff249c86828ce00 = (args: { delivery: string | number } | [delivery: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getRoute5dbb1d26137d8c6ecff249c86828ce00.url(args, options),
    method: 'get',
})

getRoute5dbb1d26137d8c6ecff249c86828ce00.definition = {
    methods: ["get","head"],
    url: '/deliveries/{delivery}/route',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::getRoute
 * @see app/Http/Controllers/Admin/DeliveryController.php:573
 * @route '/deliveries/{delivery}/route'
 */
getRoute5dbb1d26137d8c6ecff249c86828ce00.url = (args: { delivery: string | number } | [delivery: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { delivery: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    delivery: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        delivery: args.delivery,
                }

    return getRoute5dbb1d26137d8c6ecff249c86828ce00.definition.url
            .replace('{delivery}', parsedArgs.delivery.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::getRoute
 * @see app/Http/Controllers/Admin/DeliveryController.php:573
 * @route '/deliveries/{delivery}/route'
 */
getRoute5dbb1d26137d8c6ecff249c86828ce00.get = (args: { delivery: string | number } | [delivery: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getRoute5dbb1d26137d8c6ecff249c86828ce00.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DeliveryController::getRoute
 * @see app/Http/Controllers/Admin/DeliveryController.php:573
 * @route '/deliveries/{delivery}/route'
 */
getRoute5dbb1d26137d8c6ecff249c86828ce00.head = (args: { delivery: string | number } | [delivery: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getRoute5dbb1d26137d8c6ecff249c86828ce00.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::getRoute
 * @see app/Http/Controllers/Admin/DeliveryController.php:573
 * @route '/deliveries/{delivery}/route'
 */
    const getRoute5dbb1d26137d8c6ecff249c86828ce00Form = (args: { delivery: string | number } | [delivery: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getRoute5dbb1d26137d8c6ecff249c86828ce00.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::getRoute
 * @see app/Http/Controllers/Admin/DeliveryController.php:573
 * @route '/deliveries/{delivery}/route'
 */
        getRoute5dbb1d26137d8c6ecff249c86828ce00Form.get = (args: { delivery: string | number } | [delivery: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getRoute5dbb1d26137d8c6ecff249c86828ce00.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DeliveryController::getRoute
 * @see app/Http/Controllers/Admin/DeliveryController.php:573
 * @route '/deliveries/{delivery}/route'
 */
        getRoute5dbb1d26137d8c6ecff249c86828ce00Form.head = (args: { delivery: string | number } | [delivery: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getRoute5dbb1d26137d8c6ecff249c86828ce00.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getRoute5dbb1d26137d8c6ecff249c86828ce00.form = getRoute5dbb1d26137d8c6ecff249c86828ce00Form

export const getRoute = {
    '/api/v1/deliveries/{id}/route': getRoute39812b5e1fe2ef106ff477c170250c7d,
    '/deliveries/{delivery}/route': getRoute5dbb1d26137d8c6ecff249c86828ce00,
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:28
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
 * @see app/Http/Controllers/Admin/DeliveryController.php:28
 * @route '/deliveries'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:28
 * @route '/deliveries'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:28
 * @route '/deliveries'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:28
 * @route '/deliveries'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:28
 * @route '/deliveries'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:28
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
 * @see app/Http/Controllers/Admin/DeliveryController.php:321
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
 * @see app/Http/Controllers/Admin/DeliveryController.php:321
 * @route '/deliveries'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::store
 * @see app/Http/Controllers/Admin/DeliveryController.php:321
 * @route '/deliveries'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::store
 * @see app/Http/Controllers/Admin/DeliveryController.php:321
 * @route '/deliveries'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::store
 * @see app/Http/Controllers/Admin/DeliveryController.php:321
 * @route '/deliveries'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\DeliveryController::updateStatus
 * @see app/Http/Controllers/Admin/DeliveryController.php:331
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
 * @see app/Http/Controllers/Admin/DeliveryController.php:331
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
 * @see app/Http/Controllers/Admin/DeliveryController.php:331
 * @route '/deliveries/{delivery}/status'
 */
updateStatus.put = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateStatus.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::updateStatus
 * @see app/Http/Controllers/Admin/DeliveryController.php:331
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
 * @see app/Http/Controllers/Admin/DeliveryController.php:331
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
 * @see app/Http/Controllers/Admin/DeliveryController.php:344
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
 * @see app/Http/Controllers/Admin/DeliveryController.php:344
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
 * @see app/Http/Controllers/Admin/DeliveryController.php:344
 * @route '/deliveries/{delivery}/cancel'
 */
cancel.post = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::cancel
 * @see app/Http/Controllers/Admin/DeliveryController.php:344
 * @route '/deliveries/{delivery}/cancel'
 */
    const cancelForm = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancel.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::cancel
 * @see app/Http/Controllers/Admin/DeliveryController.php:344
 * @route '/deliveries/{delivery}/cancel'
 */
        cancelForm.post = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancel.url(args, options),
            method: 'post',
        })
    
    cancel.form = cancelForm
/**
* @see \App\Http\Controllers\Admin\DeliveryController::failDelivery
 * @see app/Http/Controllers/Admin/DeliveryController.php:392
 * @route '/deliveries/{delivery}/fail'
 */
export const failDelivery = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: failDelivery.url(args, options),
    method: 'post',
})

failDelivery.definition = {
    methods: ["post"],
    url: '/deliveries/{delivery}/fail',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::failDelivery
 * @see app/Http/Controllers/Admin/DeliveryController.php:392
 * @route '/deliveries/{delivery}/fail'
 */
failDelivery.url = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return failDelivery.definition.url
            .replace('{delivery}', parsedArgs.delivery.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::failDelivery
 * @see app/Http/Controllers/Admin/DeliveryController.php:392
 * @route '/deliveries/{delivery}/fail'
 */
failDelivery.post = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: failDelivery.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::failDelivery
 * @see app/Http/Controllers/Admin/DeliveryController.php:392
 * @route '/deliveries/{delivery}/fail'
 */
    const failDeliveryForm = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: failDelivery.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::failDelivery
 * @see app/Http/Controllers/Admin/DeliveryController.php:392
 * @route '/deliveries/{delivery}/fail'
 */
        failDeliveryForm.post = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: failDelivery.url(args, options),
            method: 'post',
        })
    
    failDelivery.form = failDeliveryForm
/**
* @see \App\Http\Controllers\Admin\DeliveryController::assignRider
 * @see app/Http/Controllers/Admin/DeliveryController.php:282
 * @route '/deliveries/{delivery}/assign-rider'
 */
export const assignRider = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: assignRider.url(args, options),
    method: 'post',
})

assignRider.definition = {
    methods: ["post"],
    url: '/deliveries/{delivery}/assign-rider',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::assignRider
 * @see app/Http/Controllers/Admin/DeliveryController.php:282
 * @route '/deliveries/{delivery}/assign-rider'
 */
assignRider.url = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return assignRider.definition.url
            .replace('{delivery}', parsedArgs.delivery.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::assignRider
 * @see app/Http/Controllers/Admin/DeliveryController.php:282
 * @route '/deliveries/{delivery}/assign-rider'
 */
assignRider.post = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: assignRider.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::assignRider
 * @see app/Http/Controllers/Admin/DeliveryController.php:282
 * @route '/deliveries/{delivery}/assign-rider'
 */
    const assignRiderForm = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: assignRider.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::assignRider
 * @see app/Http/Controllers/Admin/DeliveryController.php:282
 * @route '/deliveries/{delivery}/assign-rider'
 */
        assignRiderForm.post = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: assignRider.url(args, options),
            method: 'post',
        })
    
    assignRider.form = assignRiderForm
/**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:424
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
 * @see app/Http/Controllers/Admin/DeliveryController.php:424
 * @route '/deliveries/recommend'
 */
recommend.url = (options?: RouteQueryOptions) => {
    return recommend.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:424
 * @route '/deliveries/recommend'
 */
recommend.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: recommend.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:424
 * @route '/deliveries/recommend'
 */
recommend.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: recommend.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:424
 * @route '/deliveries/recommend'
 */
    const recommendForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: recommend.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:424
 * @route '/deliveries/recommend'
 */
        recommendForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: recommend.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:424
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
const DeliveryController = { getLiveRiderLocations, getRoute, index, store, updateStatus, cancel, failDelivery, assignRider, recommend }

export default DeliveryController