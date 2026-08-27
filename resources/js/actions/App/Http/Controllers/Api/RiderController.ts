import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/ready'
 */
const getOrders7fe712691563ad3f6a56e541a98df314 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders7fe712691563ad3f6a56e541a98df314.url(options),
    method: 'get',
})

getOrders7fe712691563ad3f6a56e541a98df314.definition = {
    methods: ["get","head"],
    url: '/api/v1/orders/ready',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/ready'
 */
getOrders7fe712691563ad3f6a56e541a98df314.url = (options?: RouteQueryOptions) => {
    return getOrders7fe712691563ad3f6a56e541a98df314.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/ready'
 */
getOrders7fe712691563ad3f6a56e541a98df314.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders7fe712691563ad3f6a56e541a98df314.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/ready'
 */
getOrders7fe712691563ad3f6a56e541a98df314.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrders7fe712691563ad3f6a56e541a98df314.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/ready'
 */
    const getOrders7fe712691563ad3f6a56e541a98df314Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrders7fe712691563ad3f6a56e541a98df314.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/ready'
 */
        getOrders7fe712691563ad3f6a56e541a98df314Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders7fe712691563ad3f6a56e541a98df314.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/ready'
 */
        getOrders7fe712691563ad3f6a56e541a98df314Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders7fe712691563ad3f6a56e541a98df314.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrders7fe712691563ad3f6a56e541a98df314.form = getOrders7fe712691563ad3f6a56e541a98df314Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/rider/orders'
 */
const getOrders63efdf27fdafc269d7b74547117cc692 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders63efdf27fdafc269d7b74547117cc692.url(options),
    method: 'get',
})

getOrders63efdf27fdafc269d7b74547117cc692.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/rider/orders'
 */
getOrders63efdf27fdafc269d7b74547117cc692.url = (options?: RouteQueryOptions) => {
    return getOrders63efdf27fdafc269d7b74547117cc692.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/rider/orders'
 */
getOrders63efdf27fdafc269d7b74547117cc692.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders63efdf27fdafc269d7b74547117cc692.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/rider/orders'
 */
getOrders63efdf27fdafc269d7b74547117cc692.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrders63efdf27fdafc269d7b74547117cc692.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/rider/orders'
 */
    const getOrders63efdf27fdafc269d7b74547117cc692Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrders63efdf27fdafc269d7b74547117cc692.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/rider/orders'
 */
        getOrders63efdf27fdafc269d7b74547117cc692Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders63efdf27fdafc269d7b74547117cc692.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/rider/orders'
 */
        getOrders63efdf27fdafc269d7b74547117cc692Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders63efdf27fdafc269d7b74547117cc692.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrders63efdf27fdafc269d7b74547117cc692.form = getOrders63efdf27fdafc269d7b74547117cc692Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/pickup'
 */
const getOrders6d0e63ac1b5751df71706ee6d5b18d11 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders6d0e63ac1b5751df71706ee6d5b18d11.url(options),
    method: 'get',
})

getOrders6d0e63ac1b5751df71706ee6d5b18d11.definition = {
    methods: ["get","head"],
    url: '/api/v1/orders/pickup',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/pickup'
 */
getOrders6d0e63ac1b5751df71706ee6d5b18d11.url = (options?: RouteQueryOptions) => {
    return getOrders6d0e63ac1b5751df71706ee6d5b18d11.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/pickup'
 */
getOrders6d0e63ac1b5751df71706ee6d5b18d11.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders6d0e63ac1b5751df71706ee6d5b18d11.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/pickup'
 */
getOrders6d0e63ac1b5751df71706ee6d5b18d11.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrders6d0e63ac1b5751df71706ee6d5b18d11.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/pickup'
 */
    const getOrders6d0e63ac1b5751df71706ee6d5b18d11Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrders6d0e63ac1b5751df71706ee6d5b18d11.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/pickup'
 */
        getOrders6d0e63ac1b5751df71706ee6d5b18d11Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders6d0e63ac1b5751df71706ee6d5b18d11.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/pickup'
 */
        getOrders6d0e63ac1b5751df71706ee6d5b18d11Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders6d0e63ac1b5751df71706ee6d5b18d11.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrders6d0e63ac1b5751df71706ee6d5b18d11.form = getOrders6d0e63ac1b5751df71706ee6d5b18d11Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/pending'
 */
const getOrdersdf5054f2a922e57426593b769a4b4ae5 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrdersdf5054f2a922e57426593b769a4b4ae5.url(options),
    method: 'get',
})

getOrdersdf5054f2a922e57426593b769a4b4ae5.definition = {
    methods: ["get","head"],
    url: '/api/v1/orders/pending',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/pending'
 */
getOrdersdf5054f2a922e57426593b769a4b4ae5.url = (options?: RouteQueryOptions) => {
    return getOrdersdf5054f2a922e57426593b769a4b4ae5.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/pending'
 */
getOrdersdf5054f2a922e57426593b769a4b4ae5.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrdersdf5054f2a922e57426593b769a4b4ae5.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/pending'
 */
getOrdersdf5054f2a922e57426593b769a4b4ae5.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrdersdf5054f2a922e57426593b769a4b4ae5.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/pending'
 */
    const getOrdersdf5054f2a922e57426593b769a4b4ae5Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrdersdf5054f2a922e57426593b769a4b4ae5.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/pending'
 */
        getOrdersdf5054f2a922e57426593b769a4b4ae5Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrdersdf5054f2a922e57426593b769a4b4ae5.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/v1/orders/pending'
 */
        getOrdersdf5054f2a922e57426593b769a4b4ae5Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrdersdf5054f2a922e57426593b769a4b4ae5.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrdersdf5054f2a922e57426593b769a4b4ae5.form = getOrdersdf5054f2a922e57426593b769a4b4ae5Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/rider/orders'
 */
const getOrdersdc8b9ffdca731c7c1f660bed57e883fe = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url(options),
    method: 'get',
})

getOrdersdc8b9ffdca731c7c1f660bed57e883fe.definition = {
    methods: ["get","head"],
    url: '/api/rider/orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/rider/orders'
 */
getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url = (options?: RouteQueryOptions) => {
    return getOrdersdc8b9ffdca731c7c1f660bed57e883fe.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/rider/orders'
 */
getOrdersdc8b9ffdca731c7c1f660bed57e883fe.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/rider/orders'
 */
getOrdersdc8b9ffdca731c7c1f660bed57e883fe.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/rider/orders'
 */
    const getOrdersdc8b9ffdca731c7c1f660bed57e883feForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/rider/orders'
 */
        getOrdersdc8b9ffdca731c7c1f660bed57e883feForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/rider/orders'
 */
        getOrdersdc8b9ffdca731c7c1f660bed57e883feForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrdersdc8b9ffdca731c7c1f660bed57e883fe.form = getOrdersdc8b9ffdca731c7c1f660bed57e883feForm
    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/ready'
 */
const getOrders82af8074d32c0099762ec554cdd09da3 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders82af8074d32c0099762ec554cdd09da3.url(options),
    method: 'get',
})

getOrders82af8074d32c0099762ec554cdd09da3.definition = {
    methods: ["get","head"],
    url: '/api/orders/ready',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/ready'
 */
getOrders82af8074d32c0099762ec554cdd09da3.url = (options?: RouteQueryOptions) => {
    return getOrders82af8074d32c0099762ec554cdd09da3.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/ready'
 */
getOrders82af8074d32c0099762ec554cdd09da3.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders82af8074d32c0099762ec554cdd09da3.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/ready'
 */
getOrders82af8074d32c0099762ec554cdd09da3.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrders82af8074d32c0099762ec554cdd09da3.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/ready'
 */
    const getOrders82af8074d32c0099762ec554cdd09da3Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrders82af8074d32c0099762ec554cdd09da3.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/ready'
 */
        getOrders82af8074d32c0099762ec554cdd09da3Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders82af8074d32c0099762ec554cdd09da3.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/ready'
 */
        getOrders82af8074d32c0099762ec554cdd09da3Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders82af8074d32c0099762ec554cdd09da3.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrders82af8074d32c0099762ec554cdd09da3.form = getOrders82af8074d32c0099762ec554cdd09da3Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/pickup'
 */
const getOrders90af3be51f5f73850465438b8ffc54a0 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders90af3be51f5f73850465438b8ffc54a0.url(options),
    method: 'get',
})

getOrders90af3be51f5f73850465438b8ffc54a0.definition = {
    methods: ["get","head"],
    url: '/api/orders/pickup',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/pickup'
 */
getOrders90af3be51f5f73850465438b8ffc54a0.url = (options?: RouteQueryOptions) => {
    return getOrders90af3be51f5f73850465438b8ffc54a0.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/pickup'
 */
getOrders90af3be51f5f73850465438b8ffc54a0.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders90af3be51f5f73850465438b8ffc54a0.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/pickup'
 */
getOrders90af3be51f5f73850465438b8ffc54a0.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrders90af3be51f5f73850465438b8ffc54a0.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/pickup'
 */
    const getOrders90af3be51f5f73850465438b8ffc54a0Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrders90af3be51f5f73850465438b8ffc54a0.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/pickup'
 */
        getOrders90af3be51f5f73850465438b8ffc54a0Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders90af3be51f5f73850465438b8ffc54a0.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/pickup'
 */
        getOrders90af3be51f5f73850465438b8ffc54a0Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders90af3be51f5f73850465438b8ffc54a0.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrders90af3be51f5f73850465438b8ffc54a0.form = getOrders90af3be51f5f73850465438b8ffc54a0Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/pending'
 */
const getOrders2d95e695e6c381393da6902c0f00bc25 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders2d95e695e6c381393da6902c0f00bc25.url(options),
    method: 'get',
})

getOrders2d95e695e6c381393da6902c0f00bc25.definition = {
    methods: ["get","head"],
    url: '/api/orders/pending',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/pending'
 */
getOrders2d95e695e6c381393da6902c0f00bc25.url = (options?: RouteQueryOptions) => {
    return getOrders2d95e695e6c381393da6902c0f00bc25.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/pending'
 */
getOrders2d95e695e6c381393da6902c0f00bc25.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders2d95e695e6c381393da6902c0f00bc25.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/pending'
 */
getOrders2d95e695e6c381393da6902c0f00bc25.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrders2d95e695e6c381393da6902c0f00bc25.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/pending'
 */
    const getOrders2d95e695e6c381393da6902c0f00bc25Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrders2d95e695e6c381393da6902c0f00bc25.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/pending'
 */
        getOrders2d95e695e6c381393da6902c0f00bc25Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders2d95e695e6c381393da6902c0f00bc25.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/api/orders/pending'
 */
        getOrders2d95e695e6c381393da6902c0f00bc25Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders2d95e695e6c381393da6902c0f00bc25.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrders2d95e695e6c381393da6902c0f00bc25.form = getOrders2d95e695e6c381393da6902c0f00bc25Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/ready'
 */
const getOrdersc3b080492b36ead4bd0c1f307c0f7149 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrdersc3b080492b36ead4bd0c1f307c0f7149.url(options),
    method: 'get',
})

getOrdersc3b080492b36ead4bd0c1f307c0f7149.definition = {
    methods: ["get","head"],
    url: '/orders/ready',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/ready'
 */
getOrdersc3b080492b36ead4bd0c1f307c0f7149.url = (options?: RouteQueryOptions) => {
    return getOrdersc3b080492b36ead4bd0c1f307c0f7149.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/ready'
 */
getOrdersc3b080492b36ead4bd0c1f307c0f7149.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrdersc3b080492b36ead4bd0c1f307c0f7149.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/ready'
 */
getOrdersc3b080492b36ead4bd0c1f307c0f7149.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrdersc3b080492b36ead4bd0c1f307c0f7149.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/ready'
 */
    const getOrdersc3b080492b36ead4bd0c1f307c0f7149Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrdersc3b080492b36ead4bd0c1f307c0f7149.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/ready'
 */
        getOrdersc3b080492b36ead4bd0c1f307c0f7149Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrdersc3b080492b36ead4bd0c1f307c0f7149.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/ready'
 */
        getOrdersc3b080492b36ead4bd0c1f307c0f7149Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrdersc3b080492b36ead4bd0c1f307c0f7149.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrdersc3b080492b36ead4bd0c1f307c0f7149.form = getOrdersc3b080492b36ead4bd0c1f307c0f7149Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/pickup'
 */
const getOrders3c012a52eb40b2d3644b9e9aa61d4104 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders3c012a52eb40b2d3644b9e9aa61d4104.url(options),
    method: 'get',
})

getOrders3c012a52eb40b2d3644b9e9aa61d4104.definition = {
    methods: ["get","head"],
    url: '/orders/pickup',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/pickup'
 */
getOrders3c012a52eb40b2d3644b9e9aa61d4104.url = (options?: RouteQueryOptions) => {
    return getOrders3c012a52eb40b2d3644b9e9aa61d4104.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/pickup'
 */
getOrders3c012a52eb40b2d3644b9e9aa61d4104.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders3c012a52eb40b2d3644b9e9aa61d4104.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/pickup'
 */
getOrders3c012a52eb40b2d3644b9e9aa61d4104.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrders3c012a52eb40b2d3644b9e9aa61d4104.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/pickup'
 */
    const getOrders3c012a52eb40b2d3644b9e9aa61d4104Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrders3c012a52eb40b2d3644b9e9aa61d4104.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/pickup'
 */
        getOrders3c012a52eb40b2d3644b9e9aa61d4104Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders3c012a52eb40b2d3644b9e9aa61d4104.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/pickup'
 */
        getOrders3c012a52eb40b2d3644b9e9aa61d4104Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders3c012a52eb40b2d3644b9e9aa61d4104.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrders3c012a52eb40b2d3644b9e9aa61d4104.form = getOrders3c012a52eb40b2d3644b9e9aa61d4104Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/pending'
 */
const getOrders00c1d59089b3ef47d0424b1d1ce86299 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders00c1d59089b3ef47d0424b1d1ce86299.url(options),
    method: 'get',
})

getOrders00c1d59089b3ef47d0424b1d1ce86299.definition = {
    methods: ["get","head"],
    url: '/orders/pending',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/pending'
 */
getOrders00c1d59089b3ef47d0424b1d1ce86299.url = (options?: RouteQueryOptions) => {
    return getOrders00c1d59089b3ef47d0424b1d1ce86299.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/pending'
 */
getOrders00c1d59089b3ef47d0424b1d1ce86299.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders00c1d59089b3ef47d0424b1d1ce86299.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/pending'
 */
getOrders00c1d59089b3ef47d0424b1d1ce86299.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrders00c1d59089b3ef47d0424b1d1ce86299.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/pending'
 */
    const getOrders00c1d59089b3ef47d0424b1d1ce86299Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrders00c1d59089b3ef47d0424b1d1ce86299.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/pending'
 */
        getOrders00c1d59089b3ef47d0424b1d1ce86299Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders00c1d59089b3ef47d0424b1d1ce86299.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/orders/pending'
 */
        getOrders00c1d59089b3ef47d0424b1d1ce86299Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders00c1d59089b3ef47d0424b1d1ce86299.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrders00c1d59089b3ef47d0424b1d1ce86299.form = getOrders00c1d59089b3ef47d0424b1d1ce86299Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/rider/orders'
 */
const getOrders838dd9d5f1d14b006ac82d8c366dfe7c = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders838dd9d5f1d14b006ac82d8c366dfe7c.url(options),
    method: 'get',
})

