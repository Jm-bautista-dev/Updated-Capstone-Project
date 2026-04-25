import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\MobileAuthController::login
 * @see app/Http/Controllers/MobileAuthController.php:15
 * @route '/api/mobile/login'
 */
const login525ebd90b953f79e620438f7876c8ef0 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: login525ebd90b953f79e620438f7876c8ef0.url(options),
    method: 'post',
})

login525ebd90b953f79e620438f7876c8ef0.definition = {
    methods: ["post"],
    url: '/api/mobile/login',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MobileAuthController::login
 * @see app/Http/Controllers/MobileAuthController.php:15
 * @route '/api/mobile/login'
 */
login525ebd90b953f79e620438f7876c8ef0.url = (options?: RouteQueryOptions) => {
    return login525ebd90b953f79e620438f7876c8ef0.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MobileAuthController::login
 * @see app/Http/Controllers/MobileAuthController.php:15
 * @route '/api/mobile/login'
 */
login525ebd90b953f79e620438f7876c8ef0.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: login525ebd90b953f79e620438f7876c8ef0.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\MobileAuthController::login
 * @see app/Http/Controllers/MobileAuthController.php:15
 * @route '/api/mobile/login'
 */
    const login525ebd90b953f79e620438f7876c8ef0Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: login525ebd90b953f79e620438f7876c8ef0.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MobileAuthController::login
 * @see app/Http/Controllers/MobileAuthController.php:15
 * @route '/api/mobile/login'
 */
        login525ebd90b953f79e620438f7876c8ef0Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: login525ebd90b953f79e620438f7876c8ef0.url(options),
            method: 'post',
        })
    
    login525ebd90b953f79e620438f7876c8ef0.form = login525ebd90b953f79e620438f7876c8ef0Form
    /**
* @see \App\Http\Controllers\MobileAuthController::login
 * @see app/Http/Controllers/MobileAuthController.php:15
 * @route '/api/v1/mobile/login'
 */
const loginbb1b00b7939743f5c90cd805e7f75520 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: loginbb1b00b7939743f5c90cd805e7f75520.url(options),
    method: 'post',
})

loginbb1b00b7939743f5c90cd805e7f75520.definition = {
    methods: ["post"],
    url: '/api/v1/mobile/login',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MobileAuthController::login
 * @see app/Http/Controllers/MobileAuthController.php:15
 * @route '/api/v1/mobile/login'
 */
loginbb1b00b7939743f5c90cd805e7f75520.url = (options?: RouteQueryOptions) => {
    return loginbb1b00b7939743f5c90cd805e7f75520.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MobileAuthController::login
 * @see app/Http/Controllers/MobileAuthController.php:15
 * @route '/api/v1/mobile/login'
 */
loginbb1b00b7939743f5c90cd805e7f75520.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: loginbb1b00b7939743f5c90cd805e7f75520.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\MobileAuthController::login
 * @see app/Http/Controllers/MobileAuthController.php:15
 * @route '/api/v1/mobile/login'
 */
    const loginbb1b00b7939743f5c90cd805e7f75520Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: loginbb1b00b7939743f5c90cd805e7f75520.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MobileAuthController::login
 * @see app/Http/Controllers/MobileAuthController.php:15
 * @route '/api/v1/mobile/login'
 */
        loginbb1b00b7939743f5c90cd805e7f75520Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: loginbb1b00b7939743f5c90cd805e7f75520.url(options),
            method: 'post',
        })
    
    loginbb1b00b7939743f5c90cd805e7f75520.form = loginbb1b00b7939743f5c90cd805e7f75520Form

export const login = {
    '/api/mobile/login': login525ebd90b953f79e620438f7876c8ef0,
    '/api/v1/mobile/login': loginbb1b00b7939743f5c90cd805e7f75520,
}

const MobileAuthController = { login }

export default MobileAuthController