import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\CartController::index
 * @see app/Http/Controllers/Api/CartController.php:17
 * @route '/api/v1/cart'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/v1/cart',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CartController::index
 * @see app/Http/Controllers/Api/CartController.php:17
 * @route '/api/v1/cart'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CartController::index
 * @see app/Http/Controllers/Api/CartController.php:17
 * @route '/api/v1/cart'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CartController::index
 * @see app/Http/Controllers/Api/CartController.php:17
 * @route '/api/v1/cart'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CartController::index
 * @see app/Http/Controllers/Api/CartController.php:17
 * @route '/api/v1/cart'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CartController::index
 * @see app/Http/Controllers/Api/CartController.php:17
 * @route '/api/v1/cart'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CartController::index
 * @see app/Http/Controllers/Api/CartController.php:17
 * @route '/api/v1/cart'
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
* @see \App\Http\Controllers\Api\CartController::addItem
 * @see app/Http/Controllers/Api/CartController.php:53
 * @route '/api/v1/cart/add'
 */
export const addItem = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addItem.url(options),
    method: 'post',
})

addItem.definition = {
    methods: ["post"],
    url: '/api/v1/cart/add',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CartController::addItem
 * @see app/Http/Controllers/Api/CartController.php:53
 * @route '/api/v1/cart/add'
 */
addItem.url = (options?: RouteQueryOptions) => {
    return addItem.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CartController::addItem
 * @see app/Http/Controllers/Api/CartController.php:53
 * @route '/api/v1/cart/add'
 */
addItem.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addItem.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CartController::addItem
 * @see app/Http/Controllers/Api/CartController.php:53
 * @route '/api/v1/cart/add'
 */
    const addItemForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: addItem.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CartController::addItem
 * @see app/Http/Controllers/Api/CartController.php:53
 * @route '/api/v1/cart/add'
 */
        addItemForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: addItem.url(options),
            method: 'post',
        })
    
    addItem.form = addItemForm
/**
* @see \App\Http\Controllers\Api\CartController::updateItem
 * @see app/Http/Controllers/Api/CartController.php:115
 * @route '/api/v1/cart/items/{itemId}'
 */
export const updateItem = (args: { itemId: string | number } | [itemId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateItem.url(args, options),
    method: 'put',
})

updateItem.definition = {
    methods: ["put"],
    url: '/api/v1/cart/items/{itemId}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\CartController::updateItem
 * @see app/Http/Controllers/Api/CartController.php:115
 * @route '/api/v1/cart/items/{itemId}'
 */
updateItem.url = (args: { itemId: string | number } | [itemId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { itemId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    itemId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        itemId: args.itemId,
                }

    return updateItem.definition.url
            .replace('{itemId}', parsedArgs.itemId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CartController::updateItem
 * @see app/Http/Controllers/Api/CartController.php:115
 * @route '/api/v1/cart/items/{itemId}'
 */
updateItem.put = (args: { itemId: string | number } | [itemId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateItem.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\CartController::updateItem
 * @see app/Http/Controllers/Api/CartController.php:115
 * @route '/api/v1/cart/items/{itemId}'
 */
    const updateItemForm = (args: { itemId: string | number } | [itemId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateItem.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CartController::updateItem
 * @see app/Http/Controllers/Api/CartController.php:115
 * @route '/api/v1/cart/items/{itemId}'
 */
        updateItemForm.put = (args: { itemId: string | number } | [itemId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateItem.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateItem.form = updateItemForm
/**
* @see \App\Http\Controllers\Api\CartController::removeItem
 * @see app/Http/Controllers/Api/CartController.php:136
 * @route '/api/v1/cart/items/{itemId}'
 */
export const removeItem = (args: { itemId: string | number } | [itemId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removeItem.url(args, options),
    method: 'delete',
})

removeItem.definition = {
    methods: ["delete"],
    url: '/api/v1/cart/items/{itemId}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\CartController::removeItem
 * @see app/Http/Controllers/Api/CartController.php:136
 * @route '/api/v1/cart/items/{itemId}'
 */
removeItem.url = (args: { itemId: string | number } | [itemId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { itemId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    itemId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        itemId: args.itemId,
                }

    return removeItem.definition.url
            .replace('{itemId}', parsedArgs.itemId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CartController::removeItem
 * @see app/Http/Controllers/Api/CartController.php:136
 * @route '/api/v1/cart/items/{itemId}'
 */
removeItem.delete = (args: { itemId: string | number } | [itemId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removeItem.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Api\CartController::removeItem
 * @see app/Http/Controllers/Api/CartController.php:136
 * @route '/api/v1/cart/items/{itemId}'
 */
    const removeItemForm = (args: { itemId: string | number } | [itemId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: removeItem.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CartController::removeItem
 * @see app/Http/Controllers/Api/CartController.php:136
 * @route '/api/v1/cart/items/{itemId}'
 */
        removeItemForm.delete = (args: { itemId: string | number } | [itemId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: removeItem.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    removeItem.form = removeItemForm
/**
* @see \App\Http\Controllers\Api\CartController::clear
 * @see app/Http/Controllers/Api/CartController.php:159
 * @route '/api/v1/cart/clear'
 */
export const clear = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clear.url(options),
    method: 'delete',
})

clear.definition = {
    methods: ["delete"],
    url: '/api/v1/cart/clear',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\CartController::clear
 * @see app/Http/Controllers/Api/CartController.php:159
 * @route '/api/v1/cart/clear'
 */
clear.url = (options?: RouteQueryOptions) => {
    return clear.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CartController::clear
 * @see app/Http/Controllers/Api/CartController.php:159
 * @route '/api/v1/cart/clear'
 */
clear.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clear.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Api\CartController::clear
 * @see app/Http/Controllers/Api/CartController.php:159
 * @route '/api/v1/cart/clear'
 */
    const clearForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: clear.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CartController::clear
 * @see app/Http/Controllers/Api/CartController.php:159
 * @route '/api/v1/cart/clear'
 */
        clearForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: clear.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    clear.form = clearForm
const CartController = { index, addItem, updateItem, removeItem, clear }

export default CartController