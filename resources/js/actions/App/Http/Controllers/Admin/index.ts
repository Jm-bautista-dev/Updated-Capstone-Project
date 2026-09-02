import AccountFlagController from './AccountFlagController'
import DeliveryController from './DeliveryController'
import AnalyticsController from './AnalyticsController'
import SupplierController from './SupplierController'
import RiderController from './RiderController'
import EmployeeController from './EmployeeController'
import SalesDataManagementController from './SalesDataManagementController'
import ReportController from './ReportController'
import PickupOrderController from './PickupOrderController'
import ReviewController from './ReviewController'
const Admin = {
    AccountFlagController: Object.assign(AccountFlagController, AccountFlagController),
DeliveryController: Object.assign(DeliveryController, DeliveryController),
AnalyticsController: Object.assign(AnalyticsController, AnalyticsController),
SupplierController: Object.assign(SupplierController, SupplierController),
RiderController: Object.assign(RiderController, RiderController),
EmployeeController: Object.assign(EmployeeController, EmployeeController),
SalesDataManagementController: Object.assign(SalesDataManagementController, SalesDataManagementController),
ReportController: Object.assign(ReportController, ReportController),
PickupOrderController: Object.assign(PickupOrderController, PickupOrderController),
ReviewController: Object.assign(ReviewController, ReviewController),
}

export default Admin