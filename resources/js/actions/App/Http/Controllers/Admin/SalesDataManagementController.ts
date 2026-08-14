import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::index
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:24
 * @route '/admin/sales-data'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/sales-data',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::index
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:24
 * @route '/admin/sales-data'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::index
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:24
 * @route '/admin/sales-data'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::index
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:24
 * @route '/admin/sales-data'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::index
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:24
 * @route '/admin/sales-data'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::index
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:24
 * @route '/admin/sales-data'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::index
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:24
 * @route '/admin/sales-data'
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
* @see \App\Http\Controllers\Admin\SalesDataManagementController::validateFile
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:69
 * @route '/admin/sales-data/validate'
 */
export const validateFile = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validateFile.url(options),
    method: 'post',
})

validateFile.definition = {
    methods: ["post"],
    url: '/admin/sales-data/validate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::validateFile
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:69
 * @route '/admin/sales-data/validate'
 */
validateFile.url = (options?: RouteQueryOptions) => {
    return validateFile.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::validateFile
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:69
 * @route '/admin/sales-data/validate'
 */
validateFile.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validateFile.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::validateFile
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:69
 * @route '/admin/sales-data/validate'
 */
    const validateFileForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: validateFile.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::validateFile
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:69
 * @route '/admin/sales-data/validate'
 */
        validateFileForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: validateFile.url(options),
            method: 'post',
        })
    
    validateFile.form = validateFileForm
/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::importMethod
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:257
 * @route '/admin/sales-data/import'
 */
export const importMethod = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

importMethod.definition = {
    methods: ["post"],
    url: '/admin/sales-data/import',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::importMethod
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:257
 * @route '/admin/sales-data/import'
 */
importMethod.url = (options?: RouteQueryOptions) => {
    return importMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::importMethod
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:257
 * @route '/admin/sales-data/import'
 */
importMethod.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::importMethod
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:257
 * @route '/admin/sales-data/import'
 */
    const importMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: importMethod.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::importMethod
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:257
 * @route '/admin/sales-data/import'
 */
        importMethodForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: importMethod.url(options),
            method: 'post',
        })
    
    importMethod.form = importMethodForm
/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::restore
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:506
 * @route '/admin/sales-data/restore/{backup}'
 */
export const restore = (args: { backup: number | { id: number } } | [backup: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

restore.definition = {
    methods: ["post"],
    url: '/admin/sales-data/restore/{backup}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::restore
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:506
 * @route '/admin/sales-data/restore/{backup}'
 */
restore.url = (args: { backup: number | { id: number } } | [backup: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { backup: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { backup: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    backup: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        backup: typeof args.backup === 'object'
                ? args.backup.id
                : args.backup,
                }

    return restore.definition.url
            .replace('{backup}', parsedArgs.backup.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::restore
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:506
 * @route '/admin/sales-data/restore/{backup}'
 */
restore.post = (args: { backup: number | { id: number } } | [backup: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restore.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::restore
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:506
 * @route '/admin/sales-data/restore/{backup}'
 */
    const restoreForm = (args: { backup: number | { id: number } } | [backup: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: restore.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::restore
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:506
 * @route '/admin/sales-data/restore/{backup}'
 */
        restoreForm.post = (args: { backup: number | { id: number } } | [backup: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: restore.url(args, options),
            method: 'post',
        })
    
    restore.form = restoreForm
/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::destroyBackup
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:554
 * @route '/admin/sales-data/backup/{backup}'
 */
export const destroyBackup = (args: { backup: number | { id: number } } | [backup: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyBackup.url(args, options),
    method: 'delete',
})

destroyBackup.definition = {
    methods: ["delete"],
    url: '/admin/sales-data/backup/{backup}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::destroyBackup
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:554
 * @route '/admin/sales-data/backup/{backup}'
 */
destroyBackup.url = (args: { backup: number | { id: number } } | [backup: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { backup: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { backup: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    backup: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        backup: typeof args.backup === 'object'
                ? args.backup.id
                : args.backup,
                }

    return destroyBackup.definition.url
            .replace('{backup}', parsedArgs.backup.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::destroyBackup
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:554
 * @route '/admin/sales-data/backup/{backup}'
 */
destroyBackup.delete = (args: { backup: number | { id: number } } | [backup: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyBackup.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::destroyBackup
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:554
 * @route '/admin/sales-data/backup/{backup}'
 */
    const destroyBackupForm = (args: { backup: number | { id: number } } | [backup: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroyBackup.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SalesDataManagementController::destroyBackup
 * @see app/Http/Controllers/Admin/SalesDataManagementController.php:554
 * @route '/admin/sales-data/backup/{backup}'
 */
        destroyBackupForm.delete = (args: { backup: number | { id: number } } | [backup: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroyBackup.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroyBackup.form = destroyBackupForm
const SalesDataManagementController = { index, validateFile, importMethod, restore, destroyBackup, import: importMethod }

export default SalesDataManagementController