import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:42
 * @route '/api/v1/rider/change-password'
 */
const changePasswordd664abf82b4e52501df3815d357f497e = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: changePasswordd664abf82b4e52501df3815d357f497e.url(options),
    method: 'post',
})

changePasswordd664abf82b4e52501df3815d357f497e.definition = {
    methods: ["post"],
    url: '/api/v1/rider/change-password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:42
 * @route '/api/v1/rider/change-password'
 */
changePasswordd664abf82b4e52501df3815d357f497e.url = (options?: RouteQueryOptions) => {
    return changePasswordd664abf82b4e52501df3815d357f497e.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:42
 * @route '/api/v1/rider/change-password'
 */
changePasswordd664abf82b4e52501df3815d357f497e.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: changePasswordd664abf82b4e52501df3815d357f497e.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:42
 * @route '/api/v1/rider/change-password'
 */
    const changePasswordd664abf82b4e52501df3815d357f497eForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: changePasswordd664abf82b4e52501df3815d357f497e.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:42
 * @route '/api/v1/rider/change-password'
 */
        changePasswordd664abf82b4e52501df3815d357f497eForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: changePasswordd664abf82b4e52501df3815d357f497e.url(options),
            method: 'post',
        })
    
    changePasswordd664abf82b4e52501df3815d357f497e.form = changePasswordd664abf82b4e52501df3815d357f497eForm
    /**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:42
 * @route '/api/rider/change-password'
 */
const changePassword22e3d18a20d4abd9ed81726c917d0390 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: changePassword22e3d18a20d4abd9ed81726c917d0390.url(options),
    method: 'post',
})

changePassword22e3d18a20d4abd9ed81726c917d0390.definition = {
    methods: ["post"],
    url: '/api/rider/change-password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:42
 * @route '/api/rider/change-password'
 */
changePassword22e3d18a20d4abd9ed81726c917d0390.url = (options?: RouteQueryOptions) => {
    return changePassword22e3d18a20d4abd9ed81726c917d0390.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:42
 * @route '/api/rider/change-password'
 */
changePassword22e3d18a20d4abd9ed81726c917d0390.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: changePassword22e3d18a20d4abd9ed81726c917d0390.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:42
 * @route '/api/rider/change-password'
 */
    const changePassword22e3d18a20d4abd9ed81726c917d0390Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: changePassword22e3d18a20d4abd9ed81726c917d0390.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::changePassword
 * @see app/Http/Controllers/Api/RiderController.php:42
 * @route '/api/rider/change-password'
 */
        changePassword22e3d18a20d4abd9ed81726c917d0390Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: changePassword22e3d18a20d4abd9ed81726c917d0390.url(options),
            method: 'post',
        })
    
    changePassword22e3d18a20d4abd9ed81726c917d0390.form = changePassword22e3d18a20d4abd9ed81726c917d0390Form

export const changePassword = {
    '/api/v1/rider/change-password': changePasswordd664abf82b4e52501df3815d357f497e,
    '/api/rider/change-password': changePassword22e3d18a20d4abd9ed81726c917d0390,
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:806
 * @route '/api/v1/rider/status'
 */
const updateStatusb250b8d54533bfaaf6c4fcf102ae8d86 = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url(options),
    method: 'patch',
})

updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.definition = {
    methods: ["patch"],
    url: '/api/v1/rider/status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:806
 * @route '/api/v1/rider/status'
 */
updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url = (options?: RouteQueryOptions) => {
    return updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:806
 * @route '/api/v1/rider/status'
 */
updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url(options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:806
 * @route '/api/v1/rider/status'
 */
    const updateStatusb250b8d54533bfaaf6c4fcf102ae8d86Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:806
 * @route '/api/v1/rider/status'
 */
        updateStatusb250b8d54533bfaaf6c4fcf102ae8d86Form.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.form = updateStatusb250b8d54533bfaaf6c4fcf102ae8d86Form
    /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:806
 * @route '/api/rider/status'
 */
const updateStatus3b94d099329ad87ff350831df94a1c27 = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatus3b94d099329ad87ff350831df94a1c27.url(options),
    method: 'patch',
})

updateStatus3b94d099329ad87ff350831df94a1c27.definition = {
    methods: ["patch"],
    url: '/api/rider/status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:806
 * @route '/api/rider/status'
 */
updateStatus3b94d099329ad87ff350831df94a1c27.url = (options?: RouteQueryOptions) => {
    return updateStatus3b94d099329ad87ff350831df94a1c27.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:806
 * @route '/api/rider/status'
 */
updateStatus3b94d099329ad87ff350831df94a1c27.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatus3b94d099329ad87ff350831df94a1c27.url(options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:806
 * @route '/api/rider/status'
 */
    const updateStatus3b94d099329ad87ff350831df94a1c27Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateStatus3b94d099329ad87ff350831df94a1c27.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:806
 * @route '/api/rider/status'
 */
        updateStatus3b94d099329ad87ff350831df94a1c27Form.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateStatus3b94d099329ad87ff350831df94a1c27.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateStatus3b94d099329ad87ff350831df94a1c27.form = updateStatus3b94d099329ad87ff350831df94a1c27Form

export const updateStatus = {
    '/api/v1/rider/status': updateStatusb250b8d54533bfaaf6c4fcf102ae8d86,
    '/api/rider/status': updateStatus3b94d099329ad87ff350831df94a1c27,
}

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:872
 * @route '/api/v1/rider/ping'
 */
const ping0d82d1f20b0ecfb6c97d8d26ab824f79 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ping0d82d1f20b0ecfb6c97d8d26ab824f79.url(options),
    method: 'post',
})

ping0d82d1f20b0ecfb6c97d8d26ab824f79.definition = {
    methods: ["post"],
    url: '/api/v1/rider/ping',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:872
 * @route '/api/v1/rider/ping'
 */
ping0d82d1f20b0ecfb6c97d8d26ab824f79.url = (options?: RouteQueryOptions) => {
    return ping0d82d1f20b0ecfb6c97d8d26ab824f79.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:872
 * @route '/api/v1/rider/ping'
 */
ping0d82d1f20b0ecfb6c97d8d26ab824f79.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ping0d82d1f20b0ecfb6c97d8d26ab824f79.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:872
 * @route '/api/v1/rider/ping'
 */
    const ping0d82d1f20b0ecfb6c97d8d26ab824f79Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: ping0d82d1f20b0ecfb6c97d8d26ab824f79.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:872
 * @route '/api/v1/rider/ping'
 */
        ping0d82d1f20b0ecfb6c97d8d26ab824f79Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: ping0d82d1f20b0ecfb6c97d8d26ab824f79.url(options),
            method: 'post',
        })
    
    ping0d82d1f20b0ecfb6c97d8d26ab824f79.form = ping0d82d1f20b0ecfb6c97d8d26ab824f79Form
    /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:872
 * @route '/api/rider/ping'
 */
const ping031fd5af02d93de1361ef37f3653ad91 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ping031fd5af02d93de1361ef37f3653ad91.url(options),
    method: 'post',
})

ping031fd5af02d93de1361ef37f3653ad91.definition = {
    methods: ["post"],
    url: '/api/rider/ping',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:872
 * @route '/api/rider/ping'
 */
ping031fd5af02d93de1361ef37f3653ad91.url = (options?: RouteQueryOptions) => {
    return ping031fd5af02d93de1361ef37f3653ad91.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:872
 * @route '/api/rider/ping'
 */
ping031fd5af02d93de1361ef37f3653ad91.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ping031fd5af02d93de1361ef37f3653ad91.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:872
 * @route '/api/rider/ping'
 */
    const ping031fd5af02d93de1361ef37f3653ad91Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: ping031fd5af02d93de1361ef37f3653ad91.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:872
 * @route '/api/rider/ping'
 */
        ping031fd5af02d93de1361ef37f3653ad91Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: ping031fd5af02d93de1361ef37f3653ad91.url(options),
            method: 'post',
        })
    
    ping031fd5af02d93de1361ef37f3653ad91.form = ping031fd5af02d93de1361ef37f3653ad91Form

export const ping = {
    '/api/v1/rider/ping': ping0d82d1f20b0ecfb6c97d8d26ab824f79,
    '/api/rider/ping': ping031fd5af02d93de1361ef37f3653ad91,
}

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:834
 * @route '/api/v1/rider/stats'
 */
const getStatsb4b7a936b4dbf8c412ae7f146e59c3c6 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url(options),
    method: 'get',
})

getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/stats',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:834
 * @route '/api/v1/rider/stats'
 */
getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url = (options?: RouteQueryOptions) => {
    return getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:834
 * @route '/api/v1/rider/stats'
 */
getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:834
 * @route '/api/v1/rider/stats'
 */
getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:834
 * @route '/api/v1/rider/stats'
 */
    const getStatsb4b7a936b4dbf8c412ae7f146e59c3c6Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:834
 * @route '/api/v1/rider/stats'
 */
        getStatsb4b7a936b4dbf8c412ae7f146e59c3c6Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:834
 * @route '/api/v1/rider/stats'
 */
        getStatsb4b7a936b4dbf8c412ae7f146e59c3c6Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.form = getStatsb4b7a936b4dbf8c412ae7f146e59c3c6Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:834
 * @route '/api/rider/stats'
 */
const getStats7c3d39de8ff6ff150c545ad605884ca4 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStats7c3d39de8ff6ff150c545ad605884ca4.url(options),
    method: 'get',
})

