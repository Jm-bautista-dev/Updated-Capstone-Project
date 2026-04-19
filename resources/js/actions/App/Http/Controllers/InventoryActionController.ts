import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\InventoryActionController::index
 * @see app/Http/Controllers/InventoryActionController.php:16
 * @route '/inventory-items'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventory-items',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventoryActionController::index
 * @see app/Http/Controllers/InventoryActionController.php:16
 * @route '/inventory-items'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryActionController::index
 * @see app/Http/Controllers/InventoryActionController.php:16
 * @route '/inventory-items'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventoryActionController::index
 * @see app/Http/Controllers/InventoryActionController.php:16
 * @route '/inventory-items'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventoryActionController::index
 * @see app/Http/Controllers/InventoryActionController.php:16
 * @route '/inventory-items'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventoryActionController::index
 * @see app/Http/Controllers/InventoryActionController.php:16
 * @route '/inventory-items'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventoryActionController::index
 * @see app/Http/Controllers/InventoryActionController.php:16
 * @route '/inventory-items'
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
* @see \App\Http\Controllers\InventoryActionController::store
 * @see app/Http/Controllers/InventoryActionController.php:60
 * @route '/inventory-items'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/inventory-items',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventoryActionController::store
 * @see app/Http/Controllers/InventoryActionController.php:60
 * @route '/inventory-items'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryActionController::store
 * @see app/Http/Controllers/InventoryActionController.php:60
 * @route '/inventory-items'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventoryActionController::store
 * @see app/Http/Controllers/InventoryActionController.php:60
 * @route '/inventory-items'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventoryActionController::store
 * @see app/Http/Controllers/InventoryActionController.php:60
 * @route '/inventory-items'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\InventoryActionController::pos
 * @see app/Http/Controllers/InventoryActionController.php:38
 * @route '/pos/weight'
 */
export const pos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pos.url(options),
    method: 'get',
})

pos.definition = {
    methods: ["get","head"],
    url: '/pos/weight',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventoryActionController::pos
 * @see app/Http/Controllers/InventoryActionController.php:38
 * @route '/pos/weight'
 */
pos.url = (options?: RouteQueryOptions) => {
    return pos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryActionController::pos
 * @see app/Http/Controllers/InventoryActionController.php:38
 * @route '/pos/weight'
 */
pos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventoryActionController::pos
 * @see app/Http/Controllers/InventoryActionController.php:38
 * @route '/pos/weight'
 */
pos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventoryActionController::pos
 * @see app/Http/Controllers/InventoryActionController.php:38
 * @route '/pos/weight'
 */
    const posForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: pos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventoryActionController::pos
 * @see app/Http/Controllers/InventoryActionController.php:38
 * @route '/pos/weight'
 */
        posForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventoryActionController::pos
 * @see app/Http/Controllers/InventoryActionController.php:38
 * @route '/pos/weight'
 */
        posForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pos.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    pos.form = posForm
/**
* @see \App\Http\Controllers\InventoryActionController::processSale
 * @see app/Http/Controllers/InventoryActionController.php:91
 * @route '/pos/inventory-sale'
 */
export const processSale = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: processSale.url(options),
    method: 'post',
})

processSale.definition = {
    methods: ["post"],
    url: '/pos/inventory-sale',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventoryActionController::processSale
 * @see app/Http/Controllers/InventoryActionController.php:91
 * @route '/pos/inventory-sale'
 */
processSale.url = (options?: RouteQueryOptions) => {
    return processSale.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryActionController::processSale
 * @see app/Http/Controllers/InventoryActionController.php:91
 * @route '/pos/inventory-sale'
 */
processSale.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: processSale.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventoryActionController::processSale
 * @see app/Http/Controllers/InventoryActionController.php:91
 * @route '/pos/inventory-sale'
 */
    const processSaleForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: processSale.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventoryActionController::processSale
 * @see app/Http/Controllers/InventoryActionController.php:91
 * @route '/pos/inventory-sale'
 */
        processSaleForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: processSale.url(options),
            method: 'post',
        })
    
    processSale.form = processSaleForm
/**
* @see \App\Http\Controllers\InventoryActionController::history
 * @see app/Http/Controllers/InventoryActionController.php:124
 * @route '/inventory-sales-history'
 */
export const history = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: history.url(options),
    method: 'get',
})

history.definition = {
    methods: ["get","head"],
    url: '/inventory-sales-history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventoryActionController::history
 * @see app/Http/Controllers/InventoryActionController.php:124
 * @route '/inventory-sales-history'
 */
history.url = (options?: RouteQueryOptions) => {
    return history.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryActionController::history
 * @see app/Http/Controllers/InventoryActionController.php:124
 * @route '/inventory-sales-history'
 */
history.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: history.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventoryActionController::history
 * @see app/Http/Controllers/InventoryActionController.php:124
 * @route '/inventory-sales-history'
 */
history.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: history.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventoryActionController::history
 * @see app/Http/Controllers/InventoryActionController.php:124
 * @route '/inventory-sales-history'
 */
    const historyForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: history.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventoryActionController::history
 * @see app/Http/Controllers/InventoryActionController.php:124
 * @route '/inventory-sales-history'
 */
        historyForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: history.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventoryActionController::history
 * @see app/Http/Controllers/InventoryActionController.php:124
 * @route '/inventory-sales-history'
 */
        historyForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: history.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    history.form = historyForm
const InventoryActionController = { index, store, pos, processSale, history }

export default InventoryActionController