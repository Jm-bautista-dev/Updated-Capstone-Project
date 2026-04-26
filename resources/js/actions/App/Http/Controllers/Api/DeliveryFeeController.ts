import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\DeliveryFeeController::checkFee
 * @see app/Http/Controllers/Api/DeliveryFeeController.php:16
 * @route '/api/v1/delivery/check-fee'
 */
export const checkFee = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: checkFee.url(options),
    method: 'post',
})

checkFee.definition = {
    methods: ["post"],
    url: '/api/v1/delivery/check-fee',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\DeliveryFeeController::checkFee
 * @see app/Http/Controllers/Api/DeliveryFeeController.php:16
 * @route '/api/v1/delivery/check-fee'
 */
checkFee.url = (options?: RouteQueryOptions) => {
    return checkFee.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\DeliveryFeeController::checkFee
 * @see app/Http/Controllers/Api/DeliveryFeeController.php:16
 * @route '/api/v1/delivery/check-fee'
 */
checkFee.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: checkFee.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\DeliveryFeeController::checkFee
 * @see app/Http/Controllers/Api/DeliveryFeeController.php:16
 * @route '/api/v1/delivery/check-fee'
 */
    const checkFeeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: checkFee.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\DeliveryFeeController::checkFee
 * @see app/Http/Controllers/Api/DeliveryFeeController.php:16
 * @route '/api/v1/delivery/check-fee'
 */
        checkFeeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: checkFee.url(options),
            method: 'post',
        })
    
    checkFee.form = checkFeeForm
const DeliveryFeeController = { checkFee }

export default DeliveryFeeController