getStats7c3d39de8ff6ff150c545ad605884ca4.definition = {
    methods: ["get","head"],
    url: '/api/rider/stats',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:834
 * @route '/api/rider/stats'
 */
getStats7c3d39de8ff6ff150c545ad605884ca4.url = (options?: RouteQueryOptions) => {
    return getStats7c3d39de8ff6ff150c545ad605884ca4.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:834
 * @route '/api/rider/stats'
 */
getStats7c3d39de8ff6ff150c545ad605884ca4.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStats7c3d39de8ff6ff150c545ad605884ca4.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:834
 * @route '/api/rider/stats'
 */
getStats7c3d39de8ff6ff150c545ad605884ca4.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStats7c3d39de8ff6ff150c545ad605884ca4.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:834
 * @route '/api/rider/stats'
 */
    const getStats7c3d39de8ff6ff150c545ad605884ca4Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getStats7c3d39de8ff6ff150c545ad605884ca4.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:834
 * @route '/api/rider/stats'
 */
        getStats7c3d39de8ff6ff150c545ad605884ca4Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStats7c3d39de8ff6ff150c545ad605884ca4.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:834
 * @route '/api/rider/stats'
 */
        getStats7c3d39de8ff6ff150c545ad605884ca4Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStats7c3d39de8ff6ff150c545ad605884ca4.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getStats7c3d39de8ff6ff150c545ad605884ca4.form = getStats7c3d39de8ff6ff150c545ad605884ca4Form

export const getStats = {
    '/api/v1/rider/stats': getStatsb4b7a936b4dbf8c412ae7f146e59c3c6,
    '/api/rider/stats': getStats7c3d39de8ff6ff150c545ad605884ca4,
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:725
 * @route '/api/v1/rider/location'
 */
const updateLocationfe7f85dad518befc9d281389c65bfaaf = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateLocationfe7f85dad518befc9d281389c65bfaaf.url(options),
    method: 'post',
})

updateLocationfe7f85dad518befc9d281389c65bfaaf.definition = {
    methods: ["post"],
    url: '/api/v1/rider/location',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:725
 * @route '/api/v1/rider/location'
 */
updateLocationfe7f85dad518befc9d281389c65bfaaf.url = (options?: RouteQueryOptions) => {
    return updateLocationfe7f85dad518befc9d281389c65bfaaf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:725
 * @route '/api/v1/rider/location'
 */
updateLocationfe7f85dad518befc9d281389c65bfaaf.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateLocationfe7f85dad518befc9d281389c65bfaaf.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:725
 * @route '/api/v1/rider/location'
 */
    const updateLocationfe7f85dad518befc9d281389c65bfaafForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateLocationfe7f85dad518befc9d281389c65bfaaf.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:725
 * @route '/api/v1/rider/location'
 */
        updateLocationfe7f85dad518befc9d281389c65bfaafForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateLocationfe7f85dad518befc9d281389c65bfaaf.url(options),
            method: 'post',
        })
    
    updateLocationfe7f85dad518befc9d281389c65bfaaf.form = updateLocationfe7f85dad518befc9d281389c65bfaafForm
    /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:725
 * @route '/api/rider/location'
 */
const updateLocationecfcde48da7bfe0b038a0aafe97388b5 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateLocationecfcde48da7bfe0b038a0aafe97388b5.url(options),
    method: 'post',
})

updateLocationecfcde48da7bfe0b038a0aafe97388b5.definition = {
    methods: ["post"],
    url: '/api/rider/location',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:725
 * @route '/api/rider/location'
 */
updateLocationecfcde48da7bfe0b038a0aafe97388b5.url = (options?: RouteQueryOptions) => {
    return updateLocationecfcde48da7bfe0b038a0aafe97388b5.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:725
 * @route '/api/rider/location'
 */
updateLocationecfcde48da7bfe0b038a0aafe97388b5.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateLocationecfcde48da7bfe0b038a0aafe97388b5.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:725
 * @route '/api/rider/location'
 */
    const updateLocationecfcde48da7bfe0b038a0aafe97388b5Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateLocationecfcde48da7bfe0b038a0aafe97388b5.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:725
 * @route '/api/rider/location'
 */
        updateLocationecfcde48da7bfe0b038a0aafe97388b5Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateLocationecfcde48da7bfe0b038a0aafe97388b5.url(options),
            method: 'post',
        })
    
    updateLocationecfcde48da7bfe0b038a0aafe97388b5.form = updateLocationecfcde48da7bfe0b038a0aafe97388b5Form

