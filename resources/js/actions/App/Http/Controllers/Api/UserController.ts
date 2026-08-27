import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/api/v1/user'
 */
const me805096a867627d4e728c2c6a0e1529bb = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: me805096a867627d4e728c2c6a0e1529bb.url(options),
    method: 'get',
})

me805096a867627d4e728c2c6a0e1529bb.definition = {
    methods: ["get","head"],
    url: '/api/v1/user',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/api/v1/user'
 */
me805096a867627d4e728c2c6a0e1529bb.url = (options?: RouteQueryOptions) => {
    return me805096a867627d4e728c2c6a0e1529bb.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/api/v1/user'
 */
me805096a867627d4e728c2c6a0e1529bb.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: me805096a867627d4e728c2c6a0e1529bb.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/api/v1/user'
 */
me805096a867627d4e728c2c6a0e1529bb.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: me805096a867627d4e728c2c6a0e1529bb.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/api/v1/user'
 */
    const me805096a867627d4e728c2c6a0e1529bbForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: me805096a867627d4e728c2c6a0e1529bb.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/api/v1/user'
 */
        me805096a867627d4e728c2c6a0e1529bbForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: me805096a867627d4e728c2c6a0e1529bb.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/api/v1/user'
 */
        me805096a867627d4e728c2c6a0e1529bbForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: me805096a867627d4e728c2c6a0e1529bb.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    me805096a867627d4e728c2c6a0e1529bb.form = me805096a867627d4e728c2c6a0e1529bbForm
    /**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/api/user'
 */
const mefae88ad6309fcfbde7a7c79f2701ed35 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mefae88ad6309fcfbde7a7c79f2701ed35.url(options),
    method: 'get',
})

mefae88ad6309fcfbde7a7c79f2701ed35.definition = {
    methods: ["get","head"],
    url: '/api/user',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/api/user'
 */
mefae88ad6309fcfbde7a7c79f2701ed35.url = (options?: RouteQueryOptions) => {
    return mefae88ad6309fcfbde7a7c79f2701ed35.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/api/user'
 */
mefae88ad6309fcfbde7a7c79f2701ed35.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mefae88ad6309fcfbde7a7c79f2701ed35.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/api/user'
 */
mefae88ad6309fcfbde7a7c79f2701ed35.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mefae88ad6309fcfbde7a7c79f2701ed35.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/api/user'
 */
    const mefae88ad6309fcfbde7a7c79f2701ed35Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: mefae88ad6309fcfbde7a7c79f2701ed35.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/api/user'
 */
        mefae88ad6309fcfbde7a7c79f2701ed35Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: mefae88ad6309fcfbde7a7c79f2701ed35.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/api/user'
 */
        mefae88ad6309fcfbde7a7c79f2701ed35Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: mefae88ad6309fcfbde7a7c79f2701ed35.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    mefae88ad6309fcfbde7a7c79f2701ed35.form = mefae88ad6309fcfbde7a7c79f2701ed35Form
    /**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/user'
 */
const me4f74708015d25e186d2d80ed42af2d9a = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: me4f74708015d25e186d2d80ed42af2d9a.url(options),
    method: 'get',
})

me4f74708015d25e186d2d80ed42af2d9a.definition = {
    methods: ["get","head"],
    url: '/user',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/user'
 */
me4f74708015d25e186d2d80ed42af2d9a.url = (options?: RouteQueryOptions) => {
    return me4f74708015d25e186d2d80ed42af2d9a.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/user'
 */
me4f74708015d25e186d2d80ed42af2d9a.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: me4f74708015d25e186d2d80ed42af2d9a.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/user'
 */
me4f74708015d25e186d2d80ed42af2d9a.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: me4f74708015d25e186d2d80ed42af2d9a.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/user'
 */
    const me4f74708015d25e186d2d80ed42af2d9aForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: me4f74708015d25e186d2d80ed42af2d9a.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/user'
 */
        me4f74708015d25e186d2d80ed42af2d9aForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: me4f74708015d25e186d2d80ed42af2d9a.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:17
 * @route '/user'
 */
        me4f74708015d25e186d2d80ed42af2d9aForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: me4f74708015d25e186d2d80ed42af2d9a.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    me4f74708015d25e186d2d80ed42af2d9a.form = me4f74708015d25e186d2d80ed42af2d9aForm

export const me = {
    '/api/v1/user': me805096a867627d4e728c2c6a0e1529bb,
    '/api/user': mefae88ad6309fcfbde7a7c79f2701ed35,
    '/user': me4f74708015d25e186d2d80ed42af2d9a,
}

/**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:104
 * @route '/api/v1/user'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(options),
    method: 'patch',
})

update.definition = {
    methods: ["patch","put","post"],
    url: '/api/v1/user',
} satisfies RouteDefinition<["patch","put","post"]>

/**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:104
 * @route '/api/v1/user'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:104
 * @route '/api/v1/user'
 */
update.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:104
 * @route '/api/v1/user'
 */
update.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:104
 * @route '/api/v1/user'
 */
update.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:104
 * @route '/api/v1/user'
 */
    const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:104
 * @route '/api/v1/user'
 */
        updateForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:104
 * @route '/api/v1/user'
 */
        updateForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:104
 * @route '/api/v1/user'
 */
        updateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(options),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:242
 * @route '/api/v1/user/password'
 */
export const updatePassword = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatePassword.url(options),
    method: 'patch',
})

updatePassword.definition = {
    methods: ["patch","put","post"],
    url: '/api/v1/user/password',
} satisfies RouteDefinition<["patch","put","post"]>

/**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:242
 * @route '/api/v1/user/password'
 */
updatePassword.url = (options?: RouteQueryOptions) => {
    return updatePassword.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:242
 * @route '/api/v1/user/password'
 */
updatePassword.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatePassword.url(options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:242
 * @route '/api/v1/user/password'
 */
updatePassword.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updatePassword.url(options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:242
 * @route '/api/v1/user/password'
 */
updatePassword.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updatePassword.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:242
 * @route '/api/v1/user/password'
 */
    const updatePasswordForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updatePassword.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:242
 * @route '/api/v1/user/password'
 */
        updatePasswordForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updatePassword.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:242
 * @route '/api/v1/user/password'
 */
        updatePasswordForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updatePassword.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:242
 * @route '/api/v1/user/password'
 */
        updatePasswordForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updatePassword.url(options),
            method: 'post',
        })
    
    updatePassword.form = updatePasswordForm
const UserController = { me, update, updatePassword }

export default UserController