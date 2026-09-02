import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\AccountFlagController::flag
 * @see app/Http/Controllers/Admin/AccountFlagController.php:24
 * @route '/accounts/flag'
 */
export const flag = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: flag.url(options),
    method: 'post',
})

flag.definition = {
    methods: ["post"],
    url: '/accounts/flag',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\AccountFlagController::flag
 * @see app/Http/Controllers/Admin/AccountFlagController.php:24
 * @route '/accounts/flag'
 */
flag.url = (options?: RouteQueryOptions) => {
    return flag.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AccountFlagController::flag
 * @see app/Http/Controllers/Admin/AccountFlagController.php:24
 * @route '/accounts/flag'
 */
flag.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: flag.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\AccountFlagController::flag
 * @see app/Http/Controllers/Admin/AccountFlagController.php:24
 * @route '/accounts/flag'
 */
    const flagForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: flag.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\AccountFlagController::flag
 * @see app/Http/Controllers/Admin/AccountFlagController.php:24
 * @route '/accounts/flag'
 */
        flagForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: flag.url(options),
            method: 'post',
        })
    
    flag.form = flagForm
const accounts = {
    flag: Object.assign(flag, flag),
}

export default accounts