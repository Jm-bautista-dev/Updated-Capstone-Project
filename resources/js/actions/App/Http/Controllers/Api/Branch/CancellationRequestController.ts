import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:25
 * @route '/api/v1/branch/cancellation-requests/{id}/reject'
 */
const reject3024e7361a6fcf95ee86c04270c9f2a0 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject3024e7361a6fcf95ee86c04270c9f2a0.url(args, options),
    method: 'post',
})

reject3024e7361a6fcf95ee86c04270c9f2a0.definition = {
    methods: ["post"],
    url: '/api/v1/branch/cancellation-requests/{id}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:25
 * @route '/api/v1/branch/cancellation-requests/{id}/reject'
 */
reject3024e7361a6fcf95ee86c04270c9f2a0.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return reject3024e7361a6fcf95ee86c04270c9f2a0.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:25
 * @route '/api/v1/branch/cancellation-requests/{id}/reject'
 */
reject3024e7361a6fcf95ee86c04270c9f2a0.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject3024e7361a6fcf95ee86c04270c9f2a0.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:25
 * @route '/api/v1/branch/cancellation-requests/{id}/reject'
 */
    const reject3024e7361a6fcf95ee86c04270c9f2a0Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reject3024e7361a6fcf95ee86c04270c9f2a0.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:25
 * @route '/api/v1/branch/cancellation-requests/{id}/reject'
 */
        reject3024e7361a6fcf95ee86c04270c9f2a0Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reject3024e7361a6fcf95ee86c04270c9f2a0.url(args, options),
            method: 'post',
        })
    
    reject3024e7361a6fcf95ee86c04270c9f2a0.form = reject3024e7361a6fcf95ee86c04270c9f2a0Form
    /**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:25
 * @route '/api/branch/cancellation-requests/{id}/reject'
 */
const rejectf4638f149eb42f6e12c5c930ff2cbab2 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectf4638f149eb42f6e12c5c930ff2cbab2.url(args, options),
    method: 'post',
})

rejectf4638f149eb42f6e12c5c930ff2cbab2.definition = {
    methods: ["post"],
    url: '/api/branch/cancellation-requests/{id}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:25
 * @route '/api/branch/cancellation-requests/{id}/reject'
 */
rejectf4638f149eb42f6e12c5c930ff2cbab2.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return rejectf4638f149eb42f6e12c5c930ff2cbab2.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:25
 * @route '/api/branch/cancellation-requests/{id}/reject'
 */
rejectf4638f149eb42f6e12c5c930ff2cbab2.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectf4638f149eb42f6e12c5c930ff2cbab2.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:25
 * @route '/api/branch/cancellation-requests/{id}/reject'
 */
    const rejectf4638f149eb42f6e12c5c930ff2cbab2Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectf4638f149eb42f6e12c5c930ff2cbab2.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:25
 * @route '/api/branch/cancellation-requests/{id}/reject'
 */
        rejectf4638f149eb42f6e12c5c930ff2cbab2Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectf4638f149eb42f6e12c5c930ff2cbab2.url(args, options),
            method: 'post',
        })
    
    rejectf4638f149eb42f6e12c5c930ff2cbab2.form = rejectf4638f149eb42f6e12c5c930ff2cbab2Form

export const reject = {
    '/api/v1/branch/cancellation-requests/{id}/reject': reject3024e7361a6fcf95ee86c04270c9f2a0,
    '/api/branch/cancellation-requests/{id}/reject': rejectf4638f149eb42f6e12c5c930ff2cbab2,
}

/**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::approve
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:132
 * @route '/api/v1/branch/cancellation-requests/{id}/approve'
 */
const approvef1aa6da5ff62f8f1429ebd6841784383 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approvef1aa6da5ff62f8f1429ebd6841784383.url(args, options),
    method: 'post',
})

approvef1aa6da5ff62f8f1429ebd6841784383.definition = {
    methods: ["post"],
    url: '/api/v1/branch/cancellation-requests/{id}/approve',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::approve
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:132
 * @route '/api/v1/branch/cancellation-requests/{id}/approve'
 */
approvef1aa6da5ff62f8f1429ebd6841784383.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return approvef1aa6da5ff62f8f1429ebd6841784383.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::approve
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:132
 * @route '/api/v1/branch/cancellation-requests/{id}/approve'
 */
approvef1aa6da5ff62f8f1429ebd6841784383.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approvef1aa6da5ff62f8f1429ebd6841784383.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::approve
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:132
 * @route '/api/v1/branch/cancellation-requests/{id}/approve'
 */
    const approvef1aa6da5ff62f8f1429ebd6841784383Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: approvef1aa6da5ff62f8f1429ebd6841784383.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::approve
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:132
 * @route '/api/v1/branch/cancellation-requests/{id}/approve'
 */
        approvef1aa6da5ff62f8f1429ebd6841784383Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: approvef1aa6da5ff62f8f1429ebd6841784383.url(args, options),
            method: 'post',
        })
    
    approvef1aa6da5ff62f8f1429ebd6841784383.form = approvef1aa6da5ff62f8f1429ebd6841784383Form
    /**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::approve
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:132
 * @route '/api/branch/cancellation-requests/{id}/approve'
 */
const approve333ff3f3e4f450abe81b6009c51d3441 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve333ff3f3e4f450abe81b6009c51d3441.url(args, options),
    method: 'post',
})

approve333ff3f3e4f450abe81b6009c51d3441.definition = {
    methods: ["post"],
    url: '/api/branch/cancellation-requests/{id}/approve',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::approve
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:132
 * @route '/api/branch/cancellation-requests/{id}/approve'
 */
approve333ff3f3e4f450abe81b6009c51d3441.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return approve333ff3f3e4f450abe81b6009c51d3441.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::approve
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:132
 * @route '/api/branch/cancellation-requests/{id}/approve'
 */
approve333ff3f3e4f450abe81b6009c51d3441.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve333ff3f3e4f450abe81b6009c51d3441.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::approve
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:132
 * @route '/api/branch/cancellation-requests/{id}/approve'
 */
    const approve333ff3f3e4f450abe81b6009c51d3441Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: approve333ff3f3e4f450abe81b6009c51d3441.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\Branch\CancellationRequestController::approve
 * @see app/Http/Controllers/Api/Branch/CancellationRequestController.php:132
 * @route '/api/branch/cancellation-requests/{id}/approve'
 */
        approve333ff3f3e4f450abe81b6009c51d3441Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: approve333ff3f3e4f450abe81b6009c51d3441.url(args, options),
            method: 'post',
        })
    
    approve333ff3f3e4f450abe81b6009c51d3441.form = approve333ff3f3e4f450abe81b6009c51d3441Form

export const approve = {
    '/api/v1/branch/cancellation-requests/{id}/approve': approvef1aa6da5ff62f8f1429ebd6841784383,
    '/api/branch/cancellation-requests/{id}/approve': approve333ff3f3e4f450abe81b6009c51d3441,
}

const CancellationRequestController = { reject, approve }

export default CancellationRequestController