import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\CustomerOrderController::show
 * @see app/Http/Controllers/Api/CustomerOrderController.php:22
 * @route '/api/v1/customer/orders/{id}'
 */
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/v1/customer/orders/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CustomerOrderController::show
 * @see app/Http/Controllers/Api/CustomerOrderController.php:22
 * @route '/api/v1/customer/orders/{id}'
 */
show.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CustomerOrderController::show
 * @see app/Http/Controllers/Api/CustomerOrderController.php:22
 * @route '/api/v1/customer/orders/{id}'
 */
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CustomerOrderController::show
 * @see app/Http/Controllers/Api/CustomerOrderController.php:22
 * @route '/api/v1/customer/orders/{id}'
 */
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CustomerOrderController::show
 * @see app/Http/Controllers/Api/CustomerOrderController.php:22
 * @route '/api/v1/customer/orders/{id}'
 */
    const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CustomerOrderController::show
 * @see app/Http/Controllers/Api/CustomerOrderController.php:22
 * @route '/api/v1/customer/orders/{id}'
 */
        showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CustomerOrderController::show
 * @see app/Http/Controllers/Api/CustomerOrderController.php:22
 * @route '/api/v1/customer/orders/{id}'
 */
        showForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Api\CustomerOrderController::getCodEligibility
 * @see app/Http/Controllers/Api/CustomerOrderController.php:273
 * @route '/api/v1/customer/cod-eligibility'
 */
const getCodEligibility787197fe0ec5091c82b374f176001203 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCodEligibility787197fe0ec5091c82b374f176001203.url(options),
    method: 'get',
})

getCodEligibility787197fe0ec5091c82b374f176001203.definition = {
    methods: ["get","head"],
    url: '/api/v1/customer/cod-eligibility',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CustomerOrderController::getCodEligibility
 * @see app/Http/Controllers/Api/CustomerOrderController.php:273
 * @route '/api/v1/customer/cod-eligibility'
 */
getCodEligibility787197fe0ec5091c82b374f176001203.url = (options?: RouteQueryOptions) => {
    return getCodEligibility787197fe0ec5091c82b374f176001203.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CustomerOrderController::getCodEligibility
 * @see app/Http/Controllers/Api/CustomerOrderController.php:273
 * @route '/api/v1/customer/cod-eligibility'
 */
getCodEligibility787197fe0ec5091c82b374f176001203.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCodEligibility787197fe0ec5091c82b374f176001203.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CustomerOrderController::getCodEligibility
 * @see app/Http/Controllers/Api/CustomerOrderController.php:273
 * @route '/api/v1/customer/cod-eligibility'
 */
getCodEligibility787197fe0ec5091c82b374f176001203.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCodEligibility787197fe0ec5091c82b374f176001203.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CustomerOrderController::getCodEligibility
 * @see app/Http/Controllers/Api/CustomerOrderController.php:273
 * @route '/api/v1/customer/cod-eligibility'
 */
    const getCodEligibility787197fe0ec5091c82b374f176001203Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCodEligibility787197fe0ec5091c82b374f176001203.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CustomerOrderController::getCodEligibility
 * @see app/Http/Controllers/Api/CustomerOrderController.php:273
 * @route '/api/v1/customer/cod-eligibility'
 */
        getCodEligibility787197fe0ec5091c82b374f176001203Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCodEligibility787197fe0ec5091c82b374f176001203.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CustomerOrderController::getCodEligibility
 * @see app/Http/Controllers/Api/CustomerOrderController.php:273
 * @route '/api/v1/customer/cod-eligibility'
 */
        getCodEligibility787197fe0ec5091c82b374f176001203Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCodEligibility787197fe0ec5091c82b374f176001203.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCodEligibility787197fe0ec5091c82b374f176001203.form = getCodEligibility787197fe0ec5091c82b374f176001203Form
    /**
* @see \App\Http\Controllers\Api\CustomerOrderController::getCodEligibility
 * @see app/Http/Controllers/Api/CustomerOrderController.php:273
 * @route '/api/v1/customer/check-cod-eligibility'
 */
const getCodEligibilityc8e4d91a0b176407f4e66c3fefaaaee2 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: getCodEligibilityc8e4d91a0b176407f4e66c3fefaaaee2.url(options),
    method: 'post',
})

getCodEligibilityc8e4d91a0b176407f4e66c3fefaaaee2.definition = {
    methods: ["post"],
    url: '/api/v1/customer/check-cod-eligibility',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CustomerOrderController::getCodEligibility
 * @see app/Http/Controllers/Api/CustomerOrderController.php:273
 * @route '/api/v1/customer/check-cod-eligibility'
 */
getCodEligibilityc8e4d91a0b176407f4e66c3fefaaaee2.url = (options?: RouteQueryOptions) => {
    return getCodEligibilityc8e4d91a0b176407f4e66c3fefaaaee2.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CustomerOrderController::getCodEligibility
 * @see app/Http/Controllers/Api/CustomerOrderController.php:273
 * @route '/api/v1/customer/check-cod-eligibility'
 */
getCodEligibilityc8e4d91a0b176407f4e66c3fefaaaee2.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: getCodEligibilityc8e4d91a0b176407f4e66c3fefaaaee2.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CustomerOrderController::getCodEligibility
 * @see app/Http/Controllers/Api/CustomerOrderController.php:273
 * @route '/api/v1/customer/check-cod-eligibility'
 */
    const getCodEligibilityc8e4d91a0b176407f4e66c3fefaaaee2Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: getCodEligibilityc8e4d91a0b176407f4e66c3fefaaaee2.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CustomerOrderController::getCodEligibility
 * @see app/Http/Controllers/Api/CustomerOrderController.php:273
 * @route '/api/v1/customer/check-cod-eligibility'
 */
        getCodEligibilityc8e4d91a0b176407f4e66c3fefaaaee2Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: getCodEligibilityc8e4d91a0b176407f4e66c3fefaaaee2.url(options),
            method: 'post',
        })
    
    getCodEligibilityc8e4d91a0b176407f4e66c3fefaaaee2.form = getCodEligibilityc8e4d91a0b176407f4e66c3fefaaaee2Form

