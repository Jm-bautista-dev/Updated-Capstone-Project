import AuthController from './AuthController'
import ProductController from './ProductController'
import CategoryController from './CategoryController'
import ApiOrderController from './ApiOrderController'
import CartController from './CartController'
const Api = {
    AuthController: Object.assign(AuthController, AuthController),
ProductController: Object.assign(ProductController, ProductController),
CategoryController: Object.assign(CategoryController, CategoryController),
ApiOrderController: Object.assign(ApiOrderController, ApiOrderController),
CartController: Object.assign(CartController, CartController),
}

export default Api