export const updateLocation = {
    '/api/v1/rider/location': updateLocationfe7f85dad518befc9d281389c65bfaaf,
    '/api/rider/location': updateLocationecfcde48da7bfe0b038a0aafe97388b5,
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/v1/rider/orders'
 */
const getOrders63efdf27fdafc269d7b74547117cc692 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders63efdf27fdafc269d7b74547117cc692.url(options),
    method: 'get',
})

getOrders63efdf27fdafc269d7b74547117cc692.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/v1/rider/orders'
 */
getOrders63efdf27fdafc269d7b74547117cc692.url = (options?: RouteQueryOptions) => {
    return getOrders63efdf27fdafc269d7b74547117cc692.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/v1/rider/orders'
 */
getOrders63efdf27fdafc269d7b74547117cc692.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrders63efdf27fdafc269d7b74547117cc692.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/v1/rider/orders'
 */
getOrders63efdf27fdafc269d7b74547117cc692.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrders63efdf27fdafc269d7b74547117cc692.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/v1/rider/orders'
 */
    const getOrders63efdf27fdafc269d7b74547117cc692Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrders63efdf27fdafc269d7b74547117cc692.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/v1/rider/orders'
 */
        getOrders63efdf27fdafc269d7b74547117cc692Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders63efdf27fdafc269d7b74547117cc692.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/v1/rider/orders'
 */
        getOrders63efdf27fdafc269d7b74547117cc692Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrders63efdf27fdafc269d7b74547117cc692.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrders63efdf27fdafc269d7b74547117cc692.form = getOrders63efdf27fdafc269d7b74547117cc692Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/rider/orders'
 */
const getOrdersdc8b9ffdca731c7c1f660bed57e883fe = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url(options),
    method: 'get',
})

getOrdersdc8b9ffdca731c7c1f660bed57e883fe.definition = {
    methods: ["get","head"],
    url: '/api/rider/orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/rider/orders'
 */
getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url = (options?: RouteQueryOptions) => {
    return getOrdersdc8b9ffdca731c7c1f660bed57e883fe.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/rider/orders'
 */
getOrdersdc8b9ffdca731c7c1f660bed57e883fe.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/rider/orders'
 */
getOrdersdc8b9ffdca731c7c1f660bed57e883fe.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/rider/orders'
 */
    const getOrdersdc8b9ffdca731c7c1f660bed57e883feForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/rider/orders'
 */
        getOrdersdc8b9ffdca731c7c1f660bed57e883feForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getOrders
 * @see app/Http/Controllers/Api/RiderController.php:74
 * @route '/api/rider/orders'
 */
        getOrdersdc8b9ffdca731c7c1f660bed57e883feForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getOrdersdc8b9ffdca731c7c1f660bed57e883fe.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getOrdersdc8b9ffdca731c7c1f660bed57e883fe.form = getOrdersdc8b9ffdca731c7c1f660bed57e883feForm

export const getOrders = {
    '/api/v1/rider/orders': getOrders63efdf27fdafc269d7b74547117cc692,
    '/api/rider/orders': getOrdersdc8b9ffdca731c7c1f660bed57e883fe,
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/v1/rider/my-orders'
 */
const getMyOrders91629b3f6dd1d6ca0b5603eec2097950 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
    method: 'get',
})

getMyOrders91629b3f6dd1d6ca0b5603eec2097950.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/my-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url = (options?: RouteQueryOptions) => {
    return getMyOrders91629b3f6dd1d6ca0b5603eec2097950.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders91629b3f6dd1d6ca0b5603eec2097950.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders91629b3f6dd1d6ca0b5603eec2097950.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/v1/rider/my-orders'
 */
    const getMyOrders91629b3f6dd1d6ca0b5603eec2097950Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/v1/rider/my-orders'
 */
        getMyOrders91629b3f6dd1d6ca0b5603eec2097950Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/v1/rider/my-orders'
 */
        getMyOrders91629b3f6dd1d6ca0b5603eec2097950Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders91629b3f6dd1d6ca0b5603eec2097950.form = getMyOrders91629b3f6dd1d6ca0b5603eec2097950Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/rider/my-orders'
 */
const getMyOrders055417c79b8f926941253898844fa820 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders055417c79b8f926941253898844fa820.url(options),
    method: 'get',
})

