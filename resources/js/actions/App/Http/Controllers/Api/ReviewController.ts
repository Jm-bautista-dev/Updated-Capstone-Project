import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ReviewController::getProductReviews
 * @see app/Http/Controllers/Api/ReviewController.php:21
 * @route '/api/v1/products/{id}/reviews'
 */
export const getProductReviews = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getProductReviews.url(args, options),
    method: 'get',
})

getProductReviews.definition = {
    methods: ["get","head"],
    url: '/api/v1/products/{id}/reviews',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ReviewController::getProductReviews
 * @see app/Http/Controllers/Api/ReviewController.php:21
 * @route '/api/v1/products/{id}/reviews'
 */
getProductReviews.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return getProductReviews.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ReviewController::getProductReviews
 * @see app/Http/Controllers/Api/ReviewController.php:21
 * @route '/api/v1/products/{id}/reviews'
 */
getProductReviews.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getProductReviews.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ReviewController::getProductReviews
 * @see app/Http/Controllers/Api/ReviewController.php:21
 * @route '/api/v1/products/{id}/reviews'
 */
getProductReviews.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getProductReviews.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ReviewController::getProductReviews
 * @see app/Http/Controllers/Api/ReviewController.php:21
 * @route '/api/v1/products/{id}/reviews'
 */
    const getProductReviewsForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getProductReviews.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ReviewController::getProductReviews
 * @see app/Http/Controllers/Api/ReviewController.php:21
 * @route '/api/v1/products/{id}/reviews'
 */
        getProductReviewsForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getProductReviews.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ReviewController::getProductReviews
 * @see app/Http/Controllers/Api/ReviewController.php:21
 * @route '/api/v1/products/{id}/reviews'
 */
        getProductReviewsForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getProductReviews.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getProductReviews.form = getProductReviewsForm
/**
* @see \App\Http\Controllers\Api\ReviewController::getEligibleReviews
 * @see app/Http/Controllers/Api/ReviewController.php:65
 * @route '/api/v1/customer/eligible-reviews'
 */
export const getEligibleReviews = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getEligibleReviews.url(options),
    method: 'get',
})

getEligibleReviews.definition = {
    methods: ["get","head"],
    url: '/api/v1/customer/eligible-reviews',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ReviewController::getEligibleReviews
 * @see app/Http/Controllers/Api/ReviewController.php:65
 * @route '/api/v1/customer/eligible-reviews'
 */
getEligibleReviews.url = (options?: RouteQueryOptions) => {
    return getEligibleReviews.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ReviewController::getEligibleReviews
 * @see app/Http/Controllers/Api/ReviewController.php:65
 * @route '/api/v1/customer/eligible-reviews'
 */
getEligibleReviews.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getEligibleReviews.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ReviewController::getEligibleReviews
 * @see app/Http/Controllers/Api/ReviewController.php:65
 * @route '/api/v1/customer/eligible-reviews'
 */
getEligibleReviews.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getEligibleReviews.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ReviewController::getEligibleReviews
 * @see app/Http/Controllers/Api/ReviewController.php:65
 * @route '/api/v1/customer/eligible-reviews'
 */
    const getEligibleReviewsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getEligibleReviews.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ReviewController::getEligibleReviews
 * @see app/Http/Controllers/Api/ReviewController.php:65
 * @route '/api/v1/customer/eligible-reviews'
 */
        getEligibleReviewsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getEligibleReviews.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ReviewController::getEligibleReviews
 * @see app/Http/Controllers/Api/ReviewController.php:65
 * @route '/api/v1/customer/eligible-reviews'
 */
        getEligibleReviewsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getEligibleReviews.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getEligibleReviews.form = getEligibleReviewsForm
/**
* @see \App\Http\Controllers\Api\ReviewController::getCustomerReviews
 * @see app/Http/Controllers/Api/ReviewController.php:243
 * @route '/api/v1/customer/reviews'
 */
export const getCustomerReviews = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCustomerReviews.url(options),
    method: 'get',
})

getCustomerReviews.definition = {
    methods: ["get","head"],
    url: '/api/v1/customer/reviews',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ReviewController::getCustomerReviews
 * @see app/Http/Controllers/Api/ReviewController.php:243
 * @route '/api/v1/customer/reviews'
 */
getCustomerReviews.url = (options?: RouteQueryOptions) => {
    return getCustomerReviews.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ReviewController::getCustomerReviews
 * @see app/Http/Controllers/Api/ReviewController.php:243
 * @route '/api/v1/customer/reviews'
 */
getCustomerReviews.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCustomerReviews.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ReviewController::getCustomerReviews
 * @see app/Http/Controllers/Api/ReviewController.php:243
 * @route '/api/v1/customer/reviews'
 */
getCustomerReviews.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCustomerReviews.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ReviewController::getCustomerReviews
 * @see app/Http/Controllers/Api/ReviewController.php:243
 * @route '/api/v1/customer/reviews'
 */
    const getCustomerReviewsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCustomerReviews.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ReviewController::getCustomerReviews
 * @see app/Http/Controllers/Api/ReviewController.php:243
 * @route '/api/v1/customer/reviews'
 */
        getCustomerReviewsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCustomerReviews.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ReviewController::getCustomerReviews
 * @see app/Http/Controllers/Api/ReviewController.php:243
 * @route '/api/v1/customer/reviews'
 */
        getCustomerReviewsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCustomerReviews.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCustomerReviews.form = getCustomerReviewsForm
/**
* @see \App\Http\Controllers\Api\ReviewController::store
 * @see app/Http/Controllers/Api/ReviewController.php:120
 * @route '/api/v1/reviews'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/v1/reviews',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ReviewController::store
 * @see app/Http/Controllers/Api/ReviewController.php:120
 * @route '/api/v1/reviews'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ReviewController::store
 * @see app/Http/Controllers/Api/ReviewController.php:120
 * @route '/api/v1/reviews'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ReviewController::store
 * @see app/Http/Controllers/Api/ReviewController.php:120
 * @route '/api/v1/reviews'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ReviewController::store
 * @see app/Http/Controllers/Api/ReviewController.php:120
 * @route '/api/v1/reviews'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Api\ReviewController::update
 * @see app/Http/Controllers/Api/ReviewController.php:204
 * @route '/api/v1/reviews/{id}'
 */
export const update = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/v1/reviews/{id}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\ReviewController::update
 * @see app/Http/Controllers/Api/ReviewController.php:204
 * @route '/api/v1/reviews/{id}'
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
* @see \App\Http\Controllers\Api\ReviewController::update
 * @see app/Http/Controllers/Api/ReviewController.php:204
 * @route '/api/v1/reviews/{id}'
 */
update.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\ReviewController::update
 * @see app/Http/Controllers/Api/ReviewController.php:204
 * @route '/api/v1/reviews/{id}'
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
* @see \App\Http\Controllers\Api\ReviewController::update
 * @see app/Http/Controllers/Api/ReviewController.php:204
 * @route '/api/v1/reviews/{id}'
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
const ReviewController = { getProductReviews, getEligibleReviews, getCustomerReviews, store, update }

export default ReviewController