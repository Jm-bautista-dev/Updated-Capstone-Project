import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\StockInController::massStore
 * @see app/Http/Controllers/StockInController.php:31
 * @route '/inventory/mass-stock-in'
 */
export const massStore = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: massStore.url(options),
    method: 'post',
})

massStore.definition = {
    methods: ["post"],
    url: '/inventory/mass-stock-in',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\StockInController::massStore
 * @see app/Http/Controllers/StockInController.php:31
 * @route '/inventory/mass-stock-in'
 */
massStore.url = (options?: RouteQueryOptions) => {
    return massStore.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockInController::massStore
 * @see app/Http/Controllers/StockInController.php:31
 * @route '/inventory/mass-stock-in'
 */
massStore.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: massStore.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\StockInController::massStore
 * @see app/Http/Controllers/StockInController.php:31
 * @route '/inventory/mass-stock-in'
 */
    const massStoreForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: massStore.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\StockInController::massStore
 * @see app/Http/Controllers/StockInController.php:31
 * @route '/inventory/mass-stock-in'
 */
        massStoreForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: massStore.url(options),
            method: 'post',
        })
    
    massStore.form = massStoreForm
/**
* @see \App\Http\Controllers\StockInController::store
 * @see app/Http/Controllers/StockInController.php:64
 * @route '/inventory/stock-in'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/inventory/stock-in',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\StockInController::store
 * @see app/Http/Controllers/StockInController.php:64
 * @route '/inventory/stock-in'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockInController::store
 * @see app/Http/Controllers/StockInController.php:64
 * @route '/inventory/stock-in'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\StockInController::store
 * @see app/Http/Controllers/StockInController.php:64
 * @route '/inventory/stock-in'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\StockInController::store
 * @see app/Http/Controllers/StockInController.php:64
 * @route '/inventory/stock-in'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const StockInController = { massStore, store }

export default StockInController