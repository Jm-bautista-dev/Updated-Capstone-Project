import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:75
 * @route '/api/branches'
 */
const apiIndex79a38bc5e41fa7a73766069cf0b9d9b2 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: apiIndex79a38bc5e41fa7a73766069cf0b9d9b2.url(options),
    method: 'get',
})

apiIndex79a38bc5e41fa7a73766069cf0b9d9b2.definition = {
    methods: ["get","head"],
    url: '/api/branches',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:75
 * @route '/api/branches'
 */
apiIndex79a38bc5e41fa7a73766069cf0b9d9b2.url = (options?: RouteQueryOptions) => {
    return apiIndex79a38bc5e41fa7a73766069cf0b9d9b2.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:75
 * @route '/api/branches'
 */
apiIndex79a38bc5e41fa7a73766069cf0b9d9b2.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: apiIndex79a38bc5e41fa7a73766069cf0b9d9b2.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:75
 * @route '/api/branches'
 */
apiIndex79a38bc5e41fa7a73766069cf0b9d9b2.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: apiIndex79a38bc5e41fa7a73766069cf0b9d9b2.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:75
 * @route '/api/branches'
 */
    const apiIndex79a38bc5e41fa7a73766069cf0b9d9b2Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: apiIndex79a38bc5e41fa7a73766069cf0b9d9b2.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:75
 * @route '/api/branches'
 */
        apiIndex79a38bc5e41fa7a73766069cf0b9d9b2Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: apiIndex79a38bc5e41fa7a73766069cf0b9d9b2.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:75
 * @route '/api/branches'
 */
        apiIndex79a38bc5e41fa7a73766069cf0b9d9b2Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: apiIndex79a38bc5e41fa7a73766069cf0b9d9b2.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    apiIndex79a38bc5e41fa7a73766069cf0b9d9b2.form = apiIndex79a38bc5e41fa7a73766069cf0b9d9b2Form
    /**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:75
 * @route '/api/v1/branches'
 */
const apiIndexc6ef769c783d440c68fcc24c9c598880 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: apiIndexc6ef769c783d440c68fcc24c9c598880.url(options),
    method: 'get',
})

apiIndexc6ef769c783d440c68fcc24c9c598880.definition = {
    methods: ["get","head"],
    url: '/api/v1/branches',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:75
 * @route '/api/v1/branches'
 */
apiIndexc6ef769c783d440c68fcc24c9c598880.url = (options?: RouteQueryOptions) => {
    return apiIndexc6ef769c783d440c68fcc24c9c598880.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:75
 * @route '/api/v1/branches'
 */
apiIndexc6ef769c783d440c68fcc24c9c598880.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: apiIndexc6ef769c783d440c68fcc24c9c598880.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:75
 * @route '/api/v1/branches'
 */
apiIndexc6ef769c783d440c68fcc24c9c598880.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: apiIndexc6ef769c783d440c68fcc24c9c598880.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:75
 * @route '/api/v1/branches'
 */
    const apiIndexc6ef769c783d440c68fcc24c9c598880Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: apiIndexc6ef769c783d440c68fcc24c9c598880.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:75
 * @route '/api/v1/branches'
 */
        apiIndexc6ef769c783d440c68fcc24c9c598880Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: apiIndexc6ef769c783d440c68fcc24c9c598880.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\BranchController::apiIndex
 * @see app/Http/Controllers/BranchController.php:75
 * @route '/api/v1/branches'
 */
        apiIndexc6ef769c783d440c68fcc24c9c598880Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: apiIndexc6ef769c783d440c68fcc24c9c598880.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    apiIndexc6ef769c783d440c68fcc24c9c598880.form = apiIndexc6ef769c783d440c68fcc24c9c598880Form

export const apiIndex = {
    '/api/branches': apiIndex79a38bc5e41fa7a73766069cf0b9d9b2,
    '/api/v1/branches': apiIndexc6ef769c783d440c68fcc24c9c598880,
}

/**
* @see \App\Http\Controllers\BranchController::update
 * @see app/Http/Controllers/BranchController.php:40
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
 * @see app/Http/Controllers/BranchController.php:40
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
 * @see app/Http/Controllers/BranchController.php:40
 * @route '/branches/{id}'
 */
update.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\BranchController::update
 * @see app/Http/Controllers/BranchController.php:40
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
 * @see app/Http/Controllers/BranchController.php:40
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
const BranchController = { apiIndex, update, adminIndex }

export default BranchController