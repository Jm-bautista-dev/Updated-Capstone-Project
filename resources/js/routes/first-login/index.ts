import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\ChangePasswordController::change
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:15
 * @route '/change-password'
 */
export const change = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: change.url(options),
    method: 'get',
})

change.definition = {
    methods: ["get","head"],
    url: '/change-password',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\ChangePasswordController::change
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:15
 * @route '/change-password'
 */
change.url = (options?: RouteQueryOptions) => {
    return change.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\ChangePasswordController::change
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:15
 * @route '/change-password'
 */
change.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: change.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Auth\ChangePasswordController::change
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:15
 * @route '/change-password'
 */
change.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: change.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Auth\ChangePasswordController::change
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:15
 * @route '/change-password'
 */
    const changeForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: change.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Auth\ChangePasswordController::change
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:15
 * @route '/change-password'
 */
        changeForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: change.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Auth\ChangePasswordController::change
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:15
 * @route '/change-password'
 */
        changeForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: change.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    change.form = changeForm
/**
* @see \App\Http\Controllers\Auth\ChangePasswordController::update
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:23
 * @route '/change-password'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

update.definition = {
    methods: ["post"],
    url: '/change-password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\ChangePasswordController::update
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:23
 * @route '/change-password'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\ChangePasswordController::update
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:23
 * @route '/change-password'
 */
update.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\ChangePasswordController::update
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:23
 * @route '/change-password'
 */
    const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\ChangePasswordController::update
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:23
 * @route '/change-password'
 */
        updateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(options),
            method: 'post',
        })
    
    update.form = updateForm
const firstLogin = {
    change: Object.assign(change, change),
update: Object.assign(update, update),
}

export default firstLogin