getOrders838dd9d5f1d14b006ac82d8c366dfe7c.definition = {
    methods: ["get","head"],
    url: '/rider/orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/rider/orders'
 */
getOrders838dd9d5f1d14b006ac82d8c366dfe7c.url = (options?: RouteQueryOptions) => {
    return getOrders838dd9d5f1d14b006ac82d8c366dfe7c.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/rider/orders'
 */
getOrders838dd9d5f1d14b006ac82d8c366dfe7c.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders838dd9d5f1d14b006ac82d8c366dfe7c.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/rider/orders'
 */
getOrders838dd9d5f1d14b006ac82d8c366dfe7c.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrders838dd9d5f1d14b006ac82d8c366dfe7c.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/rider/orders'
 */
    const getOrders838dd9d5f1d14b006ac82d8c366dfe7cForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrders838dd9d5f1d14b006ac82d8c366dfe7c.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/rider/orders'
 */
        getOrders838dd9d5f1d14b006ac82d8c366dfe7cForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders838dd9d5f1d14b006ac82d8c366dfe7c.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:75
 * @route '/rider/orders'
 */
        getOrders838dd9d5f1d14b006ac82d8c366dfe7cForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders838dd9d5f1d14b006ac82d8c366dfe7c.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrders838dd9d5f1d14b006ac82d8c366dfe7c.form = getOrders838dd9d5f1d14b006ac82d8c366dfe7cForm

export const getOrders = {
    '/api/v1/orders/ready': getOrders7fe712691563ad3f6a56e541a98df314,
    '/api/v1/rider/orders': getOrders63efdf27fdafc269d7b74547117cc692,
    '/api/v1/orders/pickup': getOrders6d0e63ac1b5751df71706ee6d5b18d11,
    '/api/v1/orders/pending': getOrdersdf5054f2a922e57426593b769a4b4ae5,
    '/api/rider/orders': getOrdersdc8b9ffdca731c7c1f660bed57e883fe,
    '/api/orders/ready': getOrders82af8074d32c0099762ec554cdd09da3,
    '/api/orders/pickup': getOrders90af3be51f5f73850465438b8ffc54a0,
    '/api/orders/pending': getOrders2d95e695e6c381393da6902c0f00bc25,
    '/orders/ready': getOrdersc3b080492b36ead4bd0c1f307c0f7149,
    '/orders/pickup': getOrders3c012a52eb40b2d3644b9e9aa61d4104,
    '/orders/pending': getOrders00c1d59089b3ef47d0424b1d1ce86299,
    '/rider/orders': getOrders838dd9d5f1d14b006ac82d8c366dfe7c,
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/my'
 */
const getMyOrders38f255a519c20d52dda38255008005b8 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders38f255a519c20d52dda38255008005b8.url(options),
    method: 'get',
})

getMyOrders38f255a519c20d52dda38255008005b8.definition = {
    methods: ["get","head"],
    url: '/api/v1/orders/my',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/my'
 */
getMyOrders38f255a519c20d52dda38255008005b8.url = (options?: RouteQueryOptions) => {
    return getMyOrders38f255a519c20d52dda38255008005b8.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/my'
 */
getMyOrders38f255a519c20d52dda38255008005b8.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders38f255a519c20d52dda38255008005b8.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/my'
 */
getMyOrders38f255a519c20d52dda38255008005b8.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders38f255a519c20d52dda38255008005b8.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/my'
 */
    const getMyOrders38f255a519c20d52dda38255008005b8Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders38f255a519c20d52dda38255008005b8.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/my'
 */
        getMyOrders38f255a519c20d52dda38255008005b8Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders38f255a519c20d52dda38255008005b8.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/my'
 */
        getMyOrders38f255a519c20d52dda38255008005b8Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders38f255a519c20d52dda38255008005b8.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders38f255a519c20d52dda38255008005b8.form = getMyOrders38f255a519c20d52dda38255008005b8Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/rider/my-orders'
 */
const getMyOrders91629b3f6dd1d6ca0b5603eec2097950 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
    method: 'get',
})

getMyOrders91629b3f6dd1d6ca0b5603eec2097950.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/my-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url = (options?: RouteQueryOptions) => {
    return getMyOrders91629b3f6dd1d6ca0b5603eec2097950.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders91629b3f6dd1d6ca0b5603eec2097950.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders91629b3f6dd1d6ca0b5603eec2097950.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/rider/my-orders'
 */
    const getMyOrders91629b3f6dd1d6ca0b5603eec2097950Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/rider/my-orders'
 */
        getMyOrders91629b3f6dd1d6ca0b5603eec2097950Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/rider/my-orders'
 */
        getMyOrders91629b3f6dd1d6ca0b5603eec2097950Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders91629b3f6dd1d6ca0b5603eec2097950.form = getMyOrders91629b3f6dd1d6ca0b5603eec2097950Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/assigned'
 */
const getMyOrders109e4323d9dbc7e3d5eb33ae0b8962da = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders109e4323d9dbc7e3d5eb33ae0b8962da.url(options),
    method: 'get',
})

getMyOrders109e4323d9dbc7e3d5eb33ae0b8962da.definition = {
    methods: ["get","head"],
    url: '/api/v1/orders/assigned',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/assigned'
 */
getMyOrders109e4323d9dbc7e3d5eb33ae0b8962da.url = (options?: RouteQueryOptions) => {
    return getMyOrders109e4323d9dbc7e3d5eb33ae0b8962da.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/assigned'
 */
getMyOrders109e4323d9dbc7e3d5eb33ae0b8962da.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders109e4323d9dbc7e3d5eb33ae0b8962da.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/assigned'
 */
getMyOrders109e4323d9dbc7e3d5eb33ae0b8962da.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders109e4323d9dbc7e3d5eb33ae0b8962da.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/assigned'
 */
    const getMyOrders109e4323d9dbc7e3d5eb33ae0b8962daForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders109e4323d9dbc7e3d5eb33ae0b8962da.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/assigned'
 */
        getMyOrders109e4323d9dbc7e3d5eb33ae0b8962daForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders109e4323d9dbc7e3d5eb33ae0b8962da.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/assigned'
 */
        getMyOrders109e4323d9dbc7e3d5eb33ae0b8962daForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders109e4323d9dbc7e3d5eb33ae0b8962da.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders109e4323d9dbc7e3d5eb33ae0b8962da.form = getMyOrders109e4323d9dbc7e3d5eb33ae0b8962daForm
    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/active'
 */
const getMyOrders1cc840f37fdfac1aa41f0ac38060e613 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders1cc840f37fdfac1aa41f0ac38060e613.url(options),
    method: 'get',
})

getMyOrders1cc840f37fdfac1aa41f0ac38060e613.definition = {
    methods: ["get","head"],
    url: '/api/v1/orders/active',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/active'
 */
getMyOrders1cc840f37fdfac1aa41f0ac38060e613.url = (options?: RouteQueryOptions) => {
    return getMyOrders1cc840f37fdfac1aa41f0ac38060e613.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/active'
 */
getMyOrders1cc840f37fdfac1aa41f0ac38060e613.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders1cc840f37fdfac1aa41f0ac38060e613.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/active'
 */
getMyOrders1cc840f37fdfac1aa41f0ac38060e613.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders1cc840f37fdfac1aa41f0ac38060e613.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/active'
 */
    const getMyOrders1cc840f37fdfac1aa41f0ac38060e613Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders1cc840f37fdfac1aa41f0ac38060e613.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/active'
 */
        getMyOrders1cc840f37fdfac1aa41f0ac38060e613Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders1cc840f37fdfac1aa41f0ac38060e613.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/v1/orders/active'
 */
        getMyOrders1cc840f37fdfac1aa41f0ac38060e613Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders1cc840f37fdfac1aa41f0ac38060e613.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders1cc840f37fdfac1aa41f0ac38060e613.form = getMyOrders1cc840f37fdfac1aa41f0ac38060e613Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/rider/my-orders'
 */
const getMyOrders055417c79b8f926941253898844fa820 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders055417c79b8f926941253898844fa820.url(options),
    method: 'get',
})

getMyOrders055417c79b8f926941253898844fa820.definition = {
    methods: ["get","head"],
    url: '/api/rider/my-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/rider/my-orders'
 */
getMyOrders055417c79b8f926941253898844fa820.url = (options?: RouteQueryOptions) => {
    return getMyOrders055417c79b8f926941253898844fa820.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/rider/my-orders'
 */
getMyOrders055417c79b8f926941253898844fa820.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders055417c79b8f926941253898844fa820.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/rider/my-orders'
 */
getMyOrders055417c79b8f926941253898844fa820.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders055417c79b8f926941253898844fa820.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/rider/my-orders'
 */
    const getMyOrders055417c79b8f926941253898844fa820Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders055417c79b8f926941253898844fa820.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/rider/my-orders'
 */
        getMyOrders055417c79b8f926941253898844fa820Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders055417c79b8f926941253898844fa820.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/rider/my-orders'
 */
        getMyOrders055417c79b8f926941253898844fa820Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders055417c79b8f926941253898844fa820.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders055417c79b8f926941253898844fa820.form = getMyOrders055417c79b8f926941253898844fa820Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/my'
 */
const getMyOrders2ffb28ed42350d20cdbe10226e71b3d8 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders2ffb28ed42350d20cdbe10226e71b3d8.url(options),
    method: 'get',
})

getMyOrders2ffb28ed42350d20cdbe10226e71b3d8.definition = {
    methods: ["get","head"],
    url: '/api/orders/my',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/my'
 */
getMyOrders2ffb28ed42350d20cdbe10226e71b3d8.url = (options?: RouteQueryOptions) => {
    return getMyOrders2ffb28ed42350d20cdbe10226e71b3d8.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/my'
 */
getMyOrders2ffb28ed42350d20cdbe10226e71b3d8.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders2ffb28ed42350d20cdbe10226e71b3d8.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/my'
 */
getMyOrders2ffb28ed42350d20cdbe10226e71b3d8.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders2ffb28ed42350d20cdbe10226e71b3d8.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/my'
 */
    const getMyOrders2ffb28ed42350d20cdbe10226e71b3d8Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders2ffb28ed42350d20cdbe10226e71b3d8.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/my'
 */
        getMyOrders2ffb28ed42350d20cdbe10226e71b3d8Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders2ffb28ed42350d20cdbe10226e71b3d8.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/my'
 */
        getMyOrders2ffb28ed42350d20cdbe10226e71b3d8Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders2ffb28ed42350d20cdbe10226e71b3d8.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders2ffb28ed42350d20cdbe10226e71b3d8.form = getMyOrders2ffb28ed42350d20cdbe10226e71b3d8Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/assigned'
 */
const getMyOrdersd7355eab1094e9c856c7be39e5503d13 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrdersd7355eab1094e9c856c7be39e5503d13.url(options),
    method: 'get',
})

getMyOrdersd7355eab1094e9c856c7be39e5503d13.definition = {
    methods: ["get","head"],
    url: '/api/orders/assigned',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/assigned'
 */
getMyOrdersd7355eab1094e9c856c7be39e5503d13.url = (options?: RouteQueryOptions) => {
    return getMyOrdersd7355eab1094e9c856c7be39e5503d13.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/assigned'
 */
getMyOrdersd7355eab1094e9c856c7be39e5503d13.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrdersd7355eab1094e9c856c7be39e5503d13.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/assigned'
 */
getMyOrdersd7355eab1094e9c856c7be39e5503d13.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrdersd7355eab1094e9c856c7be39e5503d13.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/assigned'
 */
    const getMyOrdersd7355eab1094e9c856c7be39e5503d13Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrdersd7355eab1094e9c856c7be39e5503d13.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/assigned'
 */
        getMyOrdersd7355eab1094e9c856c7be39e5503d13Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrdersd7355eab1094e9c856c7be39e5503d13.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/assigned'
 */
        getMyOrdersd7355eab1094e9c856c7be39e5503d13Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrdersd7355eab1094e9c856c7be39e5503d13.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrdersd7355eab1094e9c856c7be39e5503d13.form = getMyOrdersd7355eab1094e9c856c7be39e5503d13Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/active'
 */
const getMyOrders506a416d65f569a1b67f1155a75a8c45 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders506a416d65f569a1b67f1155a75a8c45.url(options),
    method: 'get',
})

getMyOrders506a416d65f569a1b67f1155a75a8c45.definition = {
    methods: ["get","head"],
    url: '/api/orders/active',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/active'
 */
getMyOrders506a416d65f569a1b67f1155a75a8c45.url = (options?: RouteQueryOptions) => {
    return getMyOrders506a416d65f569a1b67f1155a75a8c45.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/active'
 */
getMyOrders506a416d65f569a1b67f1155a75a8c45.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders506a416d65f569a1b67f1155a75a8c45.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/active'
 */
getMyOrders506a416d65f569a1b67f1155a75a8c45.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders506a416d65f569a1b67f1155a75a8c45.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/active'
 */
    const getMyOrders506a416d65f569a1b67f1155a75a8c45Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders506a416d65f569a1b67f1155a75a8c45.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/active'
 */
        getMyOrders506a416d65f569a1b67f1155a75a8c45Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders506a416d65f569a1b67f1155a75a8c45.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/api/orders/active'
 */
        getMyOrders506a416d65f569a1b67f1155a75a8c45Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders506a416d65f569a1b67f1155a75a8c45.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders506a416d65f569a1b67f1155a75a8c45.form = getMyOrders506a416d65f569a1b67f1155a75a8c45Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/my'
 */
const getMyOrders26352084d59c73e70b53119eb4485b66 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders26352084d59c73e70b53119eb4485b66.url(options),
    method: 'get',
})

getMyOrders26352084d59c73e70b53119eb4485b66.definition = {
    methods: ["get","head"],
    url: '/orders/my',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/my'
 */
getMyOrders26352084d59c73e70b53119eb4485b66.url = (options?: RouteQueryOptions) => {
    return getMyOrders26352084d59c73e70b53119eb4485b66.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/my'
 */
getMyOrders26352084d59c73e70b53119eb4485b66.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders26352084d59c73e70b53119eb4485b66.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/my'
 */
getMyOrders26352084d59c73e70b53119eb4485b66.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders26352084d59c73e70b53119eb4485b66.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/my'
 */
    const getMyOrders26352084d59c73e70b53119eb4485b66Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders26352084d59c73e70b53119eb4485b66.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/my'
 */
        getMyOrders26352084d59c73e70b53119eb4485b66Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders26352084d59c73e70b53119eb4485b66.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/my'
 */
        getMyOrders26352084d59c73e70b53119eb4485b66Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders26352084d59c73e70b53119eb4485b66.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders26352084d59c73e70b53119eb4485b66.form = getMyOrders26352084d59c73e70b53119eb4485b66Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/assigned'
 */
const getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706c = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706c.url(options),
    method: 'get',
})

getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706c.definition = {
    methods: ["get","head"],
    url: '/orders/assigned',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/assigned'
 */
getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706c.url = (options?: RouteQueryOptions) => {
    return getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706c.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/assigned'
 */
getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706c.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706c.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/assigned'
 */
getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706c.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706c.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/assigned'
 */
    const getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706cForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706c.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/assigned'
 */
        getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706cForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706c.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/assigned'
 */
        getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706cForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706c.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706c.form = getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706cForm
    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/active'
 */
const getMyOrders19430d03d11a2c4f0774fc0773654f98 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders19430d03d11a2c4f0774fc0773654f98.url(options),
    method: 'get',
})

getMyOrders19430d03d11a2c4f0774fc0773654f98.definition = {
    methods: ["get","head"],
    url: '/orders/active',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/active'
 */
getMyOrders19430d03d11a2c4f0774fc0773654f98.url = (options?: RouteQueryOptions) => {
    return getMyOrders19430d03d11a2c4f0774fc0773654f98.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/active'
 */
getMyOrders19430d03d11a2c4f0774fc0773654f98.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders19430d03d11a2c4f0774fc0773654f98.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/active'
 */
getMyOrders19430d03d11a2c4f0774fc0773654f98.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders19430d03d11a2c4f0774fc0773654f98.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/active'
 */
    const getMyOrders19430d03d11a2c4f0774fc0773654f98Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders19430d03d11a2c4f0774fc0773654f98.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/active'
 */
        getMyOrders19430d03d11a2c4f0774fc0773654f98Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders19430d03d11a2c4f0774fc0773654f98.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/orders/active'
 */
        getMyOrders19430d03d11a2c4f0774fc0773654f98Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders19430d03d11a2c4f0774fc0773654f98.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders19430d03d11a2c4f0774fc0773654f98.form = getMyOrders19430d03d11a2c4f0774fc0773654f98Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/rider/my-orders'
 */
const getMyOrders1a9d272c787582abb31b5b6cdbfc5366 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders1a9d272c787582abb31b5b6cdbfc5366.url(options),
    method: 'get',
})

getMyOrders1a9d272c787582abb31b5b6cdbfc5366.definition = {
    methods: ["get","head"],
    url: '/rider/my-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/rider/my-orders'
 */
getMyOrders1a9d272c787582abb31b5b6cdbfc5366.url = (options?: RouteQueryOptions) => {
    return getMyOrders1a9d272c787582abb31b5b6cdbfc5366.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/rider/my-orders'
 */
getMyOrders1a9d272c787582abb31b5b6cdbfc5366.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders1a9d272c787582abb31b5b6cdbfc5366.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/rider/my-orders'
 */
getMyOrders1a9d272c787582abb31b5b6cdbfc5366.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders1a9d272c787582abb31b5b6cdbfc5366.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/rider/my-orders'
 */
    const getMyOrders1a9d272c787582abb31b5b6cdbfc5366Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders1a9d272c787582abb31b5b6cdbfc5366.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/rider/my-orders'
 */
        getMyOrders1a9d272c787582abb31b5b6cdbfc5366Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders1a9d272c787582abb31b5b6cdbfc5366.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:153
 * @route '/rider/my-orders'
 */
        getMyOrders1a9d272c787582abb31b5b6cdbfc5366Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders1a9d272c787582abb31b5b6cdbfc5366.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders1a9d272c787582abb31b5b6cdbfc5366.form = getMyOrders1a9d272c787582abb31b5b6cdbfc5366Form

export const getMyOrders = {
    '/api/v1/orders/my': getMyOrders38f255a519c20d52dda38255008005b8,
    '/api/v1/rider/my-orders': getMyOrders91629b3f6dd1d6ca0b5603eec2097950,
    '/api/v1/orders/assigned': getMyOrders109e4323d9dbc7e3d5eb33ae0b8962da,
    '/api/v1/orders/active': getMyOrders1cc840f37fdfac1aa41f0ac38060e613,
    '/api/rider/my-orders': getMyOrders055417c79b8f926941253898844fa820,
    '/api/orders/my': getMyOrders2ffb28ed42350d20cdbe10226e71b3d8,
    '/api/orders/assigned': getMyOrdersd7355eab1094e9c856c7be39e5503d13,
    '/api/orders/active': getMyOrders506a416d65f569a1b67f1155a75a8c45,
    '/orders/my': getMyOrders26352084d59c73e70b53119eb4485b66,
    '/orders/assigned': getMyOrders66c4f4bb30eb9b68d20fc8fd5a45706c,
    '/orders/active': getMyOrders19430d03d11a2c4f0774fc0773654f98,
    '/rider/my-orders': getMyOrders1a9d272c787582abb31b5b6cdbfc5366,
}

/**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:43
 * @route '/api/v1/rider/change-password'
 */
const changePasswordd664abf82b4e52501df3815d357f497e = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: changePasswordd664abf82b4e52501df3815d357f497e.url(options),
    method: 'post',
})

