import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/v1/notifications'
 */
const index61390cf35a89fe10cc418b5300acba9f = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index61390cf35a89fe10cc418b5300acba9f.url(options),
    method: 'get',
})

index61390cf35a89fe10cc418b5300acba9f.definition = {
    methods: ["get","head"],
    url: '/api/v1/notifications',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/v1/notifications'
 */
index61390cf35a89fe10cc418b5300acba9f.url = (options?: RouteQueryOptions) => {
    return index61390cf35a89fe10cc418b5300acba9f.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/v1/notifications'
 */
index61390cf35a89fe10cc418b5300acba9f.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index61390cf35a89fe10cc418b5300acba9f.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/v1/notifications'
 */
index61390cf35a89fe10cc418b5300acba9f.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index61390cf35a89fe10cc418b5300acba9f.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/v1/notifications'
 */
    const index61390cf35a89fe10cc418b5300acba9fForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index61390cf35a89fe10cc418b5300acba9f.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/v1/notifications'
 */
        index61390cf35a89fe10cc418b5300acba9fForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index61390cf35a89fe10cc418b5300acba9f.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/v1/notifications'
 */
        index61390cf35a89fe10cc418b5300acba9fForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index61390cf35a89fe10cc418b5300acba9f.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index61390cf35a89fe10cc418b5300acba9f.form = index61390cf35a89fe10cc418b5300acba9fForm
    /**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/notifications'
 */
const index63ca617bad575304d9a46c7bd2661780 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index63ca617bad575304d9a46c7bd2661780.url(options),
    method: 'get',
})

index63ca617bad575304d9a46c7bd2661780.definition = {
    methods: ["get","head"],
    url: '/api/notifications',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/notifications'
 */
index63ca617bad575304d9a46c7bd2661780.url = (options?: RouteQueryOptions) => {
    return index63ca617bad575304d9a46c7bd2661780.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/notifications'
 */
index63ca617bad575304d9a46c7bd2661780.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index63ca617bad575304d9a46c7bd2661780.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/notifications'
 */
index63ca617bad575304d9a46c7bd2661780.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index63ca617bad575304d9a46c7bd2661780.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/notifications'
 */
    const index63ca617bad575304d9a46c7bd2661780Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index63ca617bad575304d9a46c7bd2661780.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/notifications'
 */
        index63ca617bad575304d9a46c7bd2661780Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index63ca617bad575304d9a46c7bd2661780.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/notifications'
 */
        index63ca617bad575304d9a46c7bd2661780Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index63ca617bad575304d9a46c7bd2661780.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index63ca617bad575304d9a46c7bd2661780.form = index63ca617bad575304d9a46c7bd2661780Form

export const index = {
    '/api/v1/notifications': index61390cf35a89fe10cc418b5300acba9f,
    '/api/notifications': index63ca617bad575304d9a46c7bd2661780,
}

/**
* @see \App\Http\Controllers\NotificationController::markAsRead
 * @see app/Http/Controllers/NotificationController.php:71
 * @route '/api/v1/notifications/mark-as-read'
 */
const markAsRead6039862eabf8fa1a6118428035edadf3 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAsRead6039862eabf8fa1a6118428035edadf3.url(options),
    method: 'post',
})

markAsRead6039862eabf8fa1a6118428035edadf3.definition = {
    methods: ["post"],
    url: '/api/v1/notifications/mark-as-read',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\NotificationController::markAsRead
 * @see app/Http/Controllers/NotificationController.php:71
 * @route '/api/v1/notifications/mark-as-read'
 */
markAsRead6039862eabf8fa1a6118428035edadf3.url = (options?: RouteQueryOptions) => {
    return markAsRead6039862eabf8fa1a6118428035edadf3.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\NotificationController::markAsRead
 * @see app/Http/Controllers/NotificationController.php:71
 * @route '/api/v1/notifications/mark-as-read'
 */
markAsRead6039862eabf8fa1a6118428035edadf3.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAsRead6039862eabf8fa1a6118428035edadf3.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\NotificationController::markAsRead
 * @see app/Http/Controllers/NotificationController.php:71
 * @route '/api/v1/notifications/mark-as-read'
 */
    const markAsRead6039862eabf8fa1a6118428035edadf3Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: markAsRead6039862eabf8fa1a6118428035edadf3.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\NotificationController::markAsRead
 * @see app/Http/Controllers/NotificationController.php:71
 * @route '/api/v1/notifications/mark-as-read'
 */
        markAsRead6039862eabf8fa1a6118428035edadf3Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: markAsRead6039862eabf8fa1a6118428035edadf3.url(options),
            method: 'post',
        })
    
    markAsRead6039862eabf8fa1a6118428035edadf3.form = markAsRead6039862eabf8fa1a6118428035edadf3Form
    /**
* @see \App\Http\Controllers\NotificationController::markAsRead
 * @see app/Http/Controllers/NotificationController.php:71
 * @route '/api/notifications/mark-as-read'
 */
