import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ApiOrderController::index
 * @see app/Http/Controllers/Api/ApiOrderController.php:22
 * @route '/api/v1/orders'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/v1/orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiOrderController::index
 * @see app/Http/Controllers/Api/ApiOrderController.php:22
 * @route '/api/v1/orders'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiOrderController::index
 * @see app/Http/Controllers/Api/ApiOrderController.php:22
 * @route '/api/v1/orders'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiOrderController::index
 * @see app/Http/Controllers/Api/ApiOrderController.php:22
 * @route '/api/v1/orders'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiOrderController::index
 * @see app/Http/Controllers/Api/ApiOrderController.php:22
 * @route '/api/v1/orders'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiOrderController::index
 * @see app/Http/Controllers/Api/ApiOrderController.php:22
 * @route '/api/v1/orders'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiOrderController::index
 * @see app/Http/Controllers/Api/ApiOrderController.php:22
 * @route '/api/v1/orders'
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
* @see \App\Http\Controllers\Api\ApiOrderController::store
 * @see app/Http/Controllers/Api/ApiOrderController.php:49
 * @route '/api/v1/orders'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/v1/orders',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiOrderController::store
 * @see app/Http/Controllers/Api/ApiOrderController.php:49
 * @route '/api/v1/orders'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiOrderController::store
 * @see app/Http/Controllers/Api/ApiOrderController.php:49
 * @route '/api/v1/orders'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ApiOrderController::store
 * @see app/Http/Controllers/Api/ApiOrderController.php:49
 * @route '/api/v1/orders'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ApiOrderController::store
 * @see app/Http/Controllers/Api/ApiOrderController.php:49
 * @route '/api/v1/orders'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Api\ApiOrderController::show
 * @see app/Http/Controllers/Api/ApiOrderController.php:219
 * @route '/api/v1/orders/{id}'
 */
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/v1/orders/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiOrderController::show
 * @see app/Http/Controllers/Api/ApiOrderController.php:219
 * @route '/api/v1/orders/{id}'
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
* @see \App\Http\Controllers\Api\ApiOrderController::show
 * @see app/Http/Controllers/Api/ApiOrderController.php:219
 * @route '/api/v1/orders/{id}'
 */
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiOrderController::show
 * @see app/Http/Controllers/Api/ApiOrderController.php:219
 * @route '/api/v1/orders/{id}'
 */
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiOrderController::show
 * @see app/Http/Controllers/Api/ApiOrderController.php:219
 * @route '/api/v1/orders/{id}'
 */
    const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiOrderController::show
 * @see app/Http/Controllers/Api/ApiOrderController.php:219
 * @route '/api/v1/orders/{id}'
 */
        showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiOrderController::show
 * @see app/Http/Controllers/Api/ApiOrderController.php:219
 * @route '/api/v1/orders/{id}'
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
* @see \App\Http\Controllers\Api\ApiOrderController::tracking
 * @see app/Http/Controllers/Api/ApiOrderController.php:271
 * @route '/api/v1/orders/{id}/tracking'
 */
const trackingac77c32e8816b05a8fd5a40ba6f25522 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: trackingac77c32e8816b05a8fd5a40ba6f25522.url(args, options),
    method: 'get',
})

