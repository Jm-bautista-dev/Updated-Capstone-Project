import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SupplierController::index
 * @see app/Http/Controllers/Admin/SupplierController.php:35
 * @route '/suppliers'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/suppliers',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SupplierController::index
 * @see app/Http/Controllers/Admin/SupplierController.php:35
 * @route '/suppliers'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SupplierController::index
 * @see app/Http/Controllers/Admin/SupplierController.php:35
 * @route '/suppliers'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\SupplierController::index
 * @see app/Http/Controllers/Admin/SupplierController.php:35
 * @route '/suppliers'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\SupplierController::index
 * @see app/Http/Controllers/Admin/SupplierController.php:35
 * @route '/suppliers'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\SupplierController::index
 * @see app/Http/Controllers/Admin/SupplierController.php:35
 * @route '/suppliers'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\SupplierController::index
 * @see app/Http/Controllers/Admin/SupplierController.php:35
 * @route '/suppliers'
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
* @see \App\Http\Controllers\Admin\SupplierController::store
 * @see app/Http/Controllers/Admin/SupplierController.php:108
 * @route '/suppliers'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/suppliers',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SupplierController::store
 * @see app/Http/Controllers/Admin/SupplierController.php:108
 * @route '/suppliers'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SupplierController::store
 * @see app/Http/Controllers/Admin/SupplierController.php:108
 * @route '/suppliers'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\SupplierController::store
 * @see app/Http/Controllers/Admin/SupplierController.php:108
 * @route '/suppliers'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SupplierController::store
 * @see app/Http/Controllers/Admin/SupplierController.php:108
 * @route '/suppliers'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\SupplierController::show
 * @see app/Http/Controllers/Admin/SupplierController.php:137
 * @route '/suppliers/{supplier}'
 */
export const show = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/suppliers/{supplier}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SupplierController::show
 * @see app/Http/Controllers/Admin/SupplierController.php:137
 * @route '/suppliers/{supplier}'
 */
show.url = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { supplier: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { supplier: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    supplier: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        supplier: typeof args.supplier === 'object'
                ? args.supplier.id
                : args.supplier,
                }

    return show.definition.url
            .replace('{supplier}', parsedArgs.supplier.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SupplierController::show
 * @see app/Http/Controllers/Admin/SupplierController.php:137
 * @route '/suppliers/{supplier}'
 */
show.get = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\SupplierController::show
 * @see app/Http/Controllers/Admin/SupplierController.php:137
 * @route '/suppliers/{supplier}'
 */
show.head = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\SupplierController::show
 * @see app/Http/Controllers/Admin/SupplierController.php:137
 * @route '/suppliers/{supplier}'
 */
    const showForm = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\SupplierController::show
 * @see app/Http/Controllers/Admin/SupplierController.php:137
 * @route '/suppliers/{supplier}'
 */
        showForm.get = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\SupplierController::show
 * @see app/Http/Controllers/Admin/SupplierController.php:137
 * @route '/suppliers/{supplier}'
 */
        showForm.head = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Admin\SupplierController::update
 * @see app/Http/Controllers/Admin/SupplierController.php:150
 * @route '/suppliers/{supplier}'
 */
export const update = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/suppliers/{supplier}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\SupplierController::update
 * @see app/Http/Controllers/Admin/SupplierController.php:150
 * @route '/suppliers/{supplier}'
 */
update.url = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { supplier: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { supplier: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    supplier: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        supplier: typeof args.supplier === 'object'
                ? args.supplier.id
                : args.supplier,
                }

    return update.definition.url
            .replace('{supplier}', parsedArgs.supplier.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SupplierController::update
 * @see app/Http/Controllers/Admin/SupplierController.php:150
 * @route '/suppliers/{supplier}'
 */
update.put = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\SupplierController::update
 * @see app/Http/Controllers/Admin/SupplierController.php:150
 * @route '/suppliers/{supplier}'
 */
    const updateForm = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SupplierController::update
 * @see app/Http/Controllers/Admin/SupplierController.php:150
 * @route '/suppliers/{supplier}'
 */
        updateForm.put = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Admin\SupplierController::destroy
 * @see app/Http/Controllers/Admin/SupplierController.php:176
 * @route '/suppliers/{supplier}'
 */
export const destroy = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/suppliers/{supplier}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\SupplierController::destroy
 * @see app/Http/Controllers/Admin/SupplierController.php:176
 * @route '/suppliers/{supplier}'
 */
destroy.url = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { supplier: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { supplier: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    supplier: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        supplier: typeof args.supplier === 'object'
                ? args.supplier.id
                : args.supplier,
                }

    return destroy.definition.url
            .replace('{supplier}', parsedArgs.supplier.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SupplierController::destroy
 * @see app/Http/Controllers/Admin/SupplierController.php:176
 * @route '/suppliers/{supplier}'
 */
destroy.delete = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\SupplierController::destroy
 * @see app/Http/Controllers/Admin/SupplierController.php:176
 * @route '/suppliers/{supplier}'
 */
    const destroyForm = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SupplierController::destroy
 * @see app/Http/Controllers/Admin/SupplierController.php:176
 * @route '/suppliers/{supplier}'
 */
        destroyForm.delete = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
/**
* @see \App\Http\Controllers\Admin\SupplierController::restore
 * @see app/Http/Controllers/Admin/SupplierController.php:187
 * @route '/suppliers/{supplier}/restore'
 */
export const restore = (args: { supplier: string | number } | [supplier: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

restore.definition = {
    methods: ["post"],
    url: '/suppliers/{supplier}/restore',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SupplierController::restore
 * @see app/Http/Controllers/Admin/SupplierController.php:187
 * @route '/suppliers/{supplier}/restore'
 */
restore.url = (args: { supplier: string | number } | [supplier: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { supplier: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    supplier: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        supplier: args.supplier,
                }

    return restore.definition.url
            .replace('{supplier}', parsedArgs.supplier.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SupplierController::restore
 * @see app/Http/Controllers/Admin/SupplierController.php:187
 * @route '/suppliers/{supplier}/restore'
 */
restore.post = (args: { supplier: string | number } | [supplier: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\SupplierController::restore
 * @see app/Http/Controllers/Admin/SupplierController.php:187
 * @route '/suppliers/{supplier}/restore'
 */
    const restoreForm = (args: { supplier: string | number } | [supplier: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: restore.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SupplierController::restore
 * @see app/Http/Controllers/Admin/SupplierController.php:187
 * @route '/suppliers/{supplier}/restore'
 */
        restoreForm.post = (args: { supplier: string | number } | [supplier: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: restore.url(args, options),
            method: 'post',
        })
    
    restore.form = restoreForm
const SupplierController = { index, store, show, update, destroy, restore }

export default SupplierController