const markAsRead3a84137137f8e9242c1b3b28bb5ab5f0 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAsRead3a84137137f8e9242c1b3b28bb5ab5f0.url(options),
    method: 'post',
})

markAsRead3a84137137f8e9242c1b3b28bb5ab5f0.definition = {
    methods: ["post"],
    url: '/api/notifications/mark-as-read',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\NotificationController::markAsRead
 * @see app/Http/Controllers/NotificationController.php:71
 * @route '/api/notifications/mark-as-read'
 */
markAsRead3a84137137f8e9242c1b3b28bb5ab5f0.url = (options?: RouteQueryOptions) => {
    return markAsRead3a84137137f8e9242c1b3b28bb5ab5f0.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\NotificationController::markAsRead
 * @see app/Http/Controllers/NotificationController.php:71
 * @route '/api/notifications/mark-as-read'
 */
markAsRead3a84137137f8e9242c1b3b28bb5ab5f0.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAsRead3a84137137f8e9242c1b3b28bb5ab5f0.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\NotificationController::markAsRead
 * @see app/Http/Controllers/NotificationController.php:71
 * @route '/api/notifications/mark-as-read'
 */
    const markAsRead3a84137137f8e9242c1b3b28bb5ab5f0Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: markAsRead3a84137137f8e9242c1b3b28bb5ab5f0.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\NotificationController::markAsRead
 * @see app/Http/Controllers/NotificationController.php:71
 * @route '/api/notifications/mark-as-read'
 */
        markAsRead3a84137137f8e9242c1b3b28bb5ab5f0Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: markAsRead3a84137137f8e9242c1b3b28bb5ab5f0.url(options),
            method: 'post',
        })
    
    markAsRead3a84137137f8e9242c1b3b28bb5ab5f0.form = markAsRead3a84137137f8e9242c1b3b28bb5ab5f0Form

export const markAsRead = {
    '/api/v1/notifications/mark-as-read': markAsRead6039862eabf8fa1a6118428035edadf3,
    '/api/notifications/mark-as-read': markAsRead3a84137137f8e9242c1b3b28bb5ab5f0,
}

/**
* @see \App\Http\Controllers\NotificationController::activity
 * @see app/Http/Controllers/NotificationController.php:84
 * @route '/inventory/activity'
 */
export const activity = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: activity.url(options),
    method: 'get',
})

activity.definition = {
    methods: ["get","head"],
    url: '/inventory/activity',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\NotificationController::activity
 * @see app/Http/Controllers/NotificationController.php:84
 * @route '/inventory/activity'
 */
activity.url = (options?: RouteQueryOptions) => {
    return activity.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\NotificationController::activity
 * @see app/Http/Controllers/NotificationController.php:84
 * @route '/inventory/activity'
 */
activity.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: activity.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\NotificationController::activity
 * @see app/Http/Controllers/NotificationController.php:84
 * @route '/inventory/activity'
 */
activity.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: activity.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\NotificationController::activity
 * @see app/Http/Controllers/NotificationController.php:84
 * @route '/inventory/activity'
 */
    const activityForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: activity.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\NotificationController::activity
 * @see app/Http/Controllers/NotificationController.php:84
 * @route '/inventory/activity'
 */
        activityForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: activity.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\NotificationController::activity
 * @see app/Http/Controllers/NotificationController.php:84
 * @route '/inventory/activity'
 */
        activityForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: activity.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    activity.form = activityForm
const NotificationController = { index, markAsRead, activity }

export default NotificationController