changePasswordd664abf82b4e52501df3815d357f497e.definition = {
    methods: ["post"],
    url: '/api/v1/rider/change-password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:43
 * @route '/api/v1/rider/change-password'
 */
changePasswordd664abf82b4e52501df3815d357f497e.url = (options?: RouteQueryOptions) => {
    return changePasswordd664abf82b4e52501df3815d357f497e.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:43
 * @route '/api/v1/rider/change-password'
 */
changePasswordd664abf82b4e52501df3815d357f497e.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: changePasswordd664abf82b4e52501df3815d357f497e.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:43
 * @route '/api/v1/rider/change-password'
 */
    const changePasswordd664abf82b4e52501df3815d357f497eForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: changePasswordd664abf82b4e52501df3815d357f497e.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:43
 * @route '/api/v1/rider/change-password'
 */
        changePasswordd664abf82b4e52501df3815d357f497eForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: changePasswordd664abf82b4e52501df3815d357f497e.url(options),
            method: 'post',
        })
    
    changePasswordd664abf82b4e52501df3815d357f497e.form = changePasswordd664abf82b4e52501df3815d357f497eForm
    /**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:43
 * @route '/api/rider/change-password'
 */
const changePassword22e3d18a20d4abd9ed81726c917d0390 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: changePassword22e3d18a20d4abd9ed81726c917d0390.url(options),
    method: 'post',
})

changePassword22e3d18a20d4abd9ed81726c917d0390.definition = {
    methods: ["post"],
    url: '/api/rider/change-password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:43
 * @route '/api/rider/change-password'
 */
changePassword22e3d18a20d4abd9ed81726c917d0390.url = (options?: RouteQueryOptions) => {
    return changePassword22e3d18a20d4abd9ed81726c917d0390.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:43
 * @route '/api/rider/change-password'
 */
changePassword22e3d18a20d4abd9ed81726c917d0390.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: changePassword22e3d18a20d4abd9ed81726c917d0390.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:43
 * @route '/api/rider/change-password'
 */
    const changePassword22e3d18a20d4abd9ed81726c917d0390Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: changePassword22e3d18a20d4abd9ed81726c917d0390.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:43
 * @route '/api/rider/change-password'
 */
        changePassword22e3d18a20d4abd9ed81726c917d0390Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: changePassword22e3d18a20d4abd9ed81726c917d0390.url(options),
            method: 'post',
        })
    
    changePassword22e3d18a20d4abd9ed81726c917d0390.form = changePassword22e3d18a20d4abd9ed81726c917d0390Form

export const changePassword = {
    '/api/v1/rider/change-password': changePasswordd664abf82b4e52501df3815d357f497e,
    '/api/rider/change-password': changePassword22e3d18a20d4abd9ed81726c917d0390,
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/api/v1/rider/status'
 */
const updateStatusb250b8d54533bfaaf6c4fcf102ae8d86 = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url(options),
    method: 'patch',
})

updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.definition = {
    methods: ["patch","put","post"],
    url: '/api/v1/rider/status',
} satisfies RouteDefinition<["patch","put","post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/api/v1/rider/status'
 */
updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url = (options?: RouteQueryOptions) => {
    return updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/api/v1/rider/status'
 */
updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url(options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/api/v1/rider/status'
 */
updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url(options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/api/v1/rider/status'
 */
updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/api/v1/rider/status'
 */
    const updateStatusb250b8d54533bfaaf6c4fcf102ae8d86Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/api/v1/rider/status'
 */
        updateStatusb250b8d54533bfaaf6c4fcf102ae8d86Form.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/api/v1/rider/status'
 */
        updateStatusb250b8d54533bfaaf6c4fcf102ae8d86Form.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/api/v1/rider/status'
 */
        updateStatusb250b8d54533bfaaf6c4fcf102ae8d86Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url(options),
            method: 'post',
        })
    
    updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.form = updateStatusb250b8d54533bfaaf6c4fcf102ae8d86Form
    /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/api/rider/status'
 */
const updateStatus3b94d099329ad87ff350831df94a1c27 = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatus3b94d099329ad87ff350831df94a1c27.url(options),
    method: 'patch',
})

updateStatus3b94d099329ad87ff350831df94a1c27.definition = {
    methods: ["patch"],
    url: '/api/rider/status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/api/rider/status'
 */
updateStatus3b94d099329ad87ff350831df94a1c27.url = (options?: RouteQueryOptions) => {
    return updateStatus3b94d099329ad87ff350831df94a1c27.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/api/rider/status'
 */
updateStatus3b94d099329ad87ff350831df94a1c27.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatus3b94d099329ad87ff350831df94a1c27.url(options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/api/rider/status'
 */
    const updateStatus3b94d099329ad87ff350831df94a1c27Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateStatus3b94d099329ad87ff350831df94a1c27.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/api/rider/status'
 */
        updateStatus3b94d099329ad87ff350831df94a1c27Form.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateStatus3b94d099329ad87ff350831df94a1c27.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateStatus3b94d099329ad87ff350831df94a1c27.form = updateStatus3b94d099329ad87ff350831df94a1c27Form
    /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/rider/status'
 */
const updateStatuse2d681eae558d4a5bfd7f2789eccd864 = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatuse2d681eae558d4a5bfd7f2789eccd864.url(options),
    method: 'patch',
})

updateStatuse2d681eae558d4a5bfd7f2789eccd864.definition = {
    methods: ["patch"],
    url: '/rider/status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/rider/status'
 */
updateStatuse2d681eae558d4a5bfd7f2789eccd864.url = (options?: RouteQueryOptions) => {
    return updateStatuse2d681eae558d4a5bfd7f2789eccd864.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/rider/status'
 */
updateStatuse2d681eae558d4a5bfd7f2789eccd864.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatuse2d681eae558d4a5bfd7f2789eccd864.url(options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/rider/status'
 */
    const updateStatuse2d681eae558d4a5bfd7f2789eccd864Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateStatuse2d681eae558d4a5bfd7f2789eccd864.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:910
 * @route '/rider/status'
 */
        updateStatuse2d681eae558d4a5bfd7f2789eccd864Form.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateStatuse2d681eae558d4a5bfd7f2789eccd864.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateStatuse2d681eae558d4a5bfd7f2789eccd864.form = updateStatuse2d681eae558d4a5bfd7f2789eccd864Form

export const updateStatus = {
    '/api/v1/rider/status': updateStatusb250b8d54533bfaaf6c4fcf102ae8d86,
    '/api/rider/status': updateStatus3b94d099329ad87ff350831df94a1c27,
    '/rider/status': updateStatuse2d681eae558d4a5bfd7f2789eccd864,
}

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:1094
 * @route '/api/v1/rider/ping'
 */
const ping0d82d1f20b0ecfb6c97d8d26ab824f79 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ping0d82d1f20b0ecfb6c97d8d26ab824f79.url(options),
    method: 'post',
})

ping0d82d1f20b0ecfb6c97d8d26ab824f79.definition = {
    methods: ["post"],
    url: '/api/v1/rider/ping',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:1094
 * @route '/api/v1/rider/ping'
 */
ping0d82d1f20b0ecfb6c97d8d26ab824f79.url = (options?: RouteQueryOptions) => {
    return ping0d82d1f20b0ecfb6c97d8d26ab824f79.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:1094
 * @route '/api/v1/rider/ping'
 */
ping0d82d1f20b0ecfb6c97d8d26ab824f79.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ping0d82d1f20b0ecfb6c97d8d26ab824f79.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:1094
 * @route '/api/v1/rider/ping'
 */
    const ping0d82d1f20b0ecfb6c97d8d26ab824f79Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: ping0d82d1f20b0ecfb6c97d8d26ab824f79.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:1094
 * @route '/api/v1/rider/ping'
 */
        ping0d82d1f20b0ecfb6c97d8d26ab824f79Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: ping0d82d1f20b0ecfb6c97d8d26ab824f79.url(options),
            method: 'post',
        })
    
    ping0d82d1f20b0ecfb6c97d8d26ab824f79.form = ping0d82d1f20b0ecfb6c97d8d26ab824f79Form
    /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:1094
 * @route '/api/rider/ping'
 */
const ping031fd5af02d93de1361ef37f3653ad91 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ping031fd5af02d93de1361ef37f3653ad91.url(options),
    method: 'post',
})

ping031fd5af02d93de1361ef37f3653ad91.definition = {
    methods: ["post"],
    url: '/api/rider/ping',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:1094
 * @route '/api/rider/ping'
 */
ping031fd5af02d93de1361ef37f3653ad91.url = (options?: RouteQueryOptions) => {
    return ping031fd5af02d93de1361ef37f3653ad91.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:1094
 * @route '/api/rider/ping'
 */
ping031fd5af02d93de1361ef37f3653ad91.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ping031fd5af02d93de1361ef37f3653ad91.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:1094
 * @route '/api/rider/ping'
 */
    const ping031fd5af02d93de1361ef37f3653ad91Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: ping031fd5af02d93de1361ef37f3653ad91.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:1094
 * @route '/api/rider/ping'
 */
        ping031fd5af02d93de1361ef37f3653ad91Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: ping031fd5af02d93de1361ef37f3653ad91.url(options),
            method: 'post',
        })
    
    ping031fd5af02d93de1361ef37f3653ad91.form = ping031fd5af02d93de1361ef37f3653ad91Form

export const ping = {
    '/api/v1/rider/ping': ping0d82d1f20b0ecfb6c97d8d26ab824f79,
    '/api/rider/ping': ping031fd5af02d93de1361ef37f3653ad91,
}

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/api/v1/rider/stats'
 */
const getStatsb4b7a936b4dbf8c412ae7f146e59c3c6 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url(options),
    method: 'get',
})

getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/stats',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/api/v1/rider/stats'
 */
getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url = (options?: RouteQueryOptions) => {
    return getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/api/v1/rider/stats'
 */
getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/api/v1/rider/stats'
 */
getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/api/v1/rider/stats'
 */
    const getStatsb4b7a936b4dbf8c412ae7f146e59c3c6Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/api/v1/rider/stats'
 */
        getStatsb4b7a936b4dbf8c412ae7f146e59c3c6Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/api/v1/rider/stats'
 */
        getStatsb4b7a936b4dbf8c412ae7f146e59c3c6Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.form = getStatsb4b7a936b4dbf8c412ae7f146e59c3c6Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/api/rider/stats'
 */
const getStats7c3d39de8ff6ff150c545ad605884ca4 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStats7c3d39de8ff6ff150c545ad605884ca4.url(options),
    method: 'get',
})

getStats7c3d39de8ff6ff150c545ad605884ca4.definition = {
    methods: ["get","head"],
    url: '/api/rider/stats',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/api/rider/stats'
 */
getStats7c3d39de8ff6ff150c545ad605884ca4.url = (options?: RouteQueryOptions) => {
    return getStats7c3d39de8ff6ff150c545ad605884ca4.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/api/rider/stats'
 */
getStats7c3d39de8ff6ff150c545ad605884ca4.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStats7c3d39de8ff6ff150c545ad605884ca4.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/api/rider/stats'
 */
getStats7c3d39de8ff6ff150c545ad605884ca4.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStats7c3d39de8ff6ff150c545ad605884ca4.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/api/rider/stats'
 */
    const getStats7c3d39de8ff6ff150c545ad605884ca4Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getStats7c3d39de8ff6ff150c545ad605884ca4.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/api/rider/stats'
 */
        getStats7c3d39de8ff6ff150c545ad605884ca4Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStats7c3d39de8ff6ff150c545ad605884ca4.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/api/rider/stats'
 */
        getStats7c3d39de8ff6ff150c545ad605884ca4Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStats7c3d39de8ff6ff150c545ad605884ca4.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getStats7c3d39de8ff6ff150c545ad605884ca4.form = getStats7c3d39de8ff6ff150c545ad605884ca4Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/rider/stats'
 */
const getStatsadcb4ad2a029c78e1de2c392184fa1d0 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStatsadcb4ad2a029c78e1de2c392184fa1d0.url(options),
    method: 'get',
})

getStatsadcb4ad2a029c78e1de2c392184fa1d0.definition = {
    methods: ["get","head"],
    url: '/rider/stats',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/rider/stats'
 */
getStatsadcb4ad2a029c78e1de2c392184fa1d0.url = (options?: RouteQueryOptions) => {
    return getStatsadcb4ad2a029c78e1de2c392184fa1d0.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/rider/stats'
 */
getStatsadcb4ad2a029c78e1de2c392184fa1d0.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStatsadcb4ad2a029c78e1de2c392184fa1d0.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/rider/stats'
 */
getStatsadcb4ad2a029c78e1de2c392184fa1d0.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStatsadcb4ad2a029c78e1de2c392184fa1d0.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/rider/stats'
 */
    const getStatsadcb4ad2a029c78e1de2c392184fa1d0Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getStatsadcb4ad2a029c78e1de2c392184fa1d0.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/rider/stats'
 */
        getStatsadcb4ad2a029c78e1de2c392184fa1d0Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStatsadcb4ad2a029c78e1de2c392184fa1d0.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/rider/stats'
 */
        getStatsadcb4ad2a029c78e1de2c392184fa1d0Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStatsadcb4ad2a029c78e1de2c392184fa1d0.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getStatsadcb4ad2a029c78e1de2c392184fa1d0.form = getStatsadcb4ad2a029c78e1de2c392184fa1d0Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/rider/earnings'
 */
const getStats51ab2b0adc81b001e8a00ac2b6a2941d = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStats51ab2b0adc81b001e8a00ac2b6a2941d.url(options),
    method: 'get',
})

getStats51ab2b0adc81b001e8a00ac2b6a2941d.definition = {
    methods: ["get","head"],
    url: '/rider/earnings',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/rider/earnings'
 */
getStats51ab2b0adc81b001e8a00ac2b6a2941d.url = (options?: RouteQueryOptions) => {
    return getStats51ab2b0adc81b001e8a00ac2b6a2941d.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/rider/earnings'
 */
getStats51ab2b0adc81b001e8a00ac2b6a2941d.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStats51ab2b0adc81b001e8a00ac2b6a2941d.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/rider/earnings'
 */
getStats51ab2b0adc81b001e8a00ac2b6a2941d.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStats51ab2b0adc81b001e8a00ac2b6a2941d.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/rider/earnings'
 */
    const getStats51ab2b0adc81b001e8a00ac2b6a2941dForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getStats51ab2b0adc81b001e8a00ac2b6a2941d.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/rider/earnings'
 */
        getStats51ab2b0adc81b001e8a00ac2b6a2941dForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStats51ab2b0adc81b001e8a00ac2b6a2941d.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/rider/earnings'
 */
        getStats51ab2b0adc81b001e8a00ac2b6a2941dForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStats51ab2b0adc81b001e8a00ac2b6a2941d.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getStats51ab2b0adc81b001e8a00ac2b6a2941d.form = getStats51ab2b0adc81b001e8a00ac2b6a2941dForm
    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/earnings'
 */
const getStats514c235f8220375d6241743793847794 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStats514c235f8220375d6241743793847794.url(options),
    method: 'get',
})

