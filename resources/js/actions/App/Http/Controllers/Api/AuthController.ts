import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\AuthController::register
 * @see app/Http/Controllers/Api/AuthController.php:19
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
 * @see app/Http/Controllers/Api/AuthController.php:19
 * @route '/api/v1/register'
 */
register.url = (options?: RouteQueryOptions) => {
    return register.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AuthController::register
 * @see app/Http/Controllers/Api/AuthController.php:19
 * @route '/api/v1/register'
 */
register.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: register.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AuthController::register
 * @see app/Http/Controllers/Api/AuthController.php:19
 * @route '/api/v1/register'
 */
    const registerForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: register.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AuthController::register
 * @see app/Http/Controllers/Api/AuthController.php:19
 * @route '/api/v1/register'
 */
        registerForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: register.url(options),
            method: 'post',
        })
    
    register.form = registerForm
/**
* @see \App\Http\Controllers\Api\AuthController::login
 * @see app/Http/Controllers/Api/AuthController.php:65
 * @route '/api/v1/login'
 */
export const login = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: login.url(options),
    method: 'post',
})

login.definition = {
    methods: ["post"],
    url: '/api/v1/login',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AuthController::login
 * @see app/Http/Controllers/Api/AuthController.php:65
 * @route '/api/v1/login'
 */
login.url = (options?: RouteQueryOptions) => {
    return login.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AuthController::login
 * @see app/Http/Controllers/Api/AuthController.php:65
 * @route '/api/v1/login'
 */
login.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: login.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AuthController::login
 * @see app/Http/Controllers/Api/AuthController.php:65
 * @route '/api/v1/login'
 */
    const loginForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: login.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AuthController::login
 * @see app/Http/Controllers/Api/AuthController.php:65
 * @route '/api/v1/login'
 */
        loginForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: login.url(options),
            method: 'post',
        })
    
    login.form = loginForm
/**
* @see \App\Http\Controllers\Api\AuthController::resetPassword
 * @see app/Http/Controllers/Api/AuthController.php:143
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
 * @see app/Http/Controllers/Api/AuthController.php:143
 * @route '/api/v1/reset-password'
 */
resetPassword.url = (options?: RouteQueryOptions) => {
    return resetPassword.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AuthController::resetPassword
 * @see app/Http/Controllers/Api/AuthController.php:143
 * @route '/api/v1/reset-password'
 */
resetPassword.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resetPassword.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AuthController::resetPassword
 * @see app/Http/Controllers/Api/AuthController.php:143
 * @route '/api/v1/reset-password'
 */
    const resetPasswordForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: resetPassword.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AuthController::resetPassword
 * @see app/Http/Controllers/Api/AuthController.php:143
 * @route '/api/v1/reset-password'
 */
        resetPasswordForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: resetPassword.url(options),
            method: 'post',
        })
    
    resetPassword.form = resetPasswordForm
/**
* @see \App\Http\Controllers\Api\AuthController::user
 * @see app/Http/Controllers/Api/AuthController.php:110
 * @route '/api/v1/user'
 */
export const user = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: user.url(options),
    method: 'get',
})

user.definition = {
    methods: ["get","head"],
    url: '/api/v1/user',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AuthController::user
 * @see app/Http/Controllers/Api/AuthController.php:110
 * @route '/api/v1/user'
 */
user.url = (options?: RouteQueryOptions) => {
    return user.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AuthController::user
 * @see app/Http/Controllers/Api/AuthController.php:110
 * @route '/api/v1/user'
 */
user.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: user.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AuthController::user
 * @see app/Http/Controllers/Api/AuthController.php:110
 * @route '/api/v1/user'
 */
user.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: user.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AuthController::user
 * @see app/Http/Controllers/Api/AuthController.php:110
 * @route '/api/v1/user'
 */
    const userForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: user.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AuthController::user
 * @see app/Http/Controllers/Api/AuthController.php:110
 * @route '/api/v1/user'
 */
        userForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: user.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AuthController::user
 * @see app/Http/Controllers/Api/AuthController.php:110
 * @route '/api/v1/user'
 */
        userForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: user.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    user.form = userForm
/**
* @see \App\Http\Controllers\Api\AuthController::refreshToken
 * @see app/Http/Controllers/Api/AuthController.php:122
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
 * @see app/Http/Controllers/Api/AuthController.php:122
 * @route '/api/v1/token/refresh'
 */
refreshToken.url = (options?: RouteQueryOptions) => {
    return refreshToken.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AuthController::refreshToken
 * @see app/Http/Controllers/Api/AuthController.php:122
 * @route '/api/v1/token/refresh'
 */
refreshToken.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: refreshToken.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AuthController::refreshToken
 * @see app/Http/Controllers/Api/AuthController.php:122
 * @route '/api/v1/token/refresh'
 */
    const refreshTokenForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: refreshToken.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AuthController::refreshToken
 * @see app/Http/Controllers/Api/AuthController.php:122
 * @route '/api/v1/token/refresh'
 */
        refreshTokenForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: refreshToken.url(options),
            method: 'post',
        })
    
    refreshToken.form = refreshTokenForm
/**
* @see \App\Http\Controllers\Api\AuthController::logout
 * @see app/Http/Controllers/Api/AuthController.php:96
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
 * @see app/Http/Controllers/Api/AuthController.php:96
 * @route '/api/v1/logout'
 */
logout.url = (options?: RouteQueryOptions) => {
    return logout.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AuthController::logout
 * @see app/Http/Controllers/Api/AuthController.php:96
 * @route '/api/v1/logout'
 */
logout.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AuthController::logout
 * @see app/Http/Controllers/Api/AuthController.php:96
 * @route '/api/v1/logout'
 */
    const logoutForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: logout.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AuthController::logout
 * @see app/Http/Controllers/Api/AuthController.php:96
 * @route '/api/v1/logout'
 */
        logoutForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: logout.url(options),
            method: 'post',
        })
    
    logout.form = logoutForm
const AuthController = { register, login, resetPassword, user, refreshToken, logout }

export default AuthController