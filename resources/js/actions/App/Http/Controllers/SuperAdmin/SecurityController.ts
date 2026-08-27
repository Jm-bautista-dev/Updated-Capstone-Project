import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
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
* @see \App\Http\Controllers\SuperAdmin\SecurityController::updatePassword
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:51
 * @route '/super-admin/security/password'
 */
export const updatePassword = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updatePassword.url(options),
    method: 'post',
})

updatePassword.definition = {
    methods: ["post"],
    url: '/super-admin/security/password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::updatePassword
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:51
 * @route '/super-admin/security/password'
 */
updatePassword.url = (options?: RouteQueryOptions) => {
    return updatePassword.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::updatePassword
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:51
 * @route '/super-admin/security/password'
 */
updatePassword.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updatePassword.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::updatePassword
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:51
 * @route '/super-admin/security/password'
 */
    const updatePasswordForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updatePassword.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SecurityController::updatePassword
 * @see app/Http/Controllers/SuperAdmin/SecurityController.php:51
 * @route '/super-admin/security/password'
 */
        updatePasswordForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updatePassword.url(options),
            method: 'post',
        })
    
    updatePassword.form = updatePasswordForm
const SecurityController = { index, updatePassword }

export default SecurityController