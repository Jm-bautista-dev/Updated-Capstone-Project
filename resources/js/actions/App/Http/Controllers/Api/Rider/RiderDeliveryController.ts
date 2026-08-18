import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\Rider\RiderDeliveryController::cancellationRequests
 * @see app/Http/Controllers/Api/Rider/RiderDeliveryController.php:42
 * @route '/api/v1/rider/cancellation-requests'
 */
const cancellationRequests86b69beae8e1e23bf83db8ab53ae6afa = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: cancellationRequests86b69beae8e1e23bf83db8ab53ae6afa.url(options),
    method: 'get',
})

cancellationRequests86b69beae8e1e23bf83db8ab53ae6afa.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/cancellation-requests',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\Rider\RiderDeliveryController::cancellationRequests
 * @see app/Http/Controllers/Api/Rider/RiderDeliveryController.php:42
 * @route '/api/v1/rider/cancellation-requests'
 */
cancellationRequests86b69beae8e1e23bf83db8ab53ae6afa.url = (options?: RouteQueryOptions) => {
    return cancellationRequests86b69beae8e1e23bf83db8ab53ae6afa.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\Rider\RiderDeliveryController::cancellationRequests
 * @see app/Http/Controllers/Api/Rider/RiderDeliveryController.php:42
 * @route '/api/v1/rider/cancellation-requests'
 */
cancellationRequests86b69beae8e1e23bf83db8ab53ae6afa.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: cancellationRequests86b69beae8e1e23bf83db8ab53ae6afa.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\Rider\RiderDeliveryController::cancellationRequests
 * @see app/Http/Controllers/Api/Rider/RiderDeliveryController.php:42
 * @route '/api/v1/rider/cancellation-requests'
 */
cancellationRequests86b69beae8e1e23bf83db8ab53ae6afa.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: cancellationRequests86b69beae8e1e23bf83db8ab53ae6afa.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\Rider\RiderDeliveryController::cancellationRequests
 * @see app/Http/Controllers/Api/Rider/RiderDeliveryController.php:42
 * @route '/api/v1/rider/cancellation-requests'
 */
    const cancellationRequests86b69beae8e1e23bf83db8ab53ae6afaForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: cancellationRequests86b69beae8e1e23bf83db8ab53ae6afa.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\Rider\RiderDeliveryController::cancellationRequests
 * @see app/Http/Controllers/Api/Rider/RiderDeliveryController.php:42
 * @route '/api/v1/rider/cancellation-requests'
 */
        cancellationRequests86b69beae8e1e23bf83db8ab53ae6afaForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: cancellationRequests86b69beae8e1e23bf83db8ab53ae6afa.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\Rider\RiderDeliveryController::cancellationRequests
 * @see app/Http/Controllers/Api/Rider/RiderDeliveryController.php:42
 * @route '/api/v1/rider/cancellation-requests'
 */
        cancellationRequests86b69beae8e1e23bf83db8ab53ae6afaForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: cancellationRequests86b69beae8e1e23bf83db8ab53ae6afa.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    cancellationRequests86b69beae8e1e23bf83db8ab53ae6afa.form = cancellationRequests86b69beae8e1e23bf83db8ab53ae6afaForm
    /**
* @see \App\Http\Controllers\Api\Rider\RiderDeliveryController::cancellationRequests
 * @see app/Http/Controllers/Api/Rider/RiderDeliveryController.php:42
 * @route '/api/rider/cancellation-requests'
 */
const cancellationRequests4e91f346ba9a280b660aeca0ff27ca97 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: cancellationRequests4e91f346ba9a280b660aeca0ff27ca97.url(options),
    method: 'get',
})

cancellationRequests4e91f346ba9a280b660aeca0ff27ca97.definition = {
    methods: ["get","head"],
    url: '/api/rider/cancellation-requests',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\Rider\RiderDeliveryController::cancellationRequests
 * @see app/Http/Controllers/Api/Rider/RiderDeliveryController.php:42
 * @route '/api/rider/cancellation-requests'
 */
cancellationRequests4e91f346ba9a280b660aeca0ff27ca97.url = (options?: RouteQueryOptions) => {
    return cancellationRequests4e91f346ba9a280b660aeca0ff27ca97.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\Rider\RiderDeliveryController::cancellationRequests
 * @see app/Http/Controllers/Api/Rider/RiderDeliveryController.php:42
 * @route '/api/rider/cancellation-requests'
 */
cancellationRequests4e91f346ba9a280b660aeca0ff27ca97.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: cancellationRequests4e91f346ba9a280b660aeca0ff27ca97.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\Rider\RiderDeliveryController::cancellationRequests
 * @see app/Http/Controllers/Api/Rider/RiderDeliveryController.php:42
 * @route '/api/rider/cancellation-requests'
 */
cancellationRequests4e91f346ba9a280b660aeca0ff27ca97.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: cancellationRequests4e91f346ba9a280b660aeca0ff27ca97.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\Rider\RiderDeliveryController::cancellationRequests
 * @see app/Http/Controllers/Api/Rider/RiderDeliveryController.php:42
 * @route '/api/rider/cancellation-requests'
 */
    const cancellationRequests4e91f346ba9a280b660aeca0ff27ca97Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: cancellationRequests4e91f346ba9a280b660aeca0ff27ca97.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\Rider\RiderDeliveryController::cancellationRequests
 * @see app/Http/Controllers/Api/Rider/RiderDeliveryController.php:42
 * @route '/api/rider/cancellation-requests'
 */
        cancellationRequests4e91f346ba9a280b660aeca0ff27ca97Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: cancellationRequests4e91f346ba9a280b660aeca0ff27ca97.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\Rider\RiderDeliveryController::cancellationRequests
 * @see app/Http/Controllers/Api/Rider/RiderDeliveryController.php:42
 * @route '/api/rider/cancellation-requests'
 */
        cancellationRequests4e91f346ba9a280b660aeca0ff27ca97Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: cancellationRequests4e91f346ba9a280b660aeca0ff27ca97.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    cancellationRequests4e91f346ba9a280b660aeca0ff27ca97.form = cancellationRequests4e91f346ba9a280b660aeca0ff27ca97Form

export const cancellationRequests = {
    '/api/v1/rider/cancellation-requests': cancellationRequests86b69beae8e1e23bf83db8ab53ae6afa,
    '/api/rider/cancellation-requests': cancellationRequests4e91f346ba9a280b660aeca0ff27ca97,
}

const RiderDeliveryController = { cancellationRequests }

export default RiderDeliveryController