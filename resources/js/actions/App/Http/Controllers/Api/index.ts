import ApiOrderController from './ApiOrderController'
import AuthController from './AuthController'
import ProductController from './ProductController'
import CategoryController from './CategoryController'
import VerificationController from './VerificationController'
const Api = {
    ApiOrderController: Object.assign(ApiOrderController, ApiOrderController),
AuthController: Object.assign(AuthController, AuthController),
ProductController: Object.assign(ProductController, ProductController),
CategoryController: Object.assign(CategoryController, CategoryController),
VerificationController: Object.assign(VerificationController, VerificationController),
}

export default Api