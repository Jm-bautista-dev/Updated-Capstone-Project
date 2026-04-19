import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\VerificationController::requestEmail
 * @see app/Http/Controllers/Api/VerificationController.php:19
 * @route '/api/v1/verify-email/request'
 */
export const requestEmail = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: requestEmail.url(options),
    method: 'post',
})

requestEmail.definition = {
    methods: ["post"],
    url: '/api/v1/verify-email/request',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\VerificationController::requestEmail
 * @see app/Http/Controllers/Api/VerificationController.php:19
 * @route '/api/v1/verify-email/request'
 */
requestEmail.url = (options?: RouteQueryOptions) => {
    return requestEmail.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\VerificationController::requestEmail
 * @see app/Http/Controllers/Api/VerificationController.php:19
 * @route '/api/v1/verify-email/request'
 */
requestEmail.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: requestEmail.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\VerificationController::requestEmail
 * @see app/Http/Controllers/Api/VerificationController.php:19
 * @route '/api/v1/verify-email/request'
 */
    const requestEmailForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: requestEmail.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\VerificationController::requestEmail
 * @see app/Http/Controllers/Api/VerificationController.php:19
 * @route '/api/v1/verify-email/request'
 */
        requestEmailForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: requestEmail.url(options),
            method: 'post',
        })
    
    requestEmail.form = requestEmailForm
/**
* @see \App\Http\Controllers\Api\VerificationController::verify
 * @see app/Http/Controllers/Api/VerificationController.php:60
 * @route '/api/v1/verify-email/verify'
 */
export const verify = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verify.url(options),
    method: 'post',
})

verify.definition = {
    methods: ["post"],
    url: '/api/v1/verify-email/verify',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\VerificationController::verify
 * @see app/Http/Controllers/Api/VerificationController.php:60
 * @route '/api/v1/verify-email/verify'
 */
verify.url = (options?: RouteQueryOptions) => {
    return verify.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\VerificationController::verify
 * @see app/Http/Controllers/Api/VerificationController.php:60
 * @route '/api/v1/verify-email/verify'
 */
verify.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verify.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\VerificationController::verify
 * @see app/Http/Controllers/Api/VerificationController.php:60
 * @route '/api/v1/verify-email/verify'
 */
    const verifyForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: verify.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\VerificationController::verify
 * @see app/Http/Controllers/Api/VerificationController.php:60
 * @route '/api/v1/verify-email/verify'
 */
        verifyForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: verify.url(options),
            method: 'post',
        })
    
    verify.form = verifyForm
const VerificationController = { requestEmail, verify }

export default VerificationController