import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\DeploymentController::index
 * @see app/Http/Controllers/SuperAdmin/DeploymentController.php:16
 * @route '/super-admin/deployment'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/super-admin/deployment',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\DeploymentController::index
 * @see app/Http/Controllers/SuperAdmin/DeploymentController.php:16
 * @route '/super-admin/deployment'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\DeploymentController::index
 * @see app/Http/Controllers/SuperAdmin/DeploymentController.php:16
 * @route '/super-admin/deployment'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\DeploymentController::index
 * @see app/Http/Controllers/SuperAdmin/DeploymentController.php:16
 * @route '/super-admin/deployment'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\DeploymentController::index
 * @see app/Http/Controllers/SuperAdmin/DeploymentController.php:16
 * @route '/super-admin/deployment'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\DeploymentController::index
 * @see app/Http/Controllers/SuperAdmin/DeploymentController.php:16
 * @route '/super-admin/deployment'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\DeploymentController::index
 * @see app/Http/Controllers/SuperAdmin/DeploymentController.php:16
 * @route '/super-admin/deployment'
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
const deployment = {
    index: Object.assign(index, index),
}

export default deployment