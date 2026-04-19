import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\RiderController::index
 * @see app/Http/Controllers/Admin/RiderController.php:13
 * @route '/riders'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/riders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\RiderController::index
 * @see app/Http/Controllers/Admin/RiderController.php:13
 * @route '/riders'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\RiderController::index
 * @see app/Http/Controllers/Admin/RiderController.php:13
 * @route '/riders'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\RiderController::index
 * @see app/Http/Controllers/Admin/RiderController.php:13
 * @route '/riders'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\RiderController::index
 * @see app/Http/Controllers/Admin/RiderController.php:13
 * @route '/riders'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\RiderController::index
 * @see app/Http/Controllers/Admin/RiderController.php:13
 * @route '/riders'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\RiderController::index
 * @see app/Http/Controllers/Admin/RiderController.php:13
 * @route '/riders'
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
* @see \App\Http\Controllers\Admin\RiderController::create
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/riders/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\RiderController::create
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\RiderController::create
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\RiderController::create
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\RiderController::create
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\RiderController::create
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\RiderController::create
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\Admin\RiderController::store
 * @see app/Http/Controllers/Admin/RiderController.php:42
 * @route '/riders'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/riders',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\RiderController::store
 * @see app/Http/Controllers/Admin/RiderController.php:42
 * @route '/riders'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\RiderController::store
 * @see app/Http/Controllers/Admin/RiderController.php:42
 * @route '/riders'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\RiderController::store
 * @see app/Http/Controllers/Admin/RiderController.php:42
 * @route '/riders'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\RiderController::store
 * @see app/Http/Controllers/Admin/RiderController.php:42
 * @route '/riders'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\RiderController::show
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/{rider}'
 */
