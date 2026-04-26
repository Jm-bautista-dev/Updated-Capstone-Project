import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\ChangePasswordController::show
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:15
 * @route '/change-password'
 */
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/change-password',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\ChangePasswordController::show
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:15
 * @route '/change-password'
 */
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\ChangePasswordController::show
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:15
 * @route '/change-password'
 */
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Auth\ChangePasswordController::show
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:15
 * @route '/change-password'
 */
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Auth\ChangePasswordController::show
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:15
 * @route '/change-password'
 */
    const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Auth\ChangePasswordController::show
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:15
 * @route '/change-password'
 */
        showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Auth\ChangePasswordController::show
 * @see app/Http/Controllers/Auth/ChangePasswordController.php:15
 * @route '/change-password'
 */
        showForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
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
const ChangePasswordController = { show, update }

export default ChangePasswordController