trackingac77c32e8816b05a8fd5a40ba6f25522.definition = {
    methods: ["get","head"],
    url: '/api/v1/orders/{id}/tracking',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiOrderController::tracking
 * @see app/Http/Controllers/Api/ApiOrderController.php:271
 * @route '/api/v1/orders/{id}/tracking'
 */
trackingac77c32e8816b05a8fd5a40ba6f25522.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return trackingac77c32e8816b05a8fd5a40ba6f25522.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiOrderController::tracking
 * @see app/Http/Controllers/Api/ApiOrderController.php:271
 * @route '/api/v1/orders/{id}/tracking'
 */
trackingac77c32e8816b05a8fd5a40ba6f25522.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: trackingac77c32e8816b05a8fd5a40ba6f25522.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiOrderController::tracking
 * @see app/Http/Controllers/Api/ApiOrderController.php:271
 * @route '/api/v1/orders/{id}/tracking'
 */
trackingac77c32e8816b05a8fd5a40ba6f25522.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: trackingac77c32e8816b05a8fd5a40ba6f25522.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiOrderController::tracking
 * @see app/Http/Controllers/Api/ApiOrderController.php:271
 * @route '/api/v1/orders/{id}/tracking'
 */
    const trackingac77c32e8816b05a8fd5a40ba6f25522Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: trackingac77c32e8816b05a8fd5a40ba6f25522.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiOrderController::tracking
 * @see app/Http/Controllers/Api/ApiOrderController.php:271
 * @route '/api/v1/orders/{id}/tracking'
 */
        trackingac77c32e8816b05a8fd5a40ba6f25522Form.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: trackingac77c32e8816b05a8fd5a40ba6f25522.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiOrderController::tracking
 * @see app/Http/Controllers/Api/ApiOrderController.php:271
 * @route '/api/v1/orders/{id}/tracking'
 */
        trackingac77c32e8816b05a8fd5a40ba6f25522Form.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: trackingac77c32e8816b05a8fd5a40ba6f25522.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    trackingac77c32e8816b05a8fd5a40ba6f25522.form = trackingac77c32e8816b05a8fd5a40ba6f25522Form
    /**
* @see \App\Http\Controllers\Api\ApiOrderController::tracking
 * @see app/Http/Controllers/Api/ApiOrderController.php:271
 * @route '/api/v1/customer/orders/{id}/tracking'
 */
const tracking36d2a1ced4db6948eafdcf9b275b9143 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: tracking36d2a1ced4db6948eafdcf9b275b9143.url(args, options),
    method: 'get',
})

tracking36d2a1ced4db6948eafdcf9b275b9143.definition = {
    methods: ["get","head"],
    url: '/api/v1/customer/orders/{id}/tracking',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiOrderController::tracking
 * @see app/Http/Controllers/Api/ApiOrderController.php:271
 * @route '/api/v1/customer/orders/{id}/tracking'
 */
tracking36d2a1ced4db6948eafdcf9b275b9143.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return tracking36d2a1ced4db6948eafdcf9b275b9143.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiOrderController::tracking
 * @see app/Http/Controllers/Api/ApiOrderController.php:271
 * @route '/api/v1/customer/orders/{id}/tracking'
 */
tracking36d2a1ced4db6948eafdcf9b275b9143.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: tracking36d2a1ced4db6948eafdcf9b275b9143.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiOrderController::tracking
 * @see app/Http/Controllers/Api/ApiOrderController.php:271
 * @route '/api/v1/customer/orders/{id}/tracking'
 */
tracking36d2a1ced4db6948eafdcf9b275b9143.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: tracking36d2a1ced4db6948eafdcf9b275b9143.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiOrderController::tracking
 * @see app/Http/Controllers/Api/ApiOrderController.php:271
 * @route '/api/v1/customer/orders/{id}/tracking'
 */
    const tracking36d2a1ced4db6948eafdcf9b275b9143Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: tracking36d2a1ced4db6948eafdcf9b275b9143.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiOrderController::tracking
 * @see app/Http/Controllers/Api/ApiOrderController.php:271
 * @route '/api/v1/customer/orders/{id}/tracking'
 */
        tracking36d2a1ced4db6948eafdcf9b275b9143Form.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: tracking36d2a1ced4db6948eafdcf9b275b9143.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiOrderController::tracking
 * @see app/Http/Controllers/Api/ApiOrderController.php:271
 * @route '/api/v1/customer/orders/{id}/tracking'
 */
        tracking36d2a1ced4db6948eafdcf9b275b9143Form.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: tracking36d2a1ced4db6948eafdcf9b275b9143.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    tracking36d2a1ced4db6948eafdcf9b275b9143.form = tracking36d2a1ced4db6948eafdcf9b275b9143Form

export const tracking = {
    '/api/v1/orders/{id}/tracking': trackingac77c32e8816b05a8fd5a40ba6f25522,
    '/api/v1/customer/orders/{id}/tracking': tracking36d2a1ced4db6948eafdcf9b275b9143,
}

/**
* @see \App\Http\Controllers\Api\ApiOrderController::route
 * @see app/Http/Controllers/Api/ApiOrderController.php:432
 * @route '/api/v1/orders/{id}/route'
 */
const route3dc26aa79a154ff87d2636c69cb80753 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: route3dc26aa79a154ff87d2636c69cb80753.url(args, options),
    method: 'get',
})

