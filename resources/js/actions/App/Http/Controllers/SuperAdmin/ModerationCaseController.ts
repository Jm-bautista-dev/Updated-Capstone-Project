import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::index
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:24
 * @route '/super-admin/moderation-cases'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/super-admin/moderation-cases',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::index
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:24
 * @route '/super-admin/moderation-cases'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::index
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:24
 * @route '/super-admin/moderation-cases'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::index
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:24
 * @route '/super-admin/moderation-cases'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::index
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:24
 * @route '/super-admin/moderation-cases'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::index
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:24
 * @route '/super-admin/moderation-cases'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::index
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:24
 * @route '/super-admin/moderation-cases'
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
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::show
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:64
 * @route '/super-admin/moderation-cases/{id}'
 */
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/super-admin/moderation-cases/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::show
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:64
 * @route '/super-admin/moderation-cases/{id}'
 */
show.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::show
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:64
 * @route '/super-admin/moderation-cases/{id}'
 */
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::show
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:64
 * @route '/super-admin/moderation-cases/{id}'
 */
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::show
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:64
 * @route '/super-admin/moderation-cases/{id}'
 */
    const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::show
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:64
 * @route '/super-admin/moderation-cases/{id}'
 */
        showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::show
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:64
 * @route '/super-admin/moderation-cases/{id}'
 */
        showForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::resolve
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:82
 * @route '/super-admin/moderation-cases/{id}/resolve'
 */
export const resolve = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resolve.url(args, options),
    method: 'post',
})

resolve.definition = {
    methods: ["post"],
    url: '/super-admin/moderation-cases/{id}/resolve',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::resolve
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:82
 * @route '/super-admin/moderation-cases/{id}/resolve'
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
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::resolve
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:82
 * @route '/super-admin/moderation-cases/{id}/resolve'
 */
resolve.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resolve.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::resolve
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:82
 * @route '/super-admin/moderation-cases/{id}/resolve'
 */
    const resolveForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: resolve.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\ModerationCaseController::resolve
 * @see app/Http/Controllers/SuperAdmin/ModerationCaseController.php:82
 * @route '/super-admin/moderation-cases/{id}/resolve'
 */
        resolveForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: resolve.url(args, options),
            method: 'post',
        })
    
    resolve.form = resolveForm
const ModerationCaseController = { index, show, resolve }

export default ModerationCaseController