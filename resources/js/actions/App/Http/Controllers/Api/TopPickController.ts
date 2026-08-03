import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\TopPickController::index
 * @see app/Http/Controllers/Api/TopPickController.php:29
 * @route '/api/top-picks'
 */
const indexfc17e44fbc9426ebeca136559c4e7426 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexfc17e44fbc9426ebeca136559c4e7426.url(options),
    method: 'get',
})

indexfc17e44fbc9426ebeca136559c4e7426.definition = {
    methods: ["get","head"],
    url: '/api/top-picks',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TopPickController::index
 * @see app/Http/Controllers/Api/TopPickController.php:29
 * @route '/api/top-picks'
 */
indexfc17e44fbc9426ebeca136559c4e7426.url = (options?: RouteQueryOptions) => {
    return indexfc17e44fbc9426ebeca136559c4e7426.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TopPickController::index
 * @see app/Http/Controllers/Api/TopPickController.php:29
 * @route '/api/top-picks'
 */
indexfc17e44fbc9426ebeca136559c4e7426.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexfc17e44fbc9426ebeca136559c4e7426.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\TopPickController::index
 * @see app/Http/Controllers/Api/TopPickController.php:29
 * @route '/api/top-picks'
 */
indexfc17e44fbc9426ebeca136559c4e7426.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: indexfc17e44fbc9426ebeca136559c4e7426.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\TopPickController::index
 * @see app/Http/Controllers/Api/TopPickController.php:29
 * @route '/api/top-picks'
 */
    const indexfc17e44fbc9426ebeca136559c4e7426Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: indexfc17e44fbc9426ebeca136559c4e7426.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\TopPickController::index
 * @see app/Http/Controllers/Api/TopPickController.php:29
 * @route '/api/top-picks'
 */
        indexfc17e44fbc9426ebeca136559c4e7426Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexfc17e44fbc9426ebeca136559c4e7426.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\TopPickController::index
 * @see app/Http/Controllers/Api/TopPickController.php:29
 * @route '/api/top-picks'
 */
        indexfc17e44fbc9426ebeca136559c4e7426Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexfc17e44fbc9426ebeca136559c4e7426.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    indexfc17e44fbc9426ebeca136559c4e7426.form = indexfc17e44fbc9426ebeca136559c4e7426Form
    /**
* @see \App\Http\Controllers\Api\TopPickController::index
 * @see app/Http/Controllers/Api/TopPickController.php:29
 * @route '/api/v1/top-picks'
 */
const indexd094b8a51922376b3dd97d5bd0efbe25 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexd094b8a51922376b3dd97d5bd0efbe25.url(options),
    method: 'get',
})

indexd094b8a51922376b3dd97d5bd0efbe25.definition = {
    methods: ["get","head"],
    url: '/api/v1/top-picks',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TopPickController::index
 * @see app/Http/Controllers/Api/TopPickController.php:29
 * @route '/api/v1/top-picks'
 */
indexd094b8a51922376b3dd97d5bd0efbe25.url = (options?: RouteQueryOptions) => {
    return indexd094b8a51922376b3dd97d5bd0efbe25.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TopPickController::index
 * @see app/Http/Controllers/Api/TopPickController.php:29
 * @route '/api/v1/top-picks'
 */
indexd094b8a51922376b3dd97d5bd0efbe25.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexd094b8a51922376b3dd97d5bd0efbe25.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\TopPickController::index
 * @see app/Http/Controllers/Api/TopPickController.php:29
 * @route '/api/v1/top-picks'
 */
indexd094b8a51922376b3dd97d5bd0efbe25.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: indexd094b8a51922376b3dd97d5bd0efbe25.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\TopPickController::index
 * @see app/Http/Controllers/Api/TopPickController.php:29
 * @route '/api/v1/top-picks'
 */
    const indexd094b8a51922376b3dd97d5bd0efbe25Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: indexd094b8a51922376b3dd97d5bd0efbe25.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\TopPickController::index
 * @see app/Http/Controllers/Api/TopPickController.php:29
 * @route '/api/v1/top-picks'
 */
        indexd094b8a51922376b3dd97d5bd0efbe25Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexd094b8a51922376b3dd97d5bd0efbe25.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\TopPickController::index
 * @see app/Http/Controllers/Api/TopPickController.php:29
 * @route '/api/v1/top-picks'
 */
        indexd094b8a51922376b3dd97d5bd0efbe25Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexd094b8a51922376b3dd97d5bd0efbe25.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    indexd094b8a51922376b3dd97d5bd0efbe25.form = indexd094b8a51922376b3dd97d5bd0efbe25Form

export const index = {
    '/api/top-picks': indexfc17e44fbc9426ebeca136559c4e7426,
    '/api/v1/top-picks': indexd094b8a51922376b3dd97d5bd0efbe25,
}

const TopPickController = { index }

export default TopPickController