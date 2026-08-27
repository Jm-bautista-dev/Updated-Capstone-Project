import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::index
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:18
 * @route '/super-admin/errors'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/super-admin/errors',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::index
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:18
 * @route '/super-admin/errors'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::index
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:18
 * @route '/super-admin/errors'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::index
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:18
 * @route '/super-admin/errors'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::index
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:18
 * @route '/super-admin/errors'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::index
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:18
 * @route '/super-admin/errors'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::index
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:18
 * @route '/super-admin/errors'
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
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::resolve
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:73
 * @route '/super-admin/errors/{id}/resolve'
 */
export const resolve = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resolve.url(args, options),
    method: 'post',
})

resolve.definition = {
    methods: ["post"],
    url: '/super-admin/errors/{id}/resolve',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::resolve
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:73
 * @route '/super-admin/errors/{id}/resolve'
 */
resolve.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return resolve.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::resolve
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:73
 * @route '/super-admin/errors/{id}/resolve'
 */
resolve.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resolve.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::resolve
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:73
 * @route '/super-admin/errors/{id}/resolve'
 */
    const resolveForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: resolve.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::resolve
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:73
 * @route '/super-admin/errors/{id}/resolve'
 */
        resolveForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: resolve.url(args, options),
            method: 'post',
        })
    
    resolve.form = resolveForm
/**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::clearResolved
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:100
 * @route '/super-admin/errors/clear-resolved'
 */
export const clearResolved = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: clearResolved.url(options),
    method: 'post',
})

clearResolved.definition = {
    methods: ["post"],
    url: '/super-admin/errors/clear-resolved',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::clearResolved
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:100
 * @route '/super-admin/errors/clear-resolved'
 */
clearResolved.url = (options?: RouteQueryOptions) => {
    return clearResolved.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::clearResolved
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:100
 * @route '/super-admin/errors/clear-resolved'
 */
clearResolved.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: clearResolved.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::clearResolved
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:100
 * @route '/super-admin/errors/clear-resolved'
 */
    const clearResolvedForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: clearResolved.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\ErrorLogController::clearResolved
 * @see app/Http/Controllers/SuperAdmin/ErrorLogController.php:100
 * @route '/super-admin/errors/clear-resolved'
 */
        clearResolvedForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: clearResolved.url(options),
            method: 'post',
        })
    
    clearResolved.form = clearResolvedForm
const errors = {
    index: Object.assign(index, index),
resolve: Object.assign(resolve, resolve),
clearResolved: Object.assign(clearResolved, clearResolved),
}

export default errors