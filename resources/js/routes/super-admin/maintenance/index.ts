import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\MaintenanceController::index
 * @see app/Http/Controllers/SuperAdmin/MaintenanceController.php:18
 * @route '/super-admin/maintenance'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/super-admin/maintenance',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\MaintenanceController::index
 * @see app/Http/Controllers/SuperAdmin/MaintenanceController.php:18
 * @route '/super-admin/maintenance'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\MaintenanceController::index
 * @see app/Http/Controllers/SuperAdmin/MaintenanceController.php:18
 * @route '/super-admin/maintenance'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\MaintenanceController::index
 * @see app/Http/Controllers/SuperAdmin/MaintenanceController.php:18
 * @route '/super-admin/maintenance'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\MaintenanceController::index
 * @see app/Http/Controllers/SuperAdmin/MaintenanceController.php:18
 * @route '/super-admin/maintenance'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\MaintenanceController::index
 * @see app/Http/Controllers/SuperAdmin/MaintenanceController.php:18
 * @route '/super-admin/maintenance'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\MaintenanceController::index
 * @see app/Http/Controllers/SuperAdmin/MaintenanceController.php:18
 * @route '/super-admin/maintenance'
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
* @see \App\Http\Controllers\SuperAdmin\MaintenanceController::toggle
 * @see app/Http/Controllers/SuperAdmin/MaintenanceController.php:34
 * @route '/super-admin/maintenance/toggle'
 */
export const toggle = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggle.url(options),
    method: 'post',
})

toggle.definition = {
    methods: ["post"],
    url: '/super-admin/maintenance/toggle',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\MaintenanceController::toggle
 * @see app/Http/Controllers/SuperAdmin/MaintenanceController.php:34
 * @route '/super-admin/maintenance/toggle'
 */
toggle.url = (options?: RouteQueryOptions) => {
    return toggle.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\MaintenanceController::toggle
 * @see app/Http/Controllers/SuperAdmin/MaintenanceController.php:34
 * @route '/super-admin/maintenance/toggle'
 */
toggle.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggle.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\MaintenanceController::toggle
 * @see app/Http/Controllers/SuperAdmin/MaintenanceController.php:34
 * @route '/super-admin/maintenance/toggle'
 */
    const toggleForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggle.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\MaintenanceController::toggle
 * @see app/Http/Controllers/SuperAdmin/MaintenanceController.php:34
 * @route '/super-admin/maintenance/toggle'
 */
        toggleForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: toggle.url(options),
            method: 'post',
        })
    
    toggle.form = toggleForm
const maintenance = {
    index: Object.assign(index, index),
toggle: Object.assign(toggle, toggle),
}

export default maintenance