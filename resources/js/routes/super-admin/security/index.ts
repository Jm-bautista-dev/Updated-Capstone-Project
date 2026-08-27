import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::index
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:20
 * @route '/super-admin/security'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/super-admin/security',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::index
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:20
 * @route '/super-admin/security'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::index
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:20
 * @route '/super-admin/security'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::index
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:20
 * @route '/super-admin/security'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::index
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:20
 * @route '/super-admin/security'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::index
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:20
 * @route '/super-admin/security'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::index
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:20
 * @route '/super-admin/security'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::password
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:51
 * @route '/super-admin/security/password'
 */
export const password = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: password.url(options),
    method: 'post',
})

password.definition = {
    methods: ["post"],
    url: '/super-admin/security/password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::password
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:51
 * @route '/super-admin/security/password'
 */
password.url = (options?: RouteQueryOptions) => {
    return password.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::password
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:51
 * @route '/super-admin/security/password'
 */
password.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: password.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::password
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:51
 * @route '/super-admin/security/password'
 */
    const passwordForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: password.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::password
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:51
 * @route '/super-admin/security/password'
 */
        passwordForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: password.url(options),
            method: 'post',
        })
    
    password.form = passwordForm
const security = {
    index: Object.assign(index, index),
password: Object.assign(password, password),
}

export default security