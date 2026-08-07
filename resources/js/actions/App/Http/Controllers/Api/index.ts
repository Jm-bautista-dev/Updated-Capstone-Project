import ApiOrderController from './ApiOrderController'
import AuthController from './AuthController'
import CartController from './CartController'
import CategoryController from './CategoryController'
import DeliveryFeeController from './DeliveryFeeController'
import ProductController from './ProductController'
import ReceiptController from './ReceiptController'
import RiderController from './RiderController'
import SyncApiController from './SyncApiController'
import TopPickController from './TopPickController'
import UserController from './UserController'
import V1 from './V1'
import VerificationController from './VerificationController'
const Api = {
    TopPickController: Object.assign(TopPickController, TopPickController),
AuthController: Object.assign(AuthController, AuthController),
VerificationController: Object.assign(VerificationController, VerificationController),
ProductController: Object.assign(ProductController, ProductController),
CategoryController: Object.assign(CategoryController, CategoryController),
V1: Object.assign(V1, V1),
DeliveryFeeController: Object.assign(DeliveryFeeController, DeliveryFeeController),
UserController: Object.assign(UserController, UserController),
RiderController: Object.assign(RiderController, RiderController),
ApiOrderController: Object.assign(ApiOrderController, ApiOrderController),
CartController: Object.assign(CartController, CartController),
SyncApiController: Object.assign(SyncApiController, SyncApiController),
ReceiptController: Object.assign(ReceiptController, ReceiptController),
}

export default Api