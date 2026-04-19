import CategoryController from './CategoryController'
import ProductController from './ProductController'
const Customer = {
    CategoryController: Object.assign(CategoryController, CategoryController),
ProductController: Object.assign(ProductController, ProductController),
}

export default Customer