getMyOrders055417c79b8f926941253898844fa820.definition = {
    methods: ["get","head"],
    url: '/api/rider/my-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/rider/my-orders'
 */
getMyOrders055417c79b8f926941253898844fa820.url = (options?: RouteQueryOptions) => {
    return getMyOrders055417c79b8f926941253898844fa820.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/rider/my-orders'
 */
getMyOrders055417c79b8f926941253898844fa820.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders055417c79b8f926941253898844fa820.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/rider/my-orders'
 */
getMyOrders055417c79b8f926941253898844fa820.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders055417c79b8f926941253898844fa820.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/rider/my-orders'
 */
    const getMyOrders055417c79b8f926941253898844fa820Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders055417c79b8f926941253898844fa820.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/rider/my-orders'
 */
        getMyOrders055417c79b8f926941253898844fa820Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders055417c79b8f926941253898844fa820.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:105
 * @route '/api/rider/my-orders'
 */
        getMyOrders055417c79b8f926941253898844fa820Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders055417c79b8f926941253898844fa820.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMyOrders055417c79b8f926941253898844fa820.form = getMyOrders055417c79b8f926941253898844fa820Form

export const getMyOrders = {
    '/api/v1/rider/my-orders': getMyOrders91629b3f6dd1d6ca0b5603eec2097950,
    '/api/rider/my-orders': getMyOrders055417c79b8f926941253898844fa820,
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:169
 * @route '/api/v1/rider/completed-orders'
 */
const getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
    method: 'get',
})

getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/completed-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:169
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url = (options?: RouteQueryOptions) => {
    return getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:169
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:169
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:169
 * @route '/api/v1/rider/completed-orders'
 */
    const getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603fForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:169
 * @route '/api/v1/rider/completed-orders'
 */
        getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603fForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:169
 * @route '/api/v1/rider/completed-orders'
 */
        getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603fForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.form = getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603fForm
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:169
 * @route '/api/rider/completed-orders'
 */
const getCompletedOrders805dad15d371e329367cc660ba824f6b = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
    method: 'get',
})

getCompletedOrders805dad15d371e329367cc660ba824f6b.definition = {
    methods: ["get","head"],
    url: '/api/rider/completed-orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:169
 * @route '/api/rider/completed-orders'
 */
getCompletedOrders805dad15d371e329367cc660ba824f6b.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders805dad15d371e329367cc660ba824f6b.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:169
 * @route '/api/rider/completed-orders'
 */
getCompletedOrders805dad15d371e329367cc660ba824f6b.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:169
 * @route '/api/rider/completed-orders'
 */
getCompletedOrders805dad15d371e329367cc660ba824f6b.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:169
 * @route '/api/rider/completed-orders'
 */
    const getCompletedOrders805dad15d371e329367cc660ba824f6bForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:169
 * @route '/api/rider/completed-orders'
 */
        getCompletedOrders805dad15d371e329367cc660ba824f6bForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:169
 * @route '/api/rider/completed-orders'
 */
        getCompletedOrders805dad15d371e329367cc660ba824f6bForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders805dad15d371e329367cc660ba824f6b.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrders805dad15d371e329367cc660ba824f6b.form = getCompletedOrders805dad15d371e329367cc660ba824f6bForm

export const getCompletedOrders = {
    '/api/v1/rider/completed-orders': getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f,
    '/api/rider/completed-orders': getCompletedOrders805dad15d371e329367cc660ba824f6b,
}

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:216
 * @route '/api/v1/rider/orders/{id}/accept'
 */
const acceptOrder335d52fdc7997e576629d6c57b57d171 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder335d52fdc7997e576629d6c57b57d171.url(args, options),
    method: 'post',
})

acceptOrder335d52fdc7997e576629d6c57b57d171.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/accept',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:216
 * @route '/api/v1/rider/orders/{id}/accept'
 */
acceptOrder335d52fdc7997e576629d6c57b57d171.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return acceptOrder335d52fdc7997e576629d6c57b57d171.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:216
 * @route '/api/v1/rider/orders/{id}/accept'
 */
acceptOrder335d52fdc7997e576629d6c57b57d171.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder335d52fdc7997e576629d6c57b57d171.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:216
 * @route '/api/v1/rider/orders/{id}/accept'
 */
    const acceptOrder335d52fdc7997e576629d6c57b57d171Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: acceptOrder335d52fdc7997e576629d6c57b57d171.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:216
 * @route '/api/v1/rider/orders/{id}/accept'
 */
        acceptOrder335d52fdc7997e576629d6c57b57d171Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: acceptOrder335d52fdc7997e576629d6c57b57d171.url(args, options),
            method: 'post',
        })
    
    acceptOrder335d52fdc7997e576629d6c57b57d171.form = acceptOrder335d52fdc7997e576629d6c57b57d171Form
    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:216
 * @route '/api/rider/orders/{id}/accept'
 */
const acceptOrder1158b7621232e7382f240cf789aeabb9 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder1158b7621232e7382f240cf789aeabb9.url(args, options),
    method: 'post',
})

acceptOrder1158b7621232e7382f240cf789aeabb9.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/accept',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:216
 * @route '/api/rider/orders/{id}/accept'
 */
acceptOrder1158b7621232e7382f240cf789aeabb9.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return acceptOrder1158b7621232e7382f240cf789aeabb9.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:216
 * @route '/api/rider/orders/{id}/accept'
 */
