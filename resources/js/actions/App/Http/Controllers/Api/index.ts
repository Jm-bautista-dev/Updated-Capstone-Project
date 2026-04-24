import ApiOrderController from './ApiOrderController'
import AuthController from './AuthController'
import VerificationController from './VerificationController'
import ProductController from './ProductController'
import CategoryController from './CategoryController'
import V1 from './V1'
import CartController from './CartController'
import RiderController from './RiderController'
const Api = {
    ApiOrderController: Object.assign(ApiOrderController, ApiOrderController),
AuthController: Object.assign(AuthController, AuthController),
VerificationController: Object.assign(VerificationController, VerificationController),
ProductController: Object.assign(ProductController, ProductController),
CategoryController: Object.assign(CategoryController, CategoryController),
V1: Object.assign(V1, V1),
CartController: Object.assign(CartController, CartController),
RiderController: Object.assign(RiderController, RiderController),
}

export default Api