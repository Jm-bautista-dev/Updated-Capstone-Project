import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:16
 * @route '/api/v1/user'
 */
export const me = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: me.url(options),
    method: 'get',
})

me.definition = {
    methods: ["get","head"],
    url: '/api/v1/user',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:16
 * @route '/api/v1/user'
 */
me.url = (options?: RouteQueryOptions) => {
    return me.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:16
 * @route '/api/v1/user'
 */
me.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: me.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:16
 * @route '/api/v1/user'
 */
me.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: me.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:16
 * @route '/api/v1/user'
 */
    const meForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: me.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:16
 * @route '/api/v1/user'
 */
        meForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: me.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\UserController::me
 * @see app/Http/Controllers/Api/UserController.php:16
 * @route '/api/v1/user'
 */
        meForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: me.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    me.form = meForm
const UserController = { me }

export default UserController