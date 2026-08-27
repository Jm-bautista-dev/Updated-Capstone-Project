import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::index
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:21
 * @route '/super-admin/logs'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/super-admin/logs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::index
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:21
 * @route '/super-admin/logs'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::index
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:21
 * @route '/super-admin/logs'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::index
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:21
 * @route '/super-admin/logs'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::index
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:21
 * @route '/super-admin/logs'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::index
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:21
 * @route '/super-admin/logs'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::index
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:21
 * @route '/super-admin/logs'
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
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::entries
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:69
 * @route '/super-admin/logs/entries'
 */
export const entries = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entries.url(options),
    method: 'get',
})

entries.definition = {
    methods: ["get","head"],
    url: '/super-admin/logs/entries',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::entries
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:69
 * @route '/super-admin/logs/entries'
 */
entries.url = (options?: RouteQueryOptions) => {
    return entries.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::entries
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:69
 * @route '/super-admin/logs/entries'
 */
entries.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entries.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::entries
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:69
 * @route '/super-admin/logs/entries'
 */
entries.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: entries.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::entries
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:69
 * @route '/super-admin/logs/entries'
 */
    const entriesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: entries.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::entries
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:69
 * @route '/super-admin/logs/entries'
 */
        entriesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: entries.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::entries
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:69
 * @route '/super-admin/logs/entries'
 */
        entriesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: entries.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    entries.form = entriesForm
/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::live
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:100
 * @route '/super-admin/logs/live'
 */
export const live = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: live.url(options),
    method: 'get',
})

live.definition = {
    methods: ["get","head"],
    url: '/super-admin/logs/live',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::live
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:100
 * @route '/super-admin/logs/live'
 */
live.url = (options?: RouteQueryOptions) => {
    return live.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::live
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:100
 * @route '/super-admin/logs/live'
 */
live.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: live.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::live
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:100
 * @route '/super-admin/logs/live'
 */
live.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: live.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::live
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:100
 * @route '/super-admin/logs/live'
 */
    const liveForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: live.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::live
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:100
 * @route '/super-admin/logs/live'
 */
        liveForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: live.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::live
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:100
 * @route '/super-admin/logs/live'
 */
        liveForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: live.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    live.form = liveForm
/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::sources
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:118
 * @route '/super-admin/logs/sources'
 */
export const sources = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sources.url(options),
    method: 'get',
})

sources.definition = {
    methods: ["get","head"],
    url: '/super-admin/logs/sources',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::sources
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:118
 * @route '/super-admin/logs/sources'
 */
sources.url = (options?: RouteQueryOptions) => {
    return sources.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::sources
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:118
 * @route '/super-admin/logs/sources'
 */
sources.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sources.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::sources
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:118
 * @route '/super-admin/logs/sources'
 */
sources.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: sources.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::sources
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:118
 * @route '/super-admin/logs/sources'
 */
    const sourcesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: sources.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::sources
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:118
 * @route '/super-admin/logs/sources'
 */
        sourcesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: sources.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::sources
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:118
 * @route '/super-admin/logs/sources'
 */
        sourcesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: sources.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    sources.form = sourcesForm
/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::download
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:130
 * @route '/super-admin/logs/download'
 */
export const download = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(options),
    method: 'get',
})

download.definition = {
    methods: ["get","head"],
    url: '/super-admin/logs/download',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::download
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:130
 * @route '/super-admin/logs/download'
 */
download.url = (options?: RouteQueryOptions) => {
    return download.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::download
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:130
 * @route '/super-admin/logs/download'
 */
download.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::download
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:130
 * @route '/super-admin/logs/download'
 */
download.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: download.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::download
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:130
 * @route '/super-admin/logs/download'
 */
    const downloadForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: download.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::download
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:130
 * @route '/super-admin/logs/download'
 */
        downloadForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: download.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\LogViewerController::download
 * @see app/Http/Controllers/SuperAdmin/LogViewerController.php:130
 * @route '/super-admin/logs/download'
 */
        downloadForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: download.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    download.form = downloadForm
const logs = {
    index: Object.assign(index, index),
entries: Object.assign(entries, entries),
live: Object.assign(live, live),
sources: Object.assign(sources, sources),
download: Object.assign(download, download),
}

export default logs