getStats514c235f8220375d6241743793847794.definition = {
    methods: ["get","head"],
    url: '/earnings',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/earnings'
 */
getStats514c235f8220375d6241743793847794.url = (options?: RouteQueryOptions) => {
    return getStats514c235f8220375d6241743793847794.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/earnings'
 */
getStats514c235f8220375d6241743793847794.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStats514c235f8220375d6241743793847794.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/earnings'
 */
getStats514c235f8220375d6241743793847794.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStats514c235f8220375d6241743793847794.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/earnings'
 */
    const getStats514c235f8220375d6241743793847794Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getStats514c235f8220375d6241743793847794.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/earnings'
 */
        getStats514c235f8220375d6241743793847794Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStats514c235f8220375d6241743793847794.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:1028
 * @route '/earnings'
 */
        getStats514c235f8220375d6241743793847794Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStats514c235f8220375d6241743793847794.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getStats514c235f8220375d6241743793847794.form = getStats514c235f8220375d6241743793847794Form

export const getStats = {
    '/api/v1/rider/stats': getStatsb4b7a936b4dbf8c412ae7f146e59c3c6,
    '/api/rider/stats': getStats7c3d39de8ff6ff150c545ad605884ca4,
    '/rider/stats': getStatsadcb4ad2a029c78e1de2c392184fa1d0,
    '/rider/earnings': getStats51ab2b0adc81b001e8a00ac2b6a2941d,
    '/earnings': getStats514c235f8220375d6241743793847794,
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:827
 * @route '/api/v1/rider/location'
 */
const updateLocationfe7f85dad518befc9d281389c65bfaaf = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateLocationfe7f85dad518befc9d281389c65bfaaf.url(options),
    method: 'post',
})

updateLocationfe7f85dad518befc9d281389c65bfaaf.definition = {
    methods: ["post"],
    url: '/api/v1/rider/location',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:827
 * @route '/api/v1/rider/location'
 */
updateLocationfe7f85dad518befc9d281389c65bfaaf.url = (options?: RouteQueryOptions) => {
    return updateLocationfe7f85dad518befc9d281389c65bfaaf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:827
 * @route '/api/v1/rider/location'
 */
updateLocationfe7f85dad518befc9d281389c65bfaaf.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateLocationfe7f85dad518befc9d281389c65bfaaf.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:827
 * @route '/api/v1/rider/location'
 */
    const updateLocationfe7f85dad518befc9d281389c65bfaafForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateLocationfe7f85dad518befc9d281389c65bfaaf.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:827
 * @route '/api/v1/rider/location'
 */
        updateLocationfe7f85dad518befc9d281389c65bfaafForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateLocationfe7f85dad518befc9d281389c65bfaaf.url(options),
            method: 'post',
        })
    
    updateLocationfe7f85dad518befc9d281389c65bfaaf.form = updateLocationfe7f85dad518befc9d281389c65bfaafForm
    /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:827
 * @route '/api/rider/location'
 */
const updateLocationecfcde48da7bfe0b038a0aafe97388b5 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateLocationecfcde48da7bfe0b038a0aafe97388b5.url(options),
    method: 'post',
})

updateLocationecfcde48da7bfe0b038a0aafe97388b5.definition = {
    methods: ["post"],
    url: '/api/rider/location',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:827
 * @route '/api/rider/location'
 */
updateLocationecfcde48da7bfe0b038a0aafe97388b5.url = (options?: RouteQueryOptions) => {
    return updateLocationecfcde48da7bfe0b038a0aafe97388b5.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:827
 * @route '/api/rider/location'
 */
updateLocationecfcde48da7bfe0b038a0aafe97388b5.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateLocationecfcde48da7bfe0b038a0aafe97388b5.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:827
 * @route '/api/rider/location'
 */
    const updateLocationecfcde48da7bfe0b038a0aafe97388b5Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateLocationecfcde48da7bfe0b038a0aafe97388b5.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:827
 * @route '/api/rider/location'
 */
        updateLocationecfcde48da7bfe0b038a0aafe97388b5Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateLocationecfcde48da7bfe0b038a0aafe97388b5.url(options),
            method: 'post',
        })
    
    updateLocationecfcde48da7bfe0b038a0aafe97388b5.form = updateLocationecfcde48da7bfe0b038a0aafe97388b5Form
    /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:827
 * @route '/rider/location'
 */
const updateLocation6dcb1922b4444a48ecf38a99c9b40d3f = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateLocation6dcb1922b4444a48ecf38a99c9b40d3f.url(options),
    method: 'post',
})

updateLocation6dcb1922b4444a48ecf38a99c9b40d3f.definition = {
    methods: ["post"],
    url: '/rider/location',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:827
 * @route '/rider/location'
 */
updateLocation6dcb1922b4444a48ecf38a99c9b40d3f.url = (options?: RouteQueryOptions) => {
    return updateLocation6dcb1922b4444a48ecf38a99c9b40d3f.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:827
 * @route '/rider/location'
 */
updateLocation6dcb1922b4444a48ecf38a99c9b40d3f.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateLocation6dcb1922b4444a48ecf38a99c9b40d3f.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:827
 * @route '/rider/location'
 */
    const updateLocation6dcb1922b4444a48ecf38a99c9b40d3fForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateLocation6dcb1922b4444a48ecf38a99c9b40d3f.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:827
 * @route '/rider/location'
 */
        updateLocation6dcb1922b4444a48ecf38a99c9b40d3fForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateLocation6dcb1922b4444a48ecf38a99c9b40d3f.url(options),
            method: 'post',
        })
    
    updateLocation6dcb1922b4444a48ecf38a99c9b40d3f.form = updateLocation6dcb1922b4444a48ecf38a99c9b40d3fForm

export const updateLocation = {
    '/api/v1/rider/location': updateLocationfe7f85dad518befc9d281389c65bfaaf,
    '/api/rider/location': updateLocationecfcde48da7bfe0b038a0aafe97388b5,
    '/rider/location': updateLocation6dcb1922b4444a48ecf38a99c9b40d3f,
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/completed-orders'
 */
const getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
    method: 'get',
})

getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/completed-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url = (options?: RouteQueryOptions) => {
    return getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/completed-orders'
 */
    const getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603fForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/completed-orders'
 */
        getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603fForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/completed-orders'
 */
        getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603fForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.form = getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603fForm
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/history'
 */
const getCompletedOrdersabde917f84dacb687a598548424e8a47 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersabde917f84dacb687a598548424e8a47.url(options),
    method: 'get',
})

getCompletedOrdersabde917f84dacb687a598548424e8a47.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/history'
 */
getCompletedOrdersabde917f84dacb687a598548424e8a47.url = (options?: RouteQueryOptions) => {
    return getCompletedOrdersabde917f84dacb687a598548424e8a47.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/history'
 */
getCompletedOrdersabde917f84dacb687a598548424e8a47.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersabde917f84dacb687a598548424e8a47.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/history'
 */
getCompletedOrdersabde917f84dacb687a598548424e8a47.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrdersabde917f84dacb687a598548424e8a47.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/history'
 */
    const getCompletedOrdersabde917f84dacb687a598548424e8a47Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrdersabde917f84dacb687a598548424e8a47.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/history'
 */
        getCompletedOrdersabde917f84dacb687a598548424e8a47Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersabde917f84dacb687a598548424e8a47.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/history'
 */
        getCompletedOrdersabde917f84dacb687a598548424e8a47Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersabde917f84dacb687a598548424e8a47.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrdersabde917f84dacb687a598548424e8a47.form = getCompletedOrdersabde917f84dacb687a598548424e8a47Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/transactions'
 */
const getCompletedOrders8a130ed474753b912b288c59bd53c250 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders8a130ed474753b912b288c59bd53c250.url(options),
    method: 'get',
})

getCompletedOrders8a130ed474753b912b288c59bd53c250.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/transactions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/transactions'
 */
getCompletedOrders8a130ed474753b912b288c59bd53c250.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders8a130ed474753b912b288c59bd53c250.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/transactions'
 */
getCompletedOrders8a130ed474753b912b288c59bd53c250.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders8a130ed474753b912b288c59bd53c250.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/transactions'
 */
getCompletedOrders8a130ed474753b912b288c59bd53c250.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders8a130ed474753b912b288c59bd53c250.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/transactions'
 */
    const getCompletedOrders8a130ed474753b912b288c59bd53c250Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders8a130ed474753b912b288c59bd53c250.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/transactions'
 */
        getCompletedOrders8a130ed474753b912b288c59bd53c250Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders8a130ed474753b912b288c59bd53c250.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/transactions'
 */
        getCompletedOrders8a130ed474753b912b288c59bd53c250Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders8a130ed474753b912b288c59bd53c250.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrders8a130ed474753b912b288c59bd53c250.form = getCompletedOrders8a130ed474753b912b288c59bd53c250Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/past-transactions'
 */
const getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafd = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafd.url(options),
    method: 'get',
})

getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafd.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/past-transactions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/past-transactions'
 */
getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafd.url = (options?: RouteQueryOptions) => {
    return getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafd.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/past-transactions'
 */
getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafd.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafd.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/past-transactions'
 */
getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafd.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafd.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/past-transactions'
 */
    const getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafdForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafd.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/past-transactions'
 */
        getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafdForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafd.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/rider/past-transactions'
 */
        getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafdForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafd.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafd.form = getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafdForm
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/orders/completed'
 */
const getCompletedOrders762fad025826d27afd5c06b1ecf69a3e = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders762fad025826d27afd5c06b1ecf69a3e.url(options),
    method: 'get',
})

getCompletedOrders762fad025826d27afd5c06b1ecf69a3e.definition = {
    methods: ["get","head"],
    url: '/api/v1/orders/completed',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/orders/completed'
 */
getCompletedOrders762fad025826d27afd5c06b1ecf69a3e.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders762fad025826d27afd5c06b1ecf69a3e.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/orders/completed'
 */
getCompletedOrders762fad025826d27afd5c06b1ecf69a3e.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders762fad025826d27afd5c06b1ecf69a3e.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/orders/completed'
 */
getCompletedOrders762fad025826d27afd5c06b1ecf69a3e.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders762fad025826d27afd5c06b1ecf69a3e.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/orders/completed'
 */
    const getCompletedOrders762fad025826d27afd5c06b1ecf69a3eForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders762fad025826d27afd5c06b1ecf69a3e.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/orders/completed'
 */
        getCompletedOrders762fad025826d27afd5c06b1ecf69a3eForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders762fad025826d27afd5c06b1ecf69a3e.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/orders/completed'
 */
        getCompletedOrders762fad025826d27afd5c06b1ecf69a3eForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders762fad025826d27afd5c06b1ecf69a3e.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrders762fad025826d27afd5c06b1ecf69a3e.form = getCompletedOrders762fad025826d27afd5c06b1ecf69a3eForm
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/orders/history'
 */
const getCompletedOrders5bdaf7c800a463570fa791708f4ebc3a = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders5bdaf7c800a463570fa791708f4ebc3a.url(options),
    method: 'get',
})

getCompletedOrders5bdaf7c800a463570fa791708f4ebc3a.definition = {
    methods: ["get","head"],
    url: '/api/v1/orders/history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/orders/history'
 */
getCompletedOrders5bdaf7c800a463570fa791708f4ebc3a.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders5bdaf7c800a463570fa791708f4ebc3a.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/orders/history'
 */
getCompletedOrders5bdaf7c800a463570fa791708f4ebc3a.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders5bdaf7c800a463570fa791708f4ebc3a.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/orders/history'
 */
getCompletedOrders5bdaf7c800a463570fa791708f4ebc3a.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders5bdaf7c800a463570fa791708f4ebc3a.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/orders/history'
 */
    const getCompletedOrders5bdaf7c800a463570fa791708f4ebc3aForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders5bdaf7c800a463570fa791708f4ebc3a.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/orders/history'
 */
        getCompletedOrders5bdaf7c800a463570fa791708f4ebc3aForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders5bdaf7c800a463570fa791708f4ebc3a.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/v1/orders/history'
 */
        getCompletedOrders5bdaf7c800a463570fa791708f4ebc3aForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders5bdaf7c800a463570fa791708f4ebc3a.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrders5bdaf7c800a463570fa791708f4ebc3a.form = getCompletedOrders5bdaf7c800a463570fa791708f4ebc3aForm
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/rider/completed-orders'
 */
const getCompletedOrders805dad15d371e329367cc660ba824f6b = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
    method: 'get',
})

getCompletedOrders805dad15d371e329367cc660ba824f6b.definition = {
    methods: ["get","head"],
    url: '/api/rider/completed-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/rider/completed-orders'
 */
getCompletedOrders805dad15d371e329367cc660ba824f6b.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders805dad15d371e329367cc660ba824f6b.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/rider/completed-orders'
 */
getCompletedOrders805dad15d371e329367cc660ba824f6b.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/rider/completed-orders'
 */
getCompletedOrders805dad15d371e329367cc660ba824f6b.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/rider/completed-orders'
 */
    const getCompletedOrders805dad15d371e329367cc660ba824f6bForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/rider/completed-orders'
 */
        getCompletedOrders805dad15d371e329367cc660ba824f6bForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/rider/completed-orders'
 */
        getCompletedOrders805dad15d371e329367cc660ba824f6bForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders805dad15d371e329367cc660ba824f6b.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrders805dad15d371e329367cc660ba824f6b.form = getCompletedOrders805dad15d371e329367cc660ba824f6bForm
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/rider/history'
 */
const getCompletedOrdersa10be4a51a2df9e3c6870283747e7827 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.url(options),
    method: 'get',
})

getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.definition = {
    methods: ["get","head"],
    url: '/api/rider/history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/rider/history'
 */
getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.url = (options?: RouteQueryOptions) => {
    return getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/rider/history'
 */
getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/rider/history'
 */
getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/rider/history'
 */
    const getCompletedOrdersa10be4a51a2df9e3c6870283747e7827Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/rider/history'
 */
        getCompletedOrdersa10be4a51a2df9e3c6870283747e7827Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/rider/history'
 */
        getCompletedOrdersa10be4a51a2df9e3c6870283747e7827Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.form = getCompletedOrdersa10be4a51a2df9e3c6870283747e7827Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/orders/completed'
 */
const getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2.url(options),
    method: 'get',
})

getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2.definition = {
    methods: ["get","head"],
    url: '/api/orders/completed',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/orders/completed'
 */
getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/orders/completed'
 */
getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/orders/completed'
 */
getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/orders/completed'
 */
    const getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/orders/completed'
 */
        getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/orders/completed'
 */
        getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2.form = getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/orders/history'
 */
const getCompletedOrdersd3a0c3e4b962523485225e96543b6222 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersd3a0c3e4b962523485225e96543b6222.url(options),
    method: 'get',
})

getCompletedOrdersd3a0c3e4b962523485225e96543b6222.definition = {
    methods: ["get","head"],
    url: '/api/orders/history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/orders/history'
 */
getCompletedOrdersd3a0c3e4b962523485225e96543b6222.url = (options?: RouteQueryOptions) => {
    return getCompletedOrdersd3a0c3e4b962523485225e96543b6222.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/orders/history'
 */
getCompletedOrdersd3a0c3e4b962523485225e96543b6222.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersd3a0c3e4b962523485225e96543b6222.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/orders/history'
 */
getCompletedOrdersd3a0c3e4b962523485225e96543b6222.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrdersd3a0c3e4b962523485225e96543b6222.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/orders/history'
 */
    const getCompletedOrdersd3a0c3e4b962523485225e96543b6222Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrdersd3a0c3e4b962523485225e96543b6222.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/orders/history'
 */
        getCompletedOrdersd3a0c3e4b962523485225e96543b6222Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersd3a0c3e4b962523485225e96543b6222.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/api/orders/history'
 */
        getCompletedOrdersd3a0c3e4b962523485225e96543b6222Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersd3a0c3e4b962523485225e96543b6222.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrdersd3a0c3e4b962523485225e96543b6222.form = getCompletedOrdersd3a0c3e4b962523485225e96543b6222Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/orders/completed'
 */
const getCompletedOrders4cee906e8251dab37acf86acad70739e = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders4cee906e8251dab37acf86acad70739e.url(options),
    method: 'get',
})

getCompletedOrders4cee906e8251dab37acf86acad70739e.definition = {
    methods: ["get","head"],
    url: '/orders/completed',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/orders/completed'
 */
getCompletedOrders4cee906e8251dab37acf86acad70739e.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders4cee906e8251dab37acf86acad70739e.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/orders/completed'
 */
getCompletedOrders4cee906e8251dab37acf86acad70739e.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders4cee906e8251dab37acf86acad70739e.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/orders/completed'
 */
getCompletedOrders4cee906e8251dab37acf86acad70739e.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders4cee906e8251dab37acf86acad70739e.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/orders/completed'
 */
    const getCompletedOrders4cee906e8251dab37acf86acad70739eForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders4cee906e8251dab37acf86acad70739e.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/orders/completed'
 */
        getCompletedOrders4cee906e8251dab37acf86acad70739eForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders4cee906e8251dab37acf86acad70739e.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/orders/completed'
 */
        getCompletedOrders4cee906e8251dab37acf86acad70739eForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders4cee906e8251dab37acf86acad70739e.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrders4cee906e8251dab37acf86acad70739e.form = getCompletedOrders4cee906e8251dab37acf86acad70739eForm
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/orders/history'
 */
const getCompletedOrders2a99de77e455ca854ac54f6f526a489e = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders2a99de77e455ca854ac54f6f526a489e.url(options),
    method: 'get',
})

