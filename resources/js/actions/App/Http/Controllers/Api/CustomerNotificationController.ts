import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::registerDeviceToken
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:18
 * @route '/api/v1/customer/device-token'
 */
const registerDeviceToken20c8be370d33ad7a763668dd8aa6d89c = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registerDeviceToken20c8be370d33ad7a763668dd8aa6d89c.url(options),
    method: 'post',
})

registerDeviceToken20c8be370d33ad7a763668dd8aa6d89c.definition = {
    methods: ["post"],
    url: '/api/v1/customer/device-token',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::registerDeviceToken
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:18
 * @route '/api/v1/customer/device-token'
 */
registerDeviceToken20c8be370d33ad7a763668dd8aa6d89c.url = (options?: RouteQueryOptions) => {
    return registerDeviceToken20c8be370d33ad7a763668dd8aa6d89c.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::registerDeviceToken
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:18
 * @route '/api/v1/customer/device-token'
 */
registerDeviceToken20c8be370d33ad7a763668dd8aa6d89c.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registerDeviceToken20c8be370d33ad7a763668dd8aa6d89c.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::registerDeviceToken
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:18
 * @route '/api/v1/customer/device-token'
 */
    const registerDeviceToken20c8be370d33ad7a763668dd8aa6d89cForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: registerDeviceToken20c8be370d33ad7a763668dd8aa6d89c.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::registerDeviceToken
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:18
 * @route '/api/v1/customer/device-token'
 */
        registerDeviceToken20c8be370d33ad7a763668dd8aa6d89cForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: registerDeviceToken20c8be370d33ad7a763668dd8aa6d89c.url(options),
            method: 'post',
        })
    
    registerDeviceToken20c8be370d33ad7a763668dd8aa6d89c.form = registerDeviceToken20c8be370d33ad7a763668dd8aa6d89cForm
    /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::registerDeviceToken
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:18
 * @route '/api/v1/notifications/push-token'
 */
const registerDeviceToken1e8bc69bd4e1aa41478c714299da68fa = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registerDeviceToken1e8bc69bd4e1aa41478c714299da68fa.url(options),
    method: 'post',
})

registerDeviceToken1e8bc69bd4e1aa41478c714299da68fa.definition = {
    methods: ["post"],
    url: '/api/v1/notifications/push-token',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::registerDeviceToken
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:18
 * @route '/api/v1/notifications/push-token'
 */
registerDeviceToken1e8bc69bd4e1aa41478c714299da68fa.url = (options?: RouteQueryOptions) => {
    return registerDeviceToken1e8bc69bd4e1aa41478c714299da68fa.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::registerDeviceToken
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:18
 * @route '/api/v1/notifications/push-token'
 */
registerDeviceToken1e8bc69bd4e1aa41478c714299da68fa.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registerDeviceToken1e8bc69bd4e1aa41478c714299da68fa.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::registerDeviceToken
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:18
 * @route '/api/v1/notifications/push-token'
 */
    const registerDeviceToken1e8bc69bd4e1aa41478c714299da68faForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: registerDeviceToken1e8bc69bd4e1aa41478c714299da68fa.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::registerDeviceToken
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:18
 * @route '/api/v1/notifications/push-token'
 */
        registerDeviceToken1e8bc69bd4e1aa41478c714299da68faForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: registerDeviceToken1e8bc69bd4e1aa41478c714299da68fa.url(options),
            method: 'post',
        })
    
    registerDeviceToken1e8bc69bd4e1aa41478c714299da68fa.form = registerDeviceToken1e8bc69bd4e1aa41478c714299da68faForm

export const registerDeviceToken = {
    '/api/v1/customer/device-token': registerDeviceToken20c8be370d33ad7a763668dd8aa6d89c,
    '/api/v1/notifications/push-token': registerDeviceToken1e8bc69bd4e1aa41478c714299da68fa,
}

/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::removeDeviceToken
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:49
 * @route '/api/v1/notifications/push-token/remove'
 */
export const removeDeviceToken = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: removeDeviceToken.url(options),
    method: 'post',
})

