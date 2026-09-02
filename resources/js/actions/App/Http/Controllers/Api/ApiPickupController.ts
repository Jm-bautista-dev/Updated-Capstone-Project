import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ApiPickupController::branches
 * @see app/Http/Controllers/Api/ApiPickupController.php:22
 * @route '/api/v1/customer/pickup-branches'
 */
const branchesab76a9eee9348b8e9d0aa90af53553ce = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: branchesab76a9eee9348b8e9d0aa90af53553ce.url(options),
    method: 'get',
})

branchesab76a9eee9348b8e9d0aa90af53553ce.definition = {
    methods: ["get","head"],
    url: '/api/v1/customer/pickup-branches',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiPickupController::branches
 * @see app/Http/Controllers/Api/ApiPickupController.php:22
 * @route '/api/v1/customer/pickup-branches'
 */
branchesab76a9eee9348b8e9d0aa90af53553ce.url = (options?: RouteQueryOptions) => {
    return branchesab76a9eee9348b8e9d0aa90af53553ce.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiPickupController::branches
 * @see app/Http/Controllers/Api/ApiPickupController.php:22
 * @route '/api/v1/customer/pickup-branches'
 */
branchesab76a9eee9348b8e9d0aa90af53553ce.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: branchesab76a9eee9348b8e9d0aa90af53553ce.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiPickupController::branches
 * @see app/Http/Controllers/Api/ApiPickupController.php:22
 * @route '/api/v1/customer/pickup-branches'
 */
branchesab76a9eee9348b8e9d0aa90af53553ce.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: branchesab76a9eee9348b8e9d0aa90af53553ce.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiPickupController::branches
 * @see app/Http/Controllers/Api/ApiPickupController.php:22
 * @route '/api/v1/customer/pickup-branches'
 */
    const branchesab76a9eee9348b8e9d0aa90af53553ceForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: branchesab76a9eee9348b8e9d0aa90af53553ce.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiPickupController::branches
 * @see app/Http/Controllers/Api/ApiPickupController.php:22
 * @route '/api/v1/customer/pickup-branches'
 */
        branchesab76a9eee9348b8e9d0aa90af53553ceForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: branchesab76a9eee9348b8e9d0aa90af53553ce.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiPickupController::branches
 * @see app/Http/Controllers/Api/ApiPickupController.php:22
 * @route '/api/v1/customer/pickup-branches'
 */
        branchesab76a9eee9348b8e9d0aa90af53553ceForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: branchesab76a9eee9348b8e9d0aa90af53553ce.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    branchesab76a9eee9348b8e9d0aa90af53553ce.form = branchesab76a9eee9348b8e9d0aa90af53553ceForm
    /**
* @see \App\Http\Controllers\Api\ApiPickupController::branches
 * @see app/Http/Controllers/Api/ApiPickupController.php:22
 * @route '/api/v1/pickup-branches'
 */
const branches4230ce738007ea59384663027ea74b7b = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: branches4230ce738007ea59384663027ea74b7b.url(options),
    method: 'get',
})

branches4230ce738007ea59384663027ea74b7b.definition = {
    methods: ["get","head"],
    url: '/api/v1/pickup-branches',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiPickupController::branches
 * @see app/Http/Controllers/Api/ApiPickupController.php:22
 * @route '/api/v1/pickup-branches'
 */
branches4230ce738007ea59384663027ea74b7b.url = (options?: RouteQueryOptions) => {
    return branches4230ce738007ea59384663027ea74b7b.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiPickupController::branches
 * @see app/Http/Controllers/Api/ApiPickupController.php:22
 * @route '/api/v1/pickup-branches'
 */
branches4230ce738007ea59384663027ea74b7b.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: branches4230ce738007ea59384663027ea74b7b.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiPickupController::branches
 * @see app/Http/Controllers/Api/ApiPickupController.php:22
 * @route '/api/v1/pickup-branches'
 */
branches4230ce738007ea59384663027ea74b7b.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: branches4230ce738007ea59384663027ea74b7b.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiPickupController::branches
 * @see app/Http/Controllers/Api/ApiPickupController.php:22
 * @route '/api/v1/pickup-branches'
 */
    const branches4230ce738007ea59384663027ea74b7bForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: branches4230ce738007ea59384663027ea74b7b.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiPickupController::branches
 * @see app/Http/Controllers/Api/ApiPickupController.php:22
 * @route '/api/v1/pickup-branches'
 */
        branches4230ce738007ea59384663027ea74b7bForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: branches4230ce738007ea59384663027ea74b7b.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiPickupController::branches
 * @see app/Http/Controllers/Api/ApiPickupController.php:22
 * @route '/api/v1/pickup-branches'
 */
        branches4230ce738007ea59384663027ea74b7bForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: branches4230ce738007ea59384663027ea74b7b.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    branches4230ce738007ea59384663027ea74b7b.form = branches4230ce738007ea59384663027ea74b7bForm

export const branches = {
    '/api/v1/customer/pickup-branches': branchesab76a9eee9348b8e9d0aa90af53553ce,
    '/api/v1/pickup-branches': branches4230ce738007ea59384663027ea74b7b,
}

/**
* @see \App\Http\Controllers\Api\ApiPickupController::slots
 * @see app/Http/Controllers/Api/ApiPickupController.php:36
 * @route '/api/v1/customer/pickup-slots'
 */
const slots4794296eee90b929e53adc063c0be421 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: slots4794296eee90b929e53adc063c0be421.url(options),
    method: 'get',
})

