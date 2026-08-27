import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\CancellationRequestController::pending
 * @see app/Http/Controllers/Api/CancellationRequestController.php:24
 * @route '/api/v1/cancellation-requests/pending'
 */
export const pending = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pending.url(options),
    method: 'get',
})

pending.definition = {
    methods: ["get","head"],
    url: '/api/v1/cancellation-requests/pending',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::pending
 * @see app/Http/Controllers/Api/CancellationRequestController.php:24
 * @route '/api/v1/cancellation-requests/pending'
 */
pending.url = (options?: RouteQueryOptions) => {
    return pending.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::pending
 * @see app/Http/Controllers/Api/CancellationRequestController.php:24
 * @route '/api/v1/cancellation-requests/pending'
 */
pending.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pending.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CancellationRequestController::pending
 * @see app/Http/Controllers/Api/CancellationRequestController.php:24
 * @route '/api/v1/cancellation-requests/pending'
 */
pending.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pending.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CancellationRequestController::pending
 * @see app/Http/Controllers/Api/CancellationRequestController.php:24
 * @route '/api/v1/cancellation-requests/pending'
 */
    const pendingForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: pending.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CancellationRequestController::pending
 * @see app/Http/Controllers/Api/CancellationRequestController.php:24
 * @route '/api/v1/cancellation-requests/pending'
 */
        pendingForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pending.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CancellationRequestController::pending
 * @see app/Http/Controllers/Api/CancellationRequestController.php:24
 * @route '/api/v1/cancellation-requests/pending'
 */
        pendingForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pending.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    pending.form = pendingForm
/**
* @see \App\Http\Controllers\Api\CancellationRequestController::accept
 * @see app/Http/Controllers/Api/CancellationRequestController.php:76
 * @route '/api/v1/cancellation-requests/{id}/accept'
 */
const acceptaf0210d30659577e3048bf8cfd0d33a1 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptaf0210d30659577e3048bf8cfd0d33a1.url(args, options),
    method: 'post',
})

acceptaf0210d30659577e3048bf8cfd0d33a1.definition = {
    methods: ["post"],
    url: '/api/v1/cancellation-requests/{id}/accept',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::accept
 * @see app/Http/Controllers/Api/CancellationRequestController.php:76
 * @route '/api/v1/cancellation-requests/{id}/accept'
 */
acceptaf0210d30659577e3048bf8cfd0d33a1.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return acceptaf0210d30659577e3048bf8cfd0d33a1.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::accept
 * @see app/Http/Controllers/Api/CancellationRequestController.php:76
 * @route '/api/v1/cancellation-requests/{id}/accept'
 */
acceptaf0210d30659577e3048bf8cfd0d33a1.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptaf0210d30659577e3048bf8cfd0d33a1.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CancellationRequestController::accept
 * @see app/Http/Controllers/Api/CancellationRequestController.php:76
 * @route '/api/v1/cancellation-requests/{id}/accept'
 */
    const acceptaf0210d30659577e3048bf8cfd0d33a1Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: acceptaf0210d30659577e3048bf8cfd0d33a1.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CancellationRequestController::accept
 * @see app/Http/Controllers/Api/CancellationRequestController.php:76
 * @route '/api/v1/cancellation-requests/{id}/accept'
 */
        acceptaf0210d30659577e3048bf8cfd0d33a1Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: acceptaf0210d30659577e3048bf8cfd0d33a1.url(args, options),
            method: 'post',
        })
    
    acceptaf0210d30659577e3048bf8cfd0d33a1.form = acceptaf0210d30659577e3048bf8cfd0d33a1Form
    /**
* @see \App\Http\Controllers\Api\CancellationRequestController::accept
 * @see app/Http/Controllers/Api/CancellationRequestController.php:76
 * @route '/cancellation-requests/{id}/accept'
 */
const accept71a82374af58aa7a9aa021d1cddfbc8e = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: accept71a82374af58aa7a9aa021d1cddfbc8e.url(args, options),
    method: 'post',
})

