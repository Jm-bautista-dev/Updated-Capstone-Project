import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\SystemHealthController::index
 * @see app/Http/Controllers/SuperAdmin/SystemHealthController.php:20
 * @route '/super-admin/system-health'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/super-admin/system-health',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SystemHealthController::index
 * @see app/Http/Controllers/SuperAdmin/SystemHealthController.php:20
 * @route '/super-admin/system-health'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SystemHealthController::index
 * @see app/Http/Controllers/SuperAdmin/SystemHealthController.php:20
 * @route '/super-admin/system-health'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\SystemHealthController::index
 * @see app/Http/Controllers/SuperAdmin/SystemHealthController.php:20
 * @route '/super-admin/system-health'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SystemHealthController::index
 * @see app/Http/Controllers/SuperAdmin/SystemHealthController.php:20
 * @route '/super-admin/system-health'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SystemHealthController::index
 * @see app/Http/Controllers/SuperAdmin/SystemHealthController.php:20
 * @route '/super-admin/system-health'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\SystemHealthController::index
 * @see app/Http/Controllers/SuperAdmin/SystemHealthController.php:20
 * @route '/super-admin/system-health'
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
* @see \App\Http\Controllers\SuperAdmin\SystemHealthController::check
 * @see app/Http/Controllers/SuperAdmin/SystemHealthController.php:30
 * @route '/super-admin/system-health/check'
 */
export const check = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: check.url(options),
    method: 'get',
})

check.definition = {
    methods: ["get","head"],
    url: '/super-admin/system-health/check',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SystemHealthController::check
 * @see app/Http/Controllers/SuperAdmin/SystemHealthController.php:30
 * @route '/super-admin/system-health/check'
 */
check.url = (options?: RouteQueryOptions) => {
    return check.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SystemHealthController::check
 * @see app/Http/Controllers/SuperAdmin/SystemHealthController.php:30
 * @route '/super-admin/system-health/check'
 */
check.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: check.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\SystemHealthController::check
 * @see app/Http/Controllers/SuperAdmin/SystemHealthController.php:30
 * @route '/super-admin/system-health/check'
 */
check.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: check.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SystemHealthController::check
 * @see app/Http/Controllers/SuperAdmin/SystemHealthController.php:30
 * @route '/super-admin/system-health/check'
 */
    const checkForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: check.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SystemHealthController::check
 * @see app/Http/Controllers/SuperAdmin/SystemHealthController.php:30
 * @route '/super-admin/system-health/check'
 */
        checkForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: check.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\SystemHealthController::check
 * @see app/Http/Controllers/SuperAdmin/SystemHealthController.php:30
 * @route '/super-admin/system-health/check'
 */
        checkForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: check.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    check.form = checkForm
const SystemHealthController = { index, check }

export default SystemHealthController