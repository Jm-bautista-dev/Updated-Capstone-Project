import ApiOrderController from './ApiOrderController'
import ApiPickupController from './ApiPickupController'
import AuthController from './AuthController'
import Branch from './Branch'
import CancellationRequestController from './CancellationRequestController'
import CartController from './CartController'
import CategoryController from './CategoryController'
import CustomerNotificationController from './CustomerNotificationController'
import CustomerOrderController from './CustomerOrderController'
import DeliveryFeeController from './DeliveryFeeController'
import POSCancellationController from './POSCancellationController'
import PosDeliveryDistanceController from './PosDeliveryDistanceController'
import PrintJobController from './PrintJobController'
import ProductController from './ProductController'
import ReceiptController from './ReceiptController'
import ReviewController from './ReviewController'
import Rider from './Rider'
import RiderCancellationController from './RiderCancellationController'
import RiderController from './RiderController'
import SyncApiController from './SyncApiController'
import SystemStatusController from './SystemStatusController'
import TopPickController from './TopPickController'
import UserController from './UserController'
import V1 from './V1'
import VerificationController from './VerificationController'
const Api = {
    TopPickController: Object.assign(TopPickController, TopPickController),
PosDeliveryDistanceController: Object.assign(PosDeliveryDistanceController, PosDeliveryDistanceController),
AuthController: Object.assign(AuthController, AuthController),
VerificationController: Object.assign(VerificationController, VerificationController),
SystemStatusController: Object.assign(SystemStatusController, SystemStatusController),
ProductController: Object.assign(ProductController, ProductController),
CategoryController: Object.assign(CategoryController, CategoryController),
V1: Object.assign(V1, V1),
DeliveryFeeController: Object.assign(DeliveryFeeController, DeliveryFeeController),
ReviewController: Object.assign(ReviewController, ReviewController),
ApiPickupController: Object.assign(ApiPickupController, ApiPickupController),
UserController: Object.assign(UserController, UserController),
RiderController: Object.assign(RiderController, RiderController),
Rider: Object.assign(Rider, Rider),
CancellationRequestController: Object.assign(CancellationRequestController, CancellationRequestController),
Branch: Object.assign(Branch, Branch),
ApiOrderController: Object.assign(ApiOrderController, ApiOrderController),
CustomerOrderController: Object.assign(CustomerOrderController, CustomerOrderController),
CartController: Object.assign(CartController, CartController),
CustomerNotificationController: Object.assign(CustomerNotificationController, CustomerNotificationController),
PrintJobController: Object.assign(PrintJobController, PrintJobController),
SyncApiController: Object.assign(SyncApiController, SyncApiController),
ReceiptController: Object.assign(ReceiptController, ReceiptController),
RiderCancellationController: Object.assign(RiderCancellationController, RiderCancellationController),
POSCancellationController: Object.assign(POSCancellationController, POSCancellationController),
}

export default Api