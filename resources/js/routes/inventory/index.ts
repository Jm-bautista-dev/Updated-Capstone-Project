import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\StockInController::massStockIn
 * @see app/Http/Controllers/StockInController.php:31
 * @route '/inventory/mass-stock-in'
 */
export const massStockIn = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: massStockIn.url(options),
    method: 'post',
})

massStockIn.definition = {
    methods: ["post"],
    url: '/inventory/mass-stock-in',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\StockInController::massStockIn
 * @see app/Http/Controllers/StockInController.php:31
 * @route '/inventory/mass-stock-in'
 */
massStockIn.url = (options?: RouteQueryOptions) => {
    return massStockIn.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockInController::massStockIn
 * @see app/Http/Controllers/StockInController.php:31
 * @route '/inventory/mass-stock-in'
 */
massStockIn.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: massStockIn.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\StockInController::massStockIn
 * @see app/Http/Controllers/StockInController.php:31
 * @route '/inventory/mass-stock-in'
 */
    const massStockInForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: massStockIn.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\StockInController::massStockIn
 * @see app/Http/Controllers/StockInController.php:31
 * @route '/inventory/mass-stock-in'
 */
        massStockInForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: massStockIn.url(options),
            method: 'post',
        })
    
    massStockIn.form = massStockInForm
/**
* @see \App\Http\Controllers\InventoryController::bulkDelete
 * @see app/Http/Controllers/InventoryController.php:357
 * @route '/inventory/bulk-delete'
 */
export const bulkDelete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: bulkDelete.url(options),
    method: 'delete',
})

bulkDelete.definition = {
    methods: ["delete"],
    url: '/inventory/bulk-delete',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\InventoryController::bulkDelete
 * @see app/Http/Controllers/InventoryController.php:357
 * @route '/inventory/bulk-delete'
 */
bulkDelete.url = (options?: RouteQueryOptions) => {
    return bulkDelete.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::bulkDelete
 * @see app/Http/Controllers/InventoryController.php:357
 * @route '/inventory/bulk-delete'
 */
bulkDelete.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: bulkDelete.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\InventoryController::bulkDelete
 * @see app/Http/Controllers/InventoryController.php:357
 * @route '/inventory/bulk-delete'
 */
    const bulkDeleteForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: bulkDelete.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventoryController::bulkDelete
 * @see app/Http/Controllers/InventoryController.php:357
 * @route '/inventory/bulk-delete'
 */
        bulkDeleteForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: bulkDelete.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    bulkDelete.form = bulkDeleteForm
/**
* @see \App\Http\Controllers\InventoryController::store
 * @see app/Http/Controllers/InventoryController.php:130
 * @route '/inventory'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/inventory',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventoryController::store
 * @see app/Http/Controllers/InventoryController.php:130
 * @route '/inventory'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::store
 * @see app/Http/Controllers/InventoryController.php:130
 * @route '/inventory'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventoryController::store
 * @see app/Http/Controllers/InventoryController.php:130
 * @route '/inventory'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventoryController::store
 * @see app/Http/Controllers/InventoryController.php:130
 * @route '/inventory'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\InventoryController::update
 * @see app/Http/Controllers/InventoryController.php:231
 * @route '/inventory/{id}'
 */
export const update = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/inventory/{id}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\InventoryController::update
 * @see app/Http/Controllers/InventoryController.php:231
 * @route '/inventory/{id}'
 */
update.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::update
 * @see app/Http/Controllers/InventoryController.php:231
 * @route '/inventory/{id}'
 */
update.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\InventoryController::update
 * @see app/Http/Controllers/InventoryController.php:231
 * @route '/inventory/{id}'
 */
    const updateForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventoryController::update
 * @see app/Http/Controllers/InventoryController.php:231
 * @route '/inventory/{id}'
 */
        updateForm.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\InventoryController::destroy
 * @see app/Http/Controllers/InventoryController.php:307
 * @route '/inventory/{id}'
 */
export const destroy = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/inventory/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\InventoryController::destroy
 * @see app/Http/Controllers/InventoryController.php:307
 * @route '/inventory/{id}'
 */
destroy.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::destroy
 * @see app/Http/Controllers/InventoryController.php:307
 * @route '/inventory/{id}'
 */
destroy.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\InventoryController::destroy
 * @see app/Http/Controllers/InventoryController.php:307
 * @route '/inventory/{id}'
 */
    const destroyForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventoryController::destroy
 * @see app/Http/Controllers/InventoryController.php:307
 * @route '/inventory/{id}'
 */
        destroyForm.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\InventoryController::index
 * @see app/Http/Controllers/InventoryController.php:27
 * @route '/inventory'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventory',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventoryController::index
 * @see app/Http/Controllers/InventoryController.php:27
 * @route '/inventory'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::index
 * @see app/Http/Controllers/InventoryController.php:27
 * @route '/inventory'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventoryController::index
 * @see app/Http/Controllers/InventoryController.php:27
 * @route '/inventory'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventoryController::index
 * @see app/Http/Controllers/InventoryController.php:27
 * @route '/inventory'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventoryController::index
 * @see app/Http/Controllers/InventoryController.php:27
 * @route '/inventory'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventoryController::index
 * @see app/Http/Controllers/InventoryController.php:27
 * @route '/inventory'
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
* @see \App\Http\Controllers\StockInController::stockIn
 * @see app/Http/Controllers/StockInController.php:64
 * @route '/inventory/stock-in'
 */
export const stockIn = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: stockIn.url(options),
    method: 'post',
})

