import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\InventoryActionController::store
 * @see app/Http/Controllers/InventoryActionController.php:91
 * @route '/pos/inventory-sale'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/pos/inventory-sale',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventoryActionController::store
 * @see app/Http/Controllers/InventoryActionController.php:91
 * @route '/pos/inventory-sale'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryActionController::store
 * @see app/Http/Controllers/InventoryActionController.php:91
 * @route '/pos/inventory-sale'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventoryActionController::store
 * @see app/Http/Controllers/InventoryActionController.php:91
 * @route '/pos/inventory-sale'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventoryActionController::store
 * @see app/Http/Controllers/InventoryActionController.php:91
 * @route '/pos/inventory-sale'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\InventoryActionController::history
 * @see app/Http/Controllers/InventoryActionController.php:124
 * @route '/inventory-sales-history'
 */
export const history = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: history.url(options),
    method: 'get',
})

history.definition = {
    methods: ["get","head"],
    url: '/inventory-sales-history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventoryActionController::history
 * @see app/Http/Controllers/InventoryActionController.php:124
 * @route '/inventory-sales-history'
 */
history.url = (options?: RouteQueryOptions) => {
    return history.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryActionController::history
 * @see app/Http/Controllers/InventoryActionController.php:124
 * @route '/inventory-sales-history'
 */
history.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: history.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventoryActionController::history
 * @see app/Http/Controllers/InventoryActionController.php:124
 * @route '/inventory-sales-history'
 */
history.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: history.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventoryActionController::history
 * @see app/Http/Controllers/InventoryActionController.php:124
 * @route '/inventory-sales-history'
 */
    const historyForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: history.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventoryActionController::history
 * @see app/Http/Controllers/InventoryActionController.php:124
 * @route '/inventory-sales-history'
 */
        historyForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: history.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventoryActionController::history
 * @see app/Http/Controllers/InventoryActionController.php:124
 * @route '/inventory-sales-history'
 */
        historyForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: history.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    history.form = historyForm
const inventorySale = {
    store: Object.assign(store, store),
history: Object.assign(history, history),
}

export default inventorySale