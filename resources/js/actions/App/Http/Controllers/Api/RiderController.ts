import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:42
 * @route '/api/v1/rider/change-password'
 */
export const changePassword = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: changePassword.url(options),
    method: 'post',
})

changePassword.definition = {
    methods: ["post"],
    url: '/api/v1/rider/change-password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:42
 * @route '/api/v1/rider/change-password'
 */
changePassword.url = (options?: RouteQueryOptions) => {
    return changePassword.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:42
 * @route '/api/v1/rider/change-password'
 */
changePassword.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: changePassword.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:42
 * @route '/api/v1/rider/change-password'
 */
    const changePasswordForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: changePassword.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:42
 * @route '/api/v1/rider/change-password'
 */
        changePasswordForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: changePassword.url(options),
            method: 'post',
        })
    
    changePassword.form = changePasswordForm
/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:662
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
 * @see app/Http/Controllers/Api/RiderController.php:662
 * @route '/api/v1/rider/status'
 */
updateStatus.url = (options?: RouteQueryOptions) => {
    return updateStatus.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:662
 * @route '/api/v1/rider/status'
 */
updateStatus.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatus.url(options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:662
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
 * @see app/Http/Controllers/Api/RiderController.php:662
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
 * @see app/Http/Controllers/Api/RiderController.php:728
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
 * @see app/Http/Controllers/Api/RiderController.php:728
 * @route '/api/v1/rider/ping'
 */
ping.url = (options?: RouteQueryOptions) => {
    return ping.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:728
 * @route '/api/v1/rider/ping'
 */
ping.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ping.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:728
 * @route '/api/v1/rider/ping'
 */
    const pingForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: ping.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:728
 * @route '/api/v1/rider/ping'
 */
        pingForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: ping.url(options),
            method: 'post',
        })
    
    ping.form = pingForm
/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:690
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
 * @see app/Http/Controllers/Api/RiderController.php:690
 * @route '/api/v1/rider/stats'
 */
getStats.url = (options?: RouteQueryOptions) => {
    return getStats.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:690
 * @route '/api/v1/rider/stats'
 */
getStats.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStats.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:690
 * @route '/api/v1/rider/stats'
 */
getStats.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStats.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:690
 * @route '/api/v1/rider/stats'
 */
    const getStatsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getStats.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:690
 * @route '/api/v1/rider/stats'
 */
        getStatsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStats.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:690
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
 * @see app/Http/Controllers/Api/RiderController.php:581
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
 * @see app/Http/Controllers/Api/RiderController.php:581
 * @route '/api/v1/rider/location'
 */
updateLocation.url = (options?: RouteQueryOptions) => {
    return updateLocation.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:581
 * @route '/api/v1/rider/location'
 */
updateLocation.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateLocation.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:581
 * @route '/api/v1/rider/location'
 */
    const updateLocationForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateLocation.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:581
 * @route '/api/v1/rider/location'
 */
        updateLocationForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateLocation.url(options),
            method: 'post',
        })
    
    updateLocation.form = updateLocationForm
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/v1/rider/orders'
 */
const getOrders63efdf27fdafc269d7b74547117cc692 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders63efdf27fdafc269d7b74547117cc692.url(options),
    method: 'get',
})

getOrders63efdf27fdafc269d7b74547117cc692.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/v1/rider/orders'
 */
getOrders63efdf27fdafc269d7b74547117cc692.url = (options?: RouteQueryOptions) => {
    return getOrders63efdf27fdafc269d7b74547117cc692.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/v1/rider/orders'
 */
getOrders63efdf27fdafc269d7b74547117cc692.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders63efdf27fdafc269d7b74547117cc692.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/v1/rider/orders'
 */
getOrders63efdf27fdafc269d7b74547117cc692.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrders63efdf27fdafc269d7b74547117cc692.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/v1/rider/orders'
 */
    const getOrders63efdf27fdafc269d7b74547117cc692Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrders63efdf27fdafc269d7b74547117cc692.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/v1/rider/orders'
 */
        getOrders63efdf27fdafc269d7b74547117cc692Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders63efdf27fdafc269d7b74547117cc692.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/v1/rider/orders'
 */
        getOrders63efdf27fdafc269d7b74547117cc692Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders63efdf27fdafc269d7b74547117cc692.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrders63efdf27fdafc269d7b74547117cc692.form = getOrders63efdf27fdafc269d7b74547117cc692Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/rider/orders'
 */
const getOrdersdc8b9ffdca731c7c1f660bed57e883fe = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url(options),
    method: 'get',
})

