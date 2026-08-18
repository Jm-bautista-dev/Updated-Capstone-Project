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
 * @see app/Http/Controllers/Api/RiderController.php:852
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
 * @see app/Http/Controllers/Api/RiderController.php:852
 * @route '/api/v1/rider/status'
 */
updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url = (options?: RouteQueryOptions) => {
    return updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:852
 * @route '/api/v1/rider/status'
 */
updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatusb250b8d54533bfaaf6c4fcf102ae8d86.url(options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:852
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
 * @see app/Http/Controllers/Api/RiderController.php:852
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
 * @see app/Http/Controllers/Api/RiderController.php:852
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
 * @see app/Http/Controllers/Api/RiderController.php:852
 * @route '/api/rider/status'
 */
updateStatus3b94d099329ad87ff350831df94a1c27.url = (options?: RouteQueryOptions) => {
    return updateStatus3b94d099329ad87ff350831df94a1c27.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:852
 * @route '/api/rider/status'
 */
updateStatus3b94d099329ad87ff350831df94a1c27.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatus3b94d099329ad87ff350831df94a1c27.url(options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateStatus
 * @see app/Http/Controllers/Api/RiderController.php:852
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
 * @see app/Http/Controllers/Api/RiderController.php:852
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
 * @see app/Http/Controllers/Api/RiderController.php:918
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
 * @see app/Http/Controllers/Api/RiderController.php:918
 * @route '/api/v1/rider/ping'
 */
ping0d82d1f20b0ecfb6c97d8d26ab824f79.url = (options?: RouteQueryOptions) => {
    return ping0d82d1f20b0ecfb6c97d8d26ab824f79.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:918
 * @route '/api/v1/rider/ping'
 */
ping0d82d1f20b0ecfb6c97d8d26ab824f79.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ping0d82d1f20b0ecfb6c97d8d26ab824f79.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:918
 * @route '/api/v1/rider/ping'
 */
    const ping0d82d1f20b0ecfb6c97d8d26ab824f79Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: ping0d82d1f20b0ecfb6c97d8d26ab824f79.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:918
 * @route '/api/v1/rider/ping'
 */
        ping0d82d1f20b0ecfb6c97d8d26ab824f79Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: ping0d82d1f20b0ecfb6c97d8d26ab824f79.url(options),
            method: 'post',
        })
    
    ping0d82d1f20b0ecfb6c97d8d26ab824f79.form = ping0d82d1f20b0ecfb6c97d8d26ab824f79Form
    /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:918
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
 * @see app/Http/Controllers/Api/RiderController.php:918
 * @route '/api/rider/ping'
 */
ping031fd5af02d93de1361ef37f3653ad91.url = (options?: RouteQueryOptions) => {
    return ping031fd5af02d93de1361ef37f3653ad91.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:918
 * @route '/api/rider/ping'
 */
ping031fd5af02d93de1361ef37f3653ad91.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ping031fd5af02d93de1361ef37f3653ad91.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:918
 * @route '/api/rider/ping'
 */
    const ping031fd5af02d93de1361ef37f3653ad91Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: ping031fd5af02d93de1361ef37f3653ad91.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::ping
 * @see app/Http/Controllers/Api/RiderController.php:918
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
 * @see app/Http/Controllers/Api/RiderController.php:880
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
 * @see app/Http/Controllers/Api/RiderController.php:880
 * @route '/api/v1/rider/stats'
 */
getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url = (options?: RouteQueryOptions) => {
    return getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:880
 * @route '/api/v1/rider/stats'
 */
getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:880
 * @route '/api/v1/rider/stats'
 */
getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:880
 * @route '/api/v1/rider/stats'
 */
    const getStatsb4b7a936b4dbf8c412ae7f146e59c3c6Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:880
 * @route '/api/v1/rider/stats'
 */
        getStatsb4b7a936b4dbf8c412ae7f146e59c3c6Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStatsb4b7a936b4dbf8c412ae7f146e59c3c6.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:880
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
 * @see app/Http/Controllers/Api/RiderController.php:880
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
 * @see app/Http/Controllers/Api/RiderController.php:880
 * @route '/api/rider/stats'
 */
getStats7c3d39de8ff6ff150c545ad605884ca4.url = (options?: RouteQueryOptions) => {
    return getStats7c3d39de8ff6ff150c545ad605884ca4.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:880
 * @route '/api/rider/stats'
 */
getStats7c3d39de8ff6ff150c545ad605884ca4.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStats7c3d39de8ff6ff150c545ad605884ca4.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:880
 * @route '/api/rider/stats'
 */
getStats7c3d39de8ff6ff150c545ad605884ca4.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStats7c3d39de8ff6ff150c545ad605884ca4.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:880
 * @route '/api/rider/stats'
 */
    const getStats7c3d39de8ff6ff150c545ad605884ca4Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getStats7c3d39de8ff6ff150c545ad605884ca4.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:880
 * @route '/api/rider/stats'
 */
        getStats7c3d39de8ff6ff150c545ad605884ca4Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStats7c3d39de8ff6ff150c545ad605884ca4.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getStats
 * @see app/Http/Controllers/Api/RiderController.php:880
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
 * @see app/Http/Controllers/Api/RiderController.php:771
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
 * @see app/Http/Controllers/Api/RiderController.php:771
 * @route '/api/v1/rider/location'
 */
updateLocationfe7f85dad518befc9d281389c65bfaaf.url = (options?: RouteQueryOptions) => {
    return updateLocationfe7f85dad518befc9d281389c65bfaaf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:771
 * @route '/api/v1/rider/location'
 */
updateLocationfe7f85dad518befc9d281389c65bfaaf.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateLocationfe7f85dad518befc9d281389c65bfaaf.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:771
 * @route '/api/v1/rider/location'
 */
    const updateLocationfe7f85dad518befc9d281389c65bfaafForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateLocationfe7f85dad518befc9d281389c65bfaaf.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:771
 * @route '/api/v1/rider/location'
 */
        updateLocationfe7f85dad518befc9d281389c65bfaafForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateLocationfe7f85dad518befc9d281389c65bfaaf.url(options),
            method: 'post',
        })
    
    updateLocationfe7f85dad518befc9d281389c65bfaaf.form = updateLocationfe7f85dad518befc9d281389c65bfaafForm
    /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:771
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
 * @see app/Http/Controllers/Api/RiderController.php:771
 * @route '/api/rider/location'
 */
updateLocationecfcde48da7bfe0b038a0aafe97388b5.url = (options?: RouteQueryOptions) => {
    return updateLocationecfcde48da7bfe0b038a0aafe97388b5.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:771
 * @route '/api/rider/location'
 */
updateLocationecfcde48da7bfe0b038a0aafe97388b5.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateLocationecfcde48da7bfe0b038a0aafe97388b5.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:771
 * @route '/api/rider/location'
 */
    const updateLocationecfcde48da7bfe0b038a0aafe97388b5Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateLocationecfcde48da7bfe0b038a0aafe97388b5.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateLocation
 * @see app/Http/Controllers/Api/RiderController.php:771
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
 * @see app/Http/Controllers/Api/RiderController.php:134
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
 * @see app/Http/Controllers/Api/RiderController.php:134
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url = (options?: RouteQueryOptions) => {
    return getMyOrders91629b3f6dd1d6ca0b5603eec2097950.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:134
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders91629b3f6dd1d6ca0b5603eec2097950.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:134
 * @route '/api/v1/rider/my-orders'
 */
getMyOrders91629b3f6dd1d6ca0b5603eec2097950.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:134
 * @route '/api/v1/rider/my-orders'
 */
    const getMyOrders91629b3f6dd1d6ca0b5603eec2097950Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:134
 * @route '/api/v1/rider/my-orders'
 */
        getMyOrders91629b3f6dd1d6ca0b5603eec2097950Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders91629b3f6dd1d6ca0b5603eec2097950.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:134
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
 * @see app/Http/Controllers/Api/RiderController.php:134
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
 * @see app/Http/Controllers/Api/RiderController.php:134
 * @route '/api/rider/my-orders'
 */
getMyOrders055417c79b8f926941253898844fa820.url = (options?: RouteQueryOptions) => {
    return getMyOrders055417c79b8f926941253898844fa820.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:134
 * @route '/api/rider/my-orders'
 */
getMyOrders055417c79b8f926941253898844fa820.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMyOrders055417c79b8f926941253898844fa820.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:134
 * @route '/api/rider/my-orders'
 */
getMyOrders055417c79b8f926941253898844fa820.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMyOrders055417c79b8f926941253898844fa820.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:134
 * @route '/api/rider/my-orders'
 */
    const getMyOrders055417c79b8f926941253898844fa820Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMyOrders055417c79b8f926941253898844fa820.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:134
 * @route '/api/rider/my-orders'
 */
        getMyOrders055417c79b8f926941253898844fa820Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMyOrders055417c79b8f926941253898844fa820.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getMyOrders
 * @see app/Http/Controllers/Api/RiderController.php:134
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
 * @see app/Http/Controllers/Api/RiderController.php:188
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
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url = (options?: RouteQueryOptions) => {
    return getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/v1/rider/completed-orders'
 */
getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/v1/rider/completed-orders'
 */
    const getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603fForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/v1/rider/completed-orders'
 */
        getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603fForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
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
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/v1/rider/history'
 */
const getCompletedOrdersabde917f84dacb687a598548424e8a47 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersabde917f84dacb687a598548424e8a47.url(options),
    method: 'get',
})

getCompletedOrdersabde917f84dacb687a598548424e8a47.definition = {
    methods: ["get","head"],
    url: '/api/v1/rider/history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/v1/rider/history'
 */
getCompletedOrdersabde917f84dacb687a598548424e8a47.url = (options?: RouteQueryOptions) => {
    return getCompletedOrdersabde917f84dacb687a598548424e8a47.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/v1/rider/history'
 */
getCompletedOrdersabde917f84dacb687a598548424e8a47.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersabde917f84dacb687a598548424e8a47.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/v1/rider/history'
 */
getCompletedOrdersabde917f84dacb687a598548424e8a47.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrdersabde917f84dacb687a598548424e8a47.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/v1/rider/history'
 */
    const getCompletedOrdersabde917f84dacb687a598548424e8a47Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrdersabde917f84dacb687a598548424e8a47.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/v1/rider/history'
 */
        getCompletedOrdersabde917f84dacb687a598548424e8a47Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersabde917f84dacb687a598548424e8a47.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/v1/rider/history'
 */
        getCompletedOrdersabde917f84dacb687a598548424e8a47Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersabde917f84dacb687a598548424e8a47.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrdersabde917f84dacb687a598548424e8a47.form = getCompletedOrdersabde917f84dacb687a598548424e8a47Form
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
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
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/rider/completed-orders'
 */
getCompletedOrders805dad15d371e329367cc660ba824f6b.url = (options?: RouteQueryOptions) => {
    return getCompletedOrders805dad15d371e329367cc660ba824f6b.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/rider/completed-orders'
 */
getCompletedOrders805dad15d371e329367cc660ba824f6b.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/rider/completed-orders'
 */
getCompletedOrders805dad15d371e329367cc660ba824f6b.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/rider/completed-orders'
 */
    const getCompletedOrders805dad15d371e329367cc660ba824f6bForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/rider/completed-orders'
 */
        getCompletedOrders805dad15d371e329367cc660ba824f6bForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrders805dad15d371e329367cc660ba824f6b.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
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
    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/rider/history'
 */
const getCompletedOrdersa10be4a51a2df9e3c6870283747e7827 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.url(options),
    method: 'get',
})

getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.definition = {
    methods: ["get","head"],
    url: '/api/rider/history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/rider/history'
 */
getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.url = (options?: RouteQueryOptions) => {
    return getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/rider/history'
 */
getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/rider/history'
 */
getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/rider/history'
 */
    const getCompletedOrdersa10be4a51a2df9e3c6870283747e7827Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/rider/history'
 */
        getCompletedOrdersa10be4a51a2df9e3c6870283747e7827Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::getCompletedOrders
 * @see app/Http/Controllers/Api/RiderController.php:188
 * @route '/api/rider/history'
 */
        getCompletedOrdersa10be4a51a2df9e3c6870283747e7827Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getCompletedOrdersa10be4a51a2df9e3c6870283747e7827.form = getCompletedOrdersa10be4a51a2df9e3c6870283747e7827Form

export const getCompletedOrders = {
    '/api/v1/rider/completed-orders': getCompletedOrdersa9e8bf68f2b8fe95b8dc3c57c869603f,
    '/api/v1/rider/history': getCompletedOrdersabde917f84dacb687a598548424e8a47,
    '/api/rider/completed-orders': getCompletedOrders805dad15d371e329367cc660ba824f6b,
    '/api/rider/history': getCompletedOrdersa10be4a51a2df9e3c6870283747e7827,
}

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
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
 * @see app/Http/Controllers/Api/RiderController.php:235
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
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/v1/rider/orders/{id}/accept'
 */
acceptOrder335d52fdc7997e576629d6c57b57d171.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder335d52fdc7997e576629d6c57b57d171.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/v1/rider/orders/{id}/accept'
 */
    const acceptOrder335d52fdc7997e576629d6c57b57d171Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: acceptOrder335d52fdc7997e576629d6c57b57d171.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/v1/rider/orders/{id}/accept'
 */
        acceptOrder335d52fdc7997e576629d6c57b57d171Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: acceptOrder335d52fdc7997e576629d6c57b57d171.url(args, options),
            method: 'post',
        })
    
    acceptOrder335d52fdc7997e576629d6c57b57d171.form = acceptOrder335d52fdc7997e576629d6c57b57d171Form
    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/v1/rider/accept/{id}'
 */
const acceptOrder30f4aef81939b30bc75b941ab9d3d4b0 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.url(args, options),
    method: 'post',
})

acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.definition = {
    methods: ["post"],
    url: '/api/v1/rider/accept/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/v1/rider/accept/{id}'
 */
acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/v1/rider/accept/{id}'
 */
acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/v1/rider/accept/{id}'
 */
    const acceptOrder30f4aef81939b30bc75b941ab9d3d4b0Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/v1/rider/accept/{id}'
 */
        acceptOrder30f4aef81939b30bc75b941ab9d3d4b0Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.url(args, options),
            method: 'post',
        })
    
    acceptOrder30f4aef81939b30bc75b941ab9d3d4b0.form = acceptOrder30f4aef81939b30bc75b941ab9d3d4b0Form
    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
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
 * @see app/Http/Controllers/Api/RiderController.php:235
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
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/rider/orders/{id}/accept'
 */
acceptOrder1158b7621232e7382f240cf789aeabb9.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrder1158b7621232e7382f240cf789aeabb9.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/rider/orders/{id}/accept'
 */
    const acceptOrder1158b7621232e7382f240cf789aeabb9Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: acceptOrder1158b7621232e7382f240cf789aeabb9.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/rider/orders/{id}/accept'
 */
        acceptOrder1158b7621232e7382f240cf789aeabb9Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: acceptOrder1158b7621232e7382f240cf789aeabb9.url(args, options),
            method: 'post',
        })
    
    acceptOrder1158b7621232e7382f240cf789aeabb9.form = acceptOrder1158b7621232e7382f240cf789aeabb9Form
    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/rider/accept/{id}'
 */
const acceptOrderf4dc18f2e442617ffacd34572239e3de = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrderf4dc18f2e442617ffacd34572239e3de.url(args, options),
    method: 'post',
})

acceptOrderf4dc18f2e442617ffacd34572239e3de.definition = {
    methods: ["post"],
    url: '/api/rider/accept/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/rider/accept/{id}'
 */
acceptOrderf4dc18f2e442617ffacd34572239e3de.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return acceptOrderf4dc18f2e442617ffacd34572239e3de.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/rider/accept/{id}'
 */
acceptOrderf4dc18f2e442617ffacd34572239e3de.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acceptOrderf4dc18f2e442617ffacd34572239e3de.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/rider/accept/{id}'
 */
    const acceptOrderf4dc18f2e442617ffacd34572239e3deForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: acceptOrderf4dc18f2e442617ffacd34572239e3de.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::acceptOrder
 * @see app/Http/Controllers/Api/RiderController.php:235
 * @route '/api/rider/accept/{id}'
 */
        acceptOrderf4dc18f2e442617ffacd34572239e3deForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: acceptOrderf4dc18f2e442617ffacd34572239e3de.url(args, options),
            method: 'post',
        })
    
    acceptOrderf4dc18f2e442617ffacd34572239e3de.form = acceptOrderf4dc18f2e442617ffacd34572239e3deForm

