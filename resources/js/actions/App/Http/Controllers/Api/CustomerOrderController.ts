import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:21
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
 * @see app/Http/Controllers/Api/CustomerOrderController.php:21
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
 * @see app/Http/Controllers/Api/CustomerOrderController.php:21
 * @route '/api/v1/orders/{orderId}/cancel'
 */
cancel8fce9713bc55c11df3a2c57969b59e63.post = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel8fce9713bc55c11df3a2c57969b59e63.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:21
 * @route '/api/v1/orders/{orderId}/cancel'
 */
    const cancel8fce9713bc55c11df3a2c57969b59e63Form = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancel8fce9713bc55c11df3a2c57969b59e63.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:21
 * @route '/api/v1/orders/{orderId}/cancel'
 */
        cancel8fce9713bc55c11df3a2c57969b59e63Form.post = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancel8fce9713bc55c11df3a2c57969b59e63.url(args, options),
            method: 'post',
        })
    
    cancel8fce9713bc55c11df3a2c57969b59e63.form = cancel8fce9713bc55c11df3a2c57969b59e63Form
    /**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:21
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
 * @see app/Http/Controllers/Api/CustomerOrderController.php:21
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
 * @see app/Http/Controllers/Api/CustomerOrderController.php:21
 * @route '/api/v1/customer/orders/{orderId}/cancel'
 */
cancelc3d6d94ed50464371b4d50833c4092e0.post = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelc3d6d94ed50464371b4d50833c4092e0.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:21
 * @route '/api/v1/customer/orders/{orderId}/cancel'
 */
    const cancelc3d6d94ed50464371b4d50833c4092e0Form = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelc3d6d94ed50464371b4d50833c4092e0.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CustomerOrderController::cancel
 * @see app/Http/Controllers/Api/CustomerOrderController.php:21
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

const CustomerOrderController = { cancel }

export default CustomerOrderController