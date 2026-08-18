import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ReviewController::markSeen
 * @see app/Http/Controllers/Admin/ReviewController.php:245
 * @route '/admin/reviews/products/{product}/mark-seen'
 */
export const markSeen = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markSeen.url(args, options),
    method: 'post',
})

markSeen.definition = {
    methods: ["post"],
    url: '/admin/reviews/products/{product}/mark-seen',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReviewController::markSeen
 * @see app/Http/Controllers/Admin/ReviewController.php:245
 * @route '/admin/reviews/products/{product}/mark-seen'
 */
markSeen.url = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { product: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { product: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    product: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        product: typeof args.product === 'object'
                ? args.product.id
                : args.product,
                }

    return markSeen.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReviewController::markSeen
 * @see app/Http/Controllers/Admin/ReviewController.php:245
 * @route '/admin/reviews/products/{product}/mark-seen'
 */
markSeen.post = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markSeen.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ReviewController::markSeen
 * @see app/Http/Controllers/Admin/ReviewController.php:245
 * @route '/admin/reviews/products/{product}/mark-seen'
 */
    const markSeenForm = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: markSeen.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ReviewController::markSeen
 * @see app/Http/Controllers/Admin/ReviewController.php:245
 * @route '/admin/reviews/products/{product}/mark-seen'
 */
        markSeenForm.post = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: markSeen.url(args, options),
            method: 'post',
        })
    
    markSeen.form = markSeenForm
const products = {
    markSeen: Object.assign(markSeen, markSeen),
}

export default products