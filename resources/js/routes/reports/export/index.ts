import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ReportController::prepare
 * @see app/Http/Controllers/Admin/ReportController.php:72
 * @route '/reports/export/prepare'
 */
export const prepare = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: prepare.url(options),
    method: 'post',
})

prepare.definition = {
    methods: ["post"],
    url: '/reports/export/prepare',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReportController::prepare
 * @see app/Http/Controllers/Admin/ReportController.php:72
 * @route '/reports/export/prepare'
 */
prepare.url = (options?: RouteQueryOptions) => {
    return prepare.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReportController::prepare
 * @see app/Http/Controllers/Admin/ReportController.php:72
 * @route '/reports/export/prepare'
 */
prepare.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: prepare.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ReportController::prepare
 * @see app/Http/Controllers/Admin/ReportController.php:72
 * @route '/reports/export/prepare'
 */
    const prepareForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: prepare.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ReportController::prepare
 * @see app/Http/Controllers/Admin/ReportController.php:72
 * @route '/reports/export/prepare'
 */
        prepareForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: prepare.url(options),
            method: 'post',
        })
    
    prepare.form = prepareForm
const exportMethod = {
    prepare: Object.assign(prepare, prepare),
}

export default exportMethod