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

const UserController = { me }

export default UserController