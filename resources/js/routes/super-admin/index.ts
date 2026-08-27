import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import health from './health'
import errors from './errors'
import logs from './logs'
import maintenance from './maintenance'
import audit from './audit'
import apiMonitor from './api-monitor'
import database from './database'
import features from './features'
import deployment from './deployment'
import security from './security'
import settings from './settings'
/**
* @see \App\Http\Controllers\SuperAdmin\DashboardController::dashboard
 * @see app/Http/Controllers/SuperAdmin/DashboardController.php:23
 * @route '/super-admin'
 */
export const dashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

dashboard.definition = {
    methods: ["get","head"],
    url: '/super-admin',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\DashboardController::dashboard
 * @see app/Http/Controllers/SuperAdmin/DashboardController.php:23
 * @route '/super-admin'
 */
dashboard.url = (options?: RouteQueryOptions) => {
    return dashboard.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\DashboardController::dashboard
 * @see app/Http/Controllers/SuperAdmin/DashboardController.php:23
 * @route '/super-admin'
 */
dashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\DashboardController::dashboard
 * @see app/Http/Controllers/SuperAdmin/DashboardController.php:23
 * @route '/super-admin'
 */
dashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboard.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\DashboardController::dashboard
 * @see app/Http/Controllers/SuperAdmin/DashboardController.php:23
 * @route '/super-admin'
 */
    const dashboardForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: dashboard.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\DashboardController::dashboard
 * @see app/Http/Controllers/SuperAdmin/DashboardController.php:23
 * @route '/super-admin'
 */
        dashboardForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboard.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\DashboardController::dashboard
 * @see app/Http/Controllers/SuperAdmin/DashboardController.php:23
 * @route '/super-admin'
 */
        dashboardForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboard.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    dashboard.form = dashboardForm
const superAdmin = {
    dashboard: Object.assign(dashboard, dashboard),
health: Object.assign(health, health),
errors: Object.assign(errors, errors),
logs: Object.assign(logs, logs),
maintenance: Object.assign(maintenance, maintenance),
audit: Object.assign(audit, audit),
apiMonitor: Object.assign(apiMonitor, apiMonitor),
database: Object.assign(database, database),
features: Object.assign(features, features),
deployment: Object.assign(deployment, deployment),
security: Object.assign(security, security),
settings: Object.assign(settings, settings),
}

export default superAdmin