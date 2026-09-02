import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ReviewController::index
 * @see app/Http/Controllers/Admin/ReviewController.php:22
 * @route '/admin/reviews'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/reviews',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ReviewController::index
 * @see app/Http/Controllers/Admin/ReviewController.php:22
 * @route '/admin/reviews'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReviewController::index
 * @see app/Http/Controllers/Admin/ReviewController.php:22
 * @route '/admin/reviews'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ReviewController::index
 * @see app/Http/Controllers/Admin/ReviewController.php:22
 * @route '/admin/reviews'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ReviewController::index
 * @see app/Http/Controllers/Admin/ReviewController.php:22
 * @route '/admin/reviews'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ReviewController::index
 * @see app/Http/Controllers/Admin/ReviewController.php:22
 * @route '/admin/reviews'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ReviewController::index
 * @see app/Http/Controllers/Admin/ReviewController.php:22
 * @route '/admin/reviews'
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
* @see \App\Http\Controllers\Admin\ReviewController::updateStatus
 * @see app/Http/Controllers/Admin/ReviewController.php:413
 * @route '/admin/reviews/{review}/status'
 */
export const updateStatus = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateStatus.url(args, options),
    method: 'put',
})

updateStatus.definition = {
    methods: ["put"],
    url: '/admin/reviews/{review}/status',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\ReviewController::updateStatus
 * @see app/Http/Controllers/Admin/ReviewController.php:413
 * @route '/admin/reviews/{review}/status'
 */
updateStatus.url = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { review: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { review: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    review: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        review: typeof args.review === 'object'
                ? args.review.id
                : args.review,
                }

    return updateStatus.definition.url
            .replace('{review}', parsedArgs.review.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReviewController::updateStatus
 * @see app/Http/Controllers/Admin/ReviewController.php:413
 * @route '/admin/reviews/{review}/status'
 */
updateStatus.put = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateStatus.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\ReviewController::updateStatus
 * @see app/Http/Controllers/Admin/ReviewController.php:413
 * @route '/admin/reviews/{review}/status'
 */
    const updateStatusForm = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ReviewController::updateStatus
 * @see app/Http/Controllers/Admin/ReviewController.php:413
 * @route '/admin/reviews/{review}/status'
 */
        updateStatusForm.put = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateStatus.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateStatus.form = updateStatusForm
/**
* @see \App\Http\Controllers\Admin\ReviewController::respond
 * @see app/Http/Controllers/Admin/ReviewController.php:437
 * @route '/admin/reviews/{review}/respond'
 */
export const respond = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: respond.url(args, options),
    method: 'post',
})

respond.definition = {
    methods: ["post"],
    url: '/admin/reviews/{review}/respond',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReviewController::respond
 * @see app/Http/Controllers/Admin/ReviewController.php:437
 * @route '/admin/reviews/{review}/respond'
 */
respond.url = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { review: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { review: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    review: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        review: typeof args.review === 'object'
                ? args.review.id
                : args.review,
                }

    return respond.definition.url
            .replace('{review}', parsedArgs.review.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReviewController::respond
 * @see app/Http/Controllers/Admin/ReviewController.php:437
 * @route '/admin/reviews/{review}/respond'
 */
respond.post = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: respond.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ReviewController::respond
 * @see app/Http/Controllers/Admin/ReviewController.php:437
 * @route '/admin/reviews/{review}/respond'
 */
    const respondForm = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: respond.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ReviewController::respond
 * @see app/Http/Controllers/Admin/ReviewController.php:437
 * @route '/admin/reviews/{review}/respond'
 */
        respondForm.post = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: respond.url(args, options),
            method: 'post',
        })
    
    respond.form = respondForm
/**
* @see \App\Http\Controllers\Admin\ReviewController::markReviewSeen
 * @see app/Http/Controllers/Admin/ReviewController.php:380
 * @route '/admin/reviews/{review}/mark-seen'
 */
export const markReviewSeen = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markReviewSeen.url(args, options),
    method: 'post',
})