getOrdersdc8b9ffdca731c7c1f660bed57e883fe.definition = {
    methods: ["get","head"],
    url: '/api/rider/orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/rider/orders'
 */
getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url = (options?: RouteQueryOptions) => {
    return getOrdersdc8b9ffdca731c7c1f660bed57e883fe.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/rider/orders'
 */
getOrdersdc8b9ffdca731c7c1f660bed57e883fe.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/rider/orders'
 */
getOrdersdc8b9ffdca731c7c1f660bed57e883fe.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/rider/orders'
 */
    const getOrdersdc8b9ffdca731c7c1f660bed57e883feForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/rider/orders'
 */
        getOrdersdc8b9ffdca731c7c1f660bed57e883feForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/rider/orders'
 */
        getOrdersdc8b9ffdca731c7c1f660bed57e883feForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrdersdc8b9ffdca731c7c1f660bed57e883fe.form = getOrdersdc8b9ffdca731c7c1f660bed57e883feForm

export const getOrders = {
    '/api/v1/rider/orders': getOrders63efdf27fdafc269d7b74547117cc692,
    '/api/rider/orders': getOrdersdc8b9ffdca731c7c1f660bed57e883fe,
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/v1/rider/my-orders'
 */
const getMyOrders91629b3f6dd1d6ca0b5603eec2097950 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
    method: 'get',
})

getMyOrders91629b3f6dd1d6ca0b5603eec2097950.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/my-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url = (options?: RouteQueryOptions) => {
    return getMyOrders91629b3f6dd1d6ca0b5603eec2097950.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders91629b3f6dd1d6ca0b5603eec2097950.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders91629b3f6dd1d6ca0b5603eec2097950.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/v1/rider/my-orders'
 */
    const getMyOrders91629b3f6dd1d6ca0b5603eec2097950Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/v1/rider/my-orders'
 */
        getMyOrders91629b3f6dd1d6ca0b5603eec2097950Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/v1/rider/my-orders'
 */
        getMyOrders91629b3f6dd1d6ca0b5603eec2097950Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders91629b3f6dd1d6ca0b5603eec2097950.form = getMyOrders91629b3f6dd1d6ca0b5603eec2097950Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/rider/my-orders'
 */
const getMyOrders055417c79b8f926941253898844fa820 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders055417c79b8f926941253898844fa820.url(options),
    method: 'get',
})

getMyOrders055417c79b8f926941253898844fa820.definition = {
    methods: ["get","head"],
    url: '/api/rider/my-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/rider/my-orders'
 */
getMyOrders055417c79b8f926941253898844fa820.url = (options?: RouteQueryOptions) => {
    return getMyOrders055417c79b8f926941253898844fa820.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/rider/my-orders'
 */
getMyOrders055417c79b8f926941253898844fa820.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders055417c79b8f926941253898844fa820.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/rider/my-orders'
 */
getMyOrders055417c79b8f926941253898844fa820.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders055417c79b8f926941253898844fa820.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/rider/my-orders'
 */
    const getMyOrders055417c79b8f926941253898844fa820Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders055417c79b8f926941253898844fa820.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/rider/my-orders'
 */
        getMyOrders055417c79b8f926941253898844fa820Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders055417c79b8f926941253898844fa820.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/rider/my-orders'
 */
        getMyOrders055417c79b8f926941253898844fa820Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders055417c79b8f926941253898844fa820.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders055417c79b8f926941253898844fa820.form = getMyOrders055417c79b8f926941253898844fa820Form

export const getMyOrders = {
    '/api/v1/rider/my-orders': getMyOrders91629b3f6dd1d6ca0b5603eec2097950,
    '/api/rider/my-orders': getMyOrders055417c79b8f926941253898844fa820,
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:136
 * @route '/api/v1/rider/completed-orders'
 */
const getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
    method: 'get',
})

getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/completed-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:136
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url = (options?: RouteQueryOptions) => {
    return getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:136
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:136
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:136
 * @route '/api/v1/rider/completed-orders'
 */
    const getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603fForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:136
 * @route '/api/v1/rider/completed-orders'
 */
        getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603fForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:136
 * @route '/api/v1/rider/completed-orders'
 */
        getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603fForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.form = getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603fForm
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:136
 * @route '/api/rider/completed-orders'
 */
const getCompletedOrders805dad15d371e329367cc660ba824f6b = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
    method: 'get',
})