acceptOrder1158b7621232e7382f240cf789aeabb9.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder1158b7621232e7382f240cf789aeabb9.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:216
 * @route '/api/rider/orders/{id}/accept'
 */
    const acceptOrder1158b7621232e7382f240cf789aeabb9Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: acceptOrder1158b7621232e7382f240cf789aeabb9.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:216
 * @route '/api/rider/orders/{id}/accept'
 */
        acceptOrder1158b7621232e7382f240cf789aeabb9Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: acceptOrder1158b7621232e7382f240cf789aeabb9.url(args, options),
            method: 'post',
        })
    
    acceptOrder1158b7621232e7382f240cf789aeabb9.form = acceptOrder1158b7621232e7382f240cf789aeabb9Form

export const acceptOrder = {
    '/api/v1/rider/orders/{id}/accept': acceptOrder335d52fdc7997e576629d6c57b57d171,
    '/api/rider/orders/{id}/accept': acceptOrder1158b7621232e7382f240cf789aeabb9,
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:301
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
const pickupOrder67b05245dea2301f5bbd857bf4c6aa6d = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.url(args, options),
    method: 'post',
})

pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/pickup',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:301
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:301
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:301
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
    const pickupOrder67b05245dea2301f5bbd857bf4c6aa6dForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:301
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
        pickupOrder67b05245dea2301f5bbd857bf4c6aa6dForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.url(args, options),
            method: 'post',
        })
    
    pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.form = pickupOrder67b05245dea2301f5bbd857bf4c6aa6dForm
    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:301
 * @route '/api/rider/orders/{id}/pickup'
 */
const pickupOrder579a910ac119fd5fb65e16116828f5c1 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder579a910ac119fd5fb65e16116828f5c1.url(args, options),
    method: 'post',
})

pickupOrder579a910ac119fd5fb65e16116828f5c1.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/pickup',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:301
 * @route '/api/rider/orders/{id}/pickup'
 */
pickupOrder579a910ac119fd5fb65e16116828f5c1.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pickupOrder579a910ac119fd5fb65e16116828f5c1.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:301
 * @route '/api/rider/orders/{id}/pickup'
 */
pickupOrder579a910ac119fd5fb65e16116828f5c1.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder579a910ac119fd5fb65e16116828f5c1.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:301
 * @route '/api/rider/orders/{id}/pickup'
 */
    const pickupOrder579a910ac119fd5fb65e16116828f5c1Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrder579a910ac119fd5fb65e16116828f5c1.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:301
 * @route '/api/rider/orders/{id}/pickup'
 */
        pickupOrder579a910ac119fd5fb65e16116828f5c1Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrder579a910ac119fd5fb65e16116828f5c1.url(args, options),
            method: 'post',
        })
    
    pickupOrder579a910ac119fd5fb65e16116828f5c1.form = pickupOrder579a910ac119fd5fb65e16116828f5c1Form

export const pickupOrder = {
    '/api/v1/rider/orders/{id}/pickup': pickupOrder67b05245dea2301f5bbd857bf4c6aa6d,
    '/api/rider/orders/{id}/pickup': pickupOrder579a910ac119fd5fb65e16116828f5c1,
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:376
 * @route '/api/v1/rider/orders/{id}/transit'
 */
const startTransit30258da9f6003769dffda8523c718911 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit30258da9f6003769dffda8523c718911.url(args, options),
    method: 'post',
})

startTransit30258da9f6003769dffda8523c718911.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/transit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:376
 * @route '/api/v1/rider/orders/{id}/transit'
 */
startTransit30258da9f6003769dffda8523c718911.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit30258da9f6003769dffda8523c718911.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:376
 * @route '/api/v1/rider/orders/{id}/transit'
 */
startTransit30258da9f6003769dffda8523c718911.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit30258da9f6003769dffda8523c718911.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:376
 * @route '/api/v1/rider/orders/{id}/transit'
 */
    const startTransit30258da9f6003769dffda8523c718911Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit30258da9f6003769dffda8523c718911.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:376
 * @route '/api/v1/rider/orders/{id}/transit'
 */
        startTransit30258da9f6003769dffda8523c718911Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit30258da9f6003769dffda8523c718911.url(args, options),
            method: 'post',
        })
    
    startTransit30258da9f6003769dffda8523c718911.form = startTransit30258da9f6003769dffda8523c718911Form
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:376
 * @route '/api/rider/orders/{id}/transit'
 */
const startTransit113e82e4514b9b80d3702387e44dbe82 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit113e82e4514b9b80d3702387e44dbe82.url(args, options),
    method: 'post',
})

startTransit113e82e4514b9b80d3702387e44dbe82.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/transit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:376
 * @route '/api/rider/orders/{id}/transit'
 */
