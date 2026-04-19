import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\InventoryActionController::index
 * @see app/Http/Controllers/InventoryActionController.php:16
 * @route '/inventory-items'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventory-items',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventoryActionController::index
 * @see app/Http/Controllers/InventoryActionController.php:16
 * @route '/inventory-items'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryActionController::index
 * @see app/Http/Controllers/InventoryActionController.php:16
 * @route '/inventory-items'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventoryActionController::index
 * @see app/Http/Controllers/InventoryActionController.php:16
 * @route '/inventory-items'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventoryActionController::index
 * @see app/Http/Controllers/InventoryActionController.php:16
 * @route '/inventory-items'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventoryActionController::index
 * @see app/Http/Controllers/InventoryActionController.php:16
 * @route '/inventory-items'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventoryActionController::index
 * @see app/Http/Controllers/InventoryActionController.php:16
 * @route '/inventory-items'
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
* @see \App\Http\Controllers\InventoryActionController::store
 * @see app/Http/Controllers/InventoryActionController.php:60
 * @route '/inventory-items'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/inventory-items',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventoryActionController::store
 * @see app/Http/Controllers/InventoryActionController.php:60
 * @route '/inventory-items'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryActionController::store
 * @see app/Http/Controllers/InventoryActionController.php:60
 * @route '/inventory-items'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventoryActionController::store
 * @see app/Http/Controllers/InventoryActionController.php:60
 * @route '/inventory-items'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventoryActionController::store
 * @see app/Http/Controllers/InventoryActionController.php:60
 * @route '/inventory-items'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const inventoryItems = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
}

export default inventoryItems