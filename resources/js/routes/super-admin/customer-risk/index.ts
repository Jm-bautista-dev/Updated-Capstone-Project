import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::index
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:27
 * @route '/super-admin/customer-risk'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/super-admin/customer-risk',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::index
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:27
 * @route '/super-admin/customer-risk'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::index
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:27
 * @route '/super-admin/customer-risk'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::index
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:27
 * @route '/super-admin/customer-risk'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::index
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:27
 * @route '/super-admin/customer-risk'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::index
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:27
 * @route '/super-admin/customer-risk'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::index
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:27
 * @route '/super-admin/customer-risk'
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
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::show
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:94
 * @route '/super-admin/customer-risk/{id}'
 */
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/super-admin/customer-risk/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::show
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:94
 * @route '/super-admin/customer-risk/{id}'
 */
show.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::show
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:94
 * @route '/super-admin/customer-risk/{id}'
 */
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::show
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:94
 * @route '/super-admin/customer-risk/{id}'
 */
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::show
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:94
 * @route '/super-admin/customer-risk/{id}'
 */
    const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::show
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:94
 * @route '/super-admin/customer-risk/{id}'
 */
        showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::show
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:94
 * @route '/super-admin/customer-risk/{id}'
 */
        showForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::override
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:128
 * @route '/super-admin/customer-risk/{id}/override'
 */
export const override = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: override.url(args, options),
    method: 'post',
})

override.definition = {
    methods: ["post"],
    url: '/super-admin/customer-risk/{id}/override',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::override
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:128
 * @route '/super-admin/customer-risk/{id}/override'
 */
override.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return override.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::override
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:128
 * @route '/super-admin/customer-risk/{id}/override'
 */
override.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: override.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::override
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:128
 * @route '/super-admin/customer-risk/{id}/override'
 */
    const overrideForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: override.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\CustomerRiskController::override
 * @see app/Http/Controllers/SuperAdmin/CustomerRiskController.php:128
 * @route '/super-admin/customer-risk/{id}/override'
 */
        overrideForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: override.url(args, options),
            method: 'post',
        })
    
    override.form = overrideForm
const customerRisk = {
    index: Object.assign(index, index),
show: Object.assign(show, show),
override: Object.assign(override, override),
}

export default customerRisk