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
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/api/v1/user'
 */
const update805096a867627d4e728c2c6a0e1529bb = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update805096a867627d4e728c2c6a0e1529bb.url(options),
    method: 'patch',
})

update805096a867627d4e728c2c6a0e1529bb.definition = {
    methods: ["patch","put","post"],
    url: '/api/v1/user',
} satisfies RouteDefinition<["patch","put","post"]>

/**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/api/v1/user'
 */
update805096a867627d4e728c2c6a0e1529bb.url = (options?: RouteQueryOptions) => {
    return update805096a867627d4e728c2c6a0e1529bb.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/api/v1/user'
 */
update805096a867627d4e728c2c6a0e1529bb.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update805096a867627d4e728c2c6a0e1529bb.url(options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/api/v1/user'
 */
update805096a867627d4e728c2c6a0e1529bb.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update805096a867627d4e728c2c6a0e1529bb.url(options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/api/v1/user'
 */
update805096a867627d4e728c2c6a0e1529bb.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update805096a867627d4e728c2c6a0e1529bb.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/api/v1/user'
 */
    const update805096a867627d4e728c2c6a0e1529bbForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update805096a867627d4e728c2c6a0e1529bb.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/api/v1/user'
 */
        update805096a867627d4e728c2c6a0e1529bbForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update805096a867627d4e728c2c6a0e1529bb.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/api/v1/user'
 */
        update805096a867627d4e728c2c6a0e1529bbForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update805096a867627d4e728c2c6a0e1529bb.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/api/v1/user'
 */
        update805096a867627d4e728c2c6a0e1529bbForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update805096a867627d4e728c2c6a0e1529bb.url(options),
            method: 'post',
        })
    
    update805096a867627d4e728c2c6a0e1529bb.form = update805096a867627d4e728c2c6a0e1529bbForm
    /**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/user'
 */
const update4f74708015d25e186d2d80ed42af2d9a = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update4f74708015d25e186d2d80ed42af2d9a.url(options),
    method: 'patch',
})

update4f74708015d25e186d2d80ed42af2d9a.definition = {
    methods: ["patch","put","post"],
    url: '/user',
} satisfies RouteDefinition<["patch","put","post"]>

/**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/user'
 */
update4f74708015d25e186d2d80ed42af2d9a.url = (options?: RouteQueryOptions) => {
    return update4f74708015d25e186d2d80ed42af2d9a.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/user'
 */
update4f74708015d25e186d2d80ed42af2d9a.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update4f74708015d25e186d2d80ed42af2d9a.url(options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/user'
 */
update4f74708015d25e186d2d80ed42af2d9a.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update4f74708015d25e186d2d80ed42af2d9a.url(options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/user'
 */
update4f74708015d25e186d2d80ed42af2d9a.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update4f74708015d25e186d2d80ed42af2d9a.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/user'
 */
    const update4f74708015d25e186d2d80ed42af2d9aForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update4f74708015d25e186d2d80ed42af2d9a.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/user'
 */
        update4f74708015d25e186d2d80ed42af2d9aForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update4f74708015d25e186d2d80ed42af2d9a.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/user'
 */
        update4f74708015d25e186d2d80ed42af2d9aForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update4f74708015d25e186d2d80ed42af2d9a.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::update
 * @see app/Http/Controllers/Api/UserController.php:105
 * @route '/user'
 */
        update4f74708015d25e186d2d80ed42af2d9aForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update4f74708015d25e186d2d80ed42af2d9a.url(options),
            method: 'post',
        })
    
    update4f74708015d25e186d2d80ed42af2d9a.form = update4f74708015d25e186d2d80ed42af2d9aForm

export const update = {
    '/api/v1/user': update805096a867627d4e728c2c6a0e1529bb,
    '/user': update4f74708015d25e186d2d80ed42af2d9a,
}

/**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/api/v1/user/password'
 */
const updatePassword9b2966bb4355755e9686e4f7798f57cb = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatePassword9b2966bb4355755e9686e4f7798f57cb.url(options),
    method: 'patch',
})

