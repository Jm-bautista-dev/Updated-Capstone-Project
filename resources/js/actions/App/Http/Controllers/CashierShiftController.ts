import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CashierShiftController::open
 * @see app/Http/Controllers/CashierShiftController.php:12
 * @route '/shifts/open'
 */
export const open = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: open.url(options),
    method: 'post',
})

open.definition = {
    methods: ["post"],
    url: '/shifts/open',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CashierShiftController::open
 * @see app/Http/Controllers/CashierShiftController.php:12
 * @route '/shifts/open'
 */
open.url = (options?: RouteQueryOptions) => {
    return open.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CashierShiftController::open
 * @see app/Http/Controllers/CashierShiftController.php:12
 * @route '/shifts/open'
 */
open.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: open.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CashierShiftController::open
 * @see app/Http/Controllers/CashierShiftController.php:12
 * @route '/shifts/open'
 */
    const openForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: open.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CashierShiftController::open
 * @see app/Http/Controllers/CashierShiftController.php:12
 * @route '/shifts/open'
 */
        openForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: open.url(options),
            method: 'post',
        })
    
    open.form = openForm
/**
* @see \App\Http\Controllers\CashierShiftController::close
 * @see app/Http/Controllers/CashierShiftController.php:41
 * @route '/shifts/close'
 */
export const close = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: close.url(options),
    method: 'post',
})

close.definition = {
    methods: ["post"],
    url: '/shifts/close',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CashierShiftController::close
 * @see app/Http/Controllers/CashierShiftController.php:41
 * @route '/shifts/close'
 */
close.url = (options?: RouteQueryOptions) => {
    return close.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CashierShiftController::close
 * @see app/Http/Controllers/CashierShiftController.php:41
 * @route '/shifts/close'
 */
close.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: close.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CashierShiftController::close
 * @see app/Http/Controllers/CashierShiftController.php:41
 * @route '/shifts/close'
 */
    const closeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: close.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CashierShiftController::close
 * @see app/Http/Controllers/CashierShiftController.php:41
 * @route '/shifts/close'
 */
        closeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: close.url(options),
            method: 'post',
        })
    
    close.form = closeForm
/**
* @see \App\Http\Controllers\CashierShiftController::adjust
 * @see app/Http/Controllers/CashierShiftController.php:70
 * @route '/shifts/adjust'
 */
export const adjust = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: adjust.url(options),
    method: 'post',
})

adjust.definition = {
    methods: ["post"],
    url: '/shifts/adjust',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CashierShiftController::adjust
 * @see app/Http/Controllers/CashierShiftController.php:70
 * @route '/shifts/adjust'
 */
adjust.url = (options?: RouteQueryOptions) => {
    return adjust.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CashierShiftController::adjust
 * @see app/Http/Controllers/CashierShiftController.php:70
 * @route '/shifts/adjust'
 */
adjust.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: adjust.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CashierShiftController::adjust
 * @see app/Http/Controllers/CashierShiftController.php:70
 * @route '/shifts/adjust'
 */
    const adjustForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: adjust.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CashierShiftController::adjust
 * @see app/Http/Controllers/CashierShiftController.php:70
 * @route '/shifts/adjust'
 */
        adjustForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: adjust.url(options),
            method: 'post',
        })
    
    adjust.form = adjustForm
const CashierShiftController = { open, close, adjust }

export default CashierShiftController