removeDeviceToken.definition = {
    methods: ["post"],
    url: '/api/v1/notifications/push-token/remove',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::removeDeviceToken
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:49
 * @route '/api/v1/notifications/push-token/remove'
 */
removeDeviceToken.url = (options?: RouteQueryOptions) => {
    return removeDeviceToken.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::removeDeviceToken
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:49
 * @route '/api/v1/notifications/push-token/remove'
 */
removeDeviceToken.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: removeDeviceToken.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::removeDeviceToken
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:49
 * @route '/api/v1/notifications/push-token/remove'
 */
    const removeDeviceTokenForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: removeDeviceToken.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::removeDeviceToken
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:49
 * @route '/api/v1/notifications/push-token/remove'
 */
        removeDeviceTokenForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: removeDeviceToken.url(options),
            method: 'post',
        })
    
    removeDeviceToken.form = removeDeviceTokenForm
/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::index
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:69
 * @route '/api/v1/customer/notifications'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/v1/customer/notifications',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::index
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:69
 * @route '/api/v1/customer/notifications'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::index
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:69
 * @route '/api/v1/customer/notifications'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::index
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:69
 * @route '/api/v1/customer/notifications'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::index
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:69
 * @route '/api/v1/customer/notifications'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::index
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:69
 * @route '/api/v1/customer/notifications'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::index
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:69
 * @route '/api/v1/customer/notifications'
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
* @see \App\Http\Controllers\Api\CustomerNotificationController::unreadCount
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:95
 * @route '/api/v1/customer/notifications/unread-count'
 */
export const unreadCount = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: unreadCount.url(options),
    method: 'get',
})

unreadCount.definition = {
    methods: ["get","head"],
    url: '/api/v1/customer/notifications/unread-count',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::unreadCount
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:95
 * @route '/api/v1/customer/notifications/unread-count'
 */
unreadCount.url = (options?: RouteQueryOptions) => {
    return unreadCount.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::unreadCount
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:95
 * @route '/api/v1/customer/notifications/unread-count'
 */
unreadCount.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: unreadCount.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::unreadCount
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:95
 * @route '/api/v1/customer/notifications/unread-count'
 */
unreadCount.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: unreadCount.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::unreadCount
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:95
 * @route '/api/v1/customer/notifications/unread-count'
 */
    const unreadCountForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: unreadCount.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::unreadCount
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:95
 * @route '/api/v1/customer/notifications/unread-count'
 */
        unreadCountForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: unreadCount.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::unreadCount
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:95
 * @route '/api/v1/customer/notifications/unread-count'
 */
        unreadCountForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: unreadCount.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    unreadCount.form = unreadCountForm
/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::markAllAsRead
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:131
 * @route '/api/v1/customer/notifications/read-all'
 */
export const markAllAsRead = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAllAsRead.url(options),
    method: 'post',
})

markAllAsRead.definition = {
    methods: ["post"],
    url: '/api/v1/customer/notifications/read-all',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::markAllAsRead
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:131
 * @route '/api/v1/customer/notifications/read-all'
 */
markAllAsRead.url = (options?: RouteQueryOptions) => {
    return markAllAsRead.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::markAllAsRead
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:131
 * @route '/api/v1/customer/notifications/read-all'
 */
markAllAsRead.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAllAsRead.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::markAllAsRead
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:131
 * @route '/api/v1/customer/notifications/read-all'
 */
    const markAllAsReadForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: markAllAsRead.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::markAllAsRead
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:131
 * @route '/api/v1/customer/notifications/read-all'
 */
        markAllAsReadForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: markAllAsRead.url(options),
            method: 'post',
        })
    
    markAllAsRead.form = markAllAsReadForm
/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::markAsRead
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:111
 * @route '/api/v1/customer/notifications/{id}/read'
 */
export const markAsRead = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAsRead.url(args, options),
    method: 'post',
})

markAsRead.definition = {
    methods: ["post"],
    url: '/api/v1/customer/notifications/{id}/read',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::markAsRead
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:111
 * @route '/api/v1/customer/notifications/{id}/read'
 */
markAsRead.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return markAsRead.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CustomerNotificationController::markAsRead
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:111
 * @route '/api/v1/customer/notifications/{id}/read'
 */
markAsRead.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAsRead.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::markAsRead
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:111
 * @route '/api/v1/customer/notifications/{id}/read'
 */
    const markAsReadForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: markAsRead.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CustomerNotificationController::markAsRead
 * @see app/Http/Controllers/Api/CustomerNotificationController.php:111
 * @route '/api/v1/customer/notifications/{id}/read'
 */
        markAsReadForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: markAsRead.url(args, options),
            method: 'post',
        })
    
    markAsRead.form = markAsReadForm
const CustomerNotificationController = { registerDeviceToken, removeDeviceToken, index, unreadCount, markAllAsRead, markAsRead }

export default CustomerNotificationController