import ApiOrderController from './ApiOrderController'
import AuthController from './AuthController'
import VerificationController from './VerificationController'
import ProductController from './ProductController'
import CategoryController from './CategoryController'
import V1 from './V1'
import RiderController from './RiderController'
import CartController from './CartController'
const Api = {
    ApiOrderController: Object.assign(ApiOrderController, ApiOrderController),
AuthController: Object.assign(AuthController, AuthController),
VerificationController: Object.assign(VerificationController, VerificationController),
ProductController: Object.assign(ProductController, ProductController),
CategoryController: Object.assign(CategoryController, CategoryController),
V1: Object.assign(V1, V1),
RiderController: Object.assign(RiderController, RiderController),
CartController: Object.assign(CartController, CartController),
}

export default Api