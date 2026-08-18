import TopPickController from './TopPickController'
import AuthController from './AuthController'
import VerificationController from './VerificationController'
import ProductController from './ProductController'
import CategoryController from './CategoryController'
import V1 from './V1'
import DeliveryFeeController from './DeliveryFeeController'
import ReviewController from './ReviewController'
import UserController from './UserController'
import RiderController from './RiderController'
import CancellationRequestController from './CancellationRequestController'
import Branch from './Branch'
import Rider from './Rider'
import ApiOrderController from './ApiOrderController'
import CustomerOrderController from './CustomerOrderController'
import CartController from './CartController'
import SyncApiController from './SyncApiController'
import ReceiptController from './ReceiptController'
const Api = {
    TopPickController: Object.assign(TopPickController, TopPickController),
AuthController: Object.assign(AuthController, AuthController),
VerificationController: Object.assign(VerificationController, VerificationController),
ProductController: Object.assign(ProductController, ProductController),
CategoryController: Object.assign(CategoryController, CategoryController),
V1: Object.assign(V1, V1),
DeliveryFeeController: Object.assign(DeliveryFeeController, DeliveryFeeController),
ReviewController: Object.assign(ReviewController, ReviewController),
UserController: Object.assign(UserController, UserController),
RiderController: Object.assign(RiderController, RiderController),
CancellationRequestController: Object.assign(CancellationRequestController, CancellationRequestController),
Branch: Object.assign(Branch, Branch),
Rider: Object.assign(Rider, Rider),
ApiOrderController: Object.assign(ApiOrderController, ApiOrderController),
CustomerOrderController: Object.assign(CustomerOrderController, CustomerOrderController),
CartController: Object.assign(CartController, CartController),
SyncApiController: Object.assign(SyncApiController, SyncApiController),
ReceiptController: Object.assign(ReceiptController, ReceiptController),
}

export default Api