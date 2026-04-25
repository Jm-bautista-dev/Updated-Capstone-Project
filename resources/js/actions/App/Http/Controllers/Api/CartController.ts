import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\CartController::index
 * @see app/Http/Controllers/Api/CartController.php:19
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
 * @see app/Http/Controllers/Api/CartController.php:19
 * @route '/api/v1/cart'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CartController::index
 * @see app/Http/Controllers/Api/CartController.php:19
 * @route '/api/v1/cart'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CartController::index
 * @see app/Http/Controllers/Api/CartController.php:19
 * @route '/api/v1/cart'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CartController::index
 * @see app/Http/Controllers/Api/CartController.php:19
 * @route '/api/v1/cart'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CartController::index
 * @see app/Http/Controllers/Api/CartController.php:19
 * @route '/api/v1/cart'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CartController::index
 * @see app/Http/Controllers/Api/CartController.php:19
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
* @see \App\Http\Controllers\Api\CartController::clear
 * @see app/Http/Controllers/Api/CartController.php:153
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
 * @see app/Http/Controllers/Api/CartController.php:153
 * @route '/api/v1/cart/clear'
 */
clear.url = (options?: RouteQueryOptions) => {
    return clear.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CartController::clear
 * @see app/Http/Controllers/Api/CartController.php:153
 * @route '/api/v1/cart/clear'
 */
clear.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clear.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Api\CartController::clear
 * @see app/Http/Controllers/Api/CartController.php:153
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
 * @see app/Http/Controllers/Api/CartController.php:153
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
/**
* @see \App\Http\Controllers\Api\CartController::validate
 * @see app/Http/Controllers/Api/CartController.php:176
 * @route '/api/v1/cart/validate'
 */
export const validate = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validate.url(options),
    method: 'post',
})

validate.definition = {
    methods: ["post"],
    url: '/api/v1/cart/validate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CartController::validate
 * @see app/Http/Controllers/Api/CartController.php:176
 * @route '/api/v1/cart/validate'
 */
validate.url = (options?: RouteQueryOptions) => {
    return validate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CartController::validate
 * @see app/Http/Controllers/Api/CartController.php:176
 * @route '/api/v1/cart/validate'
 */
validate.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validate.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CartController::validate
 * @see app/Http/Controllers/Api/CartController.php:176
 * @route '/api/v1/cart/validate'
 */
    const validateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: validate.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CartController::validate
 * @see app/Http/Controllers/Api/CartController.php:176
 * @route '/api/v1/cart/validate'
 */
        validateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: validate.url(options),
            method: 'post',
        })
    
    validate.form = validateForm
const CartController = { index, addItem, clear, validate }

export default CartController