stockIn.definition = {
    methods: ["post"],
    url: '/inventory/stock-in',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\StockInController::stockIn
 * @see app/Http/Controllers/StockInController.php:64
 * @route '/inventory/stock-in'
 */
stockIn.url = (options?: RouteQueryOptions) => {
    return stockIn.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockInController::stockIn
 * @see app/Http/Controllers/StockInController.php:64
 * @route '/inventory/stock-in'
 */
stockIn.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: stockIn.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\StockInController::stockIn
 * @see app/Http/Controllers/StockInController.php:64
 * @route '/inventory/stock-in'
 */
    const stockInForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: stockIn.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\StockInController::stockIn
 * @see app/Http/Controllers/StockInController.php:64
 * @route '/inventory/stock-in'
 */
        stockInForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: stockIn.url(options),
            method: 'post',
        })
    
    stockIn.form = stockInForm
/**
* @see \App\Http\Controllers\WastageController::wastage
 * @see app/Http/Controllers/WastageController.php:22
 * @route '/inventory/wastage'
 */
export const wastage = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: wastage.url(options),
    method: 'post',
})

wastage.definition = {
    methods: ["post"],
    url: '/inventory/wastage',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WastageController::wastage
 * @see app/Http/Controllers/WastageController.php:22
 * @route '/inventory/wastage'
 */
wastage.url = (options?: RouteQueryOptions) => {
    return wastage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WastageController::wastage
 * @see app/Http/Controllers/WastageController.php:22
 * @route '/inventory/wastage'
 */
wastage.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: wastage.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WastageController::wastage
 * @see app/Http/Controllers/WastageController.php:22
 * @route '/inventory/wastage'
 */
    const wastageForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: wastage.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WastageController::wastage
 * @see app/Http/Controllers/WastageController.php:22
 * @route '/inventory/wastage'
 */
        wastageForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: wastage.url(options),
            method: 'post',
        })
    
    wastage.form = wastageForm
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
const inventory = {
    massStockIn: Object.assign(massStockIn, massStockIn),
bulkDelete: Object.assign(bulkDelete, bulkDelete),
store: Object.assign(store, store),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
index: Object.assign(index, index),
stockIn: Object.assign(stockIn, stockIn),
wastage: Object.assign(wastage, wastage),
activity: Object.assign(activity, activity),
}

export default inventory