slots4794296eee90b929e53adc063c0be421.definition = {
    methods: ["get","head"],
    url: '/api/v1/customer/pickup-slots',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiPickupController::slots
 * @see app/Http/Controllers/Api/ApiPickupController.php:36
 * @route '/api/v1/customer/pickup-slots'
 */
slots4794296eee90b929e53adc063c0be421.url = (options?: RouteQueryOptions) => {
    return slots4794296eee90b929e53adc063c0be421.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiPickupController::slots
 * @see app/Http/Controllers/Api/ApiPickupController.php:36
 * @route '/api/v1/customer/pickup-slots'
 */
slots4794296eee90b929e53adc063c0be421.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: slots4794296eee90b929e53adc063c0be421.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiPickupController::slots
 * @see app/Http/Controllers/Api/ApiPickupController.php:36
 * @route '/api/v1/customer/pickup-slots'
 */
slots4794296eee90b929e53adc063c0be421.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: slots4794296eee90b929e53adc063c0be421.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiPickupController::slots
 * @see app/Http/Controllers/Api/ApiPickupController.php:36
 * @route '/api/v1/customer/pickup-slots'
 */
    const slots4794296eee90b929e53adc063c0be421Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: slots4794296eee90b929e53adc063c0be421.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiPickupController::slots
 * @see app/Http/Controllers/Api/ApiPickupController.php:36
 * @route '/api/v1/customer/pickup-slots'
 */
        slots4794296eee90b929e53adc063c0be421Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: slots4794296eee90b929e53adc063c0be421.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiPickupController::slots
 * @see app/Http/Controllers/Api/ApiPickupController.php:36
 * @route '/api/v1/customer/pickup-slots'
 */
        slots4794296eee90b929e53adc063c0be421Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: slots4794296eee90b929e53adc063c0be421.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    slots4794296eee90b929e53adc063c0be421.form = slots4794296eee90b929e53adc063c0be421Form
    /**
* @see \App\Http\Controllers\Api\ApiPickupController::slots
 * @see app/Http/Controllers/Api/ApiPickupController.php:36
 * @route '/api/v1/pickup-slots'
 */
const slots87a972ed87767d3d32bafbe2cdc7047d = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: slots87a972ed87767d3d32bafbe2cdc7047d.url(options),
    method: 'get',
})

slots87a972ed87767d3d32bafbe2cdc7047d.definition = {
    methods: ["get","head"],
    url: '/api/v1/pickup-slots',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiPickupController::slots
 * @see app/Http/Controllers/Api/ApiPickupController.php:36
 * @route '/api/v1/pickup-slots'
 */
slots87a972ed87767d3d32bafbe2cdc7047d.url = (options?: RouteQueryOptions) => {
    return slots87a972ed87767d3d32bafbe2cdc7047d.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiPickupController::slots
 * @see app/Http/Controllers/Api/ApiPickupController.php:36
 * @route '/api/v1/pickup-slots'
 */
slots87a972ed87767d3d32bafbe2cdc7047d.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: slots87a972ed87767d3d32bafbe2cdc7047d.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiPickupController::slots
 * @see app/Http/Controllers/Api/ApiPickupController.php:36
 * @route '/api/v1/pickup-slots'
 */
slots87a972ed87767d3d32bafbe2cdc7047d.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: slots87a972ed87767d3d32bafbe2cdc7047d.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiPickupController::slots
 * @see app/Http/Controllers/Api/ApiPickupController.php:36
 * @route '/api/v1/pickup-slots'
 */
    const slots87a972ed87767d3d32bafbe2cdc7047dForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: slots87a972ed87767d3d32bafbe2cdc7047d.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiPickupController::slots
 * @see app/Http/Controllers/Api/ApiPickupController.php:36
 * @route '/api/v1/pickup-slots'
 */
        slots87a972ed87767d3d32bafbe2cdc7047dForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: slots87a972ed87767d3d32bafbe2cdc7047d.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiPickupController::slots
 * @see app/Http/Controllers/Api/ApiPickupController.php:36
 * @route '/api/v1/pickup-slots'
 */
        slots87a972ed87767d3d32bafbe2cdc7047dForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: slots87a972ed87767d3d32bafbe2cdc7047d.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    slots87a972ed87767d3d32bafbe2cdc7047d.form = slots87a972ed87767d3d32bafbe2cdc7047dForm

export const slots = {
    '/api/v1/customer/pickup-slots': slots4794296eee90b929e53adc063c0be421,
    '/api/v1/pickup-slots': slots87a972ed87767d3d32bafbe2cdc7047d,
}

/**
* @see \App\Http\Controllers\Api\ApiPickupController::status
 * @see app/Http/Controllers/Api/ApiPickupController.php:58
 * @route '/api/v1/orders/{id}/pickup-status'
 */
const status07170d83401fa8c83aadbf90022caf2a = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status07170d83401fa8c83aadbf90022caf2a.url(args, options),
    method: 'get',
})