route3dc26aa79a154ff87d2636c69cb80753.definition = {
    methods: ["get","head"],
    url: '/api/v1/orders/{id}/route',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiOrderController::route
 * @see app/Http/Controllers/Api/ApiOrderController.php:432
 * @route '/api/v1/orders/{id}/route'
 */
route3dc26aa79a154ff87d2636c69cb80753.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return route3dc26aa79a154ff87d2636c69cb80753.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiOrderController::route
 * @see app/Http/Controllers/Api/ApiOrderController.php:432
 * @route '/api/v1/orders/{id}/route'
 */
route3dc26aa79a154ff87d2636c69cb80753.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: route3dc26aa79a154ff87d2636c69cb80753.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiOrderController::route
 * @see app/Http/Controllers/Api/ApiOrderController.php:432
 * @route '/api/v1/orders/{id}/route'
 */
route3dc26aa79a154ff87d2636c69cb80753.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: route3dc26aa79a154ff87d2636c69cb80753.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiOrderController::route
 * @see app/Http/Controllers/Api/ApiOrderController.php:432
 * @route '/api/v1/orders/{id}/route'
 */
    const route3dc26aa79a154ff87d2636c69cb80753Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: route3dc26aa79a154ff87d2636c69cb80753.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiOrderController::route
 * @see app/Http/Controllers/Api/ApiOrderController.php:432
 * @route '/api/v1/orders/{id}/route'
 */
        route3dc26aa79a154ff87d2636c69cb80753Form.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: route3dc26aa79a154ff87d2636c69cb80753.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiOrderController::route
 * @see app/Http/Controllers/Api/ApiOrderController.php:432
 * @route '/api/v1/orders/{id}/route'
 */
        route3dc26aa79a154ff87d2636c69cb80753Form.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: route3dc26aa79a154ff87d2636c69cb80753.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    route3dc26aa79a154ff87d2636c69cb80753.form = route3dc26aa79a154ff87d2636c69cb80753Form
    /**
* @see \App\Http\Controllers\Api\ApiOrderController::route
 * @see app/Http/Controllers/Api/ApiOrderController.php:432
 * @route '/api/v1/customer/orders/{id}/route'
 */
const route862b0e1503de6ccf0b3992b4833c4ffd = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: route862b0e1503de6ccf0b3992b4833c4ffd.url(args, options),
    method: 'get',
})

route862b0e1503de6ccf0b3992b4833c4ffd.definition = {
    methods: ["get","head"],
    url: '/api/v1/customer/orders/{id}/route',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiOrderController::route
 * @see app/Http/Controllers/Api/ApiOrderController.php:432
 * @route '/api/v1/customer/orders/{id}/route'
 */
route862b0e1503de6ccf0b3992b4833c4ffd.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return route862b0e1503de6ccf0b3992b4833c4ffd.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiOrderController::route
 * @see app/Http/Controllers/Api/ApiOrderController.php:432
 * @route '/api/v1/customer/orders/{id}/route'
 */
route862b0e1503de6ccf0b3992b4833c4ffd.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: route862b0e1503de6ccf0b3992b4833c4ffd.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiOrderController::route
 * @see app/Http/Controllers/Api/ApiOrderController.php:432
 * @route '/api/v1/customer/orders/{id}/route'
 */
route862b0e1503de6ccf0b3992b4833c4ffd.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: route862b0e1503de6ccf0b3992b4833c4ffd.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiOrderController::route
 * @see app/Http/Controllers/Api/ApiOrderController.php:432
 * @route '/api/v1/customer/orders/{id}/route'
 */
    const route862b0e1503de6ccf0b3992b4833c4ffdForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: route862b0e1503de6ccf0b3992b4833c4ffd.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiOrderController::route
 * @see app/Http/Controllers/Api/ApiOrderController.php:432
 * @route '/api/v1/customer/orders/{id}/route'
 */
        route862b0e1503de6ccf0b3992b4833c4ffdForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: route862b0e1503de6ccf0b3992b4833c4ffd.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiOrderController::route
 * @see app/Http/Controllers/Api/ApiOrderController.php:432
 * @route '/api/v1/customer/orders/{id}/route'
 */
        route862b0e1503de6ccf0b3992b4833c4ffdForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: route862b0e1503de6ccf0b3992b4833c4ffd.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    route862b0e1503de6ccf0b3992b4833c4ffd.form = route862b0e1503de6ccf0b3992b4833c4ffdForm

export const route = {
    '/api/v1/orders/{id}/route': route3dc26aa79a154ff87d2636c69cb80753,
    '/api/v1/customer/orders/{id}/route': route862b0e1503de6ccf0b3992b4833c4ffd,
}

const ApiOrderController = { index, store, show, tracking, route }

export default ApiOrderController