updatePassword9b2966bb4355755e9686e4f7798f57cb.definition = {
    methods: ["patch","put","post"],
    url: '/api/v1/user/password',
} satisfies RouteDefinition<["patch","put","post"]>

/**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/api/v1/user/password'
 */
updatePassword9b2966bb4355755e9686e4f7798f57cb.url = (options?: RouteQueryOptions) => {
    return updatePassword9b2966bb4355755e9686e4f7798f57cb.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/api/v1/user/password'
 */
updatePassword9b2966bb4355755e9686e4f7798f57cb.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatePassword9b2966bb4355755e9686e4f7798f57cb.url(options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/api/v1/user/password'
 */
updatePassword9b2966bb4355755e9686e4f7798f57cb.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updatePassword9b2966bb4355755e9686e4f7798f57cb.url(options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/api/v1/user/password'
 */
updatePassword9b2966bb4355755e9686e4f7798f57cb.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updatePassword9b2966bb4355755e9686e4f7798f57cb.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/api/v1/user/password'
 */
    const updatePassword9b2966bb4355755e9686e4f7798f57cbForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updatePassword9b2966bb4355755e9686e4f7798f57cb.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/api/v1/user/password'
 */
        updatePassword9b2966bb4355755e9686e4f7798f57cbForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updatePassword9b2966bb4355755e9686e4f7798f57cb.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/api/v1/user/password'
 */
        updatePassword9b2966bb4355755e9686e4f7798f57cbForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updatePassword9b2966bb4355755e9686e4f7798f57cb.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/api/v1/user/password'
 */
        updatePassword9b2966bb4355755e9686e4f7798f57cbForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updatePassword9b2966bb4355755e9686e4f7798f57cb.url(options),
            method: 'post',
        })
    
    updatePassword9b2966bb4355755e9686e4f7798f57cb.form = updatePassword9b2966bb4355755e9686e4f7798f57cbForm
    /**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/user/password'
 */
const updatePassword5c31ea537ec820666676eac122affc36 = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatePassword5c31ea537ec820666676eac122affc36.url(options),
    method: 'patch',
})

updatePassword5c31ea537ec820666676eac122affc36.definition = {
    methods: ["patch","put","post"],
    url: '/user/password',
} satisfies RouteDefinition<["patch","put","post"]>

/**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/user/password'
 */
updatePassword5c31ea537ec820666676eac122affc36.url = (options?: RouteQueryOptions) => {
    return updatePassword5c31ea537ec820666676eac122affc36.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/user/password'
 */
updatePassword5c31ea537ec820666676eac122affc36.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatePassword5c31ea537ec820666676eac122affc36.url(options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/user/password'
 */
updatePassword5c31ea537ec820666676eac122affc36.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updatePassword5c31ea537ec820666676eac122affc36.url(options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/user/password'
 */
updatePassword5c31ea537ec820666676eac122affc36.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updatePassword5c31ea537ec820666676eac122affc36.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/user/password'
 */
    const updatePassword5c31ea537ec820666676eac122affc36Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updatePassword5c31ea537ec820666676eac122affc36.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/user/password'
 */
        updatePassword5c31ea537ec820666676eac122affc36Form.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updatePassword5c31ea537ec820666676eac122affc36.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/user/password'
 */
        updatePassword5c31ea537ec820666676eac122affc36Form.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updatePassword5c31ea537ec820666676eac122affc36.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::updatePassword
 * @see app/Http/Controllers/Api/UserController.php:244
 * @route '/user/password'
 */
        updatePassword5c31ea537ec820666676eac122affc36Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updatePassword5c31ea537ec820666676eac122affc36.url(options),
            method: 'post',
        })
    
    updatePassword5c31ea537ec820666676eac122affc36.form = updatePassword5c31ea537ec820666676eac122affc36Form

export const updatePassword = {
    '/api/v1/user/password': updatePassword9b2966bb4355755e9686e4f7798f57cb,
    '/user/password': updatePassword5c31ea537ec820666676eac122affc36,
}

const UserController = { me, update, updatePassword }

export default UserController