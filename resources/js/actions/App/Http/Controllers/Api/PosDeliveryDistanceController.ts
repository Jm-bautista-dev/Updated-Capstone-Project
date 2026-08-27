import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\PosDeliveryDistanceController::calculate
 * @see app/Http/Controllers/Api/PosDeliveryDistanceController.php:30
 * @route '/api/v1/pos/calculate-delivery-distance'
 */
const calculate229a4f69e1da9fb6ff7be4bffbec5b82 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: calculate229a4f69e1da9fb6ff7be4bffbec5b82.url(options),
    method: 'post',
})

calculate229a4f69e1da9fb6ff7be4bffbec5b82.definition = {
    methods: ["post"],
    url: '/api/v1/pos/calculate-delivery-distance',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\PosDeliveryDistanceController::calculate
 * @see app/Http/Controllers/Api/PosDeliveryDistanceController.php:30
 * @route '/api/v1/pos/calculate-delivery-distance'
 */
calculate229a4f69e1da9fb6ff7be4bffbec5b82.url = (options?: RouteQueryOptions) => {
    return calculate229a4f69e1da9fb6ff7be4bffbec5b82.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PosDeliveryDistanceController::calculate
 * @see app/Http/Controllers/Api/PosDeliveryDistanceController.php:30
 * @route '/api/v1/pos/calculate-delivery-distance'
 */
calculate229a4f69e1da9fb6ff7be4bffbec5b82.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: calculate229a4f69e1da9fb6ff7be4bffbec5b82.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\PosDeliveryDistanceController::calculate
 * @see app/Http/Controllers/Api/PosDeliveryDistanceController.php:30
 * @route '/api/v1/pos/calculate-delivery-distance'
 */
    const calculate229a4f69e1da9fb6ff7be4bffbec5b82Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: calculate229a4f69e1da9fb6ff7be4bffbec5b82.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\PosDeliveryDistanceController::calculate
 * @see app/Http/Controllers/Api/PosDeliveryDistanceController.php:30
 * @route '/api/v1/pos/calculate-delivery-distance'
 */
        calculate229a4f69e1da9fb6ff7be4bffbec5b82Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: calculate229a4f69e1da9fb6ff7be4bffbec5b82.url(options),
            method: 'post',
        })
    
    calculate229a4f69e1da9fb6ff7be4bffbec5b82.form = calculate229a4f69e1da9fb6ff7be4bffbec5b82Form
    /**
* @see \App\Http\Controllers\Api\PosDeliveryDistanceController::calculate
 * @see app/Http/Controllers/Api/PosDeliveryDistanceController.php:30
 * @route '/pos/calculate-delivery-distance'
 */
const calculate122325c184084126cdc8ba17f63f4c3c = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: calculate122325c184084126cdc8ba17f63f4c3c.url(options),
    method: 'post',
})

calculate122325c184084126cdc8ba17f63f4c3c.definition = {
    methods: ["post"],
    url: '/pos/calculate-delivery-distance',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\PosDeliveryDistanceController::calculate
 * @see app/Http/Controllers/Api/PosDeliveryDistanceController.php:30
 * @route '/pos/calculate-delivery-distance'
 */
calculate122325c184084126cdc8ba17f63f4c3c.url = (options?: RouteQueryOptions) => {
    return calculate122325c184084126cdc8ba17f63f4c3c.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PosDeliveryDistanceController::calculate
 * @see app/Http/Controllers/Api/PosDeliveryDistanceController.php:30
 * @route '/pos/calculate-delivery-distance'
 */
calculate122325c184084126cdc8ba17f63f4c3c.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: calculate122325c184084126cdc8ba17f63f4c3c.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\PosDeliveryDistanceController::calculate
 * @see app/Http/Controllers/Api/PosDeliveryDistanceController.php:30
 * @route '/pos/calculate-delivery-distance'
 */
    const calculate122325c184084126cdc8ba17f63f4c3cForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: calculate122325c184084126cdc8ba17f63f4c3c.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\PosDeliveryDistanceController::calculate
 * @see app/Http/Controllers/Api/PosDeliveryDistanceController.php:30
 * @route '/pos/calculate-delivery-distance'
 */
        calculate122325c184084126cdc8ba17f63f4c3cForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: calculate122325c184084126cdc8ba17f63f4c3c.url(options),
            method: 'post',
        })
    
    calculate122325c184084126cdc8ba17f63f4c3c.form = calculate122325c184084126cdc8ba17f63f4c3cForm

export const calculate = {
    '/api/v1/pos/calculate-delivery-distance': calculate229a4f69e1da9fb6ff7be4bffbec5b82,
    '/pos/calculate-delivery-distance': calculate122325c184084126cdc8ba17f63f4c3c,
}

const PosDeliveryDistanceController = { calculate }

export default PosDeliveryDistanceController