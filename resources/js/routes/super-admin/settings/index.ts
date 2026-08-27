import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\SettingsController::index
 * @see app/Http/Controllers/SuperAdmin/SettingsController.php:18
 * @route '/super-admin/settings'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/super-admin/settings',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SettingsController::index
 * @see app/Http/Controllers/SuperAdmin/SettingsController.php:18
 * @route '/super-admin/settings'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SettingsController::index
 * @see app/Http/Controllers/SuperAdmin/SettingsController.php:18
 * @route '/super-admin/settings'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\SettingsController::index
 * @see app/Http/Controllers/SuperAdmin/SettingsController.php:18
 * @route '/super-admin/settings'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SettingsController::index
 * @see app/Http/Controllers/SuperAdmin/SettingsController.php:18
 * @route '/super-admin/settings'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SettingsController::index
 * @see app/Http/Controllers/SuperAdmin/SettingsController.php:18
 * @route '/super-admin/settings'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\SettingsController::index
 * @see app/Http/Controllers/SuperAdmin/SettingsController.php:18
 * @route '/super-admin/settings'
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
* @see \App\Http\Controllers\SuperAdmin\SettingsController::update
 * @see app/Http/Controllers/SuperAdmin/SettingsController.php:33
 * @route '/super-admin/settings/update'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

update.definition = {
    methods: ["post"],
    url: '/super-admin/settings/update',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SettingsController::update
 * @see app/Http/Controllers/SuperAdmin/SettingsController.php:33
 * @route '/super-admin/settings/update'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SettingsController::update
 * @see app/Http/Controllers/SuperAdmin/SettingsController.php:33
 * @route '/super-admin/settings/update'
 */
update.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SettingsController::update
 * @see app/Http/Controllers/SuperAdmin/SettingsController.php:33
 * @route '/super-admin/settings/update'
 */
    const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SettingsController::update
 * @see app/Http/Controllers/SuperAdmin/SettingsController.php:33
 * @route '/super-admin/settings/update'
 */
        updateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(options),
            method: 'post',
        })
    
    update.form = updateForm
const settings = {
    index: Object.assign(index, index),
update: Object.assign(update, update),
}

export default settings