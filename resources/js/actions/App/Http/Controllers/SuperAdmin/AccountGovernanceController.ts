import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::index
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:29
 * @route '/super-admin/accounts'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/super-admin/accounts',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::index
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:29
 * @route '/super-admin/accounts'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::index
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:29
 * @route '/super-admin/accounts'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::index
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:29
 * @route '/super-admin/accounts'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::index
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:29
 * @route '/super-admin/accounts'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::index
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:29
 * @route '/super-admin/accounts'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::index
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:29
 * @route '/super-admin/accounts'
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
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::show
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:165
 * @route '/super-admin/accounts/{type}/{id}'
 */
export const show = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/super-admin/accounts/{type}/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::show
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:165
 * @route '/super-admin/accounts/{type}/{id}'
 */
show.url = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    type: args[0],
                    id: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        type: args.type,
                                id: args.id,
                }

    return show.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::show
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:165
 * @route '/super-admin/accounts/{type}/{id}'
 */
show.get = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::show
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:165
 * @route '/super-admin/accounts/{type}/{id}'
 */
show.head = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::show
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:165
 * @route '/super-admin/accounts/{type}/{id}'
 */
    const showForm = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::show
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:165
 * @route '/super-admin/accounts/{type}/{id}'
 */
        showForm.get = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::show
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:165
 * @route '/super-admin/accounts/{type}/{id}'
 */
        showForm.head = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::updateStatus
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:225
 * @route '/super-admin/accounts/{type}/{id}/status'
 */
export const updateStatus = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateStatus.url(args, options),
    method: 'post',
})

updateStatus.definition = {
    methods: ["post"],
    url: '/super-admin/accounts/{type}/{id}/status',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::updateStatus
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:225
 * @route '/super-admin/accounts/{type}/{id}/status'
 */
updateStatus.url = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    type: args[0],
                    id: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        type: args.type,
                                id: args.id,
                }

    return updateStatus.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::updateStatus
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:225
 * @route '/super-admin/accounts/{type}/{id}/status'
 */
updateStatus.post = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateStatus.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::updateStatus
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:225
 * @route '/super-admin/accounts/{type}/{id}/status'
 */
    const updateStatusForm = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateStatus.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::updateStatus
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:225
 * @route '/super-admin/accounts/{type}/{id}/status'
 */
        updateStatusForm.post = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateStatus.url(args, options),
            method: 'post',
        })
    
    updateStatus.form = updateStatusForm
/**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::restore
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:271
 * @route '/super-admin/accounts/{type}/{id}/restore'
 */
export const restore = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

restore.definition = {
    methods: ["post"],
    url: '/super-admin/accounts/{type}/{id}/restore',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::restore
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:271
 * @route '/super-admin/accounts/{type}/{id}/restore'
 */
restore.url = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    type: args[0],
                    id: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        type: args.type,
                                id: args.id,
                }

    return restore.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::restore
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:271
 * @route '/super-admin/accounts/{type}/{id}/restore'
 */
restore.post = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::restore
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:271
 * @route '/super-admin/accounts/{type}/{id}/restore'
 */
    const restoreForm = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: restore.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::restore
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:271
 * @route '/super-admin/accounts/{type}/{id}/restore'
 */
        restoreForm.post = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: restore.url(args, options),
            method: 'post',
        })
    
    restore.form = restoreForm
/**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::destroy
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:303
 * @route '/super-admin/accounts/{type}/{id}'
 */
export const destroy = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/super-admin/accounts/{type}/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::destroy
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:303
 * @route '/super-admin/accounts/{type}/{id}'
 */
destroy.url = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    type: args[0],
                    id: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        type: args.type,
                                id: args.id,
                }

    return destroy.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::destroy
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:303
 * @route '/super-admin/accounts/{type}/{id}'
 */
destroy.delete = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::destroy
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:303
 * @route '/super-admin/accounts/{type}/{id}'
 */
    const destroyForm = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\AccountGovernanceController::destroy
 * @see app/Http/Controllers/SuperAdmin/AccountGovernanceController.php:303
 * @route '/super-admin/accounts/{type}/{id}'
 */
        destroyForm.delete = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const AccountGovernanceController = { index, show, updateStatus, restore, destroy }

export default AccountGovernanceController