getCompletedOrders2a99de77e455ca854ac54f6f526a489e.definition = {
    methods: ["get","head"],
    url: '/orders/history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/orders/history'
 */
getCompletedOrders2a99de77e455ca854ac54f6f526a489e.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders2a99de77e455ca854ac54f6f526a489e.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/orders/history'
 */
getCompletedOrders2a99de77e455ca854ac54f6f526a489e.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders2a99de77e455ca854ac54f6f526a489e.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/orders/history'
 */
getCompletedOrders2a99de77e455ca854ac54f6f526a489e.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders2a99de77e455ca854ac54f6f526a489e.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/orders/history'
 */
    const getCompletedOrders2a99de77e455ca854ac54f6f526a489eForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders2a99de77e455ca854ac54f6f526a489e.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/orders/history'
 */
        getCompletedOrders2a99de77e455ca854ac54f6f526a489eForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders2a99de77e455ca854ac54f6f526a489e.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/orders/history'
 */
        getCompletedOrders2a99de77e455ca854ac54f6f526a489eForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders2a99de77e455ca854ac54f6f526a489e.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrders2a99de77e455ca854ac54f6f526a489e.form = getCompletedOrders2a99de77e455ca854ac54f6f526a489eForm
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/completed-orders'
 */
const getCompletedOrders8f61dfa7657685f38d1054ef7242df3c = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders8f61dfa7657685f38d1054ef7242df3c.url(options),
    method: 'get',
})

getCompletedOrders8f61dfa7657685f38d1054ef7242df3c.definition = {
    methods: ["get","head"],
    url: '/rider/completed-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/completed-orders'
 */
getCompletedOrders8f61dfa7657685f38d1054ef7242df3c.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders8f61dfa7657685f38d1054ef7242df3c.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/completed-orders'
 */
getCompletedOrders8f61dfa7657685f38d1054ef7242df3c.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders8f61dfa7657685f38d1054ef7242df3c.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/completed-orders'
 */
getCompletedOrders8f61dfa7657685f38d1054ef7242df3c.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders8f61dfa7657685f38d1054ef7242df3c.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/completed-orders'
 */
    const getCompletedOrders8f61dfa7657685f38d1054ef7242df3cForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders8f61dfa7657685f38d1054ef7242df3c.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/completed-orders'
 */
        getCompletedOrders8f61dfa7657685f38d1054ef7242df3cForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders8f61dfa7657685f38d1054ef7242df3c.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/completed-orders'
 */
        getCompletedOrders8f61dfa7657685f38d1054ef7242df3cForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders8f61dfa7657685f38d1054ef7242df3c.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrders8f61dfa7657685f38d1054ef7242df3c.form = getCompletedOrders8f61dfa7657685f38d1054ef7242df3cForm
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/history'
 */
const getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177c = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177c.url(options),
    method: 'get',
})

getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177c.definition = {
    methods: ["get","head"],
    url: '/rider/history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/history'
 */
getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177c.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177c.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/history'
 */
getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177c.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177c.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/history'
 */
getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177c.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177c.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/history'
 */
    const getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177cForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177c.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/history'
 */
        getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177cForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177c.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/history'
 */
        getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177cForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177c.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177c.form = getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177cForm
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/transactions'
 */
const getCompletedOrders54a59026626255333b8f4daaf6180011 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders54a59026626255333b8f4daaf6180011.url(options),
    method: 'get',
})

getCompletedOrders54a59026626255333b8f4daaf6180011.definition = {
    methods: ["get","head"],
    url: '/rider/transactions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/transactions'
 */
getCompletedOrders54a59026626255333b8f4daaf6180011.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders54a59026626255333b8f4daaf6180011.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/transactions'
 */
getCompletedOrders54a59026626255333b8f4daaf6180011.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders54a59026626255333b8f4daaf6180011.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/transactions'
 */
getCompletedOrders54a59026626255333b8f4daaf6180011.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders54a59026626255333b8f4daaf6180011.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/transactions'
 */
    const getCompletedOrders54a59026626255333b8f4daaf6180011Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders54a59026626255333b8f4daaf6180011.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/transactions'
 */
        getCompletedOrders54a59026626255333b8f4daaf6180011Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders54a59026626255333b8f4daaf6180011.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/transactions'
 */
        getCompletedOrders54a59026626255333b8f4daaf6180011Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders54a59026626255333b8f4daaf6180011.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrders54a59026626255333b8f4daaf6180011.form = getCompletedOrders54a59026626255333b8f4daaf6180011Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/past-transactions'
 */
const getCompletedOrders5ec89e2decce3b1710758837cbb22c22 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders5ec89e2decce3b1710758837cbb22c22.url(options),
    method: 'get',
})

getCompletedOrders5ec89e2decce3b1710758837cbb22c22.definition = {
    methods: ["get","head"],
    url: '/rider/past-transactions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/past-transactions'
 */
getCompletedOrders5ec89e2decce3b1710758837cbb22c22.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders5ec89e2decce3b1710758837cbb22c22.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/past-transactions'
 */
getCompletedOrders5ec89e2decce3b1710758837cbb22c22.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders5ec89e2decce3b1710758837cbb22c22.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/past-transactions'
 */
getCompletedOrders5ec89e2decce3b1710758837cbb22c22.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders5ec89e2decce3b1710758837cbb22c22.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/past-transactions'
 */
    const getCompletedOrders5ec89e2decce3b1710758837cbb22c22Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders5ec89e2decce3b1710758837cbb22c22.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/past-transactions'
 */
        getCompletedOrders5ec89e2decce3b1710758837cbb22c22Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders5ec89e2decce3b1710758837cbb22c22.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/rider/past-transactions'
 */
        getCompletedOrders5ec89e2decce3b1710758837cbb22c22Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders5ec89e2decce3b1710758837cbb22c22.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrders5ec89e2decce3b1710758837cbb22c22.form = getCompletedOrders5ec89e2decce3b1710758837cbb22c22Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/transactions'
 */
const getCompletedOrderse5aa2cad321b30063c3b415df5452200 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrderse5aa2cad321b30063c3b415df5452200.url(options),
    method: 'get',
})

getCompletedOrderse5aa2cad321b30063c3b415df5452200.definition = {
    methods: ["get","head"],
    url: '/transactions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/transactions'
 */
getCompletedOrderse5aa2cad321b30063c3b415df5452200.url = (options?: RouteQueryOptions) => {
    return getCompletedOrderse5aa2cad321b30063c3b415df5452200.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/transactions'
 */
getCompletedOrderse5aa2cad321b30063c3b415df5452200.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrderse5aa2cad321b30063c3b415df5452200.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/transactions'
 */
getCompletedOrderse5aa2cad321b30063c3b415df5452200.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrderse5aa2cad321b30063c3b415df5452200.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/transactions'
 */
    const getCompletedOrderse5aa2cad321b30063c3b415df5452200Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrderse5aa2cad321b30063c3b415df5452200.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/transactions'
 */
        getCompletedOrderse5aa2cad321b30063c3b415df5452200Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrderse5aa2cad321b30063c3b415df5452200.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/transactions'
 */
        getCompletedOrderse5aa2cad321b30063c3b415df5452200Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrderse5aa2cad321b30063c3b415df5452200.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrderse5aa2cad321b30063c3b415df5452200.form = getCompletedOrderse5aa2cad321b30063c3b415df5452200Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/past-transactions'
 */
const getCompletedOrdersea20848d9ead711a1b50da581b71ad24 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersea20848d9ead711a1b50da581b71ad24.url(options),
    method: 'get',
})

getCompletedOrdersea20848d9ead711a1b50da581b71ad24.definition = {
    methods: ["get","head"],
    url: '/past-transactions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/past-transactions'
 */
getCompletedOrdersea20848d9ead711a1b50da581b71ad24.url = (options?: RouteQueryOptions) => {
    return getCompletedOrdersea20848d9ead711a1b50da581b71ad24.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/past-transactions'
 */
getCompletedOrdersea20848d9ead711a1b50da581b71ad24.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersea20848d9ead711a1b50da581b71ad24.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/past-transactions'
 */
getCompletedOrdersea20848d9ead711a1b50da581b71ad24.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrdersea20848d9ead711a1b50da581b71ad24.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/past-transactions'
 */
    const getCompletedOrdersea20848d9ead711a1b50da581b71ad24Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrdersea20848d9ead711a1b50da581b71ad24.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/past-transactions'
 */
        getCompletedOrdersea20848d9ead711a1b50da581b71ad24Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersea20848d9ead711a1b50da581b71ad24.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:208
 * @route '/past-transactions'
 */
        getCompletedOrdersea20848d9ead711a1b50da581b71ad24Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersea20848d9ead711a1b50da581b71ad24.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrdersea20848d9ead711a1b50da581b71ad24.form = getCompletedOrdersea20848d9ead711a1b50da581b71ad24Form

export const getCompletedOrders = {
    '/api/v1/rider/completed-orders': getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f,
    '/api/v1/rider/history': getCompletedOrdersabde917f84dacb687a598548424e8a47,
    '/api/v1/rider/transactions': getCompletedOrders8a130ed474753b912b288c59bd53c250,
    '/api/v1/rider/past-transactions': getCompletedOrdersb062ab391bc3860ea383ea2b45a5eafd,
    '/api/v1/orders/completed': getCompletedOrders762fad025826d27afd5c06b1ecf69a3e,
    '/api/v1/orders/history': getCompletedOrders5bdaf7c800a463570fa791708f4ebc3a,
    '/api/rider/completed-orders': getCompletedOrders805dad15d371e329367cc660ba824f6b,
    '/api/rider/history': getCompletedOrdersa10be4a51a2df9e3c6870283747e7827,
    '/api/orders/completed': getCompletedOrders9ed031159db86cd5374f5ac8a50fbec2,
    '/api/orders/history': getCompletedOrdersd3a0c3e4b962523485225e96543b6222,
    '/orders/completed': getCompletedOrders4cee906e8251dab37acf86acad70739e,
    '/orders/history': getCompletedOrders2a99de77e455ca854ac54f6f526a489e,
    '/rider/completed-orders': getCompletedOrders8f61dfa7657685f38d1054ef7242df3c,
    '/rider/history': getCompletedOrders0f5feb3fdd4e10be69e77c75dcb4177c,
    '/rider/transactions': getCompletedOrders54a59026626255333b8f4daaf6180011,
    '/rider/past-transactions': getCompletedOrders5ec89e2decce3b1710758837cbb22c22,
    '/transactions': getCompletedOrderse5aa2cad321b30063c3b415df5452200,
    '/past-transactions': getCompletedOrdersea20848d9ead711a1b50da581b71ad24,
}

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/v1/rider/orders/{id}/accept'
 */
const acceptOrder335d52fdc7997e576629d6c57b57d171 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder335d52fdc7997e576629d6c57b57d171.url(args, options),
    method: 'post',
})

acceptOrder335d52fdc7997e576629d6c57b57d171.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/accept',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/v1/rider/orders/{id}/accept'
 */
acceptOrder335d52fdc7997e576629d6c57b57d171.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return acceptOrder335d52fdc7997e576629d6c57b57d171.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/v1/rider/orders/{id}/accept'
 */
acceptOrder335d52fdc7997e576629d6c57b57d171.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder335d52fdc7997e576629d6c57b57d171.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/v1/rider/orders/{id}/accept'
 */
    const acceptOrder335d52fdc7997e576629d6c57b57d171Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: acceptOrder335d52fdc7997e576629d6c57b57d171.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/v1/rider/orders/{id}/accept'
 */
        acceptOrder335d52fdc7997e576629d6c57b57d171Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: acceptOrder335d52fdc7997e576629d6c57b57d171.url(args, options),
            method: 'post',
        })
    
    acceptOrder335d52fdc7997e576629d6c57b57d171.form = acceptOrder335d52fdc7997e576629d6c57b57d171Form
    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/v1/rider/accept/{id}'
 */
const acceptOrder30f4aef81939b30bc75b941ab9d3d4b0 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.url(args, options),
    method: 'post',
})

acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.definition = {
    methods: ["post"],
    url: '/api/v1/rider/accept/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/v1/rider/accept/{id}'
 */
acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/v1/rider/accept/{id}'
 */
acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/v1/rider/accept/{id}'
 */
    const acceptOrder30f4aef81939b30bc75b941ab9d3d4b0Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/v1/rider/accept/{id}'
 */
        acceptOrder30f4aef81939b30bc75b941ab9d3d4b0Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.url(args, options),
            method: 'post',
        })
    
    acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.form = acceptOrder30f4aef81939b30bc75b941ab9d3d4b0Form
    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/rider/orders/{id}/accept'
 */
const acceptOrder1158b7621232e7382f240cf789aeabb9 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder1158b7621232e7382f240cf789aeabb9.url(args, options),
    method: 'post',
})

acceptOrder1158b7621232e7382f240cf789aeabb9.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/accept',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/rider/orders/{id}/accept'
 */
acceptOrder1158b7621232e7382f240cf789aeabb9.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return acceptOrder1158b7621232e7382f240cf789aeabb9.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/rider/orders/{id}/accept'
 */
acceptOrder1158b7621232e7382f240cf789aeabb9.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder1158b7621232e7382f240cf789aeabb9.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/rider/orders/{id}/accept'
 */
    const acceptOrder1158b7621232e7382f240cf789aeabb9Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: acceptOrder1158b7621232e7382f240cf789aeabb9.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/rider/orders/{id}/accept'
 */
        acceptOrder1158b7621232e7382f240cf789aeabb9Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: acceptOrder1158b7621232e7382f240cf789aeabb9.url(args, options),
            method: 'post',
        })
    
    acceptOrder1158b7621232e7382f240cf789aeabb9.form = acceptOrder1158b7621232e7382f240cf789aeabb9Form
    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/rider/accept/{id}'
 */
const acceptOrderf4dc18f2e442617ffacd34572239e3de = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrderf4dc18f2e442617ffacd34572239e3de.url(args, options),
    method: 'post',
})

acceptOrderf4dc18f2e442617ffacd34572239e3de.definition = {
    methods: ["post"],
    url: '/api/rider/accept/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/rider/accept/{id}'
 */
acceptOrderf4dc18f2e442617ffacd34572239e3de.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return acceptOrderf4dc18f2e442617ffacd34572239e3de.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/rider/accept/{id}'
 */
acceptOrderf4dc18f2e442617ffacd34572239e3de.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrderf4dc18f2e442617ffacd34572239e3de.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/rider/accept/{id}'
 */
    const acceptOrderf4dc18f2e442617ffacd34572239e3deForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: acceptOrderf4dc18f2e442617ffacd34572239e3de.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:270
 * @route '/api/rider/accept/{id}'
 */
        acceptOrderf4dc18f2e442617ffacd34572239e3deForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: acceptOrderf4dc18f2e442617ffacd34572239e3de.url(args, options),
            method: 'post',
        })
    
    acceptOrderf4dc18f2e442617ffacd34572239e3de.form = acceptOrderf4dc18f2e442617ffacd34572239e3deForm

export const acceptOrder = {
    '/api/v1/rider/orders/{id}/accept': acceptOrder335d52fdc7997e576629d6c57b57d171,
    '/api/v1/rider/accept/{id}': acceptOrder30f4aef81939b30bc75b941ab9d3d4b0,
    '/api/rider/orders/{id}/accept': acceptOrder1158b7621232e7382f240cf789aeabb9,
    '/api/rider/accept/{id}': acceptOrderf4dc18f2e442617ffacd34572239e3de,
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
const pickupOrder67b05245dea2301f5bbd857bf4c6aa6d = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.url(args, options),
    method: 'post',
})

pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/pickup',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
    const pickupOrder67b05245dea2301f5bbd857bf4c6aa6dForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
        pickupOrder67b05245dea2301f5bbd857bf4c6aa6dForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.url(args, options),
            method: 'post',
        })
    
    pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.form = pickupOrder67b05245dea2301f5bbd857bf4c6aa6dForm
    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/v1/rider/pickup/{id}'
 */
const pickupOrder34f02e4478194804ce334df7d8ce7771 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder34f02e4478194804ce334df7d8ce7771.url(args, options),
    method: 'post',
})

