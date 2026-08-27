import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\DatabaseHealthController::index
 * @see app/Http/Controllers/SuperAdmin/DatabaseHealthController.php:17
 * @route '/super-admin/database'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/super-admin/database',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\DatabaseHealthController::index
 * @see app/Http/Controllers/SuperAdmin/DatabaseHealthController.php:17
 * @route '/super-admin/database'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\DatabaseHealthController::index
 * @see app/Http/Controllers/SuperAdmin/DatabaseHealthController.php:17
 * @route '/super-admin/database'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\DatabaseHealthController::index
 * @see app/Http/Controllers/SuperAdmin/DatabaseHealthController.php:17
 * @route '/super-admin/database'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\DatabaseHealthController::index
 * @see app/Http/Controllers/SuperAdmin/DatabaseHealthController.php:17
 * @route '/super-admin/database'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\DatabaseHealthController::index
 * @see app/Http/Controllers/SuperAdmin/DatabaseHealthController.php:17
 * @route '/super-admin/database'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\DatabaseHealthController::index
 * @see app/Http/Controllers/SuperAdmin/DatabaseHealthController.php:17
 * @route '/super-admin/database'
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
const database = {
    index: Object.assign(index, index),
}

export default database