startTransit113e82e4514b9b80d3702387e44dbe82.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit113e82e4514b9b80d3702387e44dbe82.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:376
 * @route '/api/rider/orders/{id}/transit'
 */
startTransit113e82e4514b9b80d3702387e44dbe82.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit113e82e4514b9b80d3702387e44dbe82.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:376
 * @route '/api/rider/orders/{id}/transit'
 */
    const startTransit113e82e4514b9b80d3702387e44dbe82Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit113e82e4514b9b80d3702387e44dbe82.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:376
 * @route '/api/rider/orders/{id}/transit'
 */
        startTransit113e82e4514b9b80d3702387e44dbe82Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit113e82e4514b9b80d3702387e44dbe82.url(args, options),
            method: 'post',
        })
    
    startTransit113e82e4514b9b80d3702387e44dbe82.form = startTransit113e82e4514b9b80d3702387e44dbe82Form

export const startTransit = {
    '/api/v1/rider/orders/{id}/transit': startTransit30258da9f6003769dffda8523c718911,
    '/api/rider/orders/{id}/transit': startTransit113e82e4514b9b80d3702387e44dbe82,
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:443
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
const deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.url(args, options),
    method: 'post',
})

deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/deliver',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:443
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:443
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:443
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
    const deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:443
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
        deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.url(args, options),
            method: 'post',
        })
    
    deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.form = deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3Form
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:443
 * @route '/api/rider/orders/{id}/deliver'
 */
const deliverOrdera86283c8722d7e0d3031b8c518471787 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrdera86283c8722d7e0d3031b8c518471787.url(args, options),
    method: 'post',
})

deliverOrdera86283c8722d7e0d3031b8c518471787.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/deliver',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:443
 * @route '/api/rider/orders/{id}/deliver'
 */
deliverOrdera86283c8722d7e0d3031b8c518471787.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrdera86283c8722d7e0d3031b8c518471787.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:443
 * @route '/api/rider/orders/{id}/deliver'
 */
deliverOrdera86283c8722d7e0d3031b8c518471787.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrdera86283c8722d7e0d3031b8c518471787.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:443
 * @route '/api/rider/orders/{id}/deliver'
 */
    const deliverOrdera86283c8722d7e0d3031b8c518471787Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrdera86283c8722d7e0d3031b8c518471787.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:443
 * @route '/api/rider/orders/{id}/deliver'
 */
        deliverOrdera86283c8722d7e0d3031b8c518471787Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrdera86283c8722d7e0d3031b8c518471787.url(args, options),
            method: 'post',
        })
    
    deliverOrdera86283c8722d7e0d3031b8c518471787.form = deliverOrdera86283c8722d7e0d3031b8c518471787Form

export const deliverOrder = {
    '/api/v1/rider/orders/{id}/deliver': deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3,
    '/api/rider/orders/{id}/deliver': deliverOrdera86283c8722d7e0d3031b8c518471787,
}

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:672
 * @route '/api/v1/rider/orders/{id}/reject'
 */
const rejectOrderfaac7c9761f8bf4f25eb23e454f6727b = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.url(args, options),
    method: 'post',
})

rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:672
 * @route '/api/v1/rider/orders/{id}/reject'
 */
rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:672
 * @route '/api/v1/rider/orders/{id}/reject'
 */
rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:672
 * @route '/api/v1/rider/orders/{id}/reject'
 */
    const rejectOrderfaac7c9761f8bf4f25eb23e454f6727bForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:672
 * @route '/api/v1/rider/orders/{id}/reject'
 */
        rejectOrderfaac7c9761f8bf4f25eb23e454f6727bForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.url(args, options),
            method: 'post',
        })
    
    rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.form = rejectOrderfaac7c9761f8bf4f25eb23e454f6727bForm
    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:672
 * @route '/api/rider/orders/{id}/reject'
 */
const rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.url(args, options),
    method: 'post',
})

rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:672
 * @route '/api/rider/orders/{id}/reject'
 */
rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:672
 * @route '/api/rider/orders/{id}/reject'
 */
rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:672
 * @route '/api/rider/orders/{id}/reject'
 */
    const rejectOrder94fb5ab30d0131e4068baa7bd57d7ecdForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:672
 * @route '/api/rider/orders/{id}/reject'
 */
        rejectOrder94fb5ab30d0131e4068baa7bd57d7ecdForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.url(args, options),
            method: 'post',
        })
    
    rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.form = rejectOrder94fb5ab30d0131e4068baa7bd57d7ecdForm

export const rejectOrder = {
    '/api/v1/rider/orders/{id}/reject': rejectOrderfaac7c9761f8bf4f25eb23e454f6727b,
    '/api/rider/orders/{id}/reject': rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd,
}

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
const cancelOrderc6e91f42a6a96f0dc48849a40d8ac513 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url(args, options),
    method: 'post',
})

cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
    const cancelOrderc6e91f42a6a96f0dc48849a40d8ac513Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
        cancelOrderc6e91f42a6a96f0dc48849a40d8ac513Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url(args, options),
            method: 'post',
        })
    
    cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.form = cancelOrderc6e91f42a6a96f0dc48849a40d8ac513Form
    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
const cancelOrder676ea8b862358a07db7266022896cc59 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder676ea8b862358a07db7266022896cc59.url(args, options),
    method: 'post',
})

cancelOrder676ea8b862358a07db7266022896cc59.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/cancel-request',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
cancelOrder676ea8b862358a07db7266022896cc59.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return cancelOrder676ea8b862358a07db7266022896cc59.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
cancelOrder676ea8b862358a07db7266022896cc59.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder676ea8b862358a07db7266022896cc59.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
    const cancelOrder676ea8b862358a07db7266022896cc59Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelOrder676ea8b862358a07db7266022896cc59.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
        cancelOrder676ea8b862358a07db7266022896cc59Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelOrder676ea8b862358a07db7266022896cc59.url(args, options),
            method: 'post',
        })
    
    cancelOrder676ea8b862358a07db7266022896cc59.form = cancelOrder676ea8b862358a07db7266022896cc59Form
    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/rider/orders/{id}/cancel'
 */
const cancelOrder0ee1fe1f36eddf0b892c4836f981f776 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder0ee1fe1f36eddf0b892c4836f981f776.url(args, options),
    method: 'post',
})

cancelOrder0ee1fe1f36eddf0b892c4836f981f776.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/rider/orders/{id}/cancel'
 */
cancelOrder0ee1fe1f36eddf0b892c4836f981f776.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return cancelOrder0ee1fe1f36eddf0b892c4836f981f776.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/rider/orders/{id}/cancel'
 */
cancelOrder0ee1fe1f36eddf0b892c4836f981f776.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder0ee1fe1f36eddf0b892c4836f981f776.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/rider/orders/{id}/cancel'
 */
    const cancelOrder0ee1fe1f36eddf0b892c4836f981f776Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelOrder0ee1fe1f36eddf0b892c4836f981f776.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/rider/orders/{id}/cancel'
 */
        cancelOrder0ee1fe1f36eddf0b892c4836f981f776Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelOrder0ee1fe1f36eddf0b892c4836f981f776.url(args, options),
            method: 'post',
        })
    
    cancelOrder0ee1fe1f36eddf0b892c4836f981f776.form = cancelOrder0ee1fe1f36eddf0b892c4836f981f776Form
    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/rider/orders/{id}/cancel-request'
 */
const cancelOrder2dccc2582b88c47bdea90c08f6913efa = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder2dccc2582b88c47bdea90c08f6913efa.url(args, options),
    method: 'post',
})

cancelOrder2dccc2582b88c47bdea90c08f6913efa.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/cancel-request',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/rider/orders/{id}/cancel-request'
 */
cancelOrder2dccc2582b88c47bdea90c08f6913efa.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return cancelOrder2dccc2582b88c47bdea90c08f6913efa.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/rider/orders/{id}/cancel-request'
 */
cancelOrder2dccc2582b88c47bdea90c08f6913efa.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder2dccc2582b88c47bdea90c08f6913efa.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/rider/orders/{id}/cancel-request'
 */
    const cancelOrder2dccc2582b88c47bdea90c08f6913efaForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelOrder2dccc2582b88c47bdea90c08f6913efa.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:538
 * @route '/api/rider/orders/{id}/cancel-request'
 */
        cancelOrder2dccc2582b88c47bdea90c08f6913efaForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelOrder2dccc2582b88c47bdea90c08f6913efa.url(args, options),
            method: 'post',
        })
    
    cancelOrder2dccc2582b88c47bdea90c08f6913efa.form = cancelOrder2dccc2582b88c47bdea90c08f6913efaForm

export const cancelOrder = {
    '/api/v1/rider/orders/{id}/cancel': cancelOrderc6e91f42a6a96f0dc48849a40d8ac513,
    '/api/v1/rider/orders/{id}/cancel-request': cancelOrder676ea8b862358a07db7266022896cc59,
    '/api/rider/orders/{id}/cancel': cancelOrder0ee1fe1f36eddf0b892c4836f981f776,
    '/api/rider/orders/{id}/cancel-request': cancelOrder2dccc2582b88c47bdea90c08f6913efa,
}

const RiderController = { changePassword, updateStatus, ping, getStats, updateLocation, getOrders, getMyOrders, getCompletedOrders, acceptOrder, pickupOrder, startTransit, deliverOrder, rejectOrder, cancelOrder }

export default RiderController