pickupOrder34f02e4478194804ce334df7d8ce7771.definition = {
    methods: ["post"],
    url: '/api/v1/rider/pickup/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/v1/rider/pickup/{id}'
 */
pickupOrder34f02e4478194804ce334df7d8ce7771.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pickupOrder34f02e4478194804ce334df7d8ce7771.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/v1/rider/pickup/{id}'
 */
pickupOrder34f02e4478194804ce334df7d8ce7771.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder34f02e4478194804ce334df7d8ce7771.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/v1/rider/pickup/{id}'
 */
    const pickupOrder34f02e4478194804ce334df7d8ce7771Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrder34f02e4478194804ce334df7d8ce7771.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/v1/rider/pickup/{id}'
 */
        pickupOrder34f02e4478194804ce334df7d8ce7771Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrder34f02e4478194804ce334df7d8ce7771.url(args, options),
            method: 'post',
        })
    
    pickupOrder34f02e4478194804ce334df7d8ce7771.form = pickupOrder34f02e4478194804ce334df7d8ce7771Form
    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/v1/rider/deliveries/{id}/pickup'
 */
const pickupOrderd0842575a9d8ac1952c00fba2ccf5c03 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.url(args, options),
    method: 'post',
})

pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.definition = {
    methods: ["post"],
    url: '/api/v1/rider/deliveries/{id}/pickup',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/v1/rider/deliveries/{id}/pickup'
 */
pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/v1/rider/deliveries/{id}/pickup'
 */
pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/v1/rider/deliveries/{id}/pickup'
 */
    const pickupOrderd0842575a9d8ac1952c00fba2ccf5c03Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/v1/rider/deliveries/{id}/pickup'
 */
        pickupOrderd0842575a9d8ac1952c00fba2ccf5c03Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.url(args, options),
            method: 'post',
        })
    
    pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.form = pickupOrderd0842575a9d8ac1952c00fba2ccf5c03Form
    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/rider/orders/{id}/pickup'
 */
const pickupOrder579a910ac119fd5fb65e16116828f5c1 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder579a910ac119fd5fb65e16116828f5c1.url(args, options),
    method: 'post',
})

pickupOrder579a910ac119fd5fb65e16116828f5c1.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/pickup',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/rider/orders/{id}/pickup'
 */
pickupOrder579a910ac119fd5fb65e16116828f5c1.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pickupOrder579a910ac119fd5fb65e16116828f5c1.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/rider/orders/{id}/pickup'
 */
pickupOrder579a910ac119fd5fb65e16116828f5c1.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder579a910ac119fd5fb65e16116828f5c1.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/rider/orders/{id}/pickup'
 */
    const pickupOrder579a910ac119fd5fb65e16116828f5c1Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrder579a910ac119fd5fb65e16116828f5c1.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/rider/orders/{id}/pickup'
 */
        pickupOrder579a910ac119fd5fb65e16116828f5c1Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrder579a910ac119fd5fb65e16116828f5c1.url(args, options),
            method: 'post',
        })
    
    pickupOrder579a910ac119fd5fb65e16116828f5c1.form = pickupOrder579a910ac119fd5fb65e16116828f5c1Form
    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/rider/pickup/{id}'
 */
const pickupOrder2abee28bec9182f8518b4a1efac8defc = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder2abee28bec9182f8518b4a1efac8defc.url(args, options),
    method: 'post',
})

pickupOrder2abee28bec9182f8518b4a1efac8defc.definition = {
    methods: ["post"],
    url: '/api/rider/pickup/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/rider/pickup/{id}'
 */
pickupOrder2abee28bec9182f8518b4a1efac8defc.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pickupOrder2abee28bec9182f8518b4a1efac8defc.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/rider/pickup/{id}'
 */
pickupOrder2abee28bec9182f8518b4a1efac8defc.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder2abee28bec9182f8518b4a1efac8defc.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/rider/pickup/{id}'
 */
    const pickupOrder2abee28bec9182f8518b4a1efac8defcForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrder2abee28bec9182f8518b4a1efac8defc.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/rider/pickup/{id}'
 */
        pickupOrder2abee28bec9182f8518b4a1efac8defcForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrder2abee28bec9182f8518b4a1efac8defc.url(args, options),
            method: 'post',
        })
    
    pickupOrder2abee28bec9182f8518b4a1efac8defc.form = pickupOrder2abee28bec9182f8518b4a1efac8defcForm
    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/rider/deliveries/{id}/pickup'
 */
const pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.url(args, options),
    method: 'post',
})

pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.definition = {
    methods: ["post"],
    url: '/api/rider/deliveries/{id}/pickup',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/rider/deliveries/{id}/pickup'
 */
pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/rider/deliveries/{id}/pickup'
 */
pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/rider/deliveries/{id}/pickup'
 */
    const pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ceForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/api/rider/deliveries/{id}/pickup'
 */
        pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ceForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.url(args, options),
            method: 'post',
        })
    
    pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.form = pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ceForm
    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/rider/orders/{id}/pickup'
 */
const pickupOrderd22809a91a14d39f3e14724f58d6c06c = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrderd22809a91a14d39f3e14724f58d6c06c.url(args, options),
    method: 'post',
})

pickupOrderd22809a91a14d39f3e14724f58d6c06c.definition = {
    methods: ["post"],
    url: '/rider/orders/{id}/pickup',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/rider/orders/{id}/pickup'
 */
pickupOrderd22809a91a14d39f3e14724f58d6c06c.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pickupOrderd22809a91a14d39f3e14724f58d6c06c.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/rider/orders/{id}/pickup'
 */
pickupOrderd22809a91a14d39f3e14724f58d6c06c.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrderd22809a91a14d39f3e14724f58d6c06c.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/rider/orders/{id}/pickup'
 */
    const pickupOrderd22809a91a14d39f3e14724f58d6c06cForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrderd22809a91a14d39f3e14724f58d6c06c.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/rider/orders/{id}/pickup'
 */
        pickupOrderd22809a91a14d39f3e14724f58d6c06cForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrderd22809a91a14d39f3e14724f58d6c06c.url(args, options),
            method: 'post',
        })
    
    pickupOrderd22809a91a14d39f3e14724f58d6c06c.form = pickupOrderd22809a91a14d39f3e14724f58d6c06cForm
    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/rider/pickup/{id}'
 */
const pickupOrdered244fafde22780a6014dc7fd97af955 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrdered244fafde22780a6014dc7fd97af955.url(args, options),
    method: 'post',
})

pickupOrdered244fafde22780a6014dc7fd97af955.definition = {
    methods: ["post"],
    url: '/rider/pickup/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/rider/pickup/{id}'
 */
pickupOrdered244fafde22780a6014dc7fd97af955.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pickupOrdered244fafde22780a6014dc7fd97af955.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/rider/pickup/{id}'
 */
pickupOrdered244fafde22780a6014dc7fd97af955.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrdered244fafde22780a6014dc7fd97af955.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/rider/pickup/{id}'
 */
    const pickupOrdered244fafde22780a6014dc7fd97af955Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrdered244fafde22780a6014dc7fd97af955.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:356
 * @route '/rider/pickup/{id}'
 */
        pickupOrdered244fafde22780a6014dc7fd97af955Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrdered244fafde22780a6014dc7fd97af955.url(args, options),
            method: 'post',
        })
    
    pickupOrdered244fafde22780a6014dc7fd97af955.form = pickupOrdered244fafde22780a6014dc7fd97af955Form

export const pickupOrder = {
    '/api/v1/rider/orders/{id}/pickup': pickupOrder67b05245dea2301f5bbd857bf4c6aa6d,
    '/api/v1/rider/pickup/{id}': pickupOrder34f02e4478194804ce334df7d8ce7771,
    '/api/v1/rider/deliveries/{id}/pickup': pickupOrderd0842575a9d8ac1952c00fba2ccf5c03,
    '/api/rider/orders/{id}/pickup': pickupOrder579a910ac119fd5fb65e16116828f5c1,
    '/api/rider/pickup/{id}': pickupOrder2abee28bec9182f8518b4a1efac8defc,
    '/api/rider/deliveries/{id}/pickup': pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce,
    '/rider/orders/{id}/pickup': pickupOrderd22809a91a14d39f3e14724f58d6c06c,
    '/rider/pickup/{id}': pickupOrdered244fafde22780a6014dc7fd97af955,
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/orders/{id}/transit'
 */
const startTransit30258da9f6003769dffda8523c718911 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit30258da9f6003769dffda8523c718911.url(args, options),
    method: 'post',
})

startTransit30258da9f6003769dffda8523c718911.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/transit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/orders/{id}/transit'
 */
startTransit30258da9f6003769dffda8523c718911.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit30258da9f6003769dffda8523c718911.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/orders/{id}/transit'
 */
startTransit30258da9f6003769dffda8523c718911.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit30258da9f6003769dffda8523c718911.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/orders/{id}/transit'
 */
    const startTransit30258da9f6003769dffda8523c718911Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit30258da9f6003769dffda8523c718911.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/orders/{id}/transit'
 */
        startTransit30258da9f6003769dffda8523c718911Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit30258da9f6003769dffda8523c718911.url(args, options),
            method: 'post',
        })
    
    startTransit30258da9f6003769dffda8523c718911.form = startTransit30258da9f6003769dffda8523c718911Form
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/orders/{id}/start-transit'
 */
const startTransit3d4a120e156f1f46a4425fe1c8780098 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit3d4a120e156f1f46a4425fe1c8780098.url(args, options),
    method: 'post',
})

startTransit3d4a120e156f1f46a4425fe1c8780098.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/start-transit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/orders/{id}/start-transit'
 */
startTransit3d4a120e156f1f46a4425fe1c8780098.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit3d4a120e156f1f46a4425fe1c8780098.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/orders/{id}/start-transit'
 */
startTransit3d4a120e156f1f46a4425fe1c8780098.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit3d4a120e156f1f46a4425fe1c8780098.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/orders/{id}/start-transit'
 */
    const startTransit3d4a120e156f1f46a4425fe1c8780098Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit3d4a120e156f1f46a4425fe1c8780098.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/orders/{id}/start-transit'
 */
        startTransit3d4a120e156f1f46a4425fe1c8780098Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit3d4a120e156f1f46a4425fe1c8780098.url(args, options),
            method: 'post',
        })
    
    startTransit3d4a120e156f1f46a4425fe1c8780098.form = startTransit3d4a120e156f1f46a4425fe1c8780098Form
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/transit/{id}'
 */
const startTransit7ed31a4949747b6e96f901fb601a5eab = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit7ed31a4949747b6e96f901fb601a5eab.url(args, options),
    method: 'post',
})

startTransit7ed31a4949747b6e96f901fb601a5eab.definition = {
    methods: ["post"],
    url: '/api/v1/rider/transit/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/transit/{id}'
 */
startTransit7ed31a4949747b6e96f901fb601a5eab.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit7ed31a4949747b6e96f901fb601a5eab.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/transit/{id}'
 */
startTransit7ed31a4949747b6e96f901fb601a5eab.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit7ed31a4949747b6e96f901fb601a5eab.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/transit/{id}'
 */
    const startTransit7ed31a4949747b6e96f901fb601a5eabForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit7ed31a4949747b6e96f901fb601a5eab.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/transit/{id}'
 */
        startTransit7ed31a4949747b6e96f901fb601a5eabForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit7ed31a4949747b6e96f901fb601a5eab.url(args, options),
            method: 'post',
        })
    
    startTransit7ed31a4949747b6e96f901fb601a5eab.form = startTransit7ed31a4949747b6e96f901fb601a5eabForm
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/deliveries/{id}/transit'
 */
const startTransit7204c23f000441f71edfe1aa1866a99e = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit7204c23f000441f71edfe1aa1866a99e.url(args, options),
    method: 'post',
})

startTransit7204c23f000441f71edfe1aa1866a99e.definition = {
    methods: ["post"],
    url: '/api/v1/rider/deliveries/{id}/transit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/deliveries/{id}/transit'
 */
startTransit7204c23f000441f71edfe1aa1866a99e.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit7204c23f000441f71edfe1aa1866a99e.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/deliveries/{id}/transit'
 */
startTransit7204c23f000441f71edfe1aa1866a99e.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit7204c23f000441f71edfe1aa1866a99e.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/deliveries/{id}/transit'
 */
    const startTransit7204c23f000441f71edfe1aa1866a99eForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit7204c23f000441f71edfe1aa1866a99e.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/v1/rider/deliveries/{id}/transit'
 */
        startTransit7204c23f000441f71edfe1aa1866a99eForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit7204c23f000441f71edfe1aa1866a99e.url(args, options),
            method: 'post',
        })
    
    startTransit7204c23f000441f71edfe1aa1866a99e.form = startTransit7204c23f000441f71edfe1aa1866a99eForm
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/orders/{id}/transit'
 */
const startTransit113e82e4514b9b80d3702387e44dbe82 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit113e82e4514b9b80d3702387e44dbe82.url(args, options),
    method: 'post',
})

startTransit113e82e4514b9b80d3702387e44dbe82.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/transit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/orders/{id}/transit'
 */
startTransit113e82e4514b9b80d3702387e44dbe82.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit113e82e4514b9b80d3702387e44dbe82.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/orders/{id}/transit'
 */
startTransit113e82e4514b9b80d3702387e44dbe82.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit113e82e4514b9b80d3702387e44dbe82.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/orders/{id}/transit'
 */
    const startTransit113e82e4514b9b80d3702387e44dbe82Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit113e82e4514b9b80d3702387e44dbe82.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/orders/{id}/transit'
 */
        startTransit113e82e4514b9b80d3702387e44dbe82Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit113e82e4514b9b80d3702387e44dbe82.url(args, options),
            method: 'post',
        })
    
    startTransit113e82e4514b9b80d3702387e44dbe82.form = startTransit113e82e4514b9b80d3702387e44dbe82Form
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/orders/{id}/start-transit'
 */
const startTransit77d49b870894a1805e11bde9d897789e = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit77d49b870894a1805e11bde9d897789e.url(args, options),
    method: 'post',
})

startTransit77d49b870894a1805e11bde9d897789e.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/start-transit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/orders/{id}/start-transit'
 */
startTransit77d49b870894a1805e11bde9d897789e.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit77d49b870894a1805e11bde9d897789e.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/orders/{id}/start-transit'
 */
startTransit77d49b870894a1805e11bde9d897789e.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit77d49b870894a1805e11bde9d897789e.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/orders/{id}/start-transit'
 */
    const startTransit77d49b870894a1805e11bde9d897789eForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit77d49b870894a1805e11bde9d897789e.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/orders/{id}/start-transit'
 */
        startTransit77d49b870894a1805e11bde9d897789eForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit77d49b870894a1805e11bde9d897789e.url(args, options),
            method: 'post',
        })
    
    startTransit77d49b870894a1805e11bde9d897789e.form = startTransit77d49b870894a1805e11bde9d897789eForm
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/transit/{id}'
 */
const startTransit58df34427d051990bfb390a3c01e3fec = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit58df34427d051990bfb390a3c01e3fec.url(args, options),
    method: 'post',
})

startTransit58df34427d051990bfb390a3c01e3fec.definition = {
    methods: ["post"],
    url: '/api/rider/transit/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/transit/{id}'
 */
startTransit58df34427d051990bfb390a3c01e3fec.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit58df34427d051990bfb390a3c01e3fec.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/transit/{id}'
 */
startTransit58df34427d051990bfb390a3c01e3fec.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit58df34427d051990bfb390a3c01e3fec.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/transit/{id}'
 */
    const startTransit58df34427d051990bfb390a3c01e3fecForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit58df34427d051990bfb390a3c01e3fec.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/transit/{id}'
 */
        startTransit58df34427d051990bfb390a3c01e3fecForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit58df34427d051990bfb390a3c01e3fec.url(args, options),
            method: 'post',
        })
    
    startTransit58df34427d051990bfb390a3c01e3fec.form = startTransit58df34427d051990bfb390a3c01e3fecForm
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/deliveries/{id}/transit'
 */
const startTransit4586cdd73c0462dc23203ea167ac549d = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit4586cdd73c0462dc23203ea167ac549d.url(args, options),
    method: 'post',
})

startTransit4586cdd73c0462dc23203ea167ac549d.definition = {
    methods: ["post"],
    url: '/api/rider/deliveries/{id}/transit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/deliveries/{id}/transit'
 */
startTransit4586cdd73c0462dc23203ea167ac549d.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit4586cdd73c0462dc23203ea167ac549d.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/deliveries/{id}/transit'
 */
startTransit4586cdd73c0462dc23203ea167ac549d.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit4586cdd73c0462dc23203ea167ac549d.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/deliveries/{id}/transit'
 */
    const startTransit4586cdd73c0462dc23203ea167ac549dForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit4586cdd73c0462dc23203ea167ac549d.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/api/rider/deliveries/{id}/transit'
 */
        startTransit4586cdd73c0462dc23203ea167ac549dForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit4586cdd73c0462dc23203ea167ac549d.url(args, options),
            method: 'post',
        })
    
    startTransit4586cdd73c0462dc23203ea167ac549d.form = startTransit4586cdd73c0462dc23203ea167ac549dForm
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/rider/orders/{id}/transit'
 */
