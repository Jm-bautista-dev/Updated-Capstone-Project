import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:28
 * @route '/deliveries'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/deliveries',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:28
 * @route '/deliveries'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:28
 * @route '/deliveries'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:28
 * @route '/deliveries'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:28
 * @route '/deliveries'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:28
 * @route '/deliveries'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DeliveryController::index
 * @see app/Http/Controllers/Admin/DeliveryController.php:28
 * @route '/deliveries'
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
* @see \App\Http\Controllers\Admin\DeliveryController::liveRiders
 * @see app/Http/Controllers/Admin/DeliveryController.php:471
 * @route '/deliveries/live-riders'
 */
export const liveRiders = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: liveRiders.url(options),
    method: 'get',
})

liveRiders.definition = {
    methods: ["get","head"],
    url: '/deliveries/live-riders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::liveRiders
 * @see app/Http/Controllers/Admin/DeliveryController.php:471
 * @route '/deliveries/live-riders'
 */
liveRiders.url = (options?: RouteQueryOptions) => {
    return liveRiders.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::liveRiders
 * @see app/Http/Controllers/Admin/DeliveryController.php:471
 * @route '/deliveries/live-riders'
 */
liveRiders.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: liveRiders.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DeliveryController::liveRiders
 * @see app/Http/Controllers/Admin/DeliveryController.php:471
 * @route '/deliveries/live-riders'
 */
liveRiders.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: liveRiders.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::liveRiders
 * @see app/Http/Controllers/Admin/DeliveryController.php:471
 * @route '/deliveries/live-riders'
 */
    const liveRidersForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: liveRiders.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::liveRiders
 * @see app/Http/Controllers/Admin/DeliveryController.php:471
 * @route '/deliveries/live-riders'
 */
        liveRidersForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: liveRiders.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DeliveryController::liveRiders
 * @see app/Http/Controllers/Admin/DeliveryController.php:471
 * @route '/deliveries/live-riders'
 */
        liveRidersForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: liveRiders.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    liveRiders.form = liveRidersForm
/**
* @see \App\Http\Controllers\Admin\DeliveryController::route
 * @see app/Http/Controllers/Admin/DeliveryController.php:589
 * @route '/deliveries/{delivery}/route'
 */
export const route = (args: { delivery: string | number } | [delivery: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: route.url(args, options),
    method: 'get',
})

route.definition = {
    methods: ["get","head"],
    url: '/deliveries/{delivery}/route',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::route
 * @see app/Http/Controllers/Admin/DeliveryController.php:589
 * @route '/deliveries/{delivery}/route'
 */
route.url = (args: { delivery: string | number } | [delivery: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { delivery: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    delivery: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        delivery: args.delivery,
                }

    return route.definition.url
            .replace('{delivery}', parsedArgs.delivery.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::route
 * @see app/Http/Controllers/Admin/DeliveryController.php:589
 * @route '/deliveries/{delivery}/route'
 */
route.get = (args: { delivery: string | number } | [delivery: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: route.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DeliveryController::route
 * @see app/Http/Controllers/Admin/DeliveryController.php:589
 * @route '/deliveries/{delivery}/route'
 */
route.head = (args: { delivery: string | number } | [delivery: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: route.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::route
 * @see app/Http/Controllers/Admin/DeliveryController.php:589
 * @route '/deliveries/{delivery}/route'
 */
    const routeForm = (args: { delivery: string | number } | [delivery: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: route.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::route
 * @see app/Http/Controllers/Admin/DeliveryController.php:589
 * @route '/deliveries/{delivery}/route'
 */
        routeForm.get = (args: { delivery: string | number } | [delivery: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: route.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DeliveryController::route
 * @see app/Http/Controllers/Admin/DeliveryController.php:589
 * @route '/deliveries/{delivery}/route'
 */
        routeForm.head = (args: { delivery: string | number } | [delivery: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: route.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    route.form = routeForm
/**
* @see \App\Http\Controllers\Admin\DeliveryController::store
 * @see app/Http/Controllers/Admin/DeliveryController.php:337
 * @route '/deliveries'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/deliveries',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::store
 * @see app/Http/Controllers/Admin/DeliveryController.php:337
 * @route '/deliveries'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::store
 * @see app/Http/Controllers/Admin/DeliveryController.php:337
 * @route '/deliveries'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::store
 * @see app/Http/Controllers/Admin/DeliveryController.php:337
 * @route '/deliveries'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::store
 * @see app/Http/Controllers/Admin/DeliveryController.php:337
 * @route '/deliveries'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\DeliveryController::updateStatus
 * @see app/Http/Controllers/Admin/DeliveryController.php:347
 * @route '/deliveries/{delivery}/status'
 */
export const updateStatus = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateStatus.url(args, options),
    method: 'put',
})

updateStatus.definition = {
    methods: ["put"],
    url: '/deliveries/{delivery}/status',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::updateStatus
 * @see app/Http/Controllers/Admin/DeliveryController.php:347
 * @route '/deliveries/{delivery}/status'
 */
updateStatus.url = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { delivery: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { delivery: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    delivery: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        delivery: typeof args.delivery === 'object'
                ? args.delivery.id
                : args.delivery,
                }

    return updateStatus.definition.url
            .replace('{delivery}', parsedArgs.delivery.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::updateStatus
 * @see app/Http/Controllers/Admin/DeliveryController.php:347
 * @route '/deliveries/{delivery}/status'
 */
updateStatus.put = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateStatus.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::updateStatus
 * @see app/Http/Controllers/Admin/DeliveryController.php:347
 * @route '/deliveries/{delivery}/status'
 */
    const updateStatusForm = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::updateStatus
 * @see app/Http/Controllers/Admin/DeliveryController.php:347
 * @route '/deliveries/{delivery}/status'
 */
        updateStatusForm.put = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\DeliveryController::cancel
 * @see app/Http/Controllers/Admin/DeliveryController.php:360
 * @route '/deliveries/{delivery}/cancel'
 */
export const cancel = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

cancel.definition = {
    methods: ["post"],
    url: '/deliveries/{delivery}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::cancel
 * @see app/Http/Controllers/Admin/DeliveryController.php:360
 * @route '/deliveries/{delivery}/cancel'
 */
cancel.url = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { delivery: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { delivery: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    delivery: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        delivery: typeof args.delivery === 'object'
                ? args.delivery.id
                : args.delivery,
                }

    return cancel.definition.url
            .replace('{delivery}', parsedArgs.delivery.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::cancel
 * @see app/Http/Controllers/Admin/DeliveryController.php:360
 * @route '/deliveries/{delivery}/cancel'
 */
cancel.post = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::cancel
 * @see app/Http/Controllers/Admin/DeliveryController.php:360
 * @route '/deliveries/{delivery}/cancel'
 */
    const cancelForm = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancel.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::cancel
 * @see app/Http/Controllers/Admin/DeliveryController.php:360
 * @route '/deliveries/{delivery}/cancel'
 */
        cancelForm.post = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancel.url(args, options),
            method: 'post',
        })
    
    cancel.form = cancelForm
/**
* @see \App\Http\Controllers\Admin\DeliveryController::fail
 * @see app/Http/Controllers/Admin/DeliveryController.php:408
 * @route '/deliveries/{delivery}/fail'
 */
export const fail = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: fail.url(args, options),
    method: 'post',
})

fail.definition = {
    methods: ["post"],
    url: '/deliveries/{delivery}/fail',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::fail
 * @see app/Http/Controllers/Admin/DeliveryController.php:408
 * @route '/deliveries/{delivery}/fail'
 */
fail.url = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { delivery: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { delivery: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    delivery: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        delivery: typeof args.delivery === 'object'
                ? args.delivery.id
                : args.delivery,
                }

    return fail.definition.url
            .replace('{delivery}', parsedArgs.delivery.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::fail
 * @see app/Http/Controllers/Admin/DeliveryController.php:408
 * @route '/deliveries/{delivery}/fail'
 */
fail.post = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: fail.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::fail
 * @see app/Http/Controllers/Admin/DeliveryController.php:408
 * @route '/deliveries/{delivery}/fail'
 */
    const failForm = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: fail.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::fail
 * @see app/Http/Controllers/Admin/DeliveryController.php:408
 * @route '/deliveries/{delivery}/fail'
 */
        failForm.post = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: fail.url(args, options),
            method: 'post',
        })
    
    fail.form = failForm
/**
* @see \App\Http\Controllers\Admin\DeliveryController::assignRider
 * @see app/Http/Controllers/Admin/DeliveryController.php:298
 * @route '/deliveries/{delivery}/assign-rider'
 */
export const assignRider = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: assignRider.url(args, options),
    method: 'post',
})

assignRider.definition = {
    methods: ["post"],
    url: '/deliveries/{delivery}/assign-rider',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::assignRider
 * @see app/Http/Controllers/Admin/DeliveryController.php:298
 * @route '/deliveries/{delivery}/assign-rider'
 */
assignRider.url = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { delivery: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { delivery: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    delivery: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        delivery: typeof args.delivery === 'object'
                ? args.delivery.id
                : args.delivery,
                }

    return assignRider.definition.url
            .replace('{delivery}', parsedArgs.delivery.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::assignRider
 * @see app/Http/Controllers/Admin/DeliveryController.php:298
 * @route '/deliveries/{delivery}/assign-rider'
 */
assignRider.post = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: assignRider.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::assignRider
 * @see app/Http/Controllers/Admin/DeliveryController.php:298
 * @route '/deliveries/{delivery}/assign-rider'
 */
    const assignRiderForm = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: assignRider.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::assignRider
 * @see app/Http/Controllers/Admin/DeliveryController.php:298
 * @route '/deliveries/{delivery}/assign-rider'
 */
        assignRiderForm.post = (args: { delivery: number | { id: number } } | [delivery: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: assignRider.url(args, options),
            method: 'post',
        })
    
    assignRider.form = assignRiderForm
/**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:440
 * @route '/deliveries/recommend'
 */
export const recommend = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: recommend.url(options),
    method: 'get',
})

recommend.definition = {
    methods: ["get","head"],
    url: '/deliveries/recommend',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:440
 * @route '/deliveries/recommend'
 */
recommend.url = (options?: RouteQueryOptions) => {
    return recommend.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:440
 * @route '/deliveries/recommend'
 */
recommend.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: recommend.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:440
 * @route '/deliveries/recommend'
 */
recommend.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: recommend.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:440
 * @route '/deliveries/recommend'
 */
    const recommendForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: recommend.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:440
 * @route '/deliveries/recommend'
 */
        recommendForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: recommend.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DeliveryController::recommend
 * @see app/Http/Controllers/Admin/DeliveryController.php:440
 * @route '/deliveries/recommend'
 */
        recommendForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: recommend.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    recommend.form = recommendForm
const deliveries = {
    index: Object.assign(index, index),
liveRiders: Object.assign(liveRiders, liveRiders),
route: Object.assign(route, route),
store: Object.assign(store, store),
updateStatus: Object.assign(updateStatus, updateStatus),
cancel: Object.assign(cancel, cancel),
fail: Object.assign(fail, fail),
assignRider: Object.assign(assignRider, assignRider),
recommend: Object.assign(recommend, recommend),
}

export default deliveries