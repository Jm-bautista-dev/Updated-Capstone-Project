import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\WastageController::store
 * @see app/Http/Controllers/WastageController.php:22
 * @route '/inventory/wastage'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/inventory/wastage',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WastageController::store
 * @see app/Http/Controllers/WastageController.php:22
 * @route '/inventory/wastage'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WastageController::store
 * @see app/Http/Controllers/WastageController.php:22
 * @route '/inventory/wastage'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WastageController::store
 * @see app/Http/Controllers/WastageController.php:22
 * @route '/inventory/wastage'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WastageController::store
 * @see app/Http/Controllers/WastageController.php:22
 * @route '/inventory/wastage'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const WastageController = { store }

export default WastageController