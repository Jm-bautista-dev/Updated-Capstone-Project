import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\VerificationController::sendOtp
 * @see app/Http/Controllers/Api/VerificationController.php:19
 * @route '/api/v1/send-otp'
 */
export const sendOtp = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendOtp.url(options),
    method: 'post',
})

sendOtp.definition = {
    methods: ["post"],
    url: '/api/v1/send-otp',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\VerificationController::sendOtp
 * @see app/Http/Controllers/Api/VerificationController.php:19
 * @route '/api/v1/send-otp'
 */
sendOtp.url = (options?: RouteQueryOptions) => {
    return sendOtp.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\VerificationController::sendOtp
 * @see app/Http/Controllers/Api/VerificationController.php:19
 * @route '/api/v1/send-otp'
 */
sendOtp.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendOtp.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\VerificationController::sendOtp
 * @see app/Http/Controllers/Api/VerificationController.php:19
 * @route '/api/v1/send-otp'
 */
    const sendOtpForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: sendOtp.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\VerificationController::sendOtp
 * @see app/Http/Controllers/Api/VerificationController.php:19
 * @route '/api/v1/send-otp'
 */
        sendOtpForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: sendOtp.url(options),
            method: 'post',
        })
    
    sendOtp.form = sendOtpForm
/**
* @see \App\Http\Controllers\Api\VerificationController::verifyOtp
 * @see app/Http/Controllers/Api/VerificationController.php:56
 * @route '/api/v1/verify-otp'
 */
export const verifyOtp = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verifyOtp.url(options),
    method: 'post',
})

verifyOtp.definition = {
    methods: ["post"],
    url: '/api/v1/verify-otp',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\VerificationController::verifyOtp
 * @see app/Http/Controllers/Api/VerificationController.php:56
 * @route '/api/v1/verify-otp'
 */
verifyOtp.url = (options?: RouteQueryOptions) => {
    return verifyOtp.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\VerificationController::verifyOtp
 * @see app/Http/Controllers/Api/VerificationController.php:56
 * @route '/api/v1/verify-otp'
 */
verifyOtp.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verifyOtp.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\VerificationController::verifyOtp
 * @see app/Http/Controllers/Api/VerificationController.php:56
 * @route '/api/v1/verify-otp'
 */
    const verifyOtpForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: verifyOtp.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\VerificationController::verifyOtp
 * @see app/Http/Controllers/Api/VerificationController.php:56
 * @route '/api/v1/verify-otp'
 */
        verifyOtpForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: verifyOtp.url(options),
            method: 'post',
        })
    
    verifyOtp.form = verifyOtpForm
const VerificationController = { sendOtp, verifyOtp }

export default VerificationController