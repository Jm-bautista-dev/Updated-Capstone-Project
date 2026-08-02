import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\SyncApiController::storeSale
 * @see app/Http/Controllers/Api/SyncApiController.php:78
 * @route '/api/transactions/sale'
 */
export const storeSale = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeSale.url(options),
    method: 'post',
})

storeSale.definition = {
    methods: ["post"],
    url: '/api/transactions/sale',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\SyncApiController::storeSale
 * @see app/Http/Controllers/Api/SyncApiController.php:78
 * @route '/api/transactions/sale'
 */
storeSale.url = (options?: RouteQueryOptions) => {
    return storeSale.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\SyncApiController::storeSale
 * @see app/Http/Controllers/Api/SyncApiController.php:78
 * @route '/api/transactions/sale'
 */
storeSale.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeSale.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\SyncApiController::storeSale
 * @see app/Http/Controllers/Api/SyncApiController.php:78
 * @route '/api/transactions/sale'
 */
    const storeSaleForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeSale.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\SyncApiController::storeSale
 * @see app/Http/Controllers/Api/SyncApiController.php:78
 * @route '/api/transactions/sale'
 */
        storeSaleForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeSale.url(options),
            method: 'post',
        })
    
    storeSale.form = storeSaleForm
/**
* @see \App\Http\Controllers\Api\SyncApiController::updateInventory
 * @see app/Http/Controllers/Api/SyncApiController.php:133
 * @route '/api/inventory/update'
 */
export const updateInventory = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateInventory.url(options),
    method: 'post',
})

updateInventory.definition = {
    methods: ["post"],
    url: '/api/inventory/update',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\SyncApiController::updateInventory
 * @see app/Http/Controllers/Api/SyncApiController.php:133
 * @route '/api/inventory/update'
 */
updateInventory.url = (options?: RouteQueryOptions) => {
    return updateInventory.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\SyncApiController::updateInventory
 * @see app/Http/Controllers/Api/SyncApiController.php:133
 * @route '/api/inventory/update'
 */
updateInventory.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateInventory.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\SyncApiController::updateInventory
 * @see app/Http/Controllers/Api/SyncApiController.php:133
 * @route '/api/inventory/update'
 */
    const updateInventoryForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateInventory.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\SyncApiController::updateInventory
 * @see app/Http/Controllers/Api/SyncApiController.php:133
 * @route '/api/inventory/update'
 */
        updateInventoryForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateInventory.url(options),
            method: 'post',
        })
    
    updateInventory.form = updateInventoryForm
/**
* @see \App\Http\Controllers\Api\SyncApiController::requestRestock
 * @see app/Http/Controllers/Api/SyncApiController.php:221
 * @route '/api/restock/request'
 */
export const requestRestock = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: requestRestock.url(options),
    method: 'post',
})

requestRestock.definition = {
    methods: ["post"],
    url: '/api/restock/request',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\SyncApiController::requestRestock
 * @see app/Http/Controllers/Api/SyncApiController.php:221
 * @route '/api/restock/request'
 */
requestRestock.url = (options?: RouteQueryOptions) => {
    return requestRestock.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\SyncApiController::requestRestock
 * @see app/Http/Controllers/Api/SyncApiController.php:221
 * @route '/api/restock/request'
 */
requestRestock.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: requestRestock.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\SyncApiController::requestRestock
 * @see app/Http/Controllers/Api/SyncApiController.php:221
 * @route '/api/restock/request'
 */
    const requestRestockForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: requestRestock.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\SyncApiController::requestRestock
 * @see app/Http/Controllers/Api/SyncApiController.php:221
 * @route '/api/restock/request'
 */
        requestRestockForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: requestRestock.url(options),
            method: 'post',
        })
    
    requestRestock.form = requestRestockForm
/**
* @see \App\Http\Controllers\Api\SyncApiController::sync
 * @see app/Http/Controllers/Api/SyncApiController.php:273
 * @route '/api/sync'
 */
export const sync = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sync.url(options),
    method: 'post',
})

sync.definition = {
    methods: ["post"],
    url: '/api/sync',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\SyncApiController::sync
 * @see app/Http/Controllers/Api/SyncApiController.php:273
 * @route '/api/sync'
 */
sync.url = (options?: RouteQueryOptions) => {
    return sync.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\SyncApiController::sync
 * @see app/Http/Controllers/Api/SyncApiController.php:273
 * @route '/api/sync'
 */
sync.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sync.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\SyncApiController::sync
 * @see app/Http/Controllers/Api/SyncApiController.php:273
 * @route '/api/sync'
 */
    const syncForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: sync.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\SyncApiController::sync
 * @see app/Http/Controllers/Api/SyncApiController.php:273
 * @route '/api/sync'
 */
        syncForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: sync.url(options),
            method: 'post',
        })
    
    sync.form = syncForm
const SyncApiController = { storeSale, updateInventory, requestRestock, sync }

export default SyncApiController