export const show = (args: { rider: string | number } | [rider: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/riders/{rider}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\RiderController::show
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/{rider}'
 */
show.url = (args: { rider: string | number } | [rider: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { rider: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    rider: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        rider: args.rider,
                }

    return show.definition.url
            .replace('{rider}', parsedArgs.rider.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\RiderController::show
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/{rider}'
 */
show.get = (args: { rider: string | number } | [rider: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\RiderController::show
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/{rider}'
 */
show.head = (args: { rider: string | number } | [rider: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\RiderController::show
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/{rider}'
 */
    const showForm = (args: { rider: string | number } | [rider: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\RiderController::show
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/{rider}'
 */
        showForm.get = (args: { rider: string | number } | [rider: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\RiderController::show
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/{rider}'
 */
        showForm.head = (args: { rider: string | number } | [rider: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\Admin\RiderController::edit
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/{rider}/edit'
 */
export const edit = (args: { rider: string | number } | [rider: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/riders/{rider}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\RiderController::edit
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/{rider}/edit'
 */
edit.url = (args: { rider: string | number } | [rider: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { rider: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    rider: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        rider: args.rider,
                }

    return edit.definition.url
            .replace('{rider}', parsedArgs.rider.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\RiderController::edit
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/{rider}/edit'
 */
edit.get = (args: { rider: string | number } | [rider: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\RiderController::edit
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/{rider}/edit'
 */
edit.head = (args: { rider: string | number } | [rider: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\RiderController::edit
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/{rider}/edit'
 */
    const editForm = (args: { rider: string | number } | [rider: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\RiderController::edit
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/{rider}/edit'
 */
        editForm.get = (args: { rider: string | number } | [rider: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\RiderController::edit
 * @see app/Http/Controllers/Admin/RiderController.php:0
 * @route '/riders/{rider}/edit'
 */
        editForm.head = (args: { rider: string | number } | [rider: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\Admin\RiderController::update
 * @see app/Http/Controllers/Admin/RiderController.php:56
 * @route '/riders/{rider}'
 */
export const update = (args: { rider: string | number | { id: string | number } } | [rider: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/riders/{rider}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\Admin\RiderController::update
 * @see app/Http/Controllers/Admin/RiderController.php:56
 * @route '/riders/{rider}'
 */
update.url = (args: { rider: string | number | { id: string | number } } | [rider: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { rider: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { rider: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    rider: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        rider: typeof args.rider === 'object'
                ? args.rider.id
                : args.rider,
                }

    return update.definition.url
            .replace('{rider}', parsedArgs.rider.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\RiderController::update
 * @see app/Http/Controllers/Admin/RiderController.php:56
 * @route '/riders/{rider}'
 */
update.put = (args: { rider: string | number | { id: string | number } } | [rider: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\Admin\RiderController::update
 * @see app/Http/Controllers/Admin/RiderController.php:56
 * @route '/riders/{rider}'
 */
update.patch = (args: { rider: string | number | { id: string | number } } | [rider: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\RiderController::update
 * @see app/Http/Controllers/Admin/RiderController.php:56
 * @route '/riders/{rider}'
 */
    const updateForm = (args: { rider: string | number | { id: string | number } } | [rider: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\RiderController::update
 * @see app/Http/Controllers/Admin/RiderController.php:56
 * @route '/riders/{rider}'
 */
        updateForm.put = (args: { rider: string | number | { id: string | number } } | [rider: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Admin\RiderController::update
 * @see app/Http/Controllers/Admin/RiderController.php:56
 * @route '/riders/{rider}'
 */
        updateForm.patch = (args: { rider: string | number | { id: string | number } } | [rider: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Admin\RiderController::destroy
 * @see app/Http/Controllers/Admin/RiderController.php:70
 * @route '/riders/{rider}'
 */
export const destroy = (args: { rider: string | number | { id: string | number } } | [rider: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/riders/{rider}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\RiderController::destroy
 * @see app/Http/Controllers/Admin/RiderController.php:70
 * @route '/riders/{rider}'
 */
destroy.url = (args: { rider: string | number | { id: string | number } } | [rider: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { rider: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { rider: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    rider: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        rider: typeof args.rider === 'object'
                ? args.rider.id
                : args.rider,
                }

    return destroy.definition.url
            .replace('{rider}', parsedArgs.rider.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\RiderController::destroy
 * @see app/Http/Controllers/Admin/RiderController.php:70
 * @route '/riders/{rider}'
 */
destroy.delete = (args: { rider: string | number | { id: string | number } } | [rider: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\RiderController::destroy
 * @see app/Http/Controllers/Admin/RiderController.php:70
 * @route '/riders/{rider}'
 */
    const destroyForm = (args: { rider: string | number | { id: string | number } } | [rider: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\RiderController::destroy
 * @see app/Http/Controllers/Admin/RiderController.php:70
 * @route '/riders/{rider}'
 */
        destroyForm.delete = (args: { rider: string | number | { id: string | number } } | [rider: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
/**
* @see \App\Http\Controllers\Admin\RiderController::available
 * @see app/Http/Controllers/Admin/RiderController.php:79
 * @route '/riders-available'
 */
export const available = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: available.url(options),
    method: 'get',
})

available.definition = {
    methods: ["get","head"],
    url: '/riders-available',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\RiderController::available
 * @see app/Http/Controllers/Admin/RiderController.php:79
 * @route '/riders-available'
 */
available.url = (options?: RouteQueryOptions) => {
    return available.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\RiderController::available
 * @see app/Http/Controllers/Admin/RiderController.php:79
 * @route '/riders-available'
 */
available.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: available.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\RiderController::available
 * @see app/Http/Controllers/Admin/RiderController.php:79
 * @route '/riders-available'
 */
available.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: available.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\RiderController::available
 * @see app/Http/Controllers/Admin/RiderController.php:79
 * @route '/riders-available'
 */
    const availableForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: available.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\RiderController::available
 * @see app/Http/Controllers/Admin/RiderController.php:79
 * @route '/riders-available'
 */
        availableForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: available.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\RiderController::available
 * @see app/Http/Controllers/Admin/RiderController.php:79
 * @route '/riders-available'
 */
        availableForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: available.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    available.form = availableForm
const RiderController = { index, create, store, show, edit, update, destroy, available }

export default RiderController