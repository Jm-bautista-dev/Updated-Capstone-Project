import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\SystemStatusController::status
 * @see app/Http/Controllers/Api/SystemStatusController.php:15
 * @route '/api/v1/system/status'
 */
const status2a7cbab9cbf60703e78344dd0061ce1f = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status2a7cbab9cbf60703e78344dd0061ce1f.url(options),
    method: 'get',
})

status2a7cbab9cbf60703e78344dd0061ce1f.definition = {
    methods: ["get","head"],
    url: '/api/v1/system/status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\SystemStatusController::status
 * @see app/Http/Controllers/Api/SystemStatusController.php:15
 * @route '/api/v1/system/status'
 */
status2a7cbab9cbf60703e78344dd0061ce1f.url = (options?: RouteQueryOptions) => {
    return status2a7cbab9cbf60703e78344dd0061ce1f.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\SystemStatusController::status
 * @see app/Http/Controllers/Api/SystemStatusController.php:15
 * @route '/api/v1/system/status'
 */
status2a7cbab9cbf60703e78344dd0061ce1f.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status2a7cbab9cbf60703e78344dd0061ce1f.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\SystemStatusController::status
 * @see app/Http/Controllers/Api/SystemStatusController.php:15
 * @route '/api/v1/system/status'
 */
status2a7cbab9cbf60703e78344dd0061ce1f.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status2a7cbab9cbf60703e78344dd0061ce1f.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\SystemStatusController::status
 * @see app/Http/Controllers/Api/SystemStatusController.php:15
 * @route '/api/v1/system/status'
 */
    const status2a7cbab9cbf60703e78344dd0061ce1fForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: status2a7cbab9cbf60703e78344dd0061ce1f.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\SystemStatusController::status
 * @see app/Http/Controllers/Api/SystemStatusController.php:15
 * @route '/api/v1/system/status'
 */
        status2a7cbab9cbf60703e78344dd0061ce1fForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: status2a7cbab9cbf60703e78344dd0061ce1f.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\SystemStatusController::status
 * @see app/Http/Controllers/Api/SystemStatusController.php:15
 * @route '/api/v1/system/status'
 */
        status2a7cbab9cbf60703e78344dd0061ce1fForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: status2a7cbab9cbf60703e78344dd0061ce1f.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    status2a7cbab9cbf60703e78344dd0061ce1f.form = status2a7cbab9cbf60703e78344dd0061ce1fForm
    /**
* @see \App\Http\Controllers\Api\SystemStatusController::status
 * @see app/Http/Controllers/Api/SystemStatusController.php:15
 * @route '/api/v1/system/health'
 */
const status123fe686d2782cd44adf457fccfa3b17 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status123fe686d2782cd44adf457fccfa3b17.url(options),
    method: 'get',
})

status123fe686d2782cd44adf457fccfa3b17.definition = {
    methods: ["get","head"],
    url: '/api/v1/system/health',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\SystemStatusController::status
 * @see app/Http/Controllers/Api/SystemStatusController.php:15
 * @route '/api/v1/system/health'
 */
status123fe686d2782cd44adf457fccfa3b17.url = (options?: RouteQueryOptions) => {
    return status123fe686d2782cd44adf457fccfa3b17.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\SystemStatusController::status
 * @see app/Http/Controllers/Api/SystemStatusController.php:15
 * @route '/api/v1/system/health'
 */
status123fe686d2782cd44adf457fccfa3b17.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status123fe686d2782cd44adf457fccfa3b17.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\SystemStatusController::status
 * @see app/Http/Controllers/Api/SystemStatusController.php:15
 * @route '/api/v1/system/health'
 */
status123fe686d2782cd44adf457fccfa3b17.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status123fe686d2782cd44adf457fccfa3b17.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\SystemStatusController::status
 * @see app/Http/Controllers/Api/SystemStatusController.php:15
 * @route '/api/v1/system/health'
 */
    const status123fe686d2782cd44adf457fccfa3b17Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: status123fe686d2782cd44adf457fccfa3b17.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\SystemStatusController::status
 * @see app/Http/Controllers/Api/SystemStatusController.php:15
 * @route '/api/v1/system/health'
 */
        status123fe686d2782cd44adf457fccfa3b17Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: status123fe686d2782cd44adf457fccfa3b17.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\SystemStatusController::status
 * @see app/Http/Controllers/Api/SystemStatusController.php:15
 * @route '/api/v1/system/health'
 */
        status123fe686d2782cd44adf457fccfa3b17Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: status123fe686d2782cd44adf457fccfa3b17.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    status123fe686d2782cd44adf457fccfa3b17.form = status123fe686d2782cd44adf457fccfa3b17Form

export const status = {
    '/api/v1/system/status': status2a7cbab9cbf60703e78344dd0061ce1f,
    '/api/v1/system/health': status123fe686d2782cd44adf457fccfa3b17,
}

const SystemStatusController = { status }

export default SystemStatusController