getCompletedOrders805dad15d371e329367cc660ba824f6b.definition = {
    methods: ["get","head"],
    url: '/api/rider/completed-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:136
 * @route '/api/rider/completed-orders'
 */
getCompletedOrders805dad15d371e329367cc660ba824f6b.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders805dad15d371e329367cc660ba824f6b.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:136
 * @route '/api/rider/completed-orders'
 */
getCompletedOrders805dad15d371e329367cc660ba824f6b.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:136
 * @route '/api/rider/completed-orders'
 */
getCompletedOrders805dad15d371e329367cc660ba824f6b.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:136
 * @route '/api/rider/completed-orders'
 */
    const getCompletedOrders805dad15d371e329367cc660ba824f6bForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:136
 * @route '/api/rider/completed-orders'
 */
        getCompletedOrders805dad15d371e329367cc660ba824f6bForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:136
 * @route '/api/rider/completed-orders'
 */
        getCompletedOrders805dad15d371e329367cc660ba824f6bForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders805dad15d371e329367cc660ba824f6b.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrders805dad15d371e329367cc660ba824f6b.form = getCompletedOrders805dad15d371e329367cc660ba824f6bForm

export const getCompletedOrders = {
    '/api/v1/rider/completed-orders': getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f,
    '/api/rider/completed-orders': getCompletedOrders805dad15d371e329367cc660ba824f6b,
}

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:183
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
 * @see app/Http/Controllers/Api/RiderController.php:183
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
 * @see app/Http/Controllers/Api/RiderController.php:183
 * @route '/api/v1/rider/orders/{id}/accept'
 */
acceptOrder.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:183
 * @route '/api/v1/rider/orders/{id}/accept'
 */
    const acceptOrderForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: acceptOrder.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:183
 * @route '/api/v1/rider/orders/{id}/accept'
 */
        acceptOrderForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: acceptOrder.url(args, options),
            method: 'post',
        })
    
    acceptOrder.form = acceptOrderForm
/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:245
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
 * @see app/Http/Controllers/Api/RiderController.php:245
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
 * @see app/Http/Controllers/Api/RiderController.php:245
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
pickupOrder.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:245
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
    const pickupOrderForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrder.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:245
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
        pickupOrderForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrder.url(args, options),
            method: 'post',
        })
    
    pickupOrder.form = pickupOrderForm
/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:293
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
 * @see app/Http/Controllers/Api/RiderController.php:293
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
 * @see app/Http/Controllers/Api/RiderController.php:293
 * @route '/api/v1/rider/orders/{id}/transit'
 */
startTransit.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:293
 * @route '/api/v1/rider/orders/{id}/transit'
 */
    const startTransitForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:293
 * @route '/api/v1/rider/orders/{id}/transit'
 */
        startTransitForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit.url(args, options),
            method: 'post',
        })
    
    startTransit.form = startTransitForm
/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:333
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
 * @see app/Http/Controllers/Api/RiderController.php:333
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
 * @see app/Http/Controllers/Api/RiderController.php:333
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
deliverOrder.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:333
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
    const deliverOrderForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrder.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:333
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
        deliverOrderForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrder.url(args, options),
            method: 'post',
        })
    
    deliverOrder.form = deliverOrderForm
/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:535
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
 * @see app/Http/Controllers/Api/RiderController.php:535
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
 * @see app/Http/Controllers/Api/RiderController.php:535
 * @route '/api/v1/rider/orders/{id}/reject'
 */
rejectOrder.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrder.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:535
 * @route '/api/v1/rider/orders/{id}/reject'
 */
    const rejectOrderForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectOrder.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:535
 * @route '/api/v1/rider/orders/{id}/reject'
 */
        rejectOrderForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectOrder.url(args, options),
            method: 'post',
        })
    
    rejectOrder.form = rejectOrderForm
/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:401
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
const cancelOrderc6e91f42a6a96f0dc48849a40d8ac513 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url(args, options),
    method: 'post',
})

cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:401
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:401
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:401
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
    const cancelOrderc6e91f42a6a96f0dc48849a40d8ac513Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:401
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
        cancelOrderc6e91f42a6a96f0dc48849a40d8ac513Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url(args, options),
            method: 'post',
        })
    
    cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.form = cancelOrderc6e91f42a6a96f0dc48849a40d8ac513Form
    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:401
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
const cancelOrder676ea8b862358a07db7266022896cc59 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder676ea8b862358a07db7266022896cc59.url(args, options),
    method: 'post',
})

cancelOrder676ea8b862358a07db7266022896cc59.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/cancel-request',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:401
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
cancelOrder676ea8b862358a07db7266022896cc59.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return cancelOrder676ea8b862358a07db7266022896cc59.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:401
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
cancelOrder676ea8b862358a07db7266022896cc59.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder676ea8b862358a07db7266022896cc59.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:401
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
    const cancelOrder676ea8b862358a07db7266022896cc59Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelOrder676ea8b862358a07db7266022896cc59.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:401
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
        cancelOrder676ea8b862358a07db7266022896cc59Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelOrder676ea8b862358a07db7266022896cc59.url(args, options),
            method: 'post',
        })
    
    cancelOrder676ea8b862358a07db7266022896cc59.form = cancelOrder676ea8b862358a07db7266022896cc59Form

export const cancelOrder = {
    '/api/v1/rider/orders/{id}/cancel': cancelOrderc6e91f42a6a96f0dc48849a40d8ac513,
    '/api/v1/rider/orders/{id}/cancel-request': cancelOrder676ea8b862358a07db7266022896cc59,
}

const RiderController = { changePassword, updateStatus, ping, getStats, updateLocation, getOrders, getMyOrders, getCompletedOrders, acceptOrder, pickupOrder, startTransit, deliverOrder, rejectOrder, cancelOrder }

export default RiderController