import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\FeatureFlagController::index
 * @see app/Http/Controllers/SuperAdmin/FeatureFlagController.php:18
 * @route '/super-admin/features'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/super-admin/features',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\FeatureFlagController::index
 * @see app/Http/Controllers/SuperAdmin/FeatureFlagController.php:18
 * @route '/super-admin/features'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\FeatureFlagController::index
 * @see app/Http/Controllers/SuperAdmin/FeatureFlagController.php:18
 * @route '/super-admin/features'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\FeatureFlagController::index
 * @see app/Http/Controllers/SuperAdmin/FeatureFlagController.php:18
 * @route '/super-admin/features'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\FeatureFlagController::index
 * @see app/Http/Controllers/SuperAdmin/FeatureFlagController.php:18
 * @route '/super-admin/features'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\FeatureFlagController::index
 * @see app/Http/Controllers/SuperAdmin/FeatureFlagController.php:18
 * @route '/super-admin/features'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\FeatureFlagController::index
 * @see app/Http/Controllers/SuperAdmin/FeatureFlagController.php:18
 * @route '/super-admin/features'
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
* @see \App\Http\Controllers\SuperAdmin\FeatureFlagController::toggle
 * @see app/Http/Controllers/SuperAdmin/FeatureFlagController.php:32
 * @route '/super-admin/features/{id}/toggle'
 */
export const toggle = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggle.url(args, options),
    method: 'post',
})

toggle.definition = {
    methods: ["post"],
    url: '/super-admin/features/{id}/toggle',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\FeatureFlagController::toggle
 * @see app/Http/Controllers/SuperAdmin/FeatureFlagController.php:32
 * @route '/super-admin/features/{id}/toggle'
 */
toggle.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return toggle.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\FeatureFlagController::toggle
 * @see app/Http/Controllers/SuperAdmin/FeatureFlagController.php:32
 * @route '/super-admin/features/{id}/toggle'
 */
toggle.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggle.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\FeatureFlagController::toggle
 * @see app/Http/Controllers/SuperAdmin/FeatureFlagController.php:32
 * @route '/super-admin/features/{id}/toggle'
 */
    const toggleForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggle.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\FeatureFlagController::toggle
 * @see app/Http/Controllers/SuperAdmin/FeatureFlagController.php:32
 * @route '/super-admin/features/{id}/toggle'
 */
        toggleForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: toggle.url(args, options),
            method: 'post',
        })
    
    toggle.form = toggleForm
const features = {
    index: Object.assign(index, index),
toggle: Object.assign(toggle, toggle),
}

export default features