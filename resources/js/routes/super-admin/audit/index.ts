import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\AuditLogController::index
 * @see app/Http/Controllers/SuperAdmin/AuditLogController.php:16
 * @route '/super-admin/audit-logs'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/super-admin/audit-logs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\AuditLogController::index
 * @see app/Http/Controllers/SuperAdmin/AuditLogController.php:16
 * @route '/super-admin/audit-logs'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\AuditLogController::index
 * @see app/Http/Controllers/SuperAdmin/AuditLogController.php:16
 * @route '/super-admin/audit-logs'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\AuditLogController::index
 * @see app/Http/Controllers/SuperAdmin/AuditLogController.php:16
 * @route '/super-admin/audit-logs'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\AuditLogController::index
 * @see app/Http/Controllers/SuperAdmin/AuditLogController.php:16
 * @route '/super-admin/audit-logs'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\AuditLogController::index
 * @see app/Http/Controllers/SuperAdmin/AuditLogController.php:16
 * @route '/super-admin/audit-logs'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\AuditLogController::index
 * @see app/Http/Controllers/SuperAdmin/AuditLogController.php:16
 * @route '/super-admin/audit-logs'
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
const audit = {
    index: Object.assign(index, index),
}

export default audit