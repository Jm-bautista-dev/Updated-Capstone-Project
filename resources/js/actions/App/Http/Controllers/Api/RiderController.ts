import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:417
 * @route '/api/v1/rider/status'
 */
export const updateStatus = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatus.url(options),
    method: 'patch',
})

updateStatus.definition = {
    methods: ["patch"],
    url: '/api/v1/rider/status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:417
 * @route '/api/v1/rider/status'
 */
updateStatus.url = (options?: RouteQueryOptions) => {
    return updateStatus.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:417
 * @route '/api/v1/rider/status'
 */
updateStatus.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatus.url(options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:417
 * @route '/api/v1/rider/status'
 */
    const updateStatusForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateStatus.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:417
 * @route '/api/v1/rider/status'
 */
        updateStatusForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateStatus.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateStatus.form = updateStatusForm
/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:483
 * @route '/api/v1/rider/ping'
 */
export const ping = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ping.url(options),
    method: 'post',
})

ping.definition = {
    methods: ["post"],
    url: '/api/v1/rider/ping',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:483
 * @route '/api/v1/rider/ping'
 */
ping.url = (options?: RouteQueryOptions) => {
    return ping.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:483
 * @route '/api/v1/rider/ping'
 */
ping.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ping.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:483
 * @route '/api/v1/rider/ping'
 */
    const pingForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: ping.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:483
 * @route '/api/v1/rider/ping'
 */
        pingForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: ping.url(options),
            method: 'post',
        })
    
    ping.form = pingForm
/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:445
 * @route '/api/v1/rider/stats'
 */
export const getStats = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStats.url(options),
    method: 'get',
})

getStats.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/stats',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:445
 * @route '/api/v1/rider/stats'
 */
getStats.url = (options?: RouteQueryOptions) => {
    return getStats.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:445
 * @route '/api/v1/rider/stats'
 */
getStats.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStats.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:445
 * @route '/api/v1/rider/stats'
 */
getStats.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStats.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:445
 * @route '/api/v1/rider/stats'
 */
    const getStatsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getStats.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:445
 * @route '/api/v1/rider/stats'
 */
        getStatsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStats.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:445
 * @route '/api/v1/rider/stats'
 */
        getStatsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStats.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getStats.form = getStatsForm
/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:362
 * @route '/api/v1/rider/location'
 */
export const updateLocation = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateLocation.url(options),
    method: 'post',
})

updateLocation.definition = {
    methods: ["post"],
    url: '/api/v1/rider/location',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:362
 * @route '/api/v1/rider/location'
 */
updateLocation.url = (options?: RouteQueryOptions) => {
    return updateLocation.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:362
 * @route '/api/v1/rider/location'
 */
updateLocation.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateLocation.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:362
 * @route '/api/v1/rider/location'
 */
    const updateLocationForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateLocation.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:362
 * @route '/api/v1/rider/location'
 */
        updateLocationForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateLocation.url(options),
            method: 'post',
        })
    
    updateLocation.form = updateLocationForm
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:32
 * @route '/api/v1/rider/orders'
 */
export const getOrders = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders.url(options),
    method: 'get',
})

getOrders.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:32
 * @route '/api/v1/rider/orders'
 */
getOrders.url = (options?: RouteQueryOptions) => {
    return getOrders.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:32
 * @route '/api/v1/rider/orders'
 */
getOrders.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:32
 * @route '/api/v1/rider/orders'
 */
getOrders.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrders.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:32
 * @route '/api/v1/rider/orders'
 */
    const getOrdersForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrders.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:32
 * @route '/api/v1/rider/orders'
 */
        getOrdersForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:32
 * @route '/api/v1/rider/orders'
 */
        getOrdersForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrders.form = getOrdersForm
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:58
 * @route '/api/v1/rider/my-orders'
 */
export const getMyOrders = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders.url(options),
    method: 'get',
})

