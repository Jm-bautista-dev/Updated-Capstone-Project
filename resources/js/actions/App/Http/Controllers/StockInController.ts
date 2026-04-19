import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\StockInController::store
 * @see app/Http/Controllers/StockInController.php:27
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
 * @see app/Http/Controllers/StockInController.php:27
 * @route '/inventory/stock-in'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockInController::store
 * @see app/Http/Controllers/StockInController.php:27
 * @route '/inventory/stock-in'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\StockInController::store
 * @see app/Http/Controllers/StockInController.php:27
 * @route '/inventory/stock-in'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\StockInController::store
 * @see app/Http/Controllers/StockInController.php:27
 * @route '/inventory/stock-in'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const StockInController = { store }

export default StockInController