status07170d83401fa8c83aadbf90022caf2a.definition = {
    methods: ["get","head"],
    url: '/api/v1/orders/{id}/pickup-status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiPickupController::status
 * @see app/Http/Controllers/Api/ApiPickupController.php:58
 * @route '/api/v1/orders/{id}/pickup-status'
 */
status07170d83401fa8c83aadbf90022caf2a.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return status07170d83401fa8c83aadbf90022caf2a.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiPickupController::status
 * @see app/Http/Controllers/Api/ApiPickupController.php:58
 * @route '/api/v1/orders/{id}/pickup-status'
 */
status07170d83401fa8c83aadbf90022caf2a.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status07170d83401fa8c83aadbf90022caf2a.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiPickupController::status
 * @see app/Http/Controllers/Api/ApiPickupController.php:58
 * @route '/api/v1/orders/{id}/pickup-status'
 */
status07170d83401fa8c83aadbf90022caf2a.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status07170d83401fa8c83aadbf90022caf2a.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiPickupController::status
 * @see app/Http/Controllers/Api/ApiPickupController.php:58
 * @route '/api/v1/orders/{id}/pickup-status'
 */
    const status07170d83401fa8c83aadbf90022caf2aForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: status07170d83401fa8c83aadbf90022caf2a.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiPickupController::status
 * @see app/Http/Controllers/Api/ApiPickupController.php:58
 * @route '/api/v1/orders/{id}/pickup-status'
 */
        status07170d83401fa8c83aadbf90022caf2aForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: status07170d83401fa8c83aadbf90022caf2a.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiPickupController::status
 * @see app/Http/Controllers/Api/ApiPickupController.php:58
 * @route '/api/v1/orders/{id}/pickup-status'
 */
        status07170d83401fa8c83aadbf90022caf2aForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: status07170d83401fa8c83aadbf90022caf2a.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    status07170d83401fa8c83aadbf90022caf2a.form = status07170d83401fa8c83aadbf90022caf2aForm
    /**
* @see \App\Http\Controllers\Api\ApiPickupController::status
 * @see app/Http/Controllers/Api/ApiPickupController.php:58
 * @route '/api/v1/customer/orders/{id}/pickup-status'
 */
const status08647ff805d0ea6ed1503961c1df935e = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status08647ff805d0ea6ed1503961c1df935e.url(args, options),
    method: 'get',
})

status08647ff805d0ea6ed1503961c1df935e.definition = {
    methods: ["get","head"],
    url: '/api/v1/customer/orders/{id}/pickup-status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiPickupController::status
 * @see app/Http/Controllers/Api/ApiPickupController.php:58
 * @route '/api/v1/customer/orders/{id}/pickup-status'
 */
status08647ff805d0ea6ed1503961c1df935e.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return status08647ff805d0ea6ed1503961c1df935e.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiPickupController::status
 * @see app/Http/Controllers/Api/ApiPickupController.php:58
 * @route '/api/v1/customer/orders/{id}/pickup-status'
 */
status08647ff805d0ea6ed1503961c1df935e.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status08647ff805d0ea6ed1503961c1df935e.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiPickupController::status
 * @see app/Http/Controllers/Api/ApiPickupController.php:58
 * @route '/api/v1/customer/orders/{id}/pickup-status'
 */
status08647ff805d0ea6ed1503961c1df935e.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status08647ff805d0ea6ed1503961c1df935e.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiPickupController::status
 * @see app/Http/Controllers/Api/ApiPickupController.php:58
 * @route '/api/v1/customer/orders/{id}/pickup-status'
 */
    const status08647ff805d0ea6ed1503961c1df935eForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: status08647ff805d0ea6ed1503961c1df935e.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiPickupController::status
 * @see app/Http/Controllers/Api/ApiPickupController.php:58
 * @route '/api/v1/customer/orders/{id}/pickup-status'
 */
        status08647ff805d0ea6ed1503961c1df935eForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: status08647ff805d0ea6ed1503961c1df935e.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiPickupController::status
 * @see app/Http/Controllers/Api/ApiPickupController.php:58
 * @route '/api/v1/customer/orders/{id}/pickup-status'
 */
        status08647ff805d0ea6ed1503961c1df935eForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: status08647ff805d0ea6ed1503961c1df935e.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    status08647ff805d0ea6ed1503961c1df935e.form = status08647ff805d0ea6ed1503961c1df935eForm

export const status = {
    '/api/v1/orders/{id}/pickup-status': status07170d83401fa8c83aadbf90022caf2a,
    '/api/v1/customer/orders/{id}/pickup-status': status08647ff805d0ea6ed1503961c1df935e,
}

const ApiPickupController = { branches, slots, status }

export default ApiPickupController