import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::destroy
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:543
 * @route '/admin/sales-data/backup/{backup}'
 */
export const destroy = (args: { backup: string | number | { id: string | number } } | [backup: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/sales-data/backup/{backup}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::destroy
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:543
 * @route '/admin/sales-data/backup/{backup}'
 */
destroy.url = (args: { backup: string | number | { id: string | number } } | [backup: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { backup: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { backup: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    backup: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        backup: typeof args.backup === 'object'
                ? args.backup.id
                : args.backup,
                }

    return destroy.definition.url
            .replace('{backup}', parsedArgs.backup.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::destroy
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:543
 * @route '/admin/sales-data/backup/{backup}'
 */
destroy.delete = (args: { backup: string | number | { id: string | number } } | [backup: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::destroy
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:543
 * @route '/admin/sales-data/backup/{backup}'
 */
    const destroyForm = (args: { backup: string | number | { id: string | number } } | [backup: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::destroy
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:543
 * @route '/admin/sales-data/backup/{backup}'
 */
        destroyForm.delete = (args: { backup: string | number | { id: string | number } } | [backup: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const backup = {
    destroy: Object.assign(destroy, destroy),
}

export default backup