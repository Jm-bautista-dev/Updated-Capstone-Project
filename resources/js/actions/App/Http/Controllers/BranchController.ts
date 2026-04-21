import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:67
 * @route '/api/v1/branches'
 */
export const apiIndex = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: apiIndex.url(options),
    method: 'get',
})

apiIndex.definition = {
    methods: ["get","head"],
    url: '/api/v1/branches',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:67
 * @route '/api/v1/branches'
 */
apiIndex.url = (options?: RouteQueryOptions) => {
    return apiIndex.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:67
 * @route '/api/v1/branches'
 */
apiIndex.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: apiIndex.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:67
 * @route '/api/v1/branches'
 */
apiIndex.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: apiIndex.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:67
 * @route '/api/v1/branches'
 */
    const apiIndexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: apiIndex.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:67
 * @route '/api/v1/branches'
 */
        apiIndexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: apiIndex.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:67
 * @route '/api/v1/branches'
 */
        apiIndexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: apiIndex.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    apiIndex.form = apiIndexForm
/**
* @see \App\Http\Controllers\BranchController::updateLocation
 * @see app/Http/Controllers/BranchController.php:89
 * @route '/api/v1/branches/{id}/location'
 */
export const updateLocation = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateLocation.url(args, options),
    method: 'patch',
})

updateLocation.definition = {
    methods: ["patch"],
    url: '/api/v1/branches/{id}/location',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\BranchController::updateLocation
 * @see app/Http/Controllers/BranchController.php:89
 * @route '/api/v1/branches/{id}/location'
 */
updateLocation.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return updateLocation.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\BranchController::updateLocation
 * @see app/Http/Controllers/BranchController.php:89
 * @route '/api/v1/branches/{id}/location'
 */
updateLocation.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateLocation.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\BranchController::updateLocation
 * @see app/Http/Controllers/BranchController.php:89
 * @route '/api/v1/branches/{id}/location'
 */
    const updateLocationForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateLocation.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\BranchController::updateLocation
 * @see app/Http/Controllers/BranchController.php:89
 * @route '/api/v1/branches/{id}/location'
 */
        updateLocationForm.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateLocation.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateLocation.form = updateLocationForm
/**
* @see \App\Http\Controllers\BranchController::update
 * @see app/Http/Controllers/BranchController.php:32
 * @route '/branches/{id}'
 */
export const update = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/branches/{id}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\BranchController::update
 * @see app/Http/Controllers/BranchController.php:32
 * @route '/branches/{id}'
 */
update.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return update.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\BranchController::update
 * @see app/Http/Controllers/BranchController.php:32
 * @route '/branches/{id}'
 */
update.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\BranchController::update
 * @see app/Http/Controllers/BranchController.php:32
 * @route '/branches/{id}'
 */
    const updateForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\BranchController::update
 * @see app/Http/Controllers/BranchController.php:32
 * @route '/branches/{id}'
 */
        updateForm.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\BranchController::adminIndex
 * @see app/Http/Controllers/BranchController.php:17
 * @route '/branches'
 */
export const adminIndex = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: adminIndex.url(options),
    method: 'get',
})

adminIndex.definition = {
    methods: ["get","head"],
    url: '/branches',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BranchController::adminIndex
 * @see app/Http/Controllers/BranchController.php:17
 * @route '/branches'
 */
adminIndex.url = (options?: RouteQueryOptions) => {
    return adminIndex.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BranchController::adminIndex
 * @see app/Http/Controllers/BranchController.php:17
 * @route '/branches'
 */
adminIndex.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: adminIndex.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\BranchController::adminIndex
 * @see app/Http/Controllers/BranchController.php:17
 * @route '/branches'
 */
adminIndex.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: adminIndex.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\BranchController::adminIndex
 * @see app/Http/Controllers/BranchController.php:17
 * @route '/branches'
 */
    const adminIndexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: adminIndex.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\BranchController::adminIndex
 * @see app/Http/Controllers/BranchController.php:17
 * @route '/branches'
 */
        adminIndexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: adminIndex.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\BranchController::adminIndex
 * @see app/Http/Controllers/BranchController.php:17
 * @route '/branches'
 */
        adminIndexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: adminIndex.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    adminIndex.form = adminIndexForm
const BranchController = { apiIndex, updateLocation, update, adminIndex }

export default BranchController