getMyOrders.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/my-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:58
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders.url = (options?: RouteQueryOptions) => {
    return getMyOrders.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:58
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:58
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:58
 * @route '/api/v1/rider/my-orders'
 */
    const getMyOrdersForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:58
 * @route '/api/v1/rider/my-orders'
 */
        getMyOrdersForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:58
 * @route '/api/v1/rider/my-orders'
 */
        getMyOrdersForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders.form = getMyOrdersForm
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:84
 * @route '/api/v1/rider/completed-orders'
 */
export const getCompletedOrders = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders.url(options),
    method: 'get',
})

getCompletedOrders.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/completed-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:84
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrders.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:84
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrders.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:84
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrders.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:84
 * @route '/api/v1/rider/completed-orders'
 */
    const getCompletedOrdersForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:84
 * @route '/api/v1/rider/completed-orders'
 */
        getCompletedOrdersForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:84
 * @route '/api/v1/rider/completed-orders'
 */
        getCompletedOrdersForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrders.form = getCompletedOrdersForm
/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:127
 * @route '/api/v1/rider/orders/{id}/accept'
 */
export const acceptOrder = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder.url(args, options),
    method: 'post',
})

acceptOrder.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/accept',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:127
 * @route '/api/v1/rider/orders/{id}/accept'
 */
acceptOrder.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return acceptOrder.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:127
 * @route '/api/v1/rider/orders/{id}/accept'
 */
acceptOrder.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:127
 * @route '/api/v1/rider/orders/{id}/accept'
 */
    const acceptOrderForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: acceptOrder.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:127
 * @route '/api/v1/rider/orders/{id}/accept'
 */
        acceptOrderForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: acceptOrder.url(args, options),
            method: 'post',
        })
    
    acceptOrder.form = acceptOrderForm
/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:179
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
export const pickupOrder = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder.url(args, options),
    method: 'post',
})

pickupOrder.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/pickup',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:179
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
pickupOrder.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pickupOrder.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:179
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
pickupOrder.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:179
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
    const pickupOrderForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrder.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:179
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
        pickupOrderForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrder.url(args, options),
            method: 'post',
        })
    
    pickupOrder.form = pickupOrderForm
/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:217
 * @route '/api/v1/rider/orders/{id}/transit'
 */
export const startTransit = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit.url(args, options),
    method: 'post',
})

startTransit.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/transit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:217
 * @route '/api/v1/rider/orders/{id}/transit'
 */
startTransit.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:217
 * @route '/api/v1/rider/orders/{id}/transit'
 */
startTransit.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:217
 * @route '/api/v1/rider/orders/{id}/transit'
 */
    const startTransitForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:217
 * @route '/api/v1/rider/orders/{id}/transit'
 */
        startTransitForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit.url(args, options),
            method: 'post',
        })
    
    startTransit.form = startTransitForm
/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:255
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
export const deliverOrder = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder.url(args, options),
    method: 'post',
})

deliverOrder.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/deliver',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:255
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
deliverOrder.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrder.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:255
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
deliverOrder.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:255
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
    const deliverOrderForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrder.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:255
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
        deliverOrderForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrder.url(args, options),
            method: 'post',
        })
    
    deliverOrder.form = deliverOrderForm
/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:316
 * @route '/api/v1/rider/orders/{id}/reject'
 */
export const rejectOrder = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrder.url(args, options),
    method: 'post',
})

rejectOrder.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:316
 * @route '/api/v1/rider/orders/{id}/reject'
 */
rejectOrder.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return rejectOrder.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:316
 * @route '/api/v1/rider/orders/{id}/reject'
 */
rejectOrder.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrder.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:316
 * @route '/api/v1/rider/orders/{id}/reject'
 */
    const rejectOrderForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectOrder.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:316
 * @route '/api/v1/rider/orders/{id}/reject'
 */
        rejectOrderForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectOrder.url(args, options),
            method: 'post',
        })
    
    rejectOrder.form = rejectOrderForm
const RiderController = { updateStatus, ping, getStats, updateLocation, getOrders, getMyOrders, getCompletedOrders, acceptOrder, pickupOrder, startTransit, deliverOrder, rejectOrder }

export default RiderController