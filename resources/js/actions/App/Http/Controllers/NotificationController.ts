import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/notifications'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/notifications',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/notifications'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/notifications'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/notifications'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/notifications'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/notifications'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\NotificationController::index
 * @see app/Http/Controllers/NotificationController.php:18
 * @route '/api/notifications'
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
* @see \App\Http\Controllers\NotificationController::markAsRead
 * @see app/Http/Controllers/NotificationController.php:71
 * @route '/api/notifications/mark-as-read'
 */
export const markAsRead = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAsRead.url(options),
    method: 'post',
})

markAsRead.definition = {
    methods: ["post"],
    url: '/api/notifications/mark-as-read',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\NotificationController::markAsRead
 * @see app/Http/Controllers/NotificationController.php:71
 * @route '/api/notifications/mark-as-read'
 */
markAsRead.url = (options?: RouteQueryOptions) => {
    return markAsRead.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\NotificationController::markAsRead
 * @see app/Http/Controllers/NotificationController.php:71
 * @route '/api/notifications/mark-as-read'
 */
markAsRead.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAsRead.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\NotificationController::markAsRead
 * @see app/Http/Controllers/NotificationController.php:71
 * @route '/api/notifications/mark-as-read'
 */
    const markAsReadForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: markAsRead.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\NotificationController::markAsRead
 * @see app/Http/Controllers/NotificationController.php:71
 * @route '/api/notifications/mark-as-read'
 */
        markAsReadForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: markAsRead.url(options),
            method: 'post',
        })
    
    markAsRead.form = markAsReadForm
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