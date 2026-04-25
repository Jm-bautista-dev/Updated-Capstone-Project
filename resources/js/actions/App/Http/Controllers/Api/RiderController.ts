import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:404
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
 * @see app/Http/Controllers/Api/RiderController.php:404
 * @route '/api/v1/rider/status'
 */
updateStatus.url = (options?: RouteQueryOptions) => {
    return updateStatus.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:404
 * @route '/api/v1/rider/status'
 */
updateStatus.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatus.url(options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:404
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
 * @see app/Http/Controllers/Api/RiderController.php:404
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
 * @see app/Http/Controllers/Api/RiderController.php:470
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
 * @see app/Http/Controllers/Api/RiderController.php:470
 * @route '/api/v1/rider/ping'
 */
ping.url = (options?: RouteQueryOptions) => {
    return ping.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:470
 * @route '/api/v1/rider/ping'
 */
ping.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ping.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:470
 * @route '/api/v1/rider/ping'
 */
    const pingForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: ping.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:470
 * @route '/api/v1/rider/ping'
 */
        pingForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: ping.url(options),
            method: 'post',
        })
    
    ping.form = pingForm
/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:432
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
 * @see app/Http/Controllers/Api/RiderController.php:432
 * @route '/api/v1/rider/stats'
 */
getStats.url = (options?: RouteQueryOptions) => {
    return getStats.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:432
 * @route '/api/v1/rider/stats'
 */
getStats.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStats.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:432
 * @route '/api/v1/rider/stats'
 */
getStats.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStats.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:432
 * @route '/api/v1/rider/stats'
 */
    const getStatsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getStats.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:432
 * @route '/api/v1/rider/stats'
 */
        getStatsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStats.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:432
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
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:28
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
 * @see app/Http/Controllers/Api/RiderController.php:28
 * @route '/api/v1/rider/orders'
 */
getOrders.url = (options?: RouteQueryOptions) => {
    return getOrders.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:28
 * @route '/api/v1/rider/orders'
 */
getOrders.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:28
 * @route '/api/v1/rider/orders'
 */
getOrders.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrders.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:28
 * @route '/api/v1/rider/orders'
 */
    const getOrdersForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrders.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:28
 * @route '/api/v1/rider/orders'
 */
        getOrdersForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:28
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
 * @see app/Http/Controllers/Api/RiderController.php:54
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
 * @see app/Http/Controllers/Api/RiderController.php:54
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders.url = (options?: RouteQueryOptions) => {
    return getMyOrders.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:54
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:54
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:54
 * @route '/api/v1/rider/my-orders'
 */
    const getMyOrdersForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:54
 * @route '/api/v1/rider/my-orders'
 */
        getMyOrdersForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:54
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
 * @see app/Http/Controllers/Api/RiderController.php:80
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
 * @see app/Http/Controllers/Api/RiderController.php:80
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrders.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:80
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrders.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:80
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrders.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:80
 * @route '/api/v1/rider/completed-orders'
 */
    const getCompletedOrdersForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:80
 * @route '/api/v1/rider/completed-orders'
 */
        getCompletedOrdersForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:80
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
 * @see app/Http/Controllers/Api/RiderController.php:123
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
 * @see app/Http/Controllers/Api/RiderController.php:123
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
 * @see app/Http/Controllers/Api/RiderController.php:123
 * @route '/api/v1/rider/orders/{id}/accept'
 */
acceptOrder.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:123
 * @route '/api/v1/rider/orders/{id}/accept'
 */
    const acceptOrderForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: acceptOrder.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:123
 * @route '/api/v1/rider/orders/{id}/accept'
 */
        acceptOrderForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: acceptOrder.url(args, options),
            method: 'post',
        })
    
    acceptOrder.form = acceptOrderForm
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:0
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
export const updateOrderStatus = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus.url(args, options),
    method: 'post',
})

updateOrderStatus.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/update-status',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:0
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
updateOrderStatus.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatus.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:0
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
updateOrderStatus.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:0
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
    const updateOrderStatusForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatus.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:0
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
        updateOrderStatusForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus.url(args, options),
            method: 'post',
        })
    
    updateOrderStatus.form = updateOrderStatusForm
/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:303
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
 * @see app/Http/Controllers/Api/RiderController.php:303
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
 * @see app/Http/Controllers/Api/RiderController.php:303
 * @route '/api/v1/rider/orders/{id}/reject'
 */
rejectOrder.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrder.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:303
 * @route '/api/v1/rider/orders/{id}/reject'
 */
    const rejectOrderForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectOrder.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:303
 * @route '/api/v1/rider/orders/{id}/reject'
 */
        rejectOrderForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectOrder.url(args, options),
            method: 'post',
        })
    
    rejectOrder.form = rejectOrderForm
const RiderController = { updateStatus, ping, getStats, getOrders, getMyOrders, getCompletedOrders, acceptOrder, updateOrderStatus, rejectOrder }

export default RiderController