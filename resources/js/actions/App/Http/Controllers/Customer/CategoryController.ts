import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Customer\CategoryController::index
 * @see app/Http/Controllers/Customer/CategoryController.php:15
 * @route '/api/v1/customer/categories'
 */
const index10bb122e56b6b8f82e289934c3946f28 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index10bb122e56b6b8f82e289934c3946f28.url(options),
    method: 'get',
})

index10bb122e56b6b8f82e289934c3946f28.definition = {
    methods: ["get","head"],
    url: '/api/v1/customer/categories',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Customer\CategoryController::index
 * @see app/Http/Controllers/Customer/CategoryController.php:15
 * @route '/api/v1/customer/categories'
 */
index10bb122e56b6b8f82e289934c3946f28.url = (options?: RouteQueryOptions) => {
    return index10bb122e56b6b8f82e289934c3946f28.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Customer\CategoryController::index
 * @see app/Http/Controllers/Customer/CategoryController.php:15
 * @route '/api/v1/customer/categories'
 */
index10bb122e56b6b8f82e289934c3946f28.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index10bb122e56b6b8f82e289934c3946f28.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Customer\CategoryController::index
 * @see app/Http/Controllers/Customer/CategoryController.php:15
 * @route '/api/v1/customer/categories'
 */
index10bb122e56b6b8f82e289934c3946f28.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index10bb122e56b6b8f82e289934c3946f28.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Customer\CategoryController::index
 * @see app/Http/Controllers/Customer/CategoryController.php:15
 * @route '/api/v1/customer/categories'
 */
    const index10bb122e56b6b8f82e289934c3946f28Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index10bb122e56b6b8f82e289934c3946f28.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Customer\CategoryController::index
 * @see app/Http/Controllers/Customer/CategoryController.php:15
 * @route '/api/v1/customer/categories'
 */
        index10bb122e56b6b8f82e289934c3946f28Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index10bb122e56b6b8f82e289934c3946f28.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Customer\CategoryController::index
 * @see app/Http/Controllers/Customer/CategoryController.php:15
 * @route '/api/v1/customer/categories'
 */
        index10bb122e56b6b8f82e289934c3946f28Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index10bb122e56b6b8f82e289934c3946f28.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index10bb122e56b6b8f82e289934c3946f28.form = index10bb122e56b6b8f82e289934c3946f28Form
    /**
* @see \App\Http\Controllers\Customer\CategoryController::index
 * @see app/Http/Controllers/Customer/CategoryController.php:15
 * @route '/api/customer/categories'
 */
const index11cdcc0ca39ff2911926d27be772b8a4 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index11cdcc0ca39ff2911926d27be772b8a4.url(options),
    method: 'get',
})

index11cdcc0ca39ff2911926d27be772b8a4.definition = {
    methods: ["get","head"],
    url: '/api/customer/categories',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Customer\CategoryController::index
 * @see app/Http/Controllers/Customer/CategoryController.php:15
 * @route '/api/customer/categories'
 */
index11cdcc0ca39ff2911926d27be772b8a4.url = (options?: RouteQueryOptions) => {
    return index11cdcc0ca39ff2911926d27be772b8a4.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Customer\CategoryController::index
 * @see app/Http/Controllers/Customer/CategoryController.php:15
 * @route '/api/customer/categories'
 */
index11cdcc0ca39ff2911926d27be772b8a4.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index11cdcc0ca39ff2911926d27be772b8a4.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Customer\CategoryController::index
 * @see app/Http/Controllers/Customer/CategoryController.php:15
 * @route '/api/customer/categories'
 */
index11cdcc0ca39ff2911926d27be772b8a4.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index11cdcc0ca39ff2911926d27be772b8a4.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Customer\CategoryController::index
 * @see app/Http/Controllers/Customer/CategoryController.php:15
 * @route '/api/customer/categories'
 */
    const index11cdcc0ca39ff2911926d27be772b8a4Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index11cdcc0ca39ff2911926d27be772b8a4.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Customer\CategoryController::index
 * @see app/Http/Controllers/Customer/CategoryController.php:15
 * @route '/api/customer/categories'
 */
        index11cdcc0ca39ff2911926d27be772b8a4Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index11cdcc0ca39ff2911926d27be772b8a4.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Customer\CategoryController::index
 * @see app/Http/Controllers/Customer/CategoryController.php:15
 * @route '/api/customer/categories'
 */
        index11cdcc0ca39ff2911926d27be772b8a4Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index11cdcc0ca39ff2911926d27be772b8a4.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index11cdcc0ca39ff2911926d27be772b8a4.form = index11cdcc0ca39ff2911926d27be772b8a4Form

export const index = {
    '/api/v1/customer/categories': index10bb122e56b6b8f82e289934c3946f28,
    '/api/customer/categories': index11cdcc0ca39ff2911926d27be772b8a4,
}

const CategoryController = { index }

export default CategoryController