const startTransit2650eda1d910bc50aba05c6b0225785a = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit2650eda1d910bc50aba05c6b0225785a.url(args, options),
    method: 'post',
})

startTransit2650eda1d910bc50aba05c6b0225785a.definition = {
    methods: ["post"],
    url: '/rider/orders/{id}/transit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/rider/orders/{id}/transit'
 */
startTransit2650eda1d910bc50aba05c6b0225785a.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit2650eda1d910bc50aba05c6b0225785a.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/rider/orders/{id}/transit'
 */
startTransit2650eda1d910bc50aba05c6b0225785a.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit2650eda1d910bc50aba05c6b0225785a.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/rider/orders/{id}/transit'
 */
    const startTransit2650eda1d910bc50aba05c6b0225785aForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit2650eda1d910bc50aba05c6b0225785a.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/rider/orders/{id}/transit'
 */
        startTransit2650eda1d910bc50aba05c6b0225785aForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit2650eda1d910bc50aba05c6b0225785a.url(args, options),
            method: 'post',
        })
    
    startTransit2650eda1d910bc50aba05c6b0225785a.form = startTransit2650eda1d910bc50aba05c6b0225785aForm
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/rider/transit/{id}'
 */
const startTransit8f70f034ac5123cf52b64d9530727338 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit8f70f034ac5123cf52b64d9530727338.url(args, options),
    method: 'post',
})

startTransit8f70f034ac5123cf52b64d9530727338.definition = {
    methods: ["post"],
    url: '/rider/transit/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/rider/transit/{id}'
 */
startTransit8f70f034ac5123cf52b64d9530727338.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit8f70f034ac5123cf52b64d9530727338.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/rider/transit/{id}'
 */
startTransit8f70f034ac5123cf52b64d9530727338.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit8f70f034ac5123cf52b64d9530727338.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/rider/transit/{id}'
 */
    const startTransit8f70f034ac5123cf52b64d9530727338Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit8f70f034ac5123cf52b64d9530727338.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:471
 * @route '/rider/transit/{id}'
 */
        startTransit8f70f034ac5123cf52b64d9530727338Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit8f70f034ac5123cf52b64d9530727338.url(args, options),
            method: 'post',
        })
    
    startTransit8f70f034ac5123cf52b64d9530727338.form = startTransit8f70f034ac5123cf52b64d9530727338Form

export const startTransit = {
    '/api/v1/rider/orders/{id}/transit': startTransit30258da9f6003769dffda8523c718911,
    '/api/v1/rider/orders/{id}/start-transit': startTransit3d4a120e156f1f46a4425fe1c8780098,
    '/api/v1/rider/transit/{id}': startTransit7ed31a4949747b6e96f901fb601a5eab,
    '/api/v1/rider/deliveries/{id}/transit': startTransit7204c23f000441f71edfe1aa1866a99e,
    '/api/rider/orders/{id}/transit': startTransit113e82e4514b9b80d3702387e44dbe82,
    '/api/rider/orders/{id}/start-transit': startTransit77d49b870894a1805e11bde9d897789e,
    '/api/rider/transit/{id}': startTransit58df34427d051990bfb390a3c01e3fec,
    '/api/rider/deliveries/{id}/transit': startTransit4586cdd73c0462dc23203ea167ac549d,
    '/rider/orders/{id}/transit': startTransit2650eda1d910bc50aba05c6b0225785a,
    '/rider/transit/{id}': startTransit8f70f034ac5123cf52b64d9530727338,
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
const deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.url(args, options),
    method: 'post',
})

deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/deliver',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
    const deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
        deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.url(args, options),
            method: 'post',
        })
    
    deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.form = deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3Form
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/orders/{id}/delivered'
 */
const deliverOrder957f66b3f174bff2e3c407083161585a = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder957f66b3f174bff2e3c407083161585a.url(args, options),
    method: 'post',
})

deliverOrder957f66b3f174bff2e3c407083161585a.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/delivered',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/orders/{id}/delivered'
 */
deliverOrder957f66b3f174bff2e3c407083161585a.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrder957f66b3f174bff2e3c407083161585a.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/orders/{id}/delivered'
 */
deliverOrder957f66b3f174bff2e3c407083161585a.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder957f66b3f174bff2e3c407083161585a.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/orders/{id}/delivered'
 */
    const deliverOrder957f66b3f174bff2e3c407083161585aForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrder957f66b3f174bff2e3c407083161585a.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/orders/{id}/delivered'
 */
        deliverOrder957f66b3f174bff2e3c407083161585aForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrder957f66b3f174bff2e3c407083161585a.url(args, options),
            method: 'post',
        })
    
    deliverOrder957f66b3f174bff2e3c407083161585a.form = deliverOrder957f66b3f174bff2e3c407083161585aForm
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/deliver/{id}'
 */
const deliverOrder677bd9d0e9ee8e1598e3389ca8b96473 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.url(args, options),
    method: 'post',
})

deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.definition = {
    methods: ["post"],
    url: '/api/v1/rider/deliver/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/deliver/{id}'
 */
deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/deliver/{id}'
 */
deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/deliver/{id}'
 */
    const deliverOrder677bd9d0e9ee8e1598e3389ca8b96473Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/deliver/{id}'
 */
        deliverOrder677bd9d0e9ee8e1598e3389ca8b96473Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.url(args, options),
            method: 'post',
        })
    
    deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.form = deliverOrder677bd9d0e9ee8e1598e3389ca8b96473Form
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/deliveries/{id}/deliver'
 */
const deliverOrder742262753097a1c279d47ec4b7638dc9 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder742262753097a1c279d47ec4b7638dc9.url(args, options),
    method: 'post',
})

deliverOrder742262753097a1c279d47ec4b7638dc9.definition = {
    methods: ["post"],
    url: '/api/v1/rider/deliveries/{id}/deliver',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/deliveries/{id}/deliver'
 */
deliverOrder742262753097a1c279d47ec4b7638dc9.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrder742262753097a1c279d47ec4b7638dc9.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/deliveries/{id}/deliver'
 */
deliverOrder742262753097a1c279d47ec4b7638dc9.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder742262753097a1c279d47ec4b7638dc9.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/deliveries/{id}/deliver'
 */
    const deliverOrder742262753097a1c279d47ec4b7638dc9Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrder742262753097a1c279d47ec4b7638dc9.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/v1/rider/deliveries/{id}/deliver'
 */
        deliverOrder742262753097a1c279d47ec4b7638dc9Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrder742262753097a1c279d47ec4b7638dc9.url(args, options),
            method: 'post',
        })
    
    deliverOrder742262753097a1c279d47ec4b7638dc9.form = deliverOrder742262753097a1c279d47ec4b7638dc9Form
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/orders/{id}/deliver'
 */
const deliverOrdera86283c8722d7e0d3031b8c518471787 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrdera86283c8722d7e0d3031b8c518471787.url(args, options),
    method: 'post',
})

deliverOrdera86283c8722d7e0d3031b8c518471787.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/deliver',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/orders/{id}/deliver'
 */
deliverOrdera86283c8722d7e0d3031b8c518471787.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrdera86283c8722d7e0d3031b8c518471787.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/orders/{id}/deliver'
 */
deliverOrdera86283c8722d7e0d3031b8c518471787.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrdera86283c8722d7e0d3031b8c518471787.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/orders/{id}/deliver'
 */
    const deliverOrdera86283c8722d7e0d3031b8c518471787Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrdera86283c8722d7e0d3031b8c518471787.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/orders/{id}/deliver'
 */
        deliverOrdera86283c8722d7e0d3031b8c518471787Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrdera86283c8722d7e0d3031b8c518471787.url(args, options),
            method: 'post',
        })
    
    deliverOrdera86283c8722d7e0d3031b8c518471787.form = deliverOrdera86283c8722d7e0d3031b8c518471787Form
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/orders/{id}/delivered'
 */
const deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.url(args, options),
    method: 'post',
})

deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/delivered',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/orders/{id}/delivered'
 */
deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/orders/{id}/delivered'
 */
deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/orders/{id}/delivered'
 */
    const deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/orders/{id}/delivered'
 */
        deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.url(args, options),
            method: 'post',
        })
    
    deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.form = deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0Form
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/deliver/{id}'
 */
const deliverOrder109e33c3005eaa55eaace9a56522f43a = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder109e33c3005eaa55eaace9a56522f43a.url(args, options),
    method: 'post',
})

deliverOrder109e33c3005eaa55eaace9a56522f43a.definition = {
    methods: ["post"],
    url: '/api/rider/deliver/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/deliver/{id}'
 */
deliverOrder109e33c3005eaa55eaace9a56522f43a.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrder109e33c3005eaa55eaace9a56522f43a.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/deliver/{id}'
 */
deliverOrder109e33c3005eaa55eaace9a56522f43a.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder109e33c3005eaa55eaace9a56522f43a.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/deliver/{id}'
 */
    const deliverOrder109e33c3005eaa55eaace9a56522f43aForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrder109e33c3005eaa55eaace9a56522f43a.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/deliver/{id}'
 */
        deliverOrder109e33c3005eaa55eaace9a56522f43aForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrder109e33c3005eaa55eaace9a56522f43a.url(args, options),
            method: 'post',
        })
    
    deliverOrder109e33c3005eaa55eaace9a56522f43a.form = deliverOrder109e33c3005eaa55eaace9a56522f43aForm
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/deliveries/{id}/deliver'
 */
const deliverOrdercc24c15e59bef31014cb90aa4c723d39 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrdercc24c15e59bef31014cb90aa4c723d39.url(args, options),
    method: 'post',
})

deliverOrdercc24c15e59bef31014cb90aa4c723d39.definition = {
    methods: ["post"],
    url: '/api/rider/deliveries/{id}/deliver',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/deliveries/{id}/deliver'
 */
deliverOrdercc24c15e59bef31014cb90aa4c723d39.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrdercc24c15e59bef31014cb90aa4c723d39.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/deliveries/{id}/deliver'
 */
deliverOrdercc24c15e59bef31014cb90aa4c723d39.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrdercc24c15e59bef31014cb90aa4c723d39.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/deliveries/{id}/deliver'
 */
    const deliverOrdercc24c15e59bef31014cb90aa4c723d39Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrdercc24c15e59bef31014cb90aa4c723d39.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/api/rider/deliveries/{id}/deliver'
 */
        deliverOrdercc24c15e59bef31014cb90aa4c723d39Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrdercc24c15e59bef31014cb90aa4c723d39.url(args, options),
            method: 'post',
        })
    
    deliverOrdercc24c15e59bef31014cb90aa4c723d39.form = deliverOrdercc24c15e59bef31014cb90aa4c723d39Form
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/rider/orders/{id}/deliver'
 */
const deliverOrder7b86cb38ae1092baebc044a57e3bdd04 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder7b86cb38ae1092baebc044a57e3bdd04.url(args, options),
    method: 'post',
})

deliverOrder7b86cb38ae1092baebc044a57e3bdd04.definition = {
    methods: ["post"],
    url: '/rider/orders/{id}/deliver',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/rider/orders/{id}/deliver'
 */
deliverOrder7b86cb38ae1092baebc044a57e3bdd04.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrder7b86cb38ae1092baebc044a57e3bdd04.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/rider/orders/{id}/deliver'
 */
deliverOrder7b86cb38ae1092baebc044a57e3bdd04.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder7b86cb38ae1092baebc044a57e3bdd04.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/rider/orders/{id}/deliver'
 */
    const deliverOrder7b86cb38ae1092baebc044a57e3bdd04Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrder7b86cb38ae1092baebc044a57e3bdd04.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/rider/orders/{id}/deliver'
 */
        deliverOrder7b86cb38ae1092baebc044a57e3bdd04Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrder7b86cb38ae1092baebc044a57e3bdd04.url(args, options),
            method: 'post',
        })
    
    deliverOrder7b86cb38ae1092baebc044a57e3bdd04.form = deliverOrder7b86cb38ae1092baebc044a57e3bdd04Form
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/rider/deliver/{id}'
 */
const deliverOrder5d9871cc283aefa8a7002f71ae365574 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder5d9871cc283aefa8a7002f71ae365574.url(args, options),
    method: 'post',
})

deliverOrder5d9871cc283aefa8a7002f71ae365574.definition = {
    methods: ["post"],
    url: '/rider/deliver/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/rider/deliver/{id}'
 */
deliverOrder5d9871cc283aefa8a7002f71ae365574.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrder5d9871cc283aefa8a7002f71ae365574.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/rider/deliver/{id}'
 */
deliverOrder5d9871cc283aefa8a7002f71ae365574.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder5d9871cc283aefa8a7002f71ae365574.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/rider/deliver/{id}'
 */
    const deliverOrder5d9871cc283aefa8a7002f71ae365574Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrder5d9871cc283aefa8a7002f71ae365574.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:537
 * @route '/rider/deliver/{id}'
 */
        deliverOrder5d9871cc283aefa8a7002f71ae365574Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrder5d9871cc283aefa8a7002f71ae365574.url(args, options),
            method: 'post',
        })
    
    deliverOrder5d9871cc283aefa8a7002f71ae365574.form = deliverOrder5d9871cc283aefa8a7002f71ae365574Form

export const deliverOrder = {
    '/api/v1/rider/orders/{id}/deliver': deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3,
    '/api/v1/rider/orders/{id}/delivered': deliverOrder957f66b3f174bff2e3c407083161585a,
    '/api/v1/rider/deliver/{id}': deliverOrder677bd9d0e9ee8e1598e3389ca8b96473,
    '/api/v1/rider/deliveries/{id}/deliver': deliverOrder742262753097a1c279d47ec4b7638dc9,
    '/api/rider/orders/{id}/deliver': deliverOrdera86283c8722d7e0d3031b8c518471787,
    '/api/rider/orders/{id}/delivered': deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0,
    '/api/rider/deliver/{id}': deliverOrder109e33c3005eaa55eaace9a56522f43a,
    '/api/rider/deliveries/{id}/deliver': deliverOrdercc24c15e59bef31014cb90aa4c723d39,
    '/rider/orders/{id}/deliver': deliverOrder7b86cb38ae1092baebc044a57e3bdd04,
    '/rider/deliver/{id}': deliverOrder5d9871cc283aefa8a7002f71ae365574,
}

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/v1/rider/orders/{id}/reject'
 */
const rejectOrderfaac7c9761f8bf4f25eb23e454f6727b = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.url(args, options),
    method: 'post',
})

rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/v1/rider/orders/{id}/reject'
 */
rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/v1/rider/orders/{id}/reject'
 */
rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/v1/rider/orders/{id}/reject'
 */
    const rejectOrderfaac7c9761f8bf4f25eb23e454f6727bForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/v1/rider/orders/{id}/reject'
 */
        rejectOrderfaac7c9761f8bf4f25eb23e454f6727bForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.url(args, options),
            method: 'post',
        })
    
    rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.form = rejectOrderfaac7c9761f8bf4f25eb23e454f6727bForm
    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/v1/rider/reject/{id}'
 */
const rejectOrderd0da61b346e67a58bd389a41ba2c9177 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrderd0da61b346e67a58bd389a41ba2c9177.url(args, options),
    method: 'post',
})

rejectOrderd0da61b346e67a58bd389a41ba2c9177.definition = {
    methods: ["post"],
    url: '/api/v1/rider/reject/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/v1/rider/reject/{id}'
 */
rejectOrderd0da61b346e67a58bd389a41ba2c9177.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return rejectOrderd0da61b346e67a58bd389a41ba2c9177.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/v1/rider/reject/{id}'
 */
rejectOrderd0da61b346e67a58bd389a41ba2c9177.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrderd0da61b346e67a58bd389a41ba2c9177.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/v1/rider/reject/{id}'
 */
    const rejectOrderd0da61b346e67a58bd389a41ba2c9177Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectOrderd0da61b346e67a58bd389a41ba2c9177.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/v1/rider/reject/{id}'
 */
        rejectOrderd0da61b346e67a58bd389a41ba2c9177Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectOrderd0da61b346e67a58bd389a41ba2c9177.url(args, options),
            method: 'post',
        })
    
    rejectOrderd0da61b346e67a58bd389a41ba2c9177.form = rejectOrderd0da61b346e67a58bd389a41ba2c9177Form
    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/rider/orders/{id}/reject'
 */
const rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.url(args, options),
    method: 'post',
})

rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/rider/orders/{id}/reject'
 */
rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/rider/orders/{id}/reject'
 */
rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/rider/orders/{id}/reject'
 */
    const rejectOrder94fb5ab30d0131e4068baa7bd57d7ecdForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/rider/orders/{id}/reject'
 */
        rejectOrder94fb5ab30d0131e4068baa7bd57d7ecdForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.url(args, options),
            method: 'post',
        })
    
    rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.form = rejectOrder94fb5ab30d0131e4068baa7bd57d7ecdForm
    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/rider/reject/{id}'
 */
