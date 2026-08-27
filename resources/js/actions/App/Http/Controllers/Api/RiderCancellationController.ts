import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\RiderCancellationController::requestCancellation
 * @see app/Http/Controllers/Api/RiderCancellationController.php:26
 * @route '/api/rider/orders/{id}/cancel-request'
 */
export const requestCancellation = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: requestCancellation.url(args, options),
    method: 'post',
})

requestCancellation.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/cancel-request',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderCancellationController::requestCancellation
 * @see app/Http/Controllers/Api/RiderCancellationController.php:26
 * @route '/api/rider/orders/{id}/cancel-request'
 */
requestCancellation.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return requestCancellation.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderCancellationController::requestCancellation
 * @see app/Http/Controllers/Api/RiderCancellationController.php:26
 * @route '/api/rider/orders/{id}/cancel-request'
 */
requestCancellation.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: requestCancellation.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderCancellationController::requestCancellation
 * @see app/Http/Controllers/Api/RiderCancellationController.php:26
 * @route '/api/rider/orders/{id}/cancel-request'
 */
    const requestCancellationForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: requestCancellation.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderCancellationController::requestCancellation
 * @see app/Http/Controllers/Api/RiderCancellationController.php:26
 * @route '/api/rider/orders/{id}/cancel-request'
 */
        requestCancellationForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: requestCancellation.url(args, options),
            method: 'post',
        })
    
    requestCancellation.form = requestCancellationForm
const RiderCancellationController = { requestCancellation }

export default RiderCancellationController