accept71a82374af58aa7a9aa021d1cddfbc8e.definition = {
    methods: ["post"],
    url: '/cancellation-requests/{id}/accept',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::accept
 * @see app/Http/Controllers/Api/CancellationRequestController.php:76
 * @route '/cancellation-requests/{id}/accept'
 */
accept71a82374af58aa7a9aa021d1cddfbc8e.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return accept71a82374af58aa7a9aa021d1cddfbc8e.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::accept
 * @see app/Http/Controllers/Api/CancellationRequestController.php:76
 * @route '/cancellation-requests/{id}/accept'
 */
accept71a82374af58aa7a9aa021d1cddfbc8e.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: accept71a82374af58aa7a9aa021d1cddfbc8e.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CancellationRequestController::accept
 * @see app/Http/Controllers/Api/CancellationRequestController.php:76
 * @route '/cancellation-requests/{id}/accept'
 */
    const accept71a82374af58aa7a9aa021d1cddfbc8eForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: accept71a82374af58aa7a9aa021d1cddfbc8e.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CancellationRequestController::accept
 * @see app/Http/Controllers/Api/CancellationRequestController.php:76
 * @route '/cancellation-requests/{id}/accept'
 */
        accept71a82374af58aa7a9aa021d1cddfbc8eForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: accept71a82374af58aa7a9aa021d1cddfbc8e.url(args, options),
            method: 'post',
        })
    
    accept71a82374af58aa7a9aa021d1cddfbc8e.form = accept71a82374af58aa7a9aa021d1cddfbc8eForm

export const accept = {
    '/api/v1/cancellation-requests/{id}/accept': acceptaf0210d30659577e3048bf8cfd0d33a1,
    '/cancellation-requests/{id}/accept': accept71a82374af58aa7a9aa021d1cddfbc8e,
}

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/CancellationRequestController.php:198
 * @route '/api/v1/cancellation-requests/{id}/reject'
 */
const reject1dab1dc3a30ad13e894dfcd6e17b547d = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject1dab1dc3a30ad13e894dfcd6e17b547d.url(args, options),
    method: 'post',
})

reject1dab1dc3a30ad13e894dfcd6e17b547d.definition = {
    methods: ["post"],
    url: '/api/v1/cancellation-requests/{id}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/CancellationRequestController.php:198
 * @route '/api/v1/cancellation-requests/{id}/reject'
 */
reject1dab1dc3a30ad13e894dfcd6e17b547d.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return reject1dab1dc3a30ad13e894dfcd6e17b547d.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/CancellationRequestController.php:198
 * @route '/api/v1/cancellation-requests/{id}/reject'
 */
reject1dab1dc3a30ad13e894dfcd6e17b547d.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject1dab1dc3a30ad13e894dfcd6e17b547d.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/CancellationRequestController.php:198
 * @route '/api/v1/cancellation-requests/{id}/reject'
 */
    const reject1dab1dc3a30ad13e894dfcd6e17b547dForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reject1dab1dc3a30ad13e894dfcd6e17b547d.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/CancellationRequestController.php:198
 * @route '/api/v1/cancellation-requests/{id}/reject'
 */
        reject1dab1dc3a30ad13e894dfcd6e17b547dForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reject1dab1dc3a30ad13e894dfcd6e17b547d.url(args, options),
            method: 'post',
        })
    
    reject1dab1dc3a30ad13e894dfcd6e17b547d.form = reject1dab1dc3a30ad13e894dfcd6e17b547dForm
    /**
* @see \App\Http\Controllers\Api\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/CancellationRequestController.php:198
 * @route '/cancellation-requests/{id}/reject'
 */
const rejectda0bb5a251ee02f9aff9b76104331520 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectda0bb5a251ee02f9aff9b76104331520.url(args, options),
    method: 'post',
})

rejectda0bb5a251ee02f9aff9b76104331520.definition = {
    methods: ["post"],
    url: '/cancellation-requests/{id}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/CancellationRequestController.php:198
 * @route '/cancellation-requests/{id}/reject'
 */
rejectda0bb5a251ee02f9aff9b76104331520.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return rejectda0bb5a251ee02f9aff9b76104331520.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/CancellationRequestController.php:198
 * @route '/cancellation-requests/{id}/reject'
 */
rejectda0bb5a251ee02f9aff9b76104331520.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectda0bb5a251ee02f9aff9b76104331520.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/CancellationRequestController.php:198
 * @route '/cancellation-requests/{id}/reject'
 */
    const rejectda0bb5a251ee02f9aff9b76104331520Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectda0bb5a251ee02f9aff9b76104331520.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CancellationRequestController::reject
 * @see app/Http/Controllers/Api/CancellationRequestController.php:198
 * @route '/cancellation-requests/{id}/reject'
 */
        rejectda0bb5a251ee02f9aff9b76104331520Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectda0bb5a251ee02f9aff9b76104331520.url(args, options),
            method: 'post',
        })
    
    rejectda0bb5a251ee02f9aff9b76104331520.form = rejectda0bb5a251ee02f9aff9b76104331520Form

export const reject = {
    '/api/v1/cancellation-requests/{id}/reject': reject1dab1dc3a30ad13e894dfcd6e17b547d,
    '/cancellation-requests/{id}/reject': rejectda0bb5a251ee02f9aff9b76104331520,
}

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::resolve
 * @see app/Http/Controllers/Api/CancellationRequestController.php:297
 * @route '/api/v1/cancellation-requests/{id}/resolve'
 */
const resolvebaea192fb3c53d2a7a06d614b5269147 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resolvebaea192fb3c53d2a7a06d614b5269147.url(args, options),
    method: 'post',
})

resolvebaea192fb3c53d2a7a06d614b5269147.definition = {
    methods: ["post"],
    url: '/api/v1/cancellation-requests/{id}/resolve',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::resolve
 * @see app/Http/Controllers/Api/CancellationRequestController.php:297
 * @route '/api/v1/cancellation-requests/{id}/resolve'
 */
resolvebaea192fb3c53d2a7a06d614b5269147.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return resolvebaea192fb3c53d2a7a06d614b5269147.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::resolve
 * @see app/Http/Controllers/Api/CancellationRequestController.php:297
 * @route '/api/v1/cancellation-requests/{id}/resolve'
 */
resolvebaea192fb3c53d2a7a06d614b5269147.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resolvebaea192fb3c53d2a7a06d614b5269147.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CancellationRequestController::resolve
 * @see app/Http/Controllers/Api/CancellationRequestController.php:297
 * @route '/api/v1/cancellation-requests/{id}/resolve'
 */
    const resolvebaea192fb3c53d2a7a06d614b5269147Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: resolvebaea192fb3c53d2a7a06d614b5269147.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CancellationRequestController::resolve
 * @see app/Http/Controllers/Api/CancellationRequestController.php:297
 * @route '/api/v1/cancellation-requests/{id}/resolve'
 */
        resolvebaea192fb3c53d2a7a06d614b5269147Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: resolvebaea192fb3c53d2a7a06d614b5269147.url(args, options),
            method: 'post',
        })
    
    resolvebaea192fb3c53d2a7a06d614b5269147.form = resolvebaea192fb3c53d2a7a06d614b5269147Form
    /**
* @see \App\Http\Controllers\Api\CancellationRequestController::resolve
 * @see app/Http/Controllers/Api/CancellationRequestController.php:297
 * @route '/api/v1/pos/cancellation-requests/{id}/resolve'
 */
const resolvefb44ba020fb4e11da53eb0ea725e80eb = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resolvefb44ba020fb4e11da53eb0ea725e80eb.url(args, options),
    method: 'post',
})

resolvefb44ba020fb4e11da53eb0ea725e80eb.definition = {
    methods: ["post"],
    url: '/api/v1/pos/cancellation-requests/{id}/resolve',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::resolve
 * @see app/Http/Controllers/Api/CancellationRequestController.php:297
 * @route '/api/v1/pos/cancellation-requests/{id}/resolve'
 */
resolvefb44ba020fb4e11da53eb0ea725e80eb.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return resolvefb44ba020fb4e11da53eb0ea725e80eb.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CancellationRequestController::resolve
 * @see app/Http/Controllers/Api/CancellationRequestController.php:297
 * @route '/api/v1/pos/cancellation-requests/{id}/resolve'
 */
resolvefb44ba020fb4e11da53eb0ea725e80eb.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resolvefb44ba020fb4e11da53eb0ea725e80eb.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CancellationRequestController::resolve
 * @see app/Http/Controllers/Api/CancellationRequestController.php:297
 * @route '/api/v1/pos/cancellation-requests/{id}/resolve'
 */
    const resolvefb44ba020fb4e11da53eb0ea725e80ebForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: resolvefb44ba020fb4e11da53eb0ea725e80eb.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CancellationRequestController::resolve
 * @see app/Http/Controllers/Api/CancellationRequestController.php:297
 * @route '/api/v1/pos/cancellation-requests/{id}/resolve'
 */
        resolvefb44ba020fb4e11da53eb0ea725e80ebForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: resolvefb44ba020fb4e11da53eb0ea725e80eb.url(args, options),
            method: 'post',
        })
    
    resolvefb44ba020fb4e11da53eb0ea725e80eb.form = resolvefb44ba020fb4e11da53eb0ea725e80ebForm

export const resolve = {
    '/api/v1/cancellation-requests/{id}/resolve': resolvebaea192fb3c53d2a7a06d614b5269147,
    '/api/v1/pos/cancellation-requests/{id}/resolve': resolvefb44ba020fb4e11da53eb0ea725e80eb,
}

const CancellationRequestController = { pending, accept, reject, resolve }

export default CancellationRequestController