export const getCodEligibility = {
    '/api/v1/customer/cod-eligibility': getCodEligibility787197fe0ec5091c82b374f176001203,
    '/api/v1/customer/check-cod-eligibility': getCodEligibilityc8e4d91a0b176407f4e66c3fefaaaee2,
}

/**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:168
 * @route '/api/v1/orders/{orderId}/cancel'
 */
const cancel8fce9713bc55c11df3a2c57969b59e63 = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel8fce9713bc55c11df3a2c57969b59e63.url(args, options),
    method: 'post',
})

cancel8fce9713bc55c11df3a2c57969b59e63.definition = {
    methods: ["post"],
    url: '/api/v1/orders/{orderId}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:168
 * @route '/api/v1/orders/{orderId}/cancel'
 */
cancel8fce9713bc55c11df3a2c57969b59e63.url = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { orderId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    orderId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        orderId: args.orderId,
                }

    return cancel8fce9713bc55c11df3a2c57969b59e63.definition.url
            .replace('{orderId}', parsedArgs.orderId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:168
 * @route '/api/v1/orders/{orderId}/cancel'
 */
cancel8fce9713bc55c11df3a2c57969b59e63.post = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel8fce9713bc55c11df3a2c57969b59e63.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:168
 * @route '/api/v1/orders/{orderId}/cancel'
 */
    const cancel8fce9713bc55c11df3a2c57969b59e63Form = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancel8fce9713bc55c11df3a2c57969b59e63.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:168
 * @route '/api/v1/orders/{orderId}/cancel'
 */
        cancel8fce9713bc55c11df3a2c57969b59e63Form.post = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancel8fce9713bc55c11df3a2c57969b59e63.url(args, options),
            method: 'post',
        })
    
    cancel8fce9713bc55c11df3a2c57969b59e63.form = cancel8fce9713bc55c11df3a2c57969b59e63Form
    /**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:168
 * @route '/api/v1/customer/orders/{orderId}/cancel'
 */
const cancelc3d6d94ed50464371b4d50833c4092e0 = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelc3d6d94ed50464371b4d50833c4092e0.url(args, options),
    method: 'post',
})

cancelc3d6d94ed50464371b4d50833c4092e0.definition = {
    methods: ["post"],
    url: '/api/v1/customer/orders/{orderId}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:168
 * @route '/api/v1/customer/orders/{orderId}/cancel'
 */
cancelc3d6d94ed50464371b4d50833c4092e0.url = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { orderId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    orderId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        orderId: args.orderId,
                }

    return cancelc3d6d94ed50464371b4d50833c4092e0.definition.url
            .replace('{orderId}', parsedArgs.orderId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:168
 * @route '/api/v1/customer/orders/{orderId}/cancel'
 */
cancelc3d6d94ed50464371b4d50833c4092e0.post = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelc3d6d94ed50464371b4d50833c4092e0.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:168
 * @route '/api/v1/customer/orders/{orderId}/cancel'
 */
    const cancelc3d6d94ed50464371b4d50833c4092e0Form = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelc3d6d94ed50464371b4d50833c4092e0.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:168
 * @route '/api/v1/customer/orders/{orderId}/cancel'
 */
        cancelc3d6d94ed50464371b4d50833c4092e0Form.post = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelc3d6d94ed50464371b4d50833c4092e0.url(args, options),
            method: 'post',
        })
    
    cancelc3d6d94ed50464371b4d50833c4092e0.form = cancelc3d6d94ed50464371b4d50833c4092e0Form

export const cancel = {
    '/api/v1/orders/{orderId}/cancel': cancel8fce9713bc55c11df3a2c57969b59e63,
    '/api/v1/customer/orders/{orderId}/cancel': cancelc3d6d94ed50464371b4d50833c4092e0,
}

/**
* @see \App\Http\Controllers\Api\CustomerOrderController::checkReorder
 * @see app/Http/Controllers/Api/CustomerOrderController.php:106
 * @route '/api/v1/customer/orders/{id}/reorder-check'
 */
export const checkReorder = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: checkReorder.url(args, options),
    method: 'post',
})

checkReorder.definition = {
    methods: ["post"],
    url: '/api/v1/customer/orders/{id}/reorder-check',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CustomerOrderController::checkReorder
 * @see app/Http/Controllers/Api/CustomerOrderController.php:106
 * @route '/api/v1/customer/orders/{id}/reorder-check'
 */
checkReorder.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return checkReorder.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CustomerOrderController::checkReorder
 * @see app/Http/Controllers/Api/CustomerOrderController.php:106
 * @route '/api/v1/customer/orders/{id}/reorder-check'
 */
checkReorder.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: checkReorder.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CustomerOrderController::checkReorder
 * @see app/Http/Controllers/Api/CustomerOrderController.php:106
 * @route '/api/v1/customer/orders/{id}/reorder-check'
 */
    const checkReorderForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: checkReorder.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CustomerOrderController::checkReorder
 * @see app/Http/Controllers/Api/CustomerOrderController.php:106
 * @route '/api/v1/customer/orders/{id}/reorder-check'
 */
        checkReorderForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: checkReorder.url(args, options),
            method: 'post',
        })
    
    checkReorder.form = checkReorderForm
const CustomerOrderController = { show, getCodEligibility, cancel, checkReorder }

export default CustomerOrderController