export const acceptOrder = {
    '/api/v1/rider/orders/{id}/accept': acceptOrder335d52fdc7997e576629d6c57b57d171,
    '/api/v1/rider/accept/{id}': acceptOrder30f4aef81939b30bc75b941ab9d3d4b0,
    '/api/rider/orders/{id}/accept': acceptOrder1158b7621232e7382f240cf789aeabb9,
    '/api/rider/accept/{id}': acceptOrderf4dc18f2e442617ffacd34572239e3de,
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
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
 * @see app/Http/Controllers/Api/RiderController.php:320
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
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
    const pickupOrder67b05245dea2301f5bbd857bf4c6aa6dForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/v1/rider/orders/{id}/pickup'
 */
        pickupOrder67b05245dea2301f5bbd857bf4c6aa6dForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.url(args, options),
            method: 'post',
        })
    
    pickupOrder67b05245dea2301f5bbd857bf4c6aa6d.form = pickupOrder67b05245dea2301f5bbd857bf4c6aa6dForm
    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/v1/rider/pickup/{id}'
 */
const pickupOrder34f02e4478194804ce334df7d8ce7771 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder34f02e4478194804ce334df7d8ce7771.url(args, options),
    method: 'post',
})

pickupOrder34f02e4478194804ce334df7d8ce7771.definition = {
    methods: ["post"],
    url: '/api/v1/rider/pickup/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/v1/rider/pickup/{id}'
 */
pickupOrder34f02e4478194804ce334df7d8ce7771.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pickupOrder34f02e4478194804ce334df7d8ce7771.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/v1/rider/pickup/{id}'
 */
pickupOrder34f02e4478194804ce334df7d8ce7771.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder34f02e4478194804ce334df7d8ce7771.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/v1/rider/pickup/{id}'
 */
    const pickupOrder34f02e4478194804ce334df7d8ce7771Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrder34f02e4478194804ce334df7d8ce7771.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/v1/rider/pickup/{id}'
 */
        pickupOrder34f02e4478194804ce334df7d8ce7771Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrder34f02e4478194804ce334df7d8ce7771.url(args, options),
            method: 'post',
        })
    
    pickupOrder34f02e4478194804ce334df7d8ce7771.form = pickupOrder34f02e4478194804ce334df7d8ce7771Form
    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/v1/rider/deliveries/{id}/pickup'
 */