const rejectOrder0bce80e7cfca195a7d764248ee635960 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrder0bce80e7cfca195a7d764248ee635960.url(args, options),
    method: 'post',
})

rejectOrder0bce80e7cfca195a7d764248ee635960.definition = {
    methods: ["post"],
    url: '/api/rider/reject/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/rider/reject/{id}'
 */
rejectOrder0bce80e7cfca195a7d764248ee635960.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return rejectOrder0bce80e7cfca195a7d764248ee635960.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/rider/reject/{id}'
 */
rejectOrder0bce80e7cfca195a7d764248ee635960.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrder0bce80e7cfca195a7d764248ee635960.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/rider/reject/{id}'
 */
    const rejectOrder0bce80e7cfca195a7d764248ee635960Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectOrder0bce80e7cfca195a7d764248ee635960.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/api/rider/reject/{id}'
 */
        rejectOrder0bce80e7cfca195a7d764248ee635960Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectOrder0bce80e7cfca195a7d764248ee635960.url(args, options),
            method: 'post',
        })
    
    rejectOrder0bce80e7cfca195a7d764248ee635960.form = rejectOrder0bce80e7cfca195a7d764248ee635960Form
    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/rider/orders/{id}/reject'
 */
const rejectOrder4d0498eb87f49644a5fb6a2a65951c23 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrder4d0498eb87f49644a5fb6a2a65951c23.url(args, options),
    method: 'post',
})

rejectOrder4d0498eb87f49644a5fb6a2a65951c23.definition = {
    methods: ["post"],
    url: '/rider/orders/{id}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/rider/orders/{id}/reject'
 */
rejectOrder4d0498eb87f49644a5fb6a2a65951c23.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return rejectOrder4d0498eb87f49644a5fb6a2a65951c23.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/rider/orders/{id}/reject'
 */
rejectOrder4d0498eb87f49644a5fb6a2a65951c23.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrder4d0498eb87f49644a5fb6a2a65951c23.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/rider/orders/{id}/reject'
 */
    const rejectOrder4d0498eb87f49644a5fb6a2a65951c23Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectOrder4d0498eb87f49644a5fb6a2a65951c23.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:774
 * @route '/rider/orders/{id}/reject'
 */
        rejectOrder4d0498eb87f49644a5fb6a2a65951c23Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectOrder4d0498eb87f49644a5fb6a2a65951c23.url(args, options),
            method: 'post',
        })
    
    rejectOrder4d0498eb87f49644a5fb6a2a65951c23.form = rejectOrder4d0498eb87f49644a5fb6a2a65951c23Form

export const rejectOrder = {
    '/api/v1/rider/orders/{id}/reject': rejectOrderfaac7c9761f8bf4f25eb23e454f6727b,
    '/api/v1/rider/reject/{id}': rejectOrderd0da61b346e67a58bd389a41ba2c9177,
    '/api/rider/orders/{id}/reject': rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd,
    '/api/rider/reject/{id}': rejectOrder0bce80e7cfca195a7d764248ee635960,
    '/rider/orders/{id}/reject': rejectOrder4d0498eb87f49644a5fb6a2a65951c23,
}

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
const cancelOrderc6e91f42a6a96f0dc48849a40d8ac513 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url(args, options),
    method: 'post',
})

cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
    const cancelOrderc6e91f42a6a96f0dc48849a40d8ac513Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
        cancelOrderc6e91f42a6a96f0dc48849a40d8ac513Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url(args, options),
            method: 'post',
        })
    
    cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.form = cancelOrderc6e91f42a6a96f0dc48849a40d8ac513Form
    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
const cancelOrder676ea8b862358a07db7266022896cc59 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder676ea8b862358a07db7266022896cc59.url(args, options),
    method: 'post',
})

cancelOrder676ea8b862358a07db7266022896cc59.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/cancel-request',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
cancelOrder676ea8b862358a07db7266022896cc59.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return cancelOrder676ea8b862358a07db7266022896cc59.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
cancelOrder676ea8b862358a07db7266022896cc59.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder676ea8b862358a07db7266022896cc59.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
    const cancelOrder676ea8b862358a07db7266022896cc59Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelOrder676ea8b862358a07db7266022896cc59.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
        cancelOrder676ea8b862358a07db7266022896cc59Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelOrder676ea8b862358a07db7266022896cc59.url(args, options),
            method: 'post',
        })
    
    cancelOrder676ea8b862358a07db7266022896cc59.form = cancelOrder676ea8b862358a07db7266022896cc59Form
    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/api/rider/orders/{id}/cancel'
 */
const cancelOrder0ee1fe1f36eddf0b892c4836f981f776 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder0ee1fe1f36eddf0b892c4836f981f776.url(args, options),
    method: 'post',
})

cancelOrder0ee1fe1f36eddf0b892c4836f981f776.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/api/rider/orders/{id}/cancel'
 */
cancelOrder0ee1fe1f36eddf0b892c4836f981f776.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return cancelOrder0ee1fe1f36eddf0b892c4836f981f776.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/api/rider/orders/{id}/cancel'
 */
cancelOrder0ee1fe1f36eddf0b892c4836f981f776.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder0ee1fe1f36eddf0b892c4836f981f776.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/api/rider/orders/{id}/cancel'
 */
    const cancelOrder0ee1fe1f36eddf0b892c4836f981f776Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelOrder0ee1fe1f36eddf0b892c4836f981f776.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/api/rider/orders/{id}/cancel'
 */
        cancelOrder0ee1fe1f36eddf0b892c4836f981f776Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelOrder0ee1fe1f36eddf0b892c4836f981f776.url(args, options),
            method: 'post',
        })
    
    cancelOrder0ee1fe1f36eddf0b892c4836f981f776.form = cancelOrder0ee1fe1f36eddf0b892c4836f981f776Form
    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/rider/orders/{id}/cancel'
 */
const cancelOrder60c7b3d61dbfd26c9a9367be40523e1f = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder60c7b3d61dbfd26c9a9367be40523e1f.url(args, options),
    method: 'post',
})

cancelOrder60c7b3d61dbfd26c9a9367be40523e1f.definition = {
    methods: ["post"],
    url: '/rider/orders/{id}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/rider/orders/{id}/cancel'
 */
cancelOrder60c7b3d61dbfd26c9a9367be40523e1f.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return cancelOrder60c7b3d61dbfd26c9a9367be40523e1f.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/rider/orders/{id}/cancel'
 */
cancelOrder60c7b3d61dbfd26c9a9367be40523e1f.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder60c7b3d61dbfd26c9a9367be40523e1f.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/rider/orders/{id}/cancel'
 */
    const cancelOrder60c7b3d61dbfd26c9a9367be40523e1fForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelOrder60c7b3d61dbfd26c9a9367be40523e1f.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:640
 * @route '/rider/orders/{id}/cancel'
 */
        cancelOrder60c7b3d61dbfd26c9a9367be40523e1fForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelOrder60c7b3d61dbfd26c9a9367be40523e1f.url(args, options),
            method: 'post',
        })
    
    cancelOrder60c7b3d61dbfd26c9a9367be40523e1f.form = cancelOrder60c7b3d61dbfd26c9a9367be40523e1fForm

export const cancelOrder = {
    '/api/v1/rider/orders/{id}/cancel': cancelOrderc6e91f42a6a96f0dc48849a40d8ac513,
    '/api/v1/rider/orders/{id}/cancel-request': cancelOrder676ea8b862358a07db7266022896cc59,
    '/api/rider/orders/{id}/cancel': cancelOrder0ee1fe1f36eddf0b892c4836f981f776,
    '/rider/orders/{id}/cancel': cancelOrder60c7b3d61dbfd26c9a9367be40523e1f,
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/status'
 */
const updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, options),
    method: 'post',
})

updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.definition = {
    methods: ["post","patch","put"],
    url: '/api/v1/rider/orders/{id}/status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/status'
 */
updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/status'
 */
updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/status'
 */
updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/status'
 */
updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/status'
 */
    const updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/status'
 */
        updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/status'
 */
        updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03Form.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/status'
 */
        updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03Form.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.form = updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03Form
    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
const updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, options),
    method: 'post',
})

updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.definition = {
    methods: ["post","patch","put"],
    url: '/api/v1/rider/orders/{id}/update-status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
    const updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
        updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
        updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78Form.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
        updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78Form.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.form = updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78Form
    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
const updateOrderStatuscbd2e640a6d084966c4b93513ac821a4 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, options),
    method: 'post',
})

updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.definition = {
    methods: ["post","patch","put"],
    url: '/api/v1/rider/deliveries/{id}/status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
    const updateOrderStatuscbd2e640a6d084966c4b93513ac821a4Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
        updateOrderStatuscbd2e640a6d084966c4b93513ac821a4Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
        updateOrderStatuscbd2e640a6d084966c4b93513ac821a4Form.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
        updateOrderStatuscbd2e640a6d084966c4b93513ac821a4Form.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.form = updateOrderStatuscbd2e640a6d084966c4b93513ac821a4Form
    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
const updateOrderStatus81e46a29d61266cc4724ede338200a4d = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, options),
    method: 'post',
})

updateOrderStatus81e46a29d61266cc4724ede338200a4d.definition = {
    methods: ["post","patch","put"],
    url: '/api/v1/rider/deliveries/{id}/update-status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
updateOrderStatus81e46a29d61266cc4724ede338200a4d.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatus81e46a29d61266cc4724ede338200a4d.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
updateOrderStatus81e46a29d61266cc4724ede338200a4d.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
updateOrderStatus81e46a29d61266cc4724ede338200a4d.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
updateOrderStatus81e46a29d61266cc4724ede338200a4d.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
    const updateOrderStatus81e46a29d61266cc4724ede338200a4dForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
        updateOrderStatus81e46a29d61266cc4724ede338200a4dForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
        updateOrderStatus81e46a29d61266cc4724ede338200a4dForm.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
        updateOrderStatus81e46a29d61266cc4724ede338200a4dForm.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatus81e46a29d61266cc4724ede338200a4d.form = updateOrderStatus81e46a29d61266cc4724ede338200a4dForm
    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/status'
 */
const updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, options),
    method: 'post',
})

updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.definition = {
    methods: ["post","patch","put"],
    url: '/api/rider/orders/{id}/status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/status'
 */
updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/status'
 */
updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/status'
 */
updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/status'
 */
updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/status'
 */
    const updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/status'
 */
        updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/status'
 */
        updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045Form.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/status'
 */
        updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045Form.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.form = updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045Form
    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/update-status'
 */
const updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, options),
    method: 'post',
})

updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.definition = {
    methods: ["post","patch","put"],
    url: '/api/rider/orders/{id}/update-status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/update-status'
 */
updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/update-status'
 */
updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/update-status'
 */
updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/update-status'
 */
updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/update-status'
 */
    const updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9eForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/update-status'
 */
        updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9eForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/update-status'
 */
        updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9eForm.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/orders/{id}/update-status'
 */
        updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9eForm.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.form = updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9eForm
    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/status'
 */
const updateOrderStatus00ee555570055eb15285d11011471824 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus00ee555570055eb15285d11011471824.url(args, options),
    method: 'post',
})

updateOrderStatus00ee555570055eb15285d11011471824.definition = {
    methods: ["post","patch","put"],
    url: '/api/rider/deliveries/{id}/status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/status'
 */
updateOrderStatus00ee555570055eb15285d11011471824.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatus00ee555570055eb15285d11011471824.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/status'
 */
updateOrderStatus00ee555570055eb15285d11011471824.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus00ee555570055eb15285d11011471824.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/status'
 */
updateOrderStatus00ee555570055eb15285d11011471824.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatus00ee555570055eb15285d11011471824.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/status'
 */
updateOrderStatus00ee555570055eb15285d11011471824.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatus00ee555570055eb15285d11011471824.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/status'
 */
    const updateOrderStatus00ee555570055eb15285d11011471824Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatus00ee555570055eb15285d11011471824.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/status'
 */
        updateOrderStatus00ee555570055eb15285d11011471824Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus00ee555570055eb15285d11011471824.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/status'
 */
        updateOrderStatus00ee555570055eb15285d11011471824Form.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus00ee555570055eb15285d11011471824.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/status'
 */
        updateOrderStatus00ee555570055eb15285d11011471824Form.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus00ee555570055eb15285d11011471824.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatus00ee555570055eb15285d11011471824.form = updateOrderStatus00ee555570055eb15285d11011471824Form
    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/update-status'
 */
const updateOrderStatus9439ef2803b109be42573f7660c0c104 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, options),
    method: 'post',
})

updateOrderStatus9439ef2803b109be42573f7660c0c104.definition = {
    methods: ["post","patch","put"],
    url: '/api/rider/deliveries/{id}/update-status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/update-status'
 */
updateOrderStatus9439ef2803b109be42573f7660c0c104.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatus9439ef2803b109be42573f7660c0c104.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/update-status'
 */
updateOrderStatus9439ef2803b109be42573f7660c0c104.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/update-status'
 */
updateOrderStatus9439ef2803b109be42573f7660c0c104.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/update-status'
 */
updateOrderStatus9439ef2803b109be42573f7660c0c104.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/update-status'
 */
    const updateOrderStatus9439ef2803b109be42573f7660c0c104Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/update-status'
 */
        updateOrderStatus9439ef2803b109be42573f7660c0c104Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/update-status'
 */
        updateOrderStatus9439ef2803b109be42573f7660c0c104Form.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/api/rider/deliveries/{id}/update-status'
 */
        updateOrderStatus9439ef2803b109be42573f7660c0c104Form.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatus9439ef2803b109be42573f7660c0c104.form = updateOrderStatus9439ef2803b109be42573f7660c0c104Form
    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/rider/orders/{id}/status'
 */
const updateOrderStatus021c5f0c898364a125da34c58d0d3270 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus021c5f0c898364a125da34c58d0d3270.url(args, options),
    method: 'post',
})

updateOrderStatus021c5f0c898364a125da34c58d0d3270.definition = {
    methods: ["post","patch","put"],
    url: '/rider/orders/{id}/status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/rider/orders/{id}/status'
 */
updateOrderStatus021c5f0c898364a125da34c58d0d3270.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatus021c5f0c898364a125da34c58d0d3270.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/rider/orders/{id}/status'
 */
updateOrderStatus021c5f0c898364a125da34c58d0d3270.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus021c5f0c898364a125da34c58d0d3270.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/rider/orders/{id}/status'
 */
updateOrderStatus021c5f0c898364a125da34c58d0d3270.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatus021c5f0c898364a125da34c58d0d3270.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/rider/orders/{id}/status'
 */
updateOrderStatus021c5f0c898364a125da34c58d0d3270.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatus021c5f0c898364a125da34c58d0d3270.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/rider/orders/{id}/status'
 */
    const updateOrderStatus021c5f0c898364a125da34c58d0d3270Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatus021c5f0c898364a125da34c58d0d3270.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/rider/orders/{id}/status'
 */
        updateOrderStatus021c5f0c898364a125da34c58d0d3270Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus021c5f0c898364a125da34c58d0d3270.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/rider/orders/{id}/status'
 */
        updateOrderStatus021c5f0c898364a125da34c58d0d3270Form.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus021c5f0c898364a125da34c58d0d3270.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:449
 * @route '/rider/orders/{id}/status'
 */
        updateOrderStatus021c5f0c898364a125da34c58d0d3270Form.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus021c5f0c898364a125da34c58d0d3270.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatus021c5f0c898364a125da34c58d0d3270.form = updateOrderStatus021c5f0c898364a125da34c58d0d3270Form

export const updateOrderStatus = {
    '/api/v1/rider/orders/{id}/status': updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03,
    '/api/v1/rider/orders/{id}/update-status': updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78,
    '/api/v1/rider/deliveries/{id}/status': updateOrderStatuscbd2e640a6d084966c4b93513ac821a4,
    '/api/v1/rider/deliveries/{id}/update-status': updateOrderStatus81e46a29d61266cc4724ede338200a4d,
    '/api/rider/orders/{id}/status': updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045,
    '/api/rider/orders/{id}/update-status': updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e,
    '/api/rider/deliveries/{id}/status': updateOrderStatus00ee555570055eb15285d11011471824,
    '/api/rider/deliveries/{id}/update-status': updateOrderStatus9439ef2803b109be42573f7660c0c104,
    '/rider/orders/{id}/status': updateOrderStatus021c5f0c898364a125da34c58d0d3270,
}

const RiderController = { getOrders, getMyOrders, changePassword, updateStatus, ping, getStats, updateLocation, getCompletedOrders, acceptOrder, pickupOrder, startTransit, deliverOrder, rejectOrder, cancelOrder, updateOrderStatus }

export default RiderController