markReviewSeen.definition = {
    methods: ["post"],
    url: '/admin/reviews/{review}/mark-seen',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReviewController::markReviewSeen
 * @see app/Http/Controllers/Admin/ReviewController.php:380
 * @route '/admin/reviews/{review}/mark-seen'
 */
markReviewSeen.url = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { review: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { review: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    review: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        review: typeof args.review === 'object'
                ? args.review.id
                : args.review,
                }

    return markReviewSeen.definition.url
            .replace('{review}', parsedArgs.review.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReviewController::markReviewSeen
 * @see app/Http/Controllers/Admin/ReviewController.php:380
 * @route '/admin/reviews/{review}/mark-seen'
 */
markReviewSeen.post = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markReviewSeen.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ReviewController::markReviewSeen
 * @see app/Http/Controllers/Admin/ReviewController.php:380
 * @route '/admin/reviews/{review}/mark-seen'
 */
    const markReviewSeenForm = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: markReviewSeen.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ReviewController::markReviewSeen
 * @see app/Http/Controllers/Admin/ReviewController.php:380
 * @route '/admin/reviews/{review}/mark-seen'
 */
        markReviewSeenForm.post = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: markReviewSeen.url(args, options),
            method: 'post',
        })
    
    markReviewSeen.form = markReviewSeenForm
/**
* @see \App\Http\Controllers\Admin\ReviewController::markProductReviewsSeen
 * @see app/Http/Controllers/Admin/ReviewController.php:350
 * @route '/admin/reviews/products/{product}/mark-seen'
 */
export const markProductReviewsSeen = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markProductReviewsSeen.url(args, options),
    method: 'post',
})

markProductReviewsSeen.definition = {
    methods: ["post"],
    url: '/admin/reviews/products/{product}/mark-seen',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReviewController::markProductReviewsSeen
 * @see app/Http/Controllers/Admin/ReviewController.php:350
 * @route '/admin/reviews/products/{product}/mark-seen'
 */
markProductReviewsSeen.url = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return markProductReviewsSeen.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReviewController::markProductReviewsSeen
 * @see app/Http/Controllers/Admin/ReviewController.php:350
 * @route '/admin/reviews/products/{product}/mark-seen'
 */
markProductReviewsSeen.post = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markProductReviewsSeen.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ReviewController::markProductReviewsSeen
 * @see app/Http/Controllers/Admin/ReviewController.php:350
 * @route '/admin/reviews/products/{product}/mark-seen'
 */
    const markProductReviewsSeenForm = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: markProductReviewsSeen.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ReviewController::markProductReviewsSeen
 * @see app/Http/Controllers/Admin/ReviewController.php:350
 * @route '/admin/reviews/products/{product}/mark-seen'
 */
        markProductReviewsSeenForm.post = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: markProductReviewsSeen.url(args, options),
            method: 'post',
        })
    
    markProductReviewsSeen.form = markProductReviewsSeenForm
/**
* @see \App\Http\Controllers\Admin\ReviewController::destroy
 * @see app/Http/Controllers/Admin/ReviewController.php:465
 * @route '/admin/reviews/{review}'
 */
export const destroy = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/reviews/{review}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ReviewController::destroy
 * @see app/Http/Controllers/Admin/ReviewController.php:465
 * @route '/admin/reviews/{review}'
 */
destroy.url = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { review: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { review: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    review: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        review: typeof args.review === 'object'
                ? args.review.id
                : args.review,
                }

    return destroy.definition.url
            .replace('{review}', parsedArgs.review.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReviewController::destroy
 * @see app/Http/Controllers/Admin/ReviewController.php:465
 * @route '/admin/reviews/{review}'
 */
destroy.delete = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\ReviewController::destroy
 * @see app/Http/Controllers/Admin/ReviewController.php:465
 * @route '/admin/reviews/{review}'
 */
    const destroyForm = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ReviewController::destroy
 * @see app/Http/Controllers/Admin/ReviewController.php:465
 * @route '/admin/reviews/{review}'
 */
        destroyForm.delete = (args: { review: number | { id: number } } | [review: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const ReviewController = { index, updateStatus, respond, markReviewSeen, markProductReviewsSeen, destroy }

export default ReviewController