const pickupOrderd0842575a9d8ac1952c00fba2ccf5c03 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.url(args, options),
    method: 'post',
})

pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.definition = {
    methods: ["post"],
    url: '/api/v1/rider/deliveries/{id}/pickup',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/v1/rider/deliveries/{id}/pickup'
 */
pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/v1/rider/deliveries/{id}/pickup'
 */
pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/v1/rider/deliveries/{id}/pickup'
 */
    const pickupOrderd0842575a9d8ac1952c00fba2ccf5c03Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/v1/rider/deliveries/{id}/pickup'
 */
        pickupOrderd0842575a9d8ac1952c00fba2ccf5c03Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.url(args, options),
            method: 'post',
        })
    
    pickupOrderd0842575a9d8ac1952c00fba2ccf5c03.form = pickupOrderd0842575a9d8ac1952c00fba2ccf5c03Form
    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
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
 * @see app/Http/Controllers/Api/RiderController.php:320
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
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/rider/orders/{id}/pickup'
 */
pickupOrder579a910ac119fd5fb65e16116828f5c1.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder579a910ac119fd5fb65e16116828f5c1.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/rider/orders/{id}/pickup'
 */
    const pickupOrder579a910ac119fd5fb65e16116828f5c1Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrder579a910ac119fd5fb65e16116828f5c1.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/rider/orders/{id}/pickup'
 */
        pickupOrder579a910ac119fd5fb65e16116828f5c1Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrder579a910ac119fd5fb65e16116828f5c1.url(args, options),
            method: 'post',
        })
    
    pickupOrder579a910ac119fd5fb65e16116828f5c1.form = pickupOrder579a910ac119fd5fb65e16116828f5c1Form
    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/rider/pickup/{id}'
 */
const pickupOrder2abee28bec9182f8518b4a1efac8defc = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder2abee28bec9182f8518b4a1efac8defc.url(args, options),
    method: 'post',
})

pickupOrder2abee28bec9182f8518b4a1efac8defc.definition = {
    methods: ["post"],
    url: '/api/rider/pickup/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/rider/pickup/{id}'
 */
pickupOrder2abee28bec9182f8518b4a1efac8defc.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pickupOrder2abee28bec9182f8518b4a1efac8defc.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/rider/pickup/{id}'
 */
pickupOrder2abee28bec9182f8518b4a1efac8defc.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder2abee28bec9182f8518b4a1efac8defc.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/rider/pickup/{id}'
 */
    const pickupOrder2abee28bec9182f8518b4a1efac8defcForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrder2abee28bec9182f8518b4a1efac8defc.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/rider/pickup/{id}'
 */
        pickupOrder2abee28bec9182f8518b4a1efac8defcForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrder2abee28bec9182f8518b4a1efac8defc.url(args, options),
            method: 'post',
        })
    
    pickupOrder2abee28bec9182f8518b4a1efac8defc.form = pickupOrder2abee28bec9182f8518b4a1efac8defcForm
    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/rider/deliveries/{id}/pickup'
 */
const pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.url(args, options),
    method: 'post',
})

pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.definition = {
    methods: ["post"],
    url: '/api/rider/deliveries/{id}/pickup',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/rider/deliveries/{id}/pickup'
 */
pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/rider/deliveries/{id}/pickup'
 */
pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/rider/deliveries/{id}/pickup'
 */
    const pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ceForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::pickupOrder
 * @see app/Http/Controllers/Api/RiderController.php:320
 * @route '/api/rider/deliveries/{id}/pickup'
 */
        pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ceForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.url(args, options),
            method: 'post',
        })
    
    pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce.form = pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ceForm

export const pickupOrder = {
    '/api/v1/rider/orders/{id}/pickup': pickupOrder67b05245dea2301f5bbd857bf4c6aa6d,
    '/api/v1/rider/pickup/{id}': pickupOrder34f02e4478194804ce334df7d8ce7771,
    '/api/v1/rider/deliveries/{id}/pickup': pickupOrderd0842575a9d8ac1952c00fba2ccf5c03,
    '/api/rider/orders/{id}/pickup': pickupOrder579a910ac119fd5fb65e16116828f5c1,
    '/api/rider/pickup/{id}': pickupOrder2abee28bec9182f8518b4a1efac8defc,
    '/api/rider/deliveries/{id}/pickup': pickupOrder7cc2b7106d1c4cc7a4d084adde3eb9ce,
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
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
 * @see app/Http/Controllers/Api/RiderController.php:422
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
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/orders/{id}/transit'
 */
startTransit30258da9f6003769dffda8523c718911.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit30258da9f6003769dffda8523c718911.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/orders/{id}/transit'
 */
    const startTransit30258da9f6003769dffda8523c718911Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit30258da9f6003769dffda8523c718911.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/orders/{id}/transit'
 */
        startTransit30258da9f6003769dffda8523c718911Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit30258da9f6003769dffda8523c718911.url(args, options),
            method: 'post',
        })
    
    startTransit30258da9f6003769dffda8523c718911.form = startTransit30258da9f6003769dffda8523c718911Form
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/orders/{id}/start-transit'
 */
const startTransit3d4a120e156f1f46a4425fe1c8780098 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit3d4a120e156f1f46a4425fe1c8780098.url(args, options),
    method: 'post',
})

startTransit3d4a120e156f1f46a4425fe1c8780098.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/start-transit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/orders/{id}/start-transit'
 */
startTransit3d4a120e156f1f46a4425fe1c8780098.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit3d4a120e156f1f46a4425fe1c8780098.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/orders/{id}/start-transit'
 */
startTransit3d4a120e156f1f46a4425fe1c8780098.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit3d4a120e156f1f46a4425fe1c8780098.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/orders/{id}/start-transit'
 */
    const startTransit3d4a120e156f1f46a4425fe1c8780098Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit3d4a120e156f1f46a4425fe1c8780098.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/orders/{id}/start-transit'
 */
        startTransit3d4a120e156f1f46a4425fe1c8780098Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit3d4a120e156f1f46a4425fe1c8780098.url(args, options),
            method: 'post',
        })
    
    startTransit3d4a120e156f1f46a4425fe1c8780098.form = startTransit3d4a120e156f1f46a4425fe1c8780098Form
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/transit/{id}'
 */
const startTransit7ed31a4949747b6e96f901fb601a5eab = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit7ed31a4949747b6e96f901fb601a5eab.url(args, options),
    method: 'post',
})

startTransit7ed31a4949747b6e96f901fb601a5eab.definition = {
    methods: ["post"],
    url: '/api/v1/rider/transit/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/transit/{id}'
 */
startTransit7ed31a4949747b6e96f901fb601a5eab.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit7ed31a4949747b6e96f901fb601a5eab.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/transit/{id}'
 */
startTransit7ed31a4949747b6e96f901fb601a5eab.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit7ed31a4949747b6e96f901fb601a5eab.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/transit/{id}'
 */
    const startTransit7ed31a4949747b6e96f901fb601a5eabForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit7ed31a4949747b6e96f901fb601a5eab.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/transit/{id}'
 */
        startTransit7ed31a4949747b6e96f901fb601a5eabForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit7ed31a4949747b6e96f901fb601a5eab.url(args, options),
            method: 'post',
        })
    
    startTransit7ed31a4949747b6e96f901fb601a5eab.form = startTransit7ed31a4949747b6e96f901fb601a5eabForm
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/deliveries/{id}/transit'
 */
const startTransit7204c23f000441f71edfe1aa1866a99e = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit7204c23f000441f71edfe1aa1866a99e.url(args, options),
    method: 'post',
})

startTransit7204c23f000441f71edfe1aa1866a99e.definition = {
    methods: ["post"],
    url: '/api/v1/rider/deliveries/{id}/transit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/deliveries/{id}/transit'
 */
startTransit7204c23f000441f71edfe1aa1866a99e.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit7204c23f000441f71edfe1aa1866a99e.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/deliveries/{id}/transit'
 */
startTransit7204c23f000441f71edfe1aa1866a99e.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit7204c23f000441f71edfe1aa1866a99e.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/deliveries/{id}/transit'
 */
    const startTransit7204c23f000441f71edfe1aa1866a99eForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit7204c23f000441f71edfe1aa1866a99e.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/v1/rider/deliveries/{id}/transit'
 */
        startTransit7204c23f000441f71edfe1aa1866a99eForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit7204c23f000441f71edfe1aa1866a99e.url(args, options),
            method: 'post',
        })
    
    startTransit7204c23f000441f71edfe1aa1866a99e.form = startTransit7204c23f000441f71edfe1aa1866a99eForm
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
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
 * @see app/Http/Controllers/Api/RiderController.php:422
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
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/orders/{id}/transit'
 */
startTransit113e82e4514b9b80d3702387e44dbe82.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit113e82e4514b9b80d3702387e44dbe82.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/orders/{id}/transit'
 */
    const startTransit113e82e4514b9b80d3702387e44dbe82Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit113e82e4514b9b80d3702387e44dbe82.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/orders/{id}/transit'
 */
        startTransit113e82e4514b9b80d3702387e44dbe82Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit113e82e4514b9b80d3702387e44dbe82.url(args, options),
            method: 'post',
        })
    
    startTransit113e82e4514b9b80d3702387e44dbe82.form = startTransit113e82e4514b9b80d3702387e44dbe82Form
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/orders/{id}/start-transit'
 */
const startTransit77d49b870894a1805e11bde9d897789e = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit77d49b870894a1805e11bde9d897789e.url(args, options),
    method: 'post',
})

startTransit77d49b870894a1805e11bde9d897789e.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/start-transit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/orders/{id}/start-transit'
 */
startTransit77d49b870894a1805e11bde9d897789e.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit77d49b870894a1805e11bde9d897789e.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/orders/{id}/start-transit'
 */
startTransit77d49b870894a1805e11bde9d897789e.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit77d49b870894a1805e11bde9d897789e.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/orders/{id}/start-transit'
 */
    const startTransit77d49b870894a1805e11bde9d897789eForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit77d49b870894a1805e11bde9d897789e.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/orders/{id}/start-transit'
 */
        startTransit77d49b870894a1805e11bde9d897789eForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit77d49b870894a1805e11bde9d897789e.url(args, options),
            method: 'post',
        })
    
    startTransit77d49b870894a1805e11bde9d897789e.form = startTransit77d49b870894a1805e11bde9d897789eForm
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/transit/{id}'
 */
const startTransit58df34427d051990bfb390a3c01e3fec = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit58df34427d051990bfb390a3c01e3fec.url(args, options),
    method: 'post',
})

startTransit58df34427d051990bfb390a3c01e3fec.definition = {
    methods: ["post"],
    url: '/api/rider/transit/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/transit/{id}'
 */
startTransit58df34427d051990bfb390a3c01e3fec.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit58df34427d051990bfb390a3c01e3fec.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/transit/{id}'
 */
startTransit58df34427d051990bfb390a3c01e3fec.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit58df34427d051990bfb390a3c01e3fec.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/transit/{id}'
 */
    const startTransit58df34427d051990bfb390a3c01e3fecForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit58df34427d051990bfb390a3c01e3fec.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/transit/{id}'
 */
        startTransit58df34427d051990bfb390a3c01e3fecForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit58df34427d051990bfb390a3c01e3fec.url(args, options),
            method: 'post',
        })
    
    startTransit58df34427d051990bfb390a3c01e3fec.form = startTransit58df34427d051990bfb390a3c01e3fecForm
    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/deliveries/{id}/transit'
 */
const startTransit4586cdd73c0462dc23203ea167ac549d = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit4586cdd73c0462dc23203ea167ac549d.url(args, options),
    method: 'post',
})

startTransit4586cdd73c0462dc23203ea167ac549d.definition = {
    methods: ["post"],
    url: '/api/rider/deliveries/{id}/transit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/deliveries/{id}/transit'
 */
startTransit4586cdd73c0462dc23203ea167ac549d.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return startTransit4586cdd73c0462dc23203ea167ac549d.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/deliveries/{id}/transit'
 */
startTransit4586cdd73c0462dc23203ea167ac549d.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTransit4586cdd73c0462dc23203ea167ac549d.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/deliveries/{id}/transit'
 */
    const startTransit4586cdd73c0462dc23203ea167ac549dForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: startTransit4586cdd73c0462dc23203ea167ac549d.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::startTransit
 * @see app/Http/Controllers/Api/RiderController.php:422
 * @route '/api/rider/deliveries/{id}/transit'
 */
        startTransit4586cdd73c0462dc23203ea167ac549dForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: startTransit4586cdd73c0462dc23203ea167ac549d.url(args, options),
            method: 'post',
        })
    
    startTransit4586cdd73c0462dc23203ea167ac549d.form = startTransit4586cdd73c0462dc23203ea167ac549dForm

export const startTransit = {
    '/api/v1/rider/orders/{id}/transit': startTransit30258da9f6003769dffda8523c718911,
    '/api/v1/rider/orders/{id}/start-transit': startTransit3d4a120e156f1f46a4425fe1c8780098,
    '/api/v1/rider/transit/{id}': startTransit7ed31a4949747b6e96f901fb601a5eab,
    '/api/v1/rider/deliveries/{id}/transit': startTransit7204c23f000441f71edfe1aa1866a99e,
    '/api/rider/orders/{id}/transit': startTransit113e82e4514b9b80d3702387e44dbe82,
    '/api/rider/orders/{id}/start-transit': startTransit77d49b870894a1805e11bde9d897789e,
    '/api/rider/transit/{id}': startTransit58df34427d051990bfb390a3c01e3fec,
    '/api/rider/deliveries/{id}/transit': startTransit4586cdd73c0462dc23203ea167ac549d,
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
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
 * @see app/Http/Controllers/Api/RiderController.php:489
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
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
    const deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/orders/{id}/deliver'
 */
        deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.url(args, options),
            method: 'post',
        })
    
    deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3.form = deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3Form
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/orders/{id}/delivered'
 */
const deliverOrder957f66b3f174bff2e3c407083161585a = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder957f66b3f174bff2e3c407083161585a.url(args, options),
    method: 'post',
})

deliverOrder957f66b3f174bff2e3c407083161585a.definition = {
    methods: ["post"],
    url: '/api/v1/rider/orders/{id}/delivered',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/orders/{id}/delivered'
 */
deliverOrder957f66b3f174bff2e3c407083161585a.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrder957f66b3f174bff2e3c407083161585a.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/orders/{id}/delivered'
 */
deliverOrder957f66b3f174bff2e3c407083161585a.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder957f66b3f174bff2e3c407083161585a.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/orders/{id}/delivered'
 */
    const deliverOrder957f66b3f174bff2e3c407083161585aForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrder957f66b3f174bff2e3c407083161585a.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/orders/{id}/delivered'
 */
        deliverOrder957f66b3f174bff2e3c407083161585aForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrder957f66b3f174bff2e3c407083161585a.url(args, options),
            method: 'post',
        })
    
    deliverOrder957f66b3f174bff2e3c407083161585a.form = deliverOrder957f66b3f174bff2e3c407083161585aForm
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/deliver/{id}'
 */
const deliverOrder677bd9d0e9ee8e1598e3389ca8b96473 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.url(args, options),
    method: 'post',
})

deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.definition = {
    methods: ["post"],
    url: '/api/v1/rider/deliver/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/deliver/{id}'
 */
deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/deliver/{id}'
 */
deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/deliver/{id}'
 */
    const deliverOrder677bd9d0e9ee8e1598e3389ca8b96473Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/deliver/{id}'
 */
        deliverOrder677bd9d0e9ee8e1598e3389ca8b96473Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.url(args, options),
            method: 'post',
        })
    
    deliverOrder677bd9d0e9ee8e1598e3389ca8b96473.form = deliverOrder677bd9d0e9ee8e1598e3389ca8b96473Form
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/deliveries/{id}/deliver'
 */
const deliverOrder742262753097a1c279d47ec4b7638dc9 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder742262753097a1c279d47ec4b7638dc9.url(args, options),
    method: 'post',
})

deliverOrder742262753097a1c279d47ec4b7638dc9.definition = {
    methods: ["post"],
    url: '/api/v1/rider/deliveries/{id}/deliver',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/deliveries/{id}/deliver'
 */
deliverOrder742262753097a1c279d47ec4b7638dc9.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrder742262753097a1c279d47ec4b7638dc9.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/deliveries/{id}/deliver'
 */
deliverOrder742262753097a1c279d47ec4b7638dc9.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder742262753097a1c279d47ec4b7638dc9.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/deliveries/{id}/deliver'
 */
    const deliverOrder742262753097a1c279d47ec4b7638dc9Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrder742262753097a1c279d47ec4b7638dc9.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/v1/rider/deliveries/{id}/deliver'
 */
        deliverOrder742262753097a1c279d47ec4b7638dc9Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrder742262753097a1c279d47ec4b7638dc9.url(args, options),
            method: 'post',
        })
    
    deliverOrder742262753097a1c279d47ec4b7638dc9.form = deliverOrder742262753097a1c279d47ec4b7638dc9Form
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
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
 * @see app/Http/Controllers/Api/RiderController.php:489
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
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/orders/{id}/deliver'
 */
deliverOrdera86283c8722d7e0d3031b8c518471787.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrdera86283c8722d7e0d3031b8c518471787.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/orders/{id}/deliver'
 */
    const deliverOrdera86283c8722d7e0d3031b8c518471787Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrdera86283c8722d7e0d3031b8c518471787.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/orders/{id}/deliver'
 */
        deliverOrdera86283c8722d7e0d3031b8c518471787Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrdera86283c8722d7e0d3031b8c518471787.url(args, options),
            method: 'post',
        })
    
    deliverOrdera86283c8722d7e0d3031b8c518471787.form = deliverOrdera86283c8722d7e0d3031b8c518471787Form
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/orders/{id}/delivered'
 */
const deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.url(args, options),
    method: 'post',
})

deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.definition = {
    methods: ["post"],
    url: '/api/rider/orders/{id}/delivered',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/orders/{id}/delivered'
 */
deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/orders/{id}/delivered'
 */
deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/orders/{id}/delivered'
 */
    const deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/orders/{id}/delivered'
 */
        deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.url(args, options),
            method: 'post',
        })
    
    deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0.form = deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0Form
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/deliver/{id}'
 */
const deliverOrder109e33c3005eaa55eaace9a56522f43a = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder109e33c3005eaa55eaace9a56522f43a.url(args, options),
    method: 'post',
})

deliverOrder109e33c3005eaa55eaace9a56522f43a.definition = {
    methods: ["post"],
    url: '/api/rider/deliver/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/deliver/{id}'
 */
deliverOrder109e33c3005eaa55eaace9a56522f43a.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrder109e33c3005eaa55eaace9a56522f43a.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/deliver/{id}'
 */
deliverOrder109e33c3005eaa55eaace9a56522f43a.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrder109e33c3005eaa55eaace9a56522f43a.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/deliver/{id}'
 */
    const deliverOrder109e33c3005eaa55eaace9a56522f43aForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrder109e33c3005eaa55eaace9a56522f43a.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/deliver/{id}'
 */
        deliverOrder109e33c3005eaa55eaace9a56522f43aForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrder109e33c3005eaa55eaace9a56522f43a.url(args, options),
            method: 'post',
        })
    
    deliverOrder109e33c3005eaa55eaace9a56522f43a.form = deliverOrder109e33c3005eaa55eaace9a56522f43aForm
    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/deliveries/{id}/deliver'
 */
const deliverOrdercc24c15e59bef31014cb90aa4c723d39 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrdercc24c15e59bef31014cb90aa4c723d39.url(args, options),
    method: 'post',
})

deliverOrdercc24c15e59bef31014cb90aa4c723d39.definition = {
    methods: ["post"],
    url: '/api/rider/deliveries/{id}/deliver',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/deliveries/{id}/deliver'
 */
deliverOrdercc24c15e59bef31014cb90aa4c723d39.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return deliverOrdercc24c15e59bef31014cb90aa4c723d39.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/deliveries/{id}/deliver'
 */
deliverOrdercc24c15e59bef31014cb90aa4c723d39.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deliverOrdercc24c15e59bef31014cb90aa4c723d39.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/deliveries/{id}/deliver'
 */
    const deliverOrdercc24c15e59bef31014cb90aa4c723d39Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deliverOrdercc24c15e59bef31014cb90aa4c723d39.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::deliverOrder
 * @see app/Http/Controllers/Api/RiderController.php:489
 * @route '/api/rider/deliveries/{id}/deliver'
 */
        deliverOrdercc24c15e59bef31014cb90aa4c723d39Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deliverOrdercc24c15e59bef31014cb90aa4c723d39.url(args, options),
            method: 'post',
        })
    
    deliverOrdercc24c15e59bef31014cb90aa4c723d39.form = deliverOrdercc24c15e59bef31014cb90aa4c723d39Form

export const deliverOrder = {
    '/api/v1/rider/orders/{id}/deliver': deliverOrderfcf79bea3da3a5d29bcf2e2f6eb5eff3,
    '/api/v1/rider/orders/{id}/delivered': deliverOrder957f66b3f174bff2e3c407083161585a,
    '/api/v1/rider/deliver/{id}': deliverOrder677bd9d0e9ee8e1598e3389ca8b96473,
    '/api/v1/rider/deliveries/{id}/deliver': deliverOrder742262753097a1c279d47ec4b7638dc9,
    '/api/rider/orders/{id}/deliver': deliverOrdera86283c8722d7e0d3031b8c518471787,
    '/api/rider/orders/{id}/delivered': deliverOrdera87e817ce56602cf2a8ef7c41b60d1e0,
    '/api/rider/deliver/{id}': deliverOrder109e33c3005eaa55eaace9a56522f43a,
    '/api/rider/deliveries/{id}/deliver': deliverOrdercc24c15e59bef31014cb90aa4c723d39,
}

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
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
 * @see app/Http/Controllers/Api/RiderController.php:718
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
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/v1/rider/orders/{id}/reject'
 */
rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/v1/rider/orders/{id}/reject'
 */
    const rejectOrderfaac7c9761f8bf4f25eb23e454f6727bForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/v1/rider/orders/{id}/reject'
 */
        rejectOrderfaac7c9761f8bf4f25eb23e454f6727bForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.url(args, options),
            method: 'post',
        })
    
    rejectOrderfaac7c9761f8bf4f25eb23e454f6727b.form = rejectOrderfaac7c9761f8bf4f25eb23e454f6727bForm
    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/v1/rider/reject/{id}'
 */
const rejectOrderd0da61b346e67a58bd389a41ba2c9177 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrderd0da61b346e67a58bd389a41ba2c9177.url(args, options),
    method: 'post',
})

rejectOrderd0da61b346e67a58bd389a41ba2c9177.definition = {
    methods: ["post"],
    url: '/api/v1/rider/reject/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/v1/rider/reject/{id}'
 */
rejectOrderd0da61b346e67a58bd389a41ba2c9177.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return rejectOrderd0da61b346e67a58bd389a41ba2c9177.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/v1/rider/reject/{id}'
 */
rejectOrderd0da61b346e67a58bd389a41ba2c9177.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrderd0da61b346e67a58bd389a41ba2c9177.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/v1/rider/reject/{id}'
 */
    const rejectOrderd0da61b346e67a58bd389a41ba2c9177Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectOrderd0da61b346e67a58bd389a41ba2c9177.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/v1/rider/reject/{id}'
 */
        rejectOrderd0da61b346e67a58bd389a41ba2c9177Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectOrderd0da61b346e67a58bd389a41ba2c9177.url(args, options),
            method: 'post',
        })
    
    rejectOrderd0da61b346e67a58bd389a41ba2c9177.form = rejectOrderd0da61b346e67a58bd389a41ba2c9177Form
    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
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
 * @see app/Http/Controllers/Api/RiderController.php:718
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
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/rider/orders/{id}/reject'
 */
rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/rider/orders/{id}/reject'
 */
    const rejectOrder94fb5ab30d0131e4068baa7bd57d7ecdForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/rider/orders/{id}/reject'
 */
        rejectOrder94fb5ab30d0131e4068baa7bd57d7ecdForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.url(args, options),
            method: 'post',
        })
    
    rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd.form = rejectOrder94fb5ab30d0131e4068baa7bd57d7ecdForm
    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/rider/reject/{id}'
 */
const rejectOrder0bce80e7cfca195a7d764248ee635960 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrder0bce80e7cfca195a7d764248ee635960.url(args, options),
    method: 'post',
})

rejectOrder0bce80e7cfca195a7d764248ee635960.definition = {
    methods: ["post"],
    url: '/api/rider/reject/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/rider/reject/{id}'
 */
rejectOrder0bce80e7cfca195a7d764248ee635960.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return rejectOrder0bce80e7cfca195a7d764248ee635960.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/rider/reject/{id}'
 */
rejectOrder0bce80e7cfca195a7d764248ee635960.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectOrder0bce80e7cfca195a7d764248ee635960.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/rider/reject/{id}'
 */
    const rejectOrder0bce80e7cfca195a7d764248ee635960Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rejectOrder0bce80e7cfca195a7d764248ee635960.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::rejectOrder
 * @see app/Http/Controllers/Api/RiderController.php:718
 * @route '/api/rider/reject/{id}'
 */
        rejectOrder0bce80e7cfca195a7d764248ee635960Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rejectOrder0bce80e7cfca195a7d764248ee635960.url(args, options),
            method: 'post',
        })
    
    rejectOrder0bce80e7cfca195a7d764248ee635960.form = rejectOrder0bce80e7cfca195a7d764248ee635960Form

export const rejectOrder = {
    '/api/v1/rider/orders/{id}/reject': rejectOrderfaac7c9761f8bf4f25eb23e454f6727b,
    '/api/v1/rider/reject/{id}': rejectOrderd0da61b346e67a58bd389a41ba2c9177,
    '/api/rider/orders/{id}/reject': rejectOrder94fb5ab30d0131e4068baa7bd57d7ecd,
    '/api/rider/reject/{id}': rejectOrder0bce80e7cfca195a7d764248ee635960,
}

/**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:584
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
 * @see app/Http/Controllers/Api/RiderController.php:584
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
 * @see app/Http/Controllers/Api/RiderController.php:584
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:584
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
    const cancelOrderc6e91f42a6a96f0dc48849a40d8ac513Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:584
 * @route '/api/v1/rider/orders/{id}/cancel'
 */
        cancelOrderc6e91f42a6a96f0dc48849a40d8ac513Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.url(args, options),
            method: 'post',
        })
    
    cancelOrderc6e91f42a6a96f0dc48849a40d8ac513.form = cancelOrderc6e91f42a6a96f0dc48849a40d8ac513Form
    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:584
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
 * @see app/Http/Controllers/Api/RiderController.php:584
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
 * @see app/Http/Controllers/Api/RiderController.php:584
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
cancelOrder676ea8b862358a07db7266022896cc59.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder676ea8b862358a07db7266022896cc59.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:584
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
    const cancelOrder676ea8b862358a07db7266022896cc59Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelOrder676ea8b862358a07db7266022896cc59.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:584
 * @route '/api/v1/rider/orders/{id}/cancel-request'
 */
        cancelOrder676ea8b862358a07db7266022896cc59Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelOrder676ea8b862358a07db7266022896cc59.url(args, options),
            method: 'post',
        })
    
    cancelOrder676ea8b862358a07db7266022896cc59.form = cancelOrder676ea8b862358a07db7266022896cc59Form
    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:584
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
 * @see app/Http/Controllers/Api/RiderController.php:584
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
 * @see app/Http/Controllers/Api/RiderController.php:584
 * @route '/api/rider/orders/{id}/cancel'
 */
cancelOrder0ee1fe1f36eddf0b892c4836f981f776.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder0ee1fe1f36eddf0b892c4836f981f776.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:584
 * @route '/api/rider/orders/{id}/cancel'
 */
    const cancelOrder0ee1fe1f36eddf0b892c4836f981f776Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelOrder0ee1fe1f36eddf0b892c4836f981f776.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:584
 * @route '/api/rider/orders/{id}/cancel'
 */
        cancelOrder0ee1fe1f36eddf0b892c4836f981f776Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelOrder0ee1fe1f36eddf0b892c4836f981f776.url(args, options),
            method: 'post',
        })
    
    cancelOrder0ee1fe1f36eddf0b892c4836f981f776.form = cancelOrder0ee1fe1f36eddf0b892c4836f981f776Form
    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:584
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
 * @see app/Http/Controllers/Api/RiderController.php:584
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
 * @see app/Http/Controllers/Api/RiderController.php:584
 * @route '/api/rider/orders/{id}/cancel-request'
 */
cancelOrder2dccc2582b88c47bdea90c08f6913efa.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelOrder2dccc2582b88c47bdea90c08f6913efa.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:584
 * @route '/api/rider/orders/{id}/cancel-request'
 */
    const cancelOrder2dccc2582b88c47bdea90c08f6913efaForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelOrder2dccc2582b88c47bdea90c08f6913efa.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::cancelOrder
 * @see app/Http/Controllers/Api/RiderController.php:584
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

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/status'
 */
const updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, options),
    method: 'post',
})

updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.definition = {
    methods: ["post","patch","put"],
    url: '/api/v1/rider/orders/{id}/status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/status'
 */
updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/status'
 */
updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/status'
 */
updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/status'
 */
updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/status'
 */
    const updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/status'
 */
        updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/status'
 */
        updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03Form.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/status'
 */
        updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03Form.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03.form = updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03Form
    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
const updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, options),
    method: 'post',
})

updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.definition = {
    methods: ["post","patch","put"],
    url: '/api/v1/rider/orders/{id}/update-status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
    const updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
        updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
        updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78Form.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/orders/{id}/update-status'
 */
        updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78Form.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78.form = updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78Form
    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
const updateOrderStatuscbd2e640a6d084966c4b93513ac821a4 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, options),
    method: 'post',
})

updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.definition = {
    methods: ["post","patch","put"],
    url: '/api/v1/rider/deliveries/{id}/status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
    const updateOrderStatuscbd2e640a6d084966c4b93513ac821a4Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
        updateOrderStatuscbd2e640a6d084966c4b93513ac821a4Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
        updateOrderStatuscbd2e640a6d084966c4b93513ac821a4Form.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/status'
 */
        updateOrderStatuscbd2e640a6d084966c4b93513ac821a4Form.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatuscbd2e640a6d084966c4b93513ac821a4.form = updateOrderStatuscbd2e640a6d084966c4b93513ac821a4Form
    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
const updateOrderStatus81e46a29d61266cc4724ede338200a4d = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, options),
    method: 'post',
})

updateOrderStatus81e46a29d61266cc4724ede338200a4d.definition = {
    methods: ["post","patch","put"],
    url: '/api/v1/rider/deliveries/{id}/update-status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
updateOrderStatus81e46a29d61266cc4724ede338200a4d.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatus81e46a29d61266cc4724ede338200a4d.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
updateOrderStatus81e46a29d61266cc4724ede338200a4d.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
updateOrderStatus81e46a29d61266cc4724ede338200a4d.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
updateOrderStatus81e46a29d61266cc4724ede338200a4d.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
    const updateOrderStatus81e46a29d61266cc4724ede338200a4dForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
        updateOrderStatus81e46a29d61266cc4724ede338200a4dForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
        updateOrderStatus81e46a29d61266cc4724ede338200a4dForm.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/v1/rider/deliveries/{id}/update-status'
 */
        updateOrderStatus81e46a29d61266cc4724ede338200a4dForm.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus81e46a29d61266cc4724ede338200a4d.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatus81e46a29d61266cc4724ede338200a4d.form = updateOrderStatus81e46a29d61266cc4724ede338200a4dForm
    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/status'
 */
const updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, options),
    method: 'post',
})

updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.definition = {
    methods: ["post","patch","put"],
    url: '/api/rider/orders/{id}/status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/status'
 */
updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/status'
 */
updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/status'
 */
updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/status'
 */
updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/status'
 */
    const updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/status'
 */
        updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/status'
 */
        updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045Form.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/status'
 */
        updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045Form.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045.form = updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045Form
    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/update-status'
 */
const updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, options),
    method: 'post',
})

updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.definition = {
    methods: ["post","patch","put"],
    url: '/api/rider/orders/{id}/update-status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/update-status'
 */
updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/update-status'
 */
updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/update-status'
 */
updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/update-status'
 */
updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/update-status'
 */
    const updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9eForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/update-status'
 */
        updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9eForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/update-status'
 */
        updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9eForm.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/orders/{id}/update-status'
 */
        updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9eForm.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e.form = updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9eForm
    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/status'
 */
const updateOrderStatus00ee555570055eb15285d11011471824 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus00ee555570055eb15285d11011471824.url(args, options),
    method: 'post',
})

updateOrderStatus00ee555570055eb15285d11011471824.definition = {
    methods: ["post","patch","put"],
    url: '/api/rider/deliveries/{id}/status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/status'
 */
updateOrderStatus00ee555570055eb15285d11011471824.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatus00ee555570055eb15285d11011471824.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/status'
 */
updateOrderStatus00ee555570055eb15285d11011471824.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus00ee555570055eb15285d11011471824.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/status'
 */
updateOrderStatus00ee555570055eb15285d11011471824.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatus00ee555570055eb15285d11011471824.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/status'
 */
updateOrderStatus00ee555570055eb15285d11011471824.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatus00ee555570055eb15285d11011471824.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/status'
 */
    const updateOrderStatus00ee555570055eb15285d11011471824Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatus00ee555570055eb15285d11011471824.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/status'
 */
        updateOrderStatus00ee555570055eb15285d11011471824Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus00ee555570055eb15285d11011471824.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/status'
 */
        updateOrderStatus00ee555570055eb15285d11011471824Form.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus00ee555570055eb15285d11011471824.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/status'
 */
        updateOrderStatus00ee555570055eb15285d11011471824Form.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus00ee555570055eb15285d11011471824.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatus00ee555570055eb15285d11011471824.form = updateOrderStatus00ee555570055eb15285d11011471824Form
    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/update-status'
 */
const updateOrderStatus9439ef2803b109be42573f7660c0c104 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, options),
    method: 'post',
})

updateOrderStatus9439ef2803b109be42573f7660c0c104.definition = {
    methods: ["post","patch","put"],
    url: '/api/rider/deliveries/{id}/update-status',
} satisfies RouteDefinition<["post","patch","put"]>

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/update-status'
 */
updateOrderStatus9439ef2803b109be42573f7660c0c104.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateOrderStatus9439ef2803b109be42573f7660c0c104.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/update-status'
 */
updateOrderStatus9439ef2803b109be42573f7660c0c104.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/update-status'
 */
updateOrderStatus9439ef2803b109be42573f7660c0c104.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, options),
    method: 'patch',
})
/**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/update-status'
 */
updateOrderStatus9439ef2803b109be42573f7660c0c104.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/update-status'
 */
    const updateOrderStatus9439ef2803b109be42573f7660c0c104Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/update-status'
 */
        updateOrderStatus9439ef2803b109be42573f7660c0c104Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/update-status'
 */
        updateOrderStatus9439ef2803b109be42573f7660c0c104Form.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\RiderController::updateOrderStatus
 * @see app/Http/Controllers/Api/RiderController.php:400
 * @route '/api/rider/deliveries/{id}/update-status'
 */
        updateOrderStatus9439ef2803b109be42573f7660c0c104Form.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOrderStatus9439ef2803b109be42573f7660c0c104.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOrderStatus9439ef2803b109be42573f7660c0c104.form = updateOrderStatus9439ef2803b109be42573f7660c0c104Form

export const updateOrderStatus = {
    '/api/v1/rider/orders/{id}/status': updateOrderStatusc3ce4402b6895f83c71cf9cea1cbae03,
    '/api/v1/rider/orders/{id}/update-status': updateOrderStatus8d68d893d8cb80697b4a4e9ec5891b78,
    '/api/v1/rider/deliveries/{id}/status': updateOrderStatuscbd2e640a6d084966c4b93513ac821a4,
    '/api/v1/rider/deliveries/{id}/update-status': updateOrderStatus81e46a29d61266cc4724ede338200a4d,
    '/api/rider/orders/{id}/status': updateOrderStatus30c09562f8a2173a5e8f69c7abb9b045,
    '/api/rider/orders/{id}/update-status': updateOrderStatusf97e90fbd12c2cde66f4f8296c259b9e,
    '/api/rider/deliveries/{id}/status': updateOrderStatus00ee555570055eb15285d11011471824,
    '/api/rider/deliveries/{id}/update-status': updateOrderStatus9439ef2803b109be42573f7660c0c104,
}

const RiderController = { changePassword, updateStatus, ping, getStats, updateLocation, getOrders, getMyOrders, getCompletedOrders, acceptOrder, pickupOrder, startTransit, deliverOrder, rejectOrder, cancelOrder, updateOrderStatus }

export default RiderController