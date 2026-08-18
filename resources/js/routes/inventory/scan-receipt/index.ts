import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ReceiptController::upload
 * @see app/Http/Controllers/Api/ReceiptController.php:34
 * @route '/inventory/scan-receipt/upload'
 */
export const upload = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: upload.url(options),
    method: 'post',
})

upload.definition = {
    methods: ["post"],
    url: '/inventory/scan-receipt/upload',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ReceiptController::upload
 * @see app/Http/Controllers/Api/ReceiptController.php:34
 * @route '/inventory/scan-receipt/upload'
 */
upload.url = (options?: RouteQueryOptions) => {
    return upload.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ReceiptController::upload
 * @see app/Http/Controllers/Api/ReceiptController.php:34
 * @route '/inventory/scan-receipt/upload'
 */
upload.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: upload.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ReceiptController::upload
 * @see app/Http/Controllers/Api/ReceiptController.php:34
 * @route '/inventory/scan-receipt/upload'
 */
    const uploadForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: upload.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ReceiptController::upload
 * @see app/Http/Controllers/Api/ReceiptController.php:34
 * @route '/inventory/scan-receipt/upload'
 */
        uploadForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: upload.url(options),
            method: 'post',
        })
    
    upload.form = uploadForm
/**
* @see \App\Http\Controllers\Api\ReceiptController::process
 * @see app/Http/Controllers/Api/ReceiptController.php:94
 * @route '/inventory/scan-receipt/process'
 */
export const process = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: process.url(options),
    method: 'post',
})

process.definition = {
    methods: ["post"],
    url: '/inventory/scan-receipt/process',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ReceiptController::process
 * @see app/Http/Controllers/Api/ReceiptController.php:94
 * @route '/inventory/scan-receipt/process'
 */
process.url = (options?: RouteQueryOptions) => {
    return process.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ReceiptController::process
 * @see app/Http/Controllers/Api/ReceiptController.php:94
 * @route '/inventory/scan-receipt/process'
 */
process.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: process.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ReceiptController::process
 * @see app/Http/Controllers/Api/ReceiptController.php:94
 * @route '/inventory/scan-receipt/process'
 */
    const processForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: process.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ReceiptController::process
 * @see app/Http/Controllers/Api/ReceiptController.php:94
 * @route '/inventory/scan-receipt/process'
 */
        processForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: process.url(options),
            method: 'post',
        })
    
    process.form = processForm
/**
* @see \App\Http\Controllers\Api\ReceiptController::confirm
 * @see app/Http/Controllers/Api/ReceiptController.php:225
 * @route '/inventory/scan-receipt/confirm'
 */
export const confirm = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirm.url(options),
    method: 'post',
})

confirm.definition = {
    methods: ["post"],
    url: '/inventory/scan-receipt/confirm',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ReceiptController::confirm
 * @see app/Http/Controllers/Api/ReceiptController.php:225
 * @route '/inventory/scan-receipt/confirm'
 */
confirm.url = (options?: RouteQueryOptions) => {
    return confirm.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ReceiptController::confirm
 * @see app/Http/Controllers/Api/ReceiptController.php:225
 * @route '/inventory/scan-receipt/confirm'
 */
confirm.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirm.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ReceiptController::confirm
 * @see app/Http/Controllers/Api/ReceiptController.php:225
 * @route '/inventory/scan-receipt/confirm'
 */
    const confirmForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: confirm.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ReceiptController::confirm
 * @see app/Http/Controllers/Api/ReceiptController.php:225
 * @route '/inventory/scan-receipt/confirm'
 */
        confirmForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: confirm.url(options),
            method: 'post',
        })
    
    confirm.form = confirmForm
/**
* @see \App\Http\Controllers\Api\ReceiptController::history
 * @see app/Http/Controllers/Api/ReceiptController.php:377
 * @route '/inventory/scan-receipt/history'
 */
export const history = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: history.url(options),
    method: 'get',
})

history.definition = {
    methods: ["get","head"],
    url: '/inventory/scan-receipt/history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ReceiptController::history
 * @see app/Http/Controllers/Api/ReceiptController.php:377
 * @route '/inventory/scan-receipt/history'
 */
history.url = (options?: RouteQueryOptions) => {
    return history.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ReceiptController::history
 * @see app/Http/Controllers/Api/ReceiptController.php:377
 * @route '/inventory/scan-receipt/history'
 */
history.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: history.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ReceiptController::history
 * @see app/Http/Controllers/Api/ReceiptController.php:377
 * @route '/inventory/scan-receipt/history'
 */
history.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: history.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ReceiptController::history
 * @see app/Http/Controllers/Api/ReceiptController.php:377
 * @route '/inventory/scan-receipt/history'
 */
    const historyForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: history.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ReceiptController::history
 * @see app/Http/Controllers/Api/ReceiptController.php:377
 * @route '/inventory/scan-receipt/history'
 */
        historyForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: history.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ReceiptController::history
 * @see app/Http/Controllers/Api/ReceiptController.php:377
 * @route '/inventory/scan-receipt/history'
 */
        historyForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: history.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    history.form = historyForm
/**
* @see \App\Http\Controllers\Api\ReceiptController::show
 * @see app/Http/Controllers/Api/ReceiptController.php:401
 * @route '/inventory/scan-receipt/{id}'
 */
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/inventory/scan-receipt/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ReceiptController::show
 * @see app/Http/Controllers/Api/ReceiptController.php:401
 * @route '/inventory/scan-receipt/{id}'
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
* @see \App\Http\Controllers\Api\ReceiptController::show
 * @see app/Http/Controllers/Api/ReceiptController.php:401
 * @route '/inventory/scan-receipt/{id}'
 */
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ReceiptController::show
 * @see app/Http/Controllers/Api/ReceiptController.php:401
 * @route '/inventory/scan-receipt/{id}'
 */
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ReceiptController::show
 * @see app/Http/Controllers/Api/ReceiptController.php:401
 * @route '/inventory/scan-receipt/{id}'
 */
    const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ReceiptController::show
 * @see app/Http/Controllers/Api/ReceiptController.php:401
 * @route '/inventory/scan-receipt/{id}'
 */
        showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ReceiptController::show
 * @see app/Http/Controllers/Api/ReceiptController.php:401
 * @route '/inventory/scan-receipt/{id}'
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
const scanReceipt = {
    upload: Object.assign(upload, upload),
process: Object.assign(process, process),
confirm: Object.assign(confirm, confirm),
history: Object.assign(history, history),
show: Object.assign(show, show),
}

export default scanReceipt