import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\AccountFlagController::store
 * @see app/Http/Controllers/Admin/AccountFlagController.php:24
 * @route '/api/v1/admin/accounts/flag'
 */
const store263720a39034370c7f1b764e0d5194a7 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store263720a39034370c7f1b764e0d5194a7.url(options),
    method: 'post',
})

store263720a39034370c7f1b764e0d5194a7.definition = {
    methods: ["post"],
    url: '/api/v1/admin/accounts/flag',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\AccountFlagController::store
 * @see app/Http/Controllers/Admin/AccountFlagController.php:24
 * @route '/api/v1/admin/accounts/flag'
 */
store263720a39034370c7f1b764e0d5194a7.url = (options?: RouteQueryOptions) => {
    return store263720a39034370c7f1b764e0d5194a7.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AccountFlagController::store
 * @see app/Http/Controllers/Admin/AccountFlagController.php:24
 * @route '/api/v1/admin/accounts/flag'
 */
store263720a39034370c7f1b764e0d5194a7.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store263720a39034370c7f1b764e0d5194a7.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\AccountFlagController::store
 * @see app/Http/Controllers/Admin/AccountFlagController.php:24
 * @route '/api/v1/admin/accounts/flag'
 */
    const store263720a39034370c7f1b764e0d5194a7Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store263720a39034370c7f1b764e0d5194a7.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\AccountFlagController::store
 * @see app/Http/Controllers/Admin/AccountFlagController.php:24
 * @route '/api/v1/admin/accounts/flag'
 */
        store263720a39034370c7f1b764e0d5194a7Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store263720a39034370c7f1b764e0d5194a7.url(options),
            method: 'post',
        })
    
    store263720a39034370c7f1b764e0d5194a7.form = store263720a39034370c7f1b764e0d5194a7Form
    /**
* @see \App\Http\Controllers\Admin\AccountFlagController::store
 * @see app/Http/Controllers/Admin/AccountFlagController.php:24
 * @route '/accounts/flag'
 */
const store7d84a90e3a625ba4187ed11d6fce145d = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store7d84a90e3a625ba4187ed11d6fce145d.url(options),
    method: 'post',
})

store7d84a90e3a625ba4187ed11d6fce145d.definition = {
    methods: ["post"],
    url: '/accounts/flag',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\AccountFlagController::store
 * @see app/Http/Controllers/Admin/AccountFlagController.php:24
 * @route '/accounts/flag'
 */
store7d84a90e3a625ba4187ed11d6fce145d.url = (options?: RouteQueryOptions) => {
    return store7d84a90e3a625ba4187ed11d6fce145d.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AccountFlagController::store
 * @see app/Http/Controllers/Admin/AccountFlagController.php:24
 * @route '/accounts/flag'
 */
store7d84a90e3a625ba4187ed11d6fce145d.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store7d84a90e3a625ba4187ed11d6fce145d.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\AccountFlagController::store
 * @see app/Http/Controllers/Admin/AccountFlagController.php:24
 * @route '/accounts/flag'
 */
    const store7d84a90e3a625ba4187ed11d6fce145dForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store7d84a90e3a625ba4187ed11d6fce145d.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\AccountFlagController::store
 * @see app/Http/Controllers/Admin/AccountFlagController.php:24
 * @route '/accounts/flag'
 */
        store7d84a90e3a625ba4187ed11d6fce145dForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store7d84a90e3a625ba4187ed11d6fce145d.url(options),
            method: 'post',
        })
    
    store7d84a90e3a625ba4187ed11d6fce145d.form = store7d84a90e3a625ba4187ed11d6fce145dForm

export const store = {
    '/api/v1/admin/accounts/flag': store263720a39034370c7f1b764e0d5194a7,
    '/accounts/flag': store7d84a90e3a625ba4187ed11d6fce145d,
}

const AccountFlagController = { store }

export default AccountFlagController