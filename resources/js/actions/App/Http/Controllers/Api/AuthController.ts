import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\AuthController::register
 * @see app/Http/Controllers/Api/AuthController.php:20
 * @route '/api/v1/register'
 */
export const register = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: register.url(options),
    method: 'post',
})

register.definition = {
    methods: ["post"],
    url: '/api/v1/register',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AuthController::register
 * @see app/Http/Controllers/Api/AuthController.php:20
 * @route '/api/v1/register'
 */
register.url = (options?: RouteQueryOptions) => {
    return register.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AuthController::register
 * @see app/Http/Controllers/Api/AuthController.php:20
 * @route '/api/v1/register'
 */
register.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: register.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AuthController::register
 * @see app/Http/Controllers/Api/AuthController.php:20
 * @route '/api/v1/register'
 */
    const registerForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: register.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AuthController::register
 * @see app/Http/Controllers/Api/AuthController.php:20
 * @route '/api/v1/register'
 */
        registerForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: register.url(options),
            method: 'post',
        })
    
    register.form = registerForm
/**
* @see \App\Http\Controllers\Api\AuthController::login
 * @see app/Http/Controllers/Api/AuthController.php:68
 * @route '/api/v1/login'
 */
const login49efc903aa0be885ed3d70a571b283f0 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: login49efc903aa0be885ed3d70a571b283f0.url(options),
    method: 'post',
})

login49efc903aa0be885ed3d70a571b283f0.definition = {
    methods: ["post"],
    url: '/api/v1/login',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AuthController::login
 * @see app/Http/Controllers/Api/AuthController.php:68
 * @route '/api/v1/login'
 */
login49efc903aa0be885ed3d70a571b283f0.url = (options?: RouteQueryOptions) => {
    return login49efc903aa0be885ed3d70a571b283f0.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AuthController::login
 * @see app/Http/Controllers/Api/AuthController.php:68
 * @route '/api/v1/login'
 */
login49efc903aa0be885ed3d70a571b283f0.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: login49efc903aa0be885ed3d70a571b283f0.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AuthController::login
 * @see app/Http/Controllers/Api/AuthController.php:68
 * @route '/api/v1/login'
 */
    const login49efc903aa0be885ed3d70a571b283f0Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: login49efc903aa0be885ed3d70a571b283f0.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AuthController::login
 * @see app/Http/Controllers/Api/AuthController.php:68
 * @route '/api/v1/login'
 */
        login49efc903aa0be885ed3d70a571b283f0Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: login49efc903aa0be885ed3d70a571b283f0.url(options),
            method: 'post',
        })
    
    login49efc903aa0be885ed3d70a571b283f0.form = login49efc903aa0be885ed3d70a571b283f0Form
    /**
* @see \App\Http\Controllers\Api\AuthController::login
 * @see app/Http/Controllers/Api/AuthController.php:68
 * @route '/api/v1/rider/login'
 */
const login7b344313eefec9133a231b6b74f0b152 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: login7b344313eefec9133a231b6b74f0b152.url(options),
    method: 'post',
})

login7b344313eefec9133a231b6b74f0b152.definition = {
    methods: ["post"],
    url: '/api/v1/rider/login',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AuthController::login
 * @see app/Http/Controllers/Api/AuthController.php:68
 * @route '/api/v1/rider/login'
 */
login7b344313eefec9133a231b6b74f0b152.url = (options?: RouteQueryOptions) => {
    return login7b344313eefec9133a231b6b74f0b152.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AuthController::login
 * @see app/Http/Controllers/Api/AuthController.php:68
 * @route '/api/v1/rider/login'
 */
login7b344313eefec9133a231b6b74f0b152.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: login7b344313eefec9133a231b6b74f0b152.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AuthController::login
 * @see app/Http/Controllers/Api/AuthController.php:68
 * @route '/api/v1/rider/login'
 */
    const login7b344313eefec9133a231b6b74f0b152Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: login7b344313eefec9133a231b6b74f0b152.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AuthController::login
 * @see app/Http/Controllers/Api/AuthController.php:68
 * @route '/api/v1/rider/login'
 */
        login7b344313eefec9133a231b6b74f0b152Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: login7b344313eefec9133a231b6b74f0b152.url(options),
            method: 'post',
        })
    
    login7b344313eefec9133a231b6b74f0b152.form = login7b344313eefec9133a231b6b74f0b152Form

export const login = {
    '/api/v1/login': login49efc903aa0be885ed3d70a571b283f0,
    '/api/v1/rider/login': login7b344313eefec9133a231b6b74f0b152,
}

/**
* @see \App\Http\Controllers\Api\AuthController::resetPassword
 * @see app/Http/Controllers/Api/AuthController.php:178
 * @route '/api/v1/reset-password'
 */
export const resetPassword = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resetPassword.url(options),
    method: 'post',
})

resetPassword.definition = {
    methods: ["post"],
    url: '/api/v1/reset-password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AuthController::resetPassword
 * @see app/Http/Controllers/Api/AuthController.php:178
 * @route '/api/v1/reset-password'
 */
resetPassword.url = (options?: RouteQueryOptions) => {
    return resetPassword.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AuthController::resetPassword
 * @see app/Http/Controllers/Api/AuthController.php:178
 * @route '/api/v1/reset-password'
 */
resetPassword.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resetPassword.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AuthController::resetPassword
 * @see app/Http/Controllers/Api/AuthController.php:178
 * @route '/api/v1/reset-password'
 */
    const resetPasswordForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: resetPassword.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AuthController::resetPassword
 * @see app/Http/Controllers/Api/AuthController.php:178
 * @route '/api/v1/reset-password'
 */
        resetPasswordForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: resetPassword.url(options),
            method: 'post',
        })
    
    resetPassword.form = resetPasswordForm
/**
* @see \App\Http\Controllers\Api\AuthController::logout
 * @see app/Http/Controllers/Api/AuthController.php:124
 * @route '/api/v1/logout'
 */
export const logout = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

logout.definition = {
    methods: ["post"],
    url: '/api/v1/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AuthController::logout
 * @see app/Http/Controllers/Api/AuthController.php:124
 * @route '/api/v1/logout'
 */
logout.url = (options?: RouteQueryOptions) => {
    return logout.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AuthController::logout
 * @see app/Http/Controllers/Api/AuthController.php:124
 * @route '/api/v1/logout'
 */
logout.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AuthController::logout
 * @see app/Http/Controllers/Api/AuthController.php:124
 * @route '/api/v1/logout'
 */
    const logoutForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: logout.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AuthController::logout
 * @see app/Http/Controllers/Api/AuthController.php:124
 * @route '/api/v1/logout'
 */
        logoutForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: logout.url(options),
            method: 'post',
        })
    
    logout.form = logoutForm
/**
* @see \App\Http\Controllers\Api\AuthController::refreshToken
 * @see app/Http/Controllers/Api/AuthController.php:157
 * @route '/api/v1/token/refresh'
 */
export const refreshToken = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: refreshToken.url(options),
    method: 'post',
})

refreshToken.definition = {
    methods: ["post"],
    url: '/api/v1/token/refresh',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AuthController::refreshToken
 * @see app/Http/Controllers/Api/AuthController.php:157
 * @route '/api/v1/token/refresh'
 */
refreshToken.url = (options?: RouteQueryOptions) => {
    return refreshToken.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AuthController::refreshToken
 * @see app/Http/Controllers/Api/AuthController.php:157
 * @route '/api/v1/token/refresh'
 */
refreshToken.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: refreshToken.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AuthController::refreshToken
 * @see app/Http/Controllers/Api/AuthController.php:157
 * @route '/api/v1/token/refresh'
 */
    const refreshTokenForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: refreshToken.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AuthController::refreshToken
 * @see app/Http/Controllers/Api/AuthController.php:157
 * @route '/api/v1/token/refresh'
 */
        refreshTokenForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: refreshToken.url(options),
            method: 'post',
        })
    
    refreshToken.form = refreshTokenForm
const AuthController = { register